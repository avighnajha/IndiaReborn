"""Generate the offline map art and projected geography from source data.

Usage: python build_geography.py INPUTS GAME
See design/map-production.md for input names, provenance and map conventions.
"""

from argparse import ArgumentParser
from functools import cache
import json
from pathlib import Path
import re
from subprocess import run
import unicodedata

import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import RBFInterpolator
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates
from shapely import line_merge, make_valid, union_all
from shapely.geometry import box, Point, shape
from shapely.ops import nearest_points

WIDTH, HEIGHT, SCALE, ZOOM = 920, 570, 1.5, 8

# These marks anchor programme sites whose original hexes had no named town.
# Sites other than Hirakud are representative works areas, to campaign scale.
SITE_ANCHORS = {
    "bihar": {"hex-6-5": [85.19, 25.72], "hex-10-4": [86.34, 25.91]},
    "orissa": {"hex-2-5": [83.87, 21.53], "hex-3-6": [83.78, 21.40]},
    "central": {
        "hex-8-9": [77.85, 22.68], "hex-10-8": [79.052, 22.907],
        "hex-13-12": [81.11, 20.82], "hex-15-12": [81.76, 21.05],
        "hex-16-10": [82.105, 21.0], "hex-9-3": [78.08, 26.6],
    },
    "west-bengal": {
        "hex-6-8": [87.53, 23.14], "hex-7-8": [87.86, 23.12], "hex-8-8": [88.00, 23.01],
        "hex-8-9": [87.96, 22.88], "hex-10-8": [88.46, 22.77], "hex-8-7": [88.16, 23.27],
        "hex-1-7": [86.08, 23.52], "hex-2-7": [86.60, 23.52], "hex-1-8": [86.12, 23.27],
        "hex-3-8": [86.67, 23.36], "hex-2-9": [86.42, 23.00], "hex-3-9": [86.66, 23.07],
        "hex-4-4": [87.90, 26.03], "hex-9-2": [89.23, 26.32], "hex-11-2": [89.67, 26.31],
        "hex-9-3": [89.13, 26.10], "hex-10-3": [89.41, 26.15], "hex-11-3": [89.60, 26.20],
    },
}

RIVER_NAMES = {
    "Ganges": ("Ganga", 3.25, {"bihar": (86.37, 25.45), "west-bengal": (88.39, 24.71)}),
    "Gandak": ("Gandak", 1.52, {"bihar": (84.56, 26.45)}),
    "Son": ("Son", 1.65, {"bihar": (84.00, 24.67), "central": (82.95, 24.42)}),
    "Ghaghara": ("Ghaghara", 1.44, {}),
    "Sapt": ("Kosi", 1.92, {"bihar": (86.83, 26.12)}),
    "Mahana Nadi": ("Mahanadi", 2.55, {"orissa": (84.69, 20.67), "central": (82.97, 21.30)}),
    "Brahmani": ("Brahmani", 1.47, {"orissa": (85.33, 21.38)}),
    "Sankh": ("Sankh", 1.02, {}),
    "Tel": ("Tel", 1.03, {}),
    "Indravati": ("Indravati", 1.14, {"central": (81.61, 19.38)}),
    "Tista": ("Teesta", 1.22, {"west-bengal": (88.78, 26.59)}),
    "Hooghly": ("Hooghly", 1.8, {"west-bengal": (88.60, 22.42)}),
    "Damodar": ("Damodar", 1.5, {"west-bengal": (87.21, 23.32)}),
    "Narmada": ("Narmada", 2.2, {"bombay": (74.92, 22.18), "central": (78.49, 22.83)}),
    "Tapi": ("Tapi", 1.7, {"bombay": (74.04, 21.54), "central": (75.16, 21.33)}),
    "Godavari": ("Godavari", 2.1, {"bombay": (76.23, 19.00), "madras": (81.83, 17.57), "central": (78.47, 18.89)}),
    "Krishna": ("Krishna", 1.85, {"bombay": (76.14, 16.69), "madras": (79.23, 16.39)}),
    "Bhima": ("Bhima", 1.25, {"bombay": (74.97, 17.83)}),
    "Wainganga": ("Wainganga", 1.4, {"bombay": (80.73, 20.11), "central": (79.98, 20.18)}),
    "Mahi": ("Mahi", 1.17, {}),
    "Chambal": ("Chambal", 2.1, {"central": (76.90, 26.05)}),
    "Betwa": ("Betwa", 1.5, {"central": (78.62, 25.13)}),
    "Sutlej": ("Sutlej", 2.75, {"punjab": (75.1, 30.81)}),
    "Beas": ("Beas", 1.9, {"punjab": (75.37, 31.7)}),
    "Ravi": ("Ravi", 1.65, {"punjab": (74.74, 32.16)}),
    "Yamuna": ("Yamuna", 2.05, {"punjab": (77.55, 29.57)}),
    "Chenab": ("Chenab", 1.35, {}),
    "Cauvery": ("Cauvery", 2.15, {"madras": (78.24, 11.10)}),
    "Tungabhadra": ("Tungabhadra", 1.45, {"madras": (76.92, 15.84)}),
    "Penner": ("Penner", 1.35, {"madras": (79.40, 14.73)}),
    "Palar": ("Palar", 1.2, {"madras": (79.02, 12.56)}),
    "Kolidam": ("Kollidam", 1.15, {"madras": (79.51, 11.16)}),
    "Brahmaputra": ("Brahmaputra", 3.3, {"assam": (92.72, 26.80)}),
    "Dihang": ("Dihang", 2.0, {"assam": (95.06, 28.00)}),
    "Mamas": ("Manas", 1.55, {"assam": (90.95, 26.49)}),
    "Balak": ("Barak", 1.8, {"assam": (92.71, 24.94)}),
    "Luhit": ("Lohit", 1.55, {"assam": (96.10, 27.92)}),
    "Kaladan": ("Kaladan", 1.3, {}),
}


def parts(geometry, kind):
    if geometry.is_empty:
        return
    if geometry.geom_type == kind:
        yield geometry
    elif hasattr(geometry, "geoms"):
        for part in geometry.geoms:
            yield from parts(part, kind)


@cache
def historical_features(inputs, year):
    path = inputs / f"India-State-Districts-{year}.geojsonl"
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def historical(inputs, year, state, *, exclude=None, districts=None):
    polygons = []
    for feature in historical_features(inputs, year):
        props = feature["properties"]
        if (props.get("State") or props.get("Admin Divi")) != state:
            continue
        if year == 1941 and props.get("Type") != "British districts" and districts is None:
            continue
        if exclude and props.get("District") == exclude:
            continue
        district = (props.get("District") or props.get("Districts") or "").strip()
        if districts is not None and district not in districts:
            continue
        polygons.extend(parts(make_valid(shape(feature["geometry"])), "Polygon"))
    assert polygons, (year, state)
    # Dissolve narrow seams in separately digitized districts before simplifying.
    return union_all(polygons).buffer(.002).buffer(-.002).simplify(.012, preserve_topology=True)


class Camera:
    def __init__(self, bounds):
        west, south, east, north = bounds
        self.lon = (west + east) / 2
        self.lat = (south + north) / 2
        horizontal = np.cos(np.deg2rad(self.lat))
        vertical = .88
        scale = min((WIDTH - 104) / ((east - west) * horizontal), (HEIGHT - 88) / ((north - south) * vertical))
        self.xscale = scale * horizontal
        self.yscale = scale * vertical
        self.extent = box(self.lon - WIDTH / 2 / self.xscale, self.lat - HEIGHT / 2 / self.yscale,
                          self.lon + WIDTH / 2 / self.xscale, self.lat + HEIGHT / 2 / self.yscale)

    def project(self, lon, lat):
        return WIDTH / 2 + (lon - self.lon) * self.xscale, HEIGHT / 2 - (lat - self.lat) * self.yscale

    def round(self, lon, lat):
        return [round(value, 1) for value in self.project(lon, lat)]

    def coords(self, x, y):
        return self.lon + (x - WIDTH / 2) / self.xscale, self.lat - (y - HEIGHT / 2) / self.yscale


def polygons_for(geometry, camera):
    return [
        [[coord for pair in ring.coords for coord in camera.round(*pair)] for ring in (polygon.exterior, *polygon.interiors)]
        for polygon in parts(geometry, "Polygon") if polygon.area > .001
    ]


def neighboring_borders(inputs, year, active, camera, *, coalesced=()):
    extent = camera.extent.buffer(.08)
    regions = {}
    for feature in historical_features(inputs, year):
        props = feature["properties"]
        name = props.get("State") or props.get("Admin Divi")
        if not name:
            continue
        geometry = shape(feature["geometry"])
        if not geometry.intersects(extent):
            continue
        # Colonial agency territories and directly administered provinces were separate.
        if name in coalesced:
            name = coalesced[0]
        region = (name, props.get("Type") == "Princely states")
        regions.setdefault(region, []).extend(parts(make_valid(geometry).intersection(extent), "Polygon"))
    areas = [union_all(regions[region]).buffer(.002).buffer(-.002) for region in sorted(regions)]
    # Keep one side of each shared edge and exclude coastlines and the active outline.
    shared_edges = [area.boundary.intersection(union_all(areas[i + 1:]).buffer(.018))
                    for i, area in enumerate(areas[:-1])]
    lines = union_all(shared_edges).intersection(camera.extent).difference(active.boundary.buffer(.025))
    merged = line_merge(lines).simplify(.012)
    return [[camera.round(*point) for point in line.coords] for line in parts(merged, "LineString") if line.length > .065]


def dem(inputs, camera):
    x, y = np.meshgrid((np.arange(int(WIDTH * SCALE)) + .5) / SCALE,
                       (np.arange(int(HEIGHT * SCALE)) + .5) / SCALE)
    lon, lat = camera.coords(x, y)
    resolution = 256 * 2 ** ZOOM
    mercator_x = (lon + 180) / 360 * resolution
    mercator_y = (1 - np.arcsinh(np.tan(np.deg2rad(lat))) / np.pi) / 2 * resolution
    left, right = int(mercator_x.min()) // 256, (int(mercator_x.max()) + 1) // 256
    top, bottom = int(mercator_y.min()) // 256, (int(mercator_y.max()) + 1) // 256
    mosaic = np.empty(((bottom - top + 1) * 256, (right - left + 1) * 256), np.float32)
    for tx in range(left, right + 1):
        for ty in range(top, bottom + 1):
            rgb = np.asarray(Image.open(inputs / f"dem-{ZOOM}-{tx}-{ty}.png").convert("RGB"), dtype=np.float32)
            rows, cols = (ty - top) * 256, (tx - left) * 256
            mosaic[rows:rows + 256, cols:cols + 256] = rgb[:, :, 0] * 256 + rgb[:, :, 1] + rgb[:, :, 2] / 256 - 32768
    return map_coordinates(mosaic, [mercator_y - top * 256 - .5, mercator_x - left * 256 - .5], order=1)


def raster_mask(geometry, camera, size):
    mask = Image.new("L", size)
    draw = ImageDraw.Draw(mask)
    for polygon in parts(geometry, "Polygon"):
        for ring, color in [(polygon.exterior, 255), *((hole, 0) for hole in polygon.interiors)]:
            draw.polygon([(x * SCALE, y * SCALE) for x, y in (camera.project(*p) for p in ring.coords)], fill=color)
    return np.asarray(mask) > 0


def paint(elev, land, lagoon, camera, destination):
    filtered = gaussian_filter(elev, .8)
    macro = gaussian_filter(elev, 3.4)
    slope_y, slope_x = np.gradient(filtered)
    macro_y, macro_x = np.gradient(macro)
    slope = np.hypot(slope_x, slope_y)
    heights = [0, 12, 100, 275, 540, 1100, 2300, 4200, 6100]
    palette = np.array([[120, 151, 110], [141, 159, 106], [158, 162, 109], [132, 146, 97],
                        [120, 133, 92], [136, 140, 106], [154, 147, 122], [152, 150, 130], [204, 206, 188]])
    color = np.stack([np.interp(macro, heights, channel) for channel in palette.T], axis=-1)
    light = np.tanh((slope_x * .85 + slope_y * .66) / 17) * .22
    light += np.tanh((macro_x * .9 + macro_y * .68) / 15) * .18
    rng = np.random.default_rng(615)
    grain = rng.normal(0, 1, elev.shape)
    flecks = gaussian_filter(grain, 2.3)
    color *= (1 + light - np.minimum(slope, 35) * .0023 + flecks * .055 + grain * .008)[:, :, None]
    mask = raster_mask(land, camera, elev.shape[::-1])
    if lagoon is not None:
        mask &= ~raster_mask(lagoon, camera, elev.shape[::-1])
    distance = distance_transform_edt(~mask)
    shoal = np.exp(-distance / 18)
    waves = np.sin(np.arange(elev.shape[0])[:, None] * .31 + np.arange(elev.shape[1])[None, :] * .016) * .85
    water = np.array([33, 69, 77]) + shoal[:, :, None] * np.array([39, 45, 40]) + waves[:, :, None]
    result = np.where(mask[:, :, None], color, water)
    Image.fromarray(np.clip(result, 0, 255).astype(np.uint8), "RGB").save(destination, quality=91, method=6)


def sites(region, source, places, camera, footprint, land, elev, *, site_areas=None):
    rows = re.findall(r'^\s+"([ phftr]+)",\s*$', source, re.M)
    owner_rows = re.search(r'bounds:\s*(\[.*?\]),\s*towns:', source, re.S).group(1)
    bounds = json.loads(re.sub(r',\s*]$', ']', owner_rows))
    assert len(bounds) == len(rows), (region, len(rows), len(bounds))
    towns = {f"hex-{q}-{r}": name for q, r, name in re.findall(r'q: (\d+), r: (\d+), name: "([^"]+)"', source)}
    assert set(towns.values()) == places["towns"].keys()
    anchors = {id_: places["towns"][name] for id_, name in towns.items()} | SITE_ANCHORS.get(region, {})
    grid = {f"hex-{q}-{r}": (q, r) for r, row in enumerate(rows) for q, cell in enumerate(row) if cell != " "}
    assert anchors.keys() <= grid.keys()

    def design_coords(id_):
        q, r = grid[id_]
        return q + (r % 2) * .5, r * .72

    interpolation = RBFInterpolator(np.array([design_coords(id_) for id_ in anchors]),
                                    np.array(list(anchors.values())), kernel="thin_plate_spline", smoothing=.6)
    inner = footprint.buffer(-.018)
    outer = land.intersection(camera.extent.buffer(-.12))
    reserved = np.array([camera.project(*coords) for coords in anchors.values()])
    output = {}
    for id_, coords in zip(grid, interpolation(np.array([design_coords(id_) for id_ in grid]))):
        q, r = grid[id_]
        if id_ in anchors:
            lon, lat = anchors[id_]
        else:
            area = site_areas.get(id_) if site_areas else None
            if area is None:
                area = inner if bounds[r] and bounds[r][0] <= q <= bounds[r][1] else outer
            seed = Point(*coords)
            point = seed if area.covers(seed) else nearest_points(seed, area)[1]
            x, y = camera.project(*point.coords[0])
            options = [(x, y)]
            for radius in [11, 20, 30, 43, 58]:
                for angle in np.arange(8) * np.pi / 4 + ((q * 3 + r) % 8) * .39:
                    options.append((x + np.cos(angle) * radius, y + np.sin(angle) * radius))
            used = np.vstack([reserved, [value[:2] for key, value in output.items() if key not in anchors]]) if any(
                key not in anchors for key in output) else reserved
            for px, py in options:
                lon, lat = camera.coords(px, py)
                if area.covers(Point(lon, lat)) and np.min(np.linalg.norm(used - [px, py], axis=1)) >= 10:
                    break
            else:
                lon, lat = point.coords[0]
        x, y = camera.round(lon, lat)
        level = elev[int(np.clip(y * SCALE, 0, elev.shape[0] - 1)), int(np.clip(x * SCALE, 0, elev.shape[1] - 1))]
        output[id_] = [x, y, max(0, 10 * round(float(level) / 10))]
    return output


def source_features(inputs, layer):
    return json.loads((inputs / f"{layer}.json").read_text(encoding="utf-8"))["features"]


def waterways(inputs, camera, region):
    rivers = []
    labels = {}
    features = source_features(inputs, "rivers")
    hooghly = None
    if region == "west-bengal":
        detail = json.loads(Path(__file__).with_name("west-bengal-rivers.geojson").read_text(encoding="utf-8"))["features"]
        hooghly = shape(detail[0]["geometry"]).buffer(.045)
        features += detail
    for feature in features:
        props = feature["properties"]
        name = props.get("name_en") or props.get("name") or ""
        name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
        geom = shape(feature["geometry"]).intersection(camera.extent)
        if name == "Ganges" and hooghly is not None:
            geom = geom.difference(hooghly)
        name, size, marks = RIVER_NAMES.get(name, ("", .69, {}))
        regional_river = region in marks
        if size > .69 and name in BOMBAY_RIVER_NAMES and region != "bombay" and not regional_river:
            size = .69
        if size > .69 and name in PUNJAB_RIVER_NAMES and region != "punjab":
            size = .69
        if size > .69 and name in MADRAS_RIVER_NAMES - BOMBAY_RIVER_NAMES and region != "madras":
            size = .69
        if size > .69 and name in ASSAM_RIVER_NAMES and region != "assam":
            size = .69
        if size > .69 and name in ("Chambal", "Betwa") and not regional_river:
            size = .69
        geom = geom.simplify(.008)
        for line in parts(geom, "LineString"):
            if line.length < .10:
                continue
            rivers.append({"size": size, "points": [camera.round(*point) for point in line.coords]})
            if region in marks:
                labels[name] = camera.round(*marks[region])
    return sorted(rivers, key=lambda path: path["size"]), labels


BOMBAY_RIVER_NAMES = {"Narmada", "Tapi", "Godavari", "Krishna", "Bhima", "Wainganga", "Mahi"}
BOMBAY_SUCCESSORS = ("Maharashtra", "Gujarat")
PUNJAB_RIVER_NAMES = {"Sutlej", "Beas", "Ravi", "Yamuna", "Chenab"}
MADRAS_RIVER_NAMES = {"Godavari", "Krishna", "Cauvery", "Tungabhadra", "Penner", "Palar", "Kollidam"}
ASSAM_RIVER_NAMES = {"Brahmaputra", "Dihang", "Manas", "Barak", "Lohit", "Kaladan"}
ANDHRA_DISTRICTS = {
    "Srikakulam", "Vizagapatnam", "East Godavari", "West Godavari", "Krishna", "Guntur", "Nellore",
    "Chittoor", "Cuddapah", "Anantapur", "Kurnool",
}


@cache
def bombay_outlines(inputs):
    early = historical(inputs, 1941, "Bombay")
    middle = historical(inputs, 1951, "Bombay")
    successors = {name: historical(inputs, 1961, name) for name in BOMBAY_SUCCESSORS}
    # Sections 3–4 of the 1960 Act divide the enlarged state into these two states.
    enlarged = union_all(list(successors.values())).buffer(.002).buffer(-.002).simplify(.012, preserve_topology=True)
    return early, middle, enlarged, successors


@cache
def punjab_outlines(inputs):
    early = historical(inputs, 1941, "Punjab")
    middle = historical(inputs, 1951, "Punjab")
    enlarged = historical(inputs, 1961, "Punjab")
    successors = {name: historical(inputs, 1971, name) for name in ("Punjab", "Haryana", "Chandigarh", "Himachal Pradesh")}
    return early, middle, enlarged, successors


@cache
def madras_outlines(inputs):
    early = historical(inputs, 1941, "Madras")
    province = historical(inputs, 1951, "Madras")
    andhra_pradesh = historical(inputs, 1961, "Andhra Pradesh")
    tamil = historical(inputs, 1961, "Madras")
    districts = historical(inputs, 1951, "Madras", districts=ANDHRA_DISTRICTS)
    bellary = historical(inputs, 1951, "Madras", districts={"Bellary"})
    # The 1961 outline locates the eastern Bellary taluks allotted to Andhra in 1953.
    andhra = union_all([districts, bellary.intersection(andhra_pradesh)]).buffer(.002).buffer(-.002)
    madras = province.difference(union_all([andhra, bellary]).buffer(.002))
    successors = {"andhra": andhra, "madras": madras, "andhra-pradesh": andhra_pradesh, "tamil-nadu": tamil}
    return early, province, successors


@cache
def assam_outlines(inputs, sylhet_boundary):
    # The digitized Indian census archive clips Sylhet at the present international border.
    # The 1931 district trace supplies the missing part. Frontier tracts stay contextual.
    sylhet = shape({"type": "Polygon", "coordinates": [sylhet_boundary]})
    early_districts = {"Lakhimpur", "Sibsagar", "Darrang", "Goalpara", "Kamrup", "Garo Hills",
                       "Khasi States", "Khasi and Jaintia Hills", "Sylhet", "Nowgong", "Naga Hills", "Cachar", "Lushai Hills"}
    early = union_all([historical(inputs, 1941, "Assam", districts=early_districts), sylhet])
    middle = historical(inputs, 1951, "Assam", districts={"Darrang", "Lakhimpur", "Nowgong", "Cachar", "Garo Hills",
        "Sibsagar", "Kamrup", "Goalpara", "United Khasi and Jaintia Hills", "United Mikir and North Cachar Hills",
        "Lushai Hills", "Naga Hills", "Tuensang"})
    without_nagaland = historical(inputs, 1961, "Assam")
    later = historical(inputs, 1971, "Assam")
    return early, middle, without_nagaland, later


def outline_record(inputs, camera, year, census, label, outline, *, coalesced=()):
    return {"year": year, "label": label, "polygons": polygons_for(outline, camera),
            "neighbors": neighboring_borders(inputs, census, outline, camera, coalesced=coalesced)}


@cache
def central_outlines(inputs):
    early = historical(inputs, 1941, "Central Province and Berar")
    integrated = historical(inputs, 1951, "Madhya Pradesh")
    reorganized = historical(inputs, 1961, "Madhya Pradesh")
    return early, integrated, reorganized


def projected_boundaries(inputs, region, places=None):
    if region == "bombay":
        early, middle, enlarged, _ = bombay_outlines(inputs)
        camera = Camera(union_all([early, middle, enlarged]).bounds)
        return camera, enlarged, [
            outline_record(inputs, camera, 1946, 1941, "Bombay Province · 1941 census", early),
            outline_record(inputs, camera, 1949, 1951, "Bombay after early integration · 1951 census reference", middle),
            outline_record(inputs, camera, 1956, 1961, "Enlarged Bombay · 1961 successor outlines combined", enlarged,
                           coalesced=BOMBAY_SUCCESSORS),
        ]
    if region == "punjab":
        early, middle, enlarged, _ = punjab_outlines(inputs)
        camera = Camera(union_all([early, middle, enlarged]).bounds)
        return camera, enlarged, [
            outline_record(inputs, camera, 1946, 1941, "Eastern Punjab districts · 1941 census reference", early),
            outline_record(inputs, camera, 1947, 1951, "East Punjab after Partition · 1951 census", middle),
            outline_record(inputs, camera, 1956, 1961, "Punjab after PEPSU integration · 1961 census", enlarged),
        ]
    if region == "madras":
        early, province, successors = madras_outlines(inputs)
        extent = union_all([early, province, *successors.values()])
        camera = Camera(extent.bounds)
        return camera, province, [
            outline_record(inputs, camera, 1946, 1941, "Madras Province · 1941 census reference", early),
            outline_record(inputs, camera, 1948, 1951, "Composite Madras · 1951 census reference", province),
        ]
    if region == "assam":
        early, middle, without_nagaland, later = assam_outlines(inputs, tuple(map(tuple, places["sylhetBoundary"])))
        camera = Camera(union_all([early, middle, without_nagaland, later]).bounds)
        return camera, later, [
            outline_record(inputs, camera, 1946, 1941, "Assam Province · Census and Sylhet reconstruction", early),
            outline_record(inputs, camera, 1947, 1951, "Assam after Partition · 1951 census reference", middle),
            outline_record(inputs, camera, 1958, 1961, "After the Naga Hills transfer · 1961 census reference", without_nagaland),
            outline_record(inputs, camera, 1963, 1961, "Assam after Nagaland · 1961 district reference", without_nagaland),
            outline_record(inputs, camera, 1972, 1971, "Assam after reorganization · 1971 census reference", later),
        ]
    if region == "central":
        early, integrated, reorganized = central_outlines(inputs)
        extent = union_all([early, integrated, reorganized])
        camera = Camera(extent.bounds)
        return camera, extent, [
            outline_record(inputs, camera, 1946, 1941, "Central Provinces and Berar · 1941 census reference", early),
            outline_record(inputs, camera, 1948, 1951, "Central Provinces and Berar after integration · 1951 census reference", integrated),
            outline_record(inputs, camera, 1950, 1951, "Madhya Pradesh · 1951 census reference", integrated),
            outline_record(inputs, camera, 1956, 1961, "Madhya Pradesh after reorganization · 1961 census reference", reorganized),
        ]
    state = {"bihar": "Bihar", "orissa": "Orissa", "west-bengal": "West Bengal"}[region]
    early = historical(inputs, 1941, "Bengal" if region == "west-bengal" else state)
    middle = historical(inputs, 1951, state)
    if region == "west-bengal":
        partition = historical(inputs, 1951, state, exclude="Cooch Behar")
        late = historical(inputs, 1961, state)
        boundaries = [(1946, 1941, "Western Bengal districts · 1941 census", early),
                      (1947, 1951, "After Partition · 1951 census approximation", partition),
                      (1950, 1951, "Cooch Behar integrated · 1951 census", middle),
                      (1957, 1961, "After the 1956 transfer · 1961 census", late)]
        middle = partition
    elif region == "bihar":
        late = historical(inputs, 1961, state)
        boundaries = [(1946, 1941, "Pre-merger outline · 1941 census", early),
                      (1948, 1951, "Post-merger outline · 1951 census", middle),
                      (1957, 1961, "After the 1956 transfer · 1961 census", late)]
    else:
        merged = historical(inputs, 1951, state, exclude="Mayurbhanj")
        boundaries = [(1946, 1941, "Provincial outline · 1941 census", early),
                      (1948, 1951, "Post-merger outline · before Mayurbhanj", merged),
                      (1949, 1951, "Post-merger outline · 1951 census", middle)]
    camera = Camera(union_all([poly for _, _, _, poly in boundaries]).bounds)
    projected = [outline_record(inputs, camera, year, census, label, outline)
                 for year, census, label, outline in boundaries]
    return camera, middle, projected


def map_site_groups(source, export_name, keys):
    result = run(["node", "--input-type=module", "-e", """
        const [filename, exportName, ...keys] = process.argv.slice(1);
        const map = (await import(filename))[exportName];
        process.stdout.write(JSON.stringify(Object.fromEntries(keys.map((key) => [key, map[key]]))));
    """, source.resolve().as_uri(), export_name, *keys], capture_output=True, text=True, check=True)
    return {key: set(value) for key, value in json.loads(result.stdout).items()}


def bombay_site_areas(source, outlines):
    groups = map_site_groups(source, "bombayMap", (
        "earlyAccessionSites", "accessionSites", "departureSites", "gujaratSites", "maharashtraSites"))
    early, middle, enlarged, successors = outlines
    departures = early.difference(enlarged)
    areas = {site: departures for site in groups["departureSites"]}
    for name in BOMBAY_SUCCESSORS:
        successor = successors[name]
        first = successor.intersection(early)
        integrated = successor.intersection(middle.difference(early))
        transferred = successor.difference(middle)
        for site in groups[f"{name.lower()}Sites"]:
            territory = first
            if site in groups["earlyAccessionSites"]:
                territory = integrated
            elif site in groups["accessionSites"]:
                territory = transferred
            areas[site] = successor if territory.is_empty else territory
    return areas


def punjab_site_areas(inputs, source, outlines):
    keys = {"Punjab": "punjabSites", "Haryana": "haryanaSites", "Chandigarh": "unionSites", "Himachal Pradesh": "himachalSites"}
    groups = map_site_groups(source, "punjabMap", ("accessionSites", *keys.values()))
    early, middle, enlarged, successors = outlines
    former_princely = historical(inputs, 1951, "Patial and East Punjab States Union")
    areas = {}
    for name, key in keys.items():
        successor = successors[name]
        if name == "Himachal Pradesh":
            successor = successor.intersection(enlarged)
        first = successor.intersection(middle)
        early_overlap = first.intersection(early)
        transferred = successor.intersection(former_princely).intersection(enlarged)
        for site in groups[key]:
            territory = transferred if site in groups["accessionSites"] else (early_overlap if not early_overlap.is_empty else first)
            areas[site] = successor if territory.is_empty else territory
    return areas


def madras_site_areas(inputs, source):
    early, province, outlines = madras_outlines(inputs)
    andhra, madras = outlines["andhra"], outlines["madras"]
    andhra_pradesh, tamil = outlines["andhra-pradesh"], outlines["tamil-nadu"]
    keys = ("andhraSites", "madrasSites", "telanganaSites", "keralaSites", "mysoreSites", "bellarySites", "kanyakumariSites", "pudukkottaiSites")
    groups = map_site_groups(source, "madrasMap", keys)
    kerala = historical(inputs, 1961, "Kerala")
    mysore = historical(inputs, 1961, "Mysore")
    bellary = historical(inputs, 1951, "Madras", districts={"Bellary"})
    areas = {
        "andhraSites": andhra.intersection(andhra_pradesh).intersection(early),
        "madrasSites": madras.intersection(tamil).intersection(early),
        "telanganaSites": andhra_pradesh.intersection(historical(inputs, 1951, "Hyderabad")),
        "keralaSites": madras.intersection(kerala).intersection(early),
        "mysoreSites": madras.intersection(mysore).intersection(early),
        "bellarySites": bellary.intersection(mysore).intersection(early),
        "kanyakumariSites": tamil.difference(province.buffer(.012)),
        "pudukkottaiSites": madras.difference(early.buffer(.012)),
    }
    return {site: area for key, area in areas.items() for site in groups[key] if not area.is_empty}


def central_site_areas(inputs, source):
    early, integrated, reorganized = central_outlines(inputs)
    vidarbha = historical(inputs, 1951, "Madhya Pradesh", districts={
        "Buldana", "Akola", "Amravati", "Yeotmal", "Wardha", "Nagpur", "Bhandara", "Chanda",
    })
    groups = map_site_groups(source, "centralMap", (
        "initialSites", "departureSites", "chhattisgarhSites", "makraiSites",
        "madhyaBharatSites", "vindhyaPradeshSites", "bhopalSites", "sironjSites",
    ))
    areas = {
        "initialSites": early.intersection(integrated).intersection(reorganized),
        "departureSites": early.intersection(vidarbha).difference(reorganized),
        "chhattisgarhSites": integrated.intersection(reorganized).difference(early),
        "makraiSites": historical(inputs, 1941, "Central Province and Berar", districts={"Makrai"}).intersection(integrated),
        "madhyaBharatSites": historical(inputs, 1951, "Madhya Bharat").intersection(reorganized),
        "vindhyaPradeshSites": historical(inputs, 1951, "Vindhya Pradesh").intersection(reorganized),
        "bhopalSites": historical(inputs, 1951, "Bhopal").intersection(reorganized),
        "sironjSites": historical(inputs, 1951, "Rajasthan", districts={"Kotah"}).intersection(reorganized),
    }
    return {site: area for key, area in areas.items() for site in groups[key]}


def build(inputs, game, places, region):
    camera, footprint, boundaries = projected_boundaries(inputs, region, places[region])
    bounds = camera.extent
    land = union_all([geometry.intersection(bounds) for feature in source_features(inputs, "land")
                      if (geometry := make_valid(shape(feature["geometry"]))).intersects(bounds)])
    water, water_labels = waterways(inputs, camera, region)
    # Chilika lagoon approximation at the current campaign scale.
    lagoon = shape({"type": "Polygon", "coordinates": [[(85.125, 19.743), (85.182, 19.727), (85.219, 19.727),
        (85.241, 19.689), (85.311, 19.695), (85.373, 19.671), (85.451, 19.714), (85.527, 19.742),
        (85.485, 19.781), (85.377, 19.872), (85.322, 19.884), (85.286, 19.847), (85.251, 19.833),
        (85.239, 19.803), (85.180, 19.790), (85.125, 19.743)]]}) if region == "orissa" else None
    if lagoon is not None:
        water_labels["Chilika"] = camera.round(85.31, 19.78)
    reservoir_name = {"orissa": "Hirakud Dam", "punjab": "Gobind Sagar", "madras": "Stanley",
                      "central": "Gandhi Sagar Dam"}.get(region)
    reservoir = next(make_valid(shape(feature["geometry"])) for feature in source_features(inputs, "lakes")
                     if feature["properties"].get("name_en") == reservoir_name) if reservoir_name else None
    elev = dem(inputs, camera)
    target = game / "src" / "geography"
    target.mkdir(exist_ok=True)
    paint(elev, land, lagoon, camera, target / f"{region}.webp")
    source = game / "src" / f"{region}.js"
    outlines = bombay_outlines(inputs) if region == "bombay" else None
    site_areas = bombay_site_areas(source, outlines) if outlines is not None else None
    if region == "punjab":
        site_areas = punjab_site_areas(inputs, source, punjab_outlines(inputs))
    if region == "madras":
        site_areas = madras_site_areas(inputs, source)
    if region == "central":
        site_areas = central_site_areas(inputs, source)
    if region == "assam":
        groups = map_site_groups(source, "assamMap", ("initialSites", "sylhetSites", "nagaSites", "meghalayaSites", "mizoSites"))
        early, middle, _, later = assam_outlines(inputs, tuple(map(tuple, places[region]["sylhetBoundary"])))
        retained = later.intersection(middle).intersection(early)
        site_areas = {site: retained for site in groups["initialSites"]}
        for key, area in {
            "sylhetSites": early.difference(middle),
            "nagaSites": historical(inputs, 1971, "Nagaland").intersection(middle).intersection(early),
            "meghalayaSites": historical(inputs, 1971, "Meghalaya").intersection(middle).intersection(early),
            "mizoSites": historical(inputs, 1971, "Mizoram").intersection(middle).intersection(early),
        }.items():
            site_areas.update({site: area for site in groups[key]})
    data = {
        "points": sites(region, source.read_text(encoding="utf-8"),
                        places[region], camera, footprint, land, elev, site_areas=site_areas),
        "boundaries": boundaries,
        "rivers": water,
        "labels": [{"name": name, "point": point, "water": name in water_labels}
                   for name, point in ({name: camera.round(*coord) for name, coord in places[region]["labels"].items()} | water_labels).items()],
        "reservoir": polygons_for(reservoir, camera) if reservoir is not None else [],
    }
    if outlines is not None:
        data["successors"] = {
            name.lower(): outline_record(inputs, camera, 1960, 1961, f"{name} · 1961 census", outline)
            for name, outline in outlines[3].items()
        }
    if region == "punjab":
        data["successors"] = {
            name.lower(): outline_record(inputs, camera, 1966, 1971, f"{name} · 1971 census reference", outline)
            for name, outline in punjab_outlines(inputs)[3].items() if name in ("Punjab", "Haryana")
        }
    if region == "madras":
        records = {
            "andhra": (1953, 1951, "Andhra State · 1953 district reconstruction"),
            "madras": (1953, 1951, "Madras after separation · 1953 district reconstruction"),
            "andhra-pradesh": (1956, 1961, "Andhra Pradesh · 1961 census reference"),
            "tamil-nadu": (1956, 1961, "Madras after reorganization · 1961 census reference"),
        }
        data["successors"] = {
            key: outline_record(inputs, camera, *records[key], outline)
            for key, outline in madras_outlines(inputs)[2].items()
        }
    (target / f"{region}.json").write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    print(region, len(data["points"]), "sites,", len(water), "waterways")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("inputs", type=Path)
    parser.add_argument("game", type=Path)
    parser.add_argument("--region", choices=("bihar", "orissa", "west-bengal", "bombay", "punjab", "madras", "assam", "central"))
    args = parser.parse_args()
    places = json.loads(Path(__file__).with_name("places.json").read_text(encoding="utf-8"))
    for region in ((args.region,) if args.region else ("bihar", "orissa")):
        build(args.inputs, args.game, places, region)

"""Project the same census polygons used by the regional maps into the national atlas."""

from argparse import ArgumentParser
import json
from pathlib import Path

from shapely import make_valid, union_all
from shapely.geometry import shape

from build_geography import historical_features, neighboring_borders, parts, polygons_for, projected_boundaries


def point(lon, lat):
    return round(32 + (lon - 66) * 15.7, 1), round(20 + (38 - lat) * 16.6, 1)


def drawing(geometry):
    def ring(coords):
        return "M" + "L".join(f"{x},{y}" for x, y in (point(*pair) for pair in coords)) + "Z"

    return "".join(
        ring(polygon.exterior.coords) + "".join(ring(hole.coords) for hole in polygon.interiors)
        for polygon in parts(geometry.simplify(.08, preserve_topology=True), "Polygon")
        if polygon.area > .018
    )


def chapter(inputs, year):
    groups = {}
    for feature in historical_features(inputs, year):
        prop = feature["properties"]
        name = prop.get("State") or prop.get("Admin Divi")
        if not name:
            continue
        princely = year == 1941 and prop.get("Type") == "Princely states"
        if princely and prop.get("Districts") == "Mayurbhanj":
            name = "Mayurbhanj"
        key = (name, princely)
        groups.setdefault(key, []).extend(parts(make_valid(shape(feature["geometry"])), "Polygon"))
    return [
        {"name": name, "kind": "princely" if princely else "province", "path": drawing(union_all(polygons).buffer(.004).buffer(-.004))}
        for (name, princely), polygons in sorted(groups.items())
    ]


def bihar_successor(inputs):
    camera, _, _ = projected_boundaries(inputs, "bihar")
    plateau = {"Dhanbad", "Hazaribagh", "Palamau", "Ranchi", "Santal Parganas", "Singhbhum"}
    districts = [feature for feature in historical_features(inputs, 1961) if feature["properties"].get("State") == "Bihar"]

    def dissolve(is_south):
        polygons = [make_valid(shape(feature["geometry"])) for feature in districts
                    if (feature["properties"]["District"] in plateau) == is_south]
        return union_all(polygons).buffer(.002).buffer(-.002).simplify(.012, preserve_topology=True)

    north, south = dissolve(False), dissolve(True)
    return {"year": 1956, "label": "Alternate settlement · Northern Bihar", "polygons": polygons_for(north, camera),
            "neighbors": neighboring_borders(inputs, 1961, north, camera), "successor": polygons_for(south, camera)}


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("inputs", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    data = {year: chapter(args.inputs, year) for year in (1941, 1951, 1961)}
    args.destination.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    args.destination.with_name("bihar-successor.json").write_text(
        json.dumps(bihar_successor(args.inputs), separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")

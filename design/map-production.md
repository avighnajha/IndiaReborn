# Production Map

The Bihar, Orissa and West Bengal maps use continuous shaded relief, projected settlement and river locations, and period state outlines. The governed state has a bold gold outline. Neighboring administrative borders from the same census layer use a lighter line. **Borders** increases the contrast, and **Map sources** lists the references. The map inspector shows approximate elevation in metres. Programme pins, connected routes, project assets and monsoon effects are drawn by PixiJS above the terrain.

## Historical outline phases

| Campaign | Planning years | Outline used |
| --- | --- | --- |
| Bihar | 1946–47 | 1941 census province |
| Bihar | 1948–56 | 1951 census outline after Seraikela and Kharsawan passed to Bihar in May 1948 |
| Bihar | 1957–65 | 1961 census outline for the first full planning year after the November 1956 transfer to West Bengal |
| Orissa | 1946–47 | 1941 census British districts, with the princely states outside the provincial outline |
| Orissa | 1948 | 1951 outline with Mayurbhanj excluded, approximating the footprint after the 1948 handovers |
| Orissa | 1949–65 | 1951 census outline after Mayurbhanj joined on 1 January 1949 |
| West Bengal | 1946 until Partition | Western districts of Bengal from the 1941 archive, within the archive's present-day outer extent |
| West Bengal | 1947–49 | 1951 West Bengal outline with Cooch Behar excluded to approximate the Partition footprint |
| West Bengal | 1950–56 | 1951 outline after Cooch Behar joined |
| West Bengal | After the 1956 settlement | 1961 outline if the player accepts the transfer. The alternate transit agreement keeps the 1951 outline. |
| Bombay | 1946–48 | Directly administered Bombay Province districts from the 1941 archive |
| Bombay | 1949–55 | 1951 Bombay State outline after early integration |
| Bombay | 1956–59 | 1961 Maharashtra and Gujarat outlines dissolved to approximate enlarged Bombay |
| Maharashtra or Gujarat | 1960 onward | Separate 1961 census outline for the chosen successor |

The historical census boundaries were digitized by [India State Stories](https://www.indiastatestory.in/datadownloads) from the Census of India Administrative Atlas and distributed by [ramSeraph/indian_admin_boundaries](https://github.com/ramSeraph/indian_admin_boundaries/releases/tag/historical). Census vintages approximate the outlines at the in-game transition dates. The source uses modern India as its outer extent and is intended for representation at map scale. The first Bihar transfer year is 1957 because the [Bihar and West Bengal (Transfer of Territories) Act](https://www.indiacode.nic.in/bitstream/123456789/1636/1/195640.pdf) took effect on 1 November 1956. For Orissa, see [Odisha revenue administration history](https://rotiodisha.nic.in/files/TRAINING%20MATERIAL/PPT/REVENUE/History%20%26%20Structure%20of%20Revenue%20Administration.pdf) and the [Census of India Orissa Portrait](https://censusindia.gov.in/nada/index.php/catalog/31509/download/34690/52213_1981_POR.pdf).

**Distribution status.** The local build credits the producers. The public source export omits the historical boundary layer while redistribution rights are verified. The national atlas shows starting locations in that build. Regional shaded relief, rivers, towns and campaign ownership remain available. [Producer map downloads](https://www.indiastatestory.in/datadownloads), [mirror license scope](https://github.com/ramSeraph/indian_admin_boundaries/blob/main/LICENSE).

## Terrain, water and gameplay

- Elevation is sampled from [Mapzen Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles/) at zoom 8. SRTM and GMTED2010 data are courtesy of the U.S. Geological Survey. ETOPO1 data are courtesy of NOAA. [Attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
- Land, major river centerlines and the Hirakud Reservoir outline use [Natural Earth 1:10m physical vectors](https://www.naturalearthdata.com/downloads/10m-physical-vectors/). They provide modern reference geometry. Chilika is generalized at campaign scale. The reservoir overlay appears when the Hirakud station is commissioned. The historical movement of the Kosi channel and period coastline changes are outside this pass.
- Settlement anchors approximate town centres. Checks used [IMD station locations](https://mausamjournal.imd.gov.in/index.php/MAUSAM/article/download/1581/1393/5944), [Dhanbad district coordinates](https://dhanbad.nic.in/district-at-a-glance/) and the [Old Town Bhubaneswar heritage survey](https://ignca.gov.in/asi_reports/orkhurda026.pdf). Names of geographic areas use editorial label positions.
- The map uses a regional equirectangular camera with latitude compressed to 88% for the view. Relief is shaded and art-directed for readability. The production browser loads the selected terrain texture offline.
- Historical outlines are cartographic layers. The game still uses its original site IDs, flood classifications and ownership rules for programme eligibility, district councils, construction, trade and save compatibility. Towns are anchored to approximate real locations and other works sites are fitted around them. Routes link those sites and bridge the displayed river geometry. Individual works and flood effects are modeled.

## Rebuild

The founding atlas uses the same historical snapshots. The northern Bihar successor illustration uses the 1961 district aggregate, with the modeled southern split rendered separately. Mayurbhanj projects onto the Orissa map from its 1941 outline. Run `python tools/geography/build_founding_atlas.py INPUT_DIR src/geography/founding.json` to rebuild the national snapshots and the Bihar successor outline.

Run `python tools/geography/build_geography.py INPUT_DIR GAME_DIR` with NumPy, Pillow, SciPy and Shapely 2.x. It outputs the two WebP textures and their projected JSON files into `src/geography`. The game builds from these files with the existing npm toolchain.

Run the same command with `--region west-bengal` to build the West Bengal relief and outlines. Settlement anchors use approximate town centres checked against the GeoNames gazetteer. The generator crops the same census, elevation and Natural Earth inputs around West Bengal. The Hooghly and Damodar centerlines come from OpenStreetMap relations 1243337 and 12559153. The two features are kept in a separate ODbL source file under `tools/geography`. The 1947 outline uses a census approximation and the lower delta shows modern reference hydrography. [GeoNames data](https://www.geonames.org/export/) · [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · [West Bengal chronology](west-bengal-sources.md)

Use `--region bombay` for Bombay. This build reads territory groups from `src/bombay.js` through Node to place sites in the correct phase outlines. It uses the same census snapshots, Natural Earth coast and river vectors, and Mapzen elevation tiles. Settlement anchors and modeled territory groups approximate the geographic coverage at the scale of the campaign. [Bombay chronology](bombay-sources.md)

Use `--region punjab` for Punjab. The 1941 outline covers the eastern districts within the source's modern India extent. The 1951 and 1961 snapshots show East Punjab and the enlarged state, and the 1971 census outlines approximate the 1966 Punjab and Haryana borders. Settlement markers retain their mapped town centres where the digitized boundaries and modeled ownership differ. The game represents Chandigarh as a shared capital with Union ownership. The builder also needs the 1971 census archive, Natural Earth’s Gobind Sagar lake feature, and elevation tiles covering 70.8°E–81.7°E and 27.0°N–33.7°N. [Punjab chronology](punjab-sources.md)

Use `--region madras` for Madras. The 1953 Andhra State outline combines 1951 districts with a later census proxy for the Bellary taluks. The 1956 outlines use the 1961 census and include some subsequent village-level changes. Natural Earth hydrography supplies the Mettur reservoir and major channels. [Madras and Andhra chronology](madras-sources.md) · [1961 Madras administration report](https://censusindia.gov.in/nada/index.php/catalog/31283/download/34464/22522_1961_ADM.pdf) · [Central Water Commission on the Mettur reservoir](https://cwc.gov.in/sites/default/files/sedimentation-assessment-mettur-stanley-reservoir-tamil-nadu-through-remote-sensing-may-2020.pdf)

Use `--region assam` for Assam. The opening map combines the 1941 district geometry with a campaign-scale trace of pre-Partition Sylhet from the 1931 Imperial Gazetteer atlas. Later phases use 1951, 1961 and 1971 district outlines. The 1972 outline represents the district transfer, while Dispur becomes the capital marker in 1973. The Brahmaputra and Barak use reference hydrography. [Imperial Gazetteer, plate 32](https://dsal.uchicago.edu/reference/gaz_atlas_1931/) · [Assam campaign sources](assam-sources.md)

Use `--region central` for Central Provinces and Berar. The four outline phases cover the 1946 province, the 1948 princely integrations, the 1950 Republic and the 1956 reorganization. Gandhi Sagar enters the map in 1960. [Central campaign map sources](central-map-sources.md)

The input directory contains the 1941, 1951 and 1961 `India-State-Districts-YYYY.geojsonl` members of the historical release. It also contains `land.json`, `lakes.json`, and `rivers.json` from the Natural Earth GeoJSON distribution (`ne_10m_land`, `ne_10m_lakes`, `ne_10m_rivers_lake_centerlines`). Put Mapzen Terrarium tiles in the same directory as `dem-8-X-Y.png` from `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/8/X/Y.png`. The combined source coverage used 81°E–90°E and 21°N–29°N for Bihar, and 79.5°E–89°E and 16°N–24°N for Orissa.

The browser loads the selected region's projected geometry and relief texture when its campaign opens. Bihar's alternate split and Mayurbhanj's local boundary are loaded with their respective campaigns. The national atlas loads when opened from the map.

| Input | SHA-256 |
| --- | --- |
| 1941 archive | `2e5357b2f218ac8aa10de98cf2ba7c96404f314b729cba43ab273ef859b5b60e` |
| 1951 archive | `d125fb95666cc478a15440a9c9cffa68825cd2fbb9fa356bd1f3cbee912950d2` |
| 1961 archive | `d1b60b4fe3830989f6a4b9c38a2e8f406ca8293e98866f0e4d79ff3d18d291ba` |
| 1971 archive | `ebbd38309f80bc1b4827c6373c5e2572366d5f3e2e3071eea4768acbaf3e442d` |
| Natural Earth land | `1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416` |
| Natural Earth lakes | `2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9` |
| Natural Earth rivers | `bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a` |

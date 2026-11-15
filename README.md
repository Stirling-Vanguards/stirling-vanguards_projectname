# Stirling Vanguards: Vanguard Atlas

**NASA Space Apps Challenge 2026 — Abu Dhabi**

Challenge: *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.*

Vanguard Atlas is an open-source planetary analog comparison tool that helps mission planners, engineers, and researchers identify where on Earth to test hardware and field procedures for the Moon and Mars — and clearly shows where the analogy breaks down.

Rather than hiding trade-offs behind a single blended "similarity score," we compare Earth sites against Moon and Mars targets **one dimension at a time**: terrain, thermal, geology, and subsurface. Each site card surfaces per-dimension scores (0.0–1.0), explicit confidence badges (high / medium / low), documented strengths, breakdown limits, and what you could actually test there.

## Live demo

**https://vanguardatlas.github.io**

The app is a zero-backend static site deployed via GitHub Pages. The only external requests it makes are for basemap tiles and the MapLibre library.

## Key results

We scored **8 Earth analog sites** against **2 extraterrestrial targets** across **4 dimensions** = **16 site-target pairs**. All pairs currently carry **low confidence** because the target profiles use catalog/proxy data and remain unverified.

| Target | Top terrain match | Top thermal match | Top geology match |
| --- | --- | --- | --- |
| Lunar South Pole `[30.0, -88.0]` | Mauna Kea (0.65) | Death Valley (0.27) | Haughton / Askja / Atacama / McMurdo (0.50) |
| Jezero Crater `[77.5, 18.4]` | Death Valley (0.72) | McMurdo Dry Valleys (0.47) | Death Valley / Haughton (0.67) |

Full results, including subsurface scores and per-site breakdowns, are in [`docs/report/findings_report.md`](docs/report/findings_report.md) and [`data/processed/sites.json`](data/processed/sites.json).

## How it works

```
Earth DEM tiles          Target DEM rasters
  (Copernicus GLO-30)       (LOLA 240m / MOLA 463m)
        |                          |
   earth_terrain.py          read_ldsm.py / read_mola.py
        |                          |
        +-----------+--------------+
                    |
             score_sites.py
                    |
          similarity + confidence
                    |
             sites.json (16 records)
                    |
         app/ (static web atlas)
```

- **Terrain**: slope statistics (median, p90, mean, %flat) computed from 30 m Copernicus GLO-30 DEM on Earth, 240 m LRO LOLA on the Moon, 463 m MGS MOLA on Mars.
- **Thermal**: absolute annual min/max, diurnal swing, and seasonal variation compared in Kelvin. Earth baselines from WorldClim v2.1; Moon from LRO Diviner; Mars from MGS TES / Mars 2020 MEDA.
- **Geology**: mineral/lithology class overlap against USGS and GLiM catalogs. Moon: USGS Unified Geologic Map / Kaguya MI. Mars: MRO CRISM / USGS SIM 3292.
- **Subsurface**: presence/absence matching of caves, lava tubes, pits, and ground ice against published catalogs (Wagner & Robinson 2014; Mars Global Cave Candidate Catalog).

There is **no overall score**. Dimensions are scored and exported separately.

## Run the web app locally

ES modules need a local server. Opening `index.html` straight from disk won't work.

```bash
cd app
python -m http.server 8000
# open http://localhost:8000
```

The app loads real processed data from `app/public/data/sites.json` via a manifest-driven bootstrap that validates records at the client boundary. A fallback offline snapshot is bundled for transport failures.

## Run the data pipeline

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Score all sites and export contract records

```bash
python -m pipeline.scoring.score_sites            # validated export
python -m pipeline.scoring.score_sites --draft    # partial dimensions, not validated (UI dev only)
```

**Outputs:**
- `data/processed/sites.json` — contract-valid records
- `app/public/data/sites.json` — copy for the web app
- `data/interim/scoring_report.json` — warnings, skipped sites, confidence reasons

### Run validation checks

```bash
python -m pipeline.validation.run_validation
```

### Run the test suite

```bash
python -m pytest
# 30 passed (data-contract schema tests + scoring logic tests)
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `app/` | Static web app: Home, Moon, Mars, and Explore (Atlas) pages with interactive maps, radar charts, ranked tables, and site cards. Deployed on GitHub Pages. |
| `app/src/` | ES module source: components (radar, ranked table, site card, score bars), data bootstrap, map layers, design tokens, page controllers. |
| `pipeline/` | Python pipeline: ingest (LOLA/MOLA readers), features (Earth terrain/climate, target terrain), scoring (similarity, confidence, narrative, export), validation. |
| `pipeline/config.yaml` | Tolerances, data-quality metadata, confidence rules, paths. Edit here instead of editing code. |
| `pipeline/targets/targets.yaml` | Target site profiles (coordinates, dimensions, data sources, verified flags). |
| `data/processed/` | Small processed JSON only. Raw data is gitignored. |
| `data/DATA_SOURCES.md` | Every dataset used, with agency, URL, license, and access date. |
| `docs/` | Data contract, criteria, site cards, design mockups, findings report, validation results, pitch deck. |
| `tests/` | Pytest suite: data-contract schema validation + scoring logic (30 tests). |

## Data

Site records follow the frozen data contract in [`docs/data_contract.md`](docs/data_contract.md) (JSON schema: [`docs/data_contract.schema.json`](docs/data_contract.schema.json)). Coordinates are `[longitude, latitude]`. Credits for every dataset are in [`data/DATA_SOURCES.md`](data/DATA_SOURCES.md).

### Datasets

| Body | Dimension | Source | Resolution |
| --- | --- | --- | --- |
| Earth | Terrain | Copernicus DEM GLO-30 (TanDEM-X) | ~30 m |
| Earth | Thermal | WorldClim v2.1 | 10 arcmin |
| Earth | Geology | USGS / GLiM lithology catalogs | catalog |
| Earth | Subsurface | NCKRI cave/karst database | catalog |
| Moon | Terrain | LRO LOLA GDRDSM (ldsm_75s_240m) | 240 m |
| Moon | Thermal | LRO Diviner Polar Cumulative Product | ~250 m |
| Moon | Geology | USGS Unified Geologic Map / Kaguya MI | ~500 m |
| Moon | Subsurface | Wagner & Robinson (2014) Lunar Pit Atlas | catalog |
| Mars | Terrain | MGS MOLA MEGDR (megt44n000hb) | 463 m |
| Mars | Thermal | MGS TES / Mars 2020 MEDA | ~100 m |
| Mars | Geology | MRO CRISM / USGS SIM 3292 | ~100 m |
| Mars | Subsurface | MRO SHARAD / Mars Global Cave Candidate Catalog | catalog |

## Known limitations

Even top-scoring terrestrial analogs break down under extraterrestrial boundary conditions:

1. **Reduced gravity**: Earth's 1.0g cannot replicate lunar gravity (~0.165g) or Martian gravity (~0.38g). Wheel sinkage, rover traction, and drill anchoring forces differ.
2. **Atmosphere and vacuum**: The Moon is ultra-high vacuum; Mars has a thin CO₂ atmosphere (~6 mbar). Terrestrial aerodynamic drag, convective cooling, and wind-driven dust transport don't match.
3. **Radiation**: Earth's magnetic field and dense atmosphere shield surface hardware from GCRs and SPEs. Field testing can't validate radiation tolerance without accelerator facilities.
4. **Lunar polar cold traps**: Permanently shadowed regions near the lunar south pole reach ~40 K — no terrestrial equivalent exists.
5. **Regolith mechanics**: Lunar regolith is unweathered, jagged, electrostatically charged dust — nothing on Earth behaves the same way.

See [`docs/site_cards/earth_limits.md`](docs/site_cards/earth_limits.md) for the full reference.

## Validation

The pipeline includes automated validation tests that verify scoring behavior against published planetary analog literature:

- **Positive controls**: Atacama Desert (Jezero thermal), Death Valley (Jezero terrain), Haughton Crater (Jezero geology), McMurdo Dry Valleys (Lunar South Pole thermal/subsurface).
- **Negative controls**: Hawaiian shield volcanoes score low against lunar thermal and Jezero lacustrine mineral assemblages, confirming the pipeline rejects false matches.

Results: [`docs/report/validation_results.md`](docs/report/validation_results.md). Test suite: `python -m pytest` (30 passed).

## Team

**Stirling Vanguards**

| Member | Role |
| --- | --- |
| Rex Gabriel Salamat | Project Manager & Data Lead |
| Kurt Marvic Amboy | Fullstack Lead | Data co lead | Science co Lead
| Elieser Agustin IV | Frontend Lead & Science Lead |
| Joash Chrysler Aludino | Data Engineer |
| Venice Lee Ballovar | Science Documentation |


## License

MIT. See [`LICENSE`](LICENSE).

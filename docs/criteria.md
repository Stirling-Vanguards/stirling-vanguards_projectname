# Analog Criteria (DRAFT v1)

**Project:** Stirling Vanguards, 2026 NASA Space Apps Challenge (Abu Dhabi)
**Challenge:** Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars
**Owner:** Venice (Science Lead). Methodology review: Rex.
**Status:** Draft for team review. Not frozen until Rex and Venice confirm.
**Last updated:** November 14, 2026

> Dataset names below are starting suggestions marked **(verify access)**. Nobody should build on a dataset until access is tested and it is logged in `data/DATA_SOURCES.md`.

---

## 1. Approach

- Each Earth location gets a **0 to 1 score per dimension**. We never blend them into one number.
- A score means: *how closely this Earth cell's feature distribution matches the target site's.* 1 = close match, 0 = no match.
- Dimension names match the frozen data contract (`docs/data_contract.md`): `terrain`, `thermal`, `geology`, `subsurface` (core), and optional `water_ice`, `dust_wind` (stretch).
- Target sites (one Moon, one Mars) are **not yet decided**. These criteria are written to work for any pair.
- Known analogs (Atacama, Haughton, Death Valley) are for **validation only**, not headline finds.

---

## 2. Core criteria (4)

### 2.1 Terrain (`terrain`)

| Field | Detail |
| --- | --- |
| **What we measure** | Slope (median and 90th percentile), surface roughness, and crater or boulder density if resolution allows |
| **Why it matters** | Slope and roughness decide where landers can touch down, where rovers can drive, and where habitats can be built |
| **Data (verify access)** | Moon: LOLA. Mars: MOLA, plus HiRISE/CTX for fine detail. Earth: SRTM or Copernicus DEM. Non-NASA: ESA Mars Express HRSC, JAXA Kaguya terrain data |
| **How we score** | Compute the same slope and roughness stats on all DEMs at one common scale, then score the similarity of the distributions (e.g. histogram overlap) |
| **Limitations** | DEM resolution differs a lot between bodies, so resampling to a common scale is essential. Erosion and vegetation on Earth alter slopes |
| **Evidence needed** | Instrument team papers and PDS dataset documentation for the measurements; landing-site workshop reports for why slope and roughness matter |

### 2.2 Thermal (`thermal`)

| Field | Detail |
| --- | --- |
| **What we measure** | Surface temperature range, day/night swing, seasonal variation |
| **Why it matters** | Thermal cycling drives equipment design, power needs, and rock weathering |
| **Data (verify access)** | Moon: Diviner. Mars: THEMIS. Earth: MODIS or ECOSTRESS land surface temperature. Non-NASA: Chang'e data (verify availability) |
| **How we score** | Compare annual min/max and diurnal swing, normalised per body |
| **Limitations** | The Moon has no atmosphere, so its swings are far larger than anything on Earth. Score rewards *similar swing pattern or magnitude where achievable*. Expect low Moon scores and say so on the site card |
| **Evidence needed** | Instrument papers and PDS documentation for measured temperatures; planetary science reference for body constants |

### 2.3 Geology / minerals (`geology`)

| Field | Detail |
| --- | --- |
| **What we measure** | Rock and mineral types, volcanic or basaltic terrain, relevant alteration minerals (e.g. clays, carbonates, olivine for Mars) |
| **Why it matters** | Composition affects ISRU (resource extraction), science targets, and dust and regolith behaviour |
| **Data (verify access)** | Mars: CRISM. Earth: ASTER or EMIT, plus national geologic maps. Moon: Kaguya multiband or Chandrayaan-1 M3 |
| **How we score** | Match on a short list of target mineral or lithology classes, then compute fraction overlap or spectral similarity |
| **Limitations** | Spectral data sees the surface only. Earth weathering and vegetation can mask signals |
| **Evidence needed** | Peer-reviewed mineral mapping papers for the target site; instrument documentation for the Earth sensors |

### 2.4 Subsurface: caves, lava tubes, pits (`subsurface`)

| Field | Detail |
| --- | --- |
| **What we measure** | Presence, size, and type of caves, lava tubes, and collapse pits |
| **Why it matters** | Candidate shelters from radiation and temperature extremes; may hold ice or biosignatures |
| **Data (verify access)** | Cave and lava-tube catalogs, plus DEM-based pit detection. Pit catalogs for the Moon and Mars exist in the literature; which are openly available is **not confirmed** |
| **How we score** | Match on feature type and scale; use a coarse presence/absence score where only catalog data exists |
| **Limitations** | Hardest criterion to measure from orbit. Many Earth caves are undocumented. Expect **low confidence** in most cells |
| **Evidence needed** | Peer-reviewed pit and cave detection papers |

---

## 3. Stretch criteria (only if time allows)

### 3.1 Water / ice (`water_ice`, optional)

- **Measure:** permafrost, aridity, soil moisture.
- **Data (verify access):** climate and soil moisture datasets.
- **Limitation:** Earth's liquid water is far more abundant than anything on the target bodies.
- **Evidence needed:** peer-reviewed permafrost and ice mapping papers.

### 3.2 Dust / wind (`dust_wind`, optional)

- **Measure:** dunes, wind erosion, fine dust.
- **Data (verify access):** imagery and DEM-derived mapping.
- **Limitation:** the Martian atmosphere is far thinner, so wind transport differs fundamentally.
- **Evidence needed:** aeolian studies of Mars dunes and wind regimes.

---

## 4. Confidence rule (assumption, adjust as needed)

Maps to the contract field `confidence`.

| Level | When to use |
| --- | --- |
| `high` | Both datasets are direct measurements at comparable resolution |
| `medium` | One side is modelled, or resampled by a large factor |
| `low` | Catalog-only, sparse, or proxy data |

---

## 5. "What Earth can't replicate" (standard list for every site card)

- **Gravity:** the Moon and Mars are well below Earth's.
- **Atmosphere and vacuum:** the Moon has none; Mars is very thin.
- **Radiation:** Earth's magnetic field and atmosphere shield us.
- **Polar illumination and cold traps:** important for lunar south polar sites, with no real Earth equivalent. These go in the "where the analogy breaks down" list.

*Evidence:* NASA fact sheets or a planetary science reference text for body constants.

---

## 6. Source guide for scientific claims

| Claim type | What source would support it |
| --- | --- |
| Instrument measurements (slope, temperature) | Instrument team papers and PDS dataset documentation |
| Why a criterion matters for exploration | Peer-reviewed analog-site reviews; agency landing-site or exploration-zone workshop reports |
| Body constants (gravity, pressure, radiation) | NASA fact sheets or a planetary science reference text |
| Lava tubes and pits | Peer-reviewed pit and cave detection papers |

No specific citations are attached yet. Confirm each one exists before it goes in the findings report.

---

## 7. Open items

- [ ] Venice and Rex confirm the 4 core criteria, then freeze.
- [ ] Decide the common comparison scale (suggestion: coarse grid, then drill-down for 3 to 4 deep-dive site cards).
- [ ] Rex checks the scoring approach against `pipeline/scoring`.
- [ ] Joash logs every dataset in `data/DATA_SOURCES.md` as it is used.
- [ ] Add the AI-assisted drafting of this file to `docs/ai_usage_log.md`.
- [ ] Target sites decided (Rex).

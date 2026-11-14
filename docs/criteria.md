# Analog Criteria: Vanguard Atlas

**Team:** Stirling Vanguards, 2026 NASA Space Apps Challenge (Abu Dhabi)
**Project name:** Vanguard Atlas *(Rex confirms)*
**Challenge:** Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars
**Owner:** Venice (Science Lead). Methodology review: Rex.
**Status:** Final draft, pending Rex. Becomes frozen when Venice and Rex tick the sign-off box in section 9. Items marked *(Rex)* are the defaults used until he says otherwise.
**Last updated:** November 14, 2026

---

## 1. Approach

- Each Earth location gets a **0 to 1 score per dimension**. Dimensions are never blended into one number.
- A score means: how closely this Earth cell's feature distribution matches the target site's. 1 = close match, 0 = no match.
- Dimension keys follow the data contract: `terrain`, `thermal`, `geology`, `subsurface` (core); `water_ice`, `dust_wind` (optional stretch).
- **Cells vs sites (default):** a site's score per dimension is the score of its **best-matching cell inside the site's region**. The card names that cell. *(Rex)*
- **Not scored = `null`, never 0.** Optional dimensions we skip are `null` and shown as "not scored". *(Rex)*
- Targets (one Moon, one Mars) are undecided; the criteria work for any pair. *(Rex)*
- Atacama, Haughton and Death Valley are **validation only**, not headline finds.

## 2. Core criteria

### 2.1 Terrain (`terrain`)

| Field | Detail |
| --- | --- |
| Measure | Slope (median and 90th percentile), roughness, crater/boulder density if resolution allows |
| Why it matters | Decides where landers touch down, rovers drive, habitats go |
| Data (verify access) | Moon: LOLA. Mars: MOLA, HiRISE/CTX for detail. Earth: SRTM or Copernicus DEM. Non-NASA: ESA Mars Express HRSC, JAXA Kaguya |
| Scoring | Same slope/roughness stats on all DEMs at one common scale; score distribution similarity (e.g. histogram overlap) |
| Limitations | DEM resolution differs between bodies; Earth erosion and vegetation alter slopes |
| Evidence | Instrument team papers, PDS documentation, landing-site workshop reports |

### 2.2 Thermal (`thermal`)

| Field | Detail |
| --- | --- |
| Measure | Surface temperature range, day/night swing, seasonal variation |
| Why it matters | Drives equipment design, power needs, rock weathering |
| Data (verify access) | Moon: Diviner. Mars: THEMIS. Earth: MODIS or ECOSTRESS land surface temperature. Non-NASA: Chang'e (availability unconfirmed) |
| Scoring | Compare **absolute** annual min/max and diurnal swing in kelvin. Score = 1 minus (difference / fixed reference range), clipped to 0 to 1. Reference range is a parameter in `pipeline/config.yaml`. *(Rex)* |
| Limitations | The Moon has no atmosphere, so its swings exceed anything on Earth. Expect low Moon scores and say so on the card |
| Evidence | Instrument papers, PDS documentation, planetary reference for body constants |

### 2.3 Geology / minerals (`geology`)

| Field | Detail |
| --- | --- |
| Measure | Rock and mineral types, volcanic/basaltic terrain, alteration minerals (clays, carbonates, olivine for Mars) |
| Why it matters | Affects ISRU, science targets, dust and regolith behaviour |
| Data (verify access) | Mars: CRISM. Earth: ASTER or EMIT plus national geologic maps. Moon: Kaguya multiband or Chandrayaan-1 M3 |
| Scoring | Match on a short list of target mineral/lithology classes; fraction overlap or spectral similarity |
| Limitations | Spectral data sees the surface only; weathering and vegetation mask signals |
| Evidence | Peer-reviewed mineral mapping papers for the target; Earth sensor documentation |

### 2.4 Subsurface (`subsurface`)

| Field | Detail |
| --- | --- |
| Measure | Presence, size, type of caves, lava tubes, collapse pits |
| Why it matters | Candidate shelter from radiation and temperature extremes; may hold ice |
| Data (verify access) | Cave and lava-tube catalogs, DEM-based pit detection. Openness of Moon/Mars pit catalogs is **unconfirmed** |
| Scoring | Match on feature type and scale; coarse presence/absence where only catalog data exists |
| Limitations | Hardest to measure from orbit; many Earth caves undocumented. Expect `low` confidence |
| Evidence | Peer-reviewed pit and cave detection papers |

## 3. Stretch criteria (only if time allows)

- **`water_ice`:** permafrost, aridity, soil moisture (climate/soil moisture datasets, verify access). Limit: Earth has far more liquid water. Evidence: permafrost/ice mapping papers.
- **`dust_wind`:** dunes, wind erosion, fine dust (imagery and DEM-derived mapping, verify access). Limit: Mars's thin atmosphere changes wind transport. Evidence: aeolian studies of Mars.

## 4. Confidence rule

Rate each scored dimension with the table, then set the site `confidence` to the **lowest-rated scored dimension**. Per-dimension confidence is card text only unless Rex adds a contract field. *(Rex)*

| Level | When |
| --- | --- |
| `high` | Both datasets are direct measurements at comparable resolution |
| `medium` | One side modelled or resampled by a large factor |
| `low` | Catalog-only, sparse, or proxy data |

## 5. What Earth can't replicate

Every site card draws on `docs/site_cards/earth_limits.md` (gravity, atmosphere/vacuum, radiation, other). Lunar polar illumination and cold traps go under **Breakdowns**, only if a lunar polar target is chosen.

## 6. Source guide

| Claim type | Supporting source |
| --- | --- |
| Instrument measurements | Instrument team papers, PDS documentation |
| Why a criterion matters | Peer-reviewed analog reviews; agency landing-site/exploration-zone workshop reports |
| Body constants | NASA Planetary Fact Sheets (NSSDCA); see `earth_limits.md` for which values are still to be re-checked |
| Lava tubes and pits | Peer-reviewed detection papers |

No specific paper citations are attached. Confirm each exists before it enters the report.

## 7. Site card standard

Each deep-dive site gets one card at `docs/site_cards/<site_id>.md`, copied from `docs/site_cards/_template.md` (this section and the template must stay in sync). Cards are written from pipeline output and verified sources only. Sections, in order:

1. **Basics:** `site_id`, `name`, `[lon, lat]`, `target_body`, region/country, compared target, `confidence`, best-matching cell used, author, last updated.
2. **Summary:** one or two sentences on why the site is a meaningful analog, beyond looks.
3. **Dimension scores:** score, one-line reason and source per dimension. `null` shown as "not scored", never 0.
4. **Strengths:** one bullet per point, each tied to a dimension.
5. **Breakdowns:** specific ways the analogy fails (lunar polar illumination and cold traps go here if relevant).
6. **What Earth can't replicate:** site-specific sentences drawn from `earth_limits.md`, never the whole list.
7. **Exploration uses:** each bullet starts "Use this site to test..." and names a concrete task.
8. **Confidence note:** why that level, the weakest dimension, and per-dimension confidence.
9. **Data sources:** dataset, agency, use, access verified. Each also logged in `data/DATA_SOURCES.md`.
10. **References:** only sources confirmed to exist.
11. **Review:** scores match pipeline output; every claim sourced or `[source needed]`; breakdowns filled; datasets and AI help logged.

## 8. Implementation notes for the app

- The app displays `confidence` as given; it never recomputes it.
- Ranking sorts by **one selected dimension**, never a composite.
- `null` renders as "not scored", not zero.

## 9. Sign-off and open items

- [x] Venice confirms the 4 core criteria
- [x] Rex confirms criteria and freezes this file
- [x] Rex confirms contract v1.1 (nullable optional dimensions, `earth_limits[]`, confidence handling)
- [x] Rex confirms cell-to-site roll-up and thermal reference range
- [x] Rex confirms `docs/criteria.md` and `docs/site_cards/_template.md` as locations
- [x] Rex decides target sites and common comparison scale
- [x] Joash tests dataset access and logs each in `data/DATA_SOURCES.md`
- [x] Re-check the body constants in `earth_limits.md` against the NASA fact sheets
- [x] Replace each "Evidence" line with a confirmed reference before the report

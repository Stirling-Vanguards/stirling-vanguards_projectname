@"
# Vanguard Atlas — Backup Presentation Deck (8 Slides)

---

## Slide 1: Title
**Vanguard Atlas: Multi-Dimensional Planetary Analog Site Comparison**
- Team: Stirling Vanguards (University of Stirling RAK Campus)
- Challenge: Planetary Analog Field-Site Selection for Lunar & Martian Exploration
- Repository & Prototype: `stirling-vanguards_projectname`

---

## Slide 2: The Problem with Blended Analog Scores
- **No Earth site replicates the Moon or Mars completely:** A site with lunar-like slopes may have vegetation, high atmospheric pressure, or mild temperatures.
- **Single composite scores hide failure modes:** Averaging terrain, thermal, geology, and subsurface traits into one percentage masks critical engineering risks for rovers, drills, and habitats.
- **Our Approach:** Evaluate each planetary dimension independently (`0.0` to `1.0`), surface explicit environmental breakdowns, and display `"not scored"` rather than guessing missing data.

---

## Slide 3: System Architecture & Frozen Data Contract
- **Orbital & Terrestrial Ingestion (`pipeline/`):** Python spatial pipeline extracting 5 km circular footprints from LRO LOLA (`240 m`), MGS MOLA (`463 m`), and Copernicus GLO-30 (`30 m`).
- **Strict JSON Schema (`docs/data_contract.schema.json`):** Enforces independent dimension scores, resolution-aware confidence tiers (`high` / `medium` / `low`), and explicit `strengths`, `breakdowns`, and `exploration_uses`.
- **Resilient Static Web App (`app/`):** Zero-build HTML/CSS/ES modules with offline-capable MapLibre vector map, sortable comparison table, and fail-closed data validation.

---

## Slide 4: Orbital Target Baselines (5 km Footprints)
- **Lunar South Polar Footprint (`[30.0, -88.0]` — LRO LOLA GDRDSM):**
  - Mean Slope: `12.88°` | Median Slope: `12.61°` | P90 Slope: `18.98°`
  - ~25% of pixels below `10°` (representative placeholder footprint inside 75°S–90°S LOLA coverage).
- **Jezero Crater, Mars (`[77.5, 18.4]` — MGS MOLA MEGDR):**
  - Mean Slope: `1.00°` | Median Slope: `0.91°` | P90 Slope: `1.65°`
  - Flat crater-floor terrain (~926 m central-difference baseline).

---

## Slide 5: Earth Analog Slope Results (Copernicus GLO-30, 30 m)
| Earth Analog Site | Median Slope (°) | P90 Slope (°) | Moon Terrain Score | Mars (Jezero) Score |
| --- | --- | --- | --- | --- |
| **Mauna Kea, Hawaii** | `14.44` | `22.39` | **`0.646`** | `0.000` |
| **Rio Tinto, Spain** | `8.82` | `19.02` | **`0.619`** | `0.000` |
| **Atacama Desert, Chile** | `7.15` | `19.98` | `0.450` | `0.000` |
| **McMurdo Dry Valleys** | `15.65` | `33.50` | `0.196` | `0.000` |
| **Haughton Crater, Canada** | `4.02` | `12.60` | `0.181` | `0.188` |
| **Death Valley, USA** | `0.46` | `6.30` | `0.000` | **`0.723`** |
| **Askja Lava Fields, Iceland** | `2.58` | `7.21` | `0.000` | **`0.555`** |
| **Samail Ophiolite, Oman** | `28.11` | `45.07` | `0.000` | `0.000` |

---

## Slide 6: Key Scientific & Engineering Takeaways
- **Target-Specific Trade-Offs:** Mauna Kea (`0.646`) and Rio Tinto (`0.619`) lead for lunar south polar slope geometry, whereas Death Valley (`0.723`) and Iceland's Highlands (`0.555`) best match Jezero Crater's flat floor.
- **Extreme-Slope Stress Testing:** Samail Ophiolite (`28.11°` median) exceeds both target footprints, serving as a boundary stress test for cliff avoidance rather than a direct geometric match.
- **Honest Confidence Labeling:** All 16 comparisons carry `medium` confidence because 30 m terrestrial DEMs are compared against 240 m–463 m orbital grids.

---

## Slide 7: Limitations & What Earth Cannot Replicate
- **Current Scope:** Only the `terrain` dimension (`slope_median`, `slope_p90`) is scored; `thermal`, `geology`, and `subsurface` remain unscored in this release.
- **Baseline Resolution Gap:** LOLA (`30–120 m` laser baseline), MOLA (`~926 m`), and Copernicus (`~60 m`) sample topography at different horizontal scales.
- **Irreducible Planetary Gaps:** No terrestrial site replicates lunar/Martian gravity (`0.165g` / `0.38g`), vacuum or thin $\text{CO}_2$ atmosphere, permanently shadowed cold traps, or surface radiation.

---

## Slide 8: Roadmap & Next Steps
1. **Common-Baseline Resampling:** Resample Copernicus GLO-30 tiles to match LOLA and MOLA horizontal baselines before computing slope gradients.
2. **Multi-Dimension Expansion:** Integrate Diviner/THEMIS thermal datasets, orbital mineral classifications (M3/CRISM), and lava-tube/pit catalogs into the existing contract schema.
3. **Public Deployment:** Enable GitHub Pages live hosting (`BLOCK_DEMO_DATA = true`) for interactive mission-planning exploration.
"@ | Set-Content -Path "docs\pitch\backup_deck.md" -Encoding UTF8
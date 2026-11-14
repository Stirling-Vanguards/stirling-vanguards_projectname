# Vanguard Atlas — Submission Copy & Demo Video Script

## 1. Project Summary (Submission Page Text)

**Vanguard Atlas** is an open-source planetary analog comparison tool that helps mission planners, engineers, and researchers identify where on Earth to test hardware and field procedures for the Moon and Mars—and clearly shows where the analogy breaks down.

Rather than hiding trade-offs behind a single overall "similarity score," Vanguard Atlas evaluates terrestrial field sites independently across core planetary dimensions (**Terrain**, **Thermal**, **Geology**, and **Subsurface**) against real orbital target footprints. Every candidate site displays per-dimension similarity scores (`0.0` to `1.0`), explicit data-confidence badges (`high`, `medium`, `low`), documented operational strengths, and physical breakdown limits.

### Key Capabilities
1. **Multi-Dimensional Orbital & Terrestrial Pipeline:** Extracts slope statistics (`slope_median`, `slope_p90`, `slope_mean`, `pct_below_10deg`) across 5 km circular footprints from **30 m Copernicus GLO-30 DEM** tiles on Earth, **240 m LRO LOLA GDRDSM** on the Moon, and **463 m MGS MOLA MEGDR** on Mars, paired with **WorldClim v2.1** climate baselines and published PDS/USGS geological and subsurface catalogs.
2. **No Blended Index:** Keeps terrain, thermal, geological, and subsurface scores strictly separate so an engineer testing mobility on flat slopes is never misled by a site's thermal or mineralogical mismatch.
3. **Literature-Backed Validation:** Automated validation tests verify scoring accuracy against published planetary analog studies (including Atacama Desert, Haughton Impact Crater, Death Valley, and McMurdo Dry Valleys) alongside negative controls (Hawaiian basaltic shield volcanoes).
4. **Interactive Dual-Body Atlas:** Built as a zero-backend static web application (`vanguardatlas.github.io`) featuring interactive Moon and Mars target maps, ranked comparison tables, multi-axis radar charts, and side-by-side site cards.

---

## 2. Demo Video Script (2 Minutes)

### [0:00 – 0:25] The Problem & Hook
**Visual:** Open `https://vanguardatlas.github.io` on the Home landing view showing the Earth, Moon, and Mars target cards.  
**Narration:** "Before any rover, lander, or astronaut tool leaves Earth, engineers test it at terrestrial analog sites. The problem is that no single place on Earth replicates the Moon or Mars. If you collapse everything into one combined 'similarity score,' a great terrain match can hide a complete thermal or geological mismatch. We built **Vanguard Atlas** to keep those dimensions separate—and make every analog's breaking point explicit."

### [0:25 – 1:00] Exploring Lunar Targets (Lunar South Pole)
**Visual:** Click into **Lunar South Polar Site** (`moon.html`), inspect the 5 km target footprint, and click through top-ranked candidates like **McMurdo Dry Valleys** and **Iceland Lava Fields**.  
**Narration:** "Here we're comparing eight Earth field sites against a 5-kilometer footprint near the Lunar South Pole using 240-meter LRO LOLA elevation data and 30-meter Copernicus Earth DEMs. Notice how McMurdo Dry Valleys scores highest on thermal and subsurface permafrost analogs, while each site card surfaces its exact confidence level and where the analogy fails—like Earth's atmosphere, 1g gravity, and the absence of 40-Kelvin permanently shadowed cold traps."

### [1:00 – 1:35] Switching to Mars (Jezero Crater) & Side-by-Side Comparison
**Visual:** Switch to **Jezero Crater** (`mars.html`) or the **Explore** comparison view (`explore.html`). Toggle dimensions in the ranked table and open the radar comparison between **Death Valley**, **Atacama Desert**, and **Haughton Impact Crater**.  
**Narration:** "Switching to Jezero Crater on Mars—scored against MGS MOLA topography and orbital mineral catalogs—different winners emerge depending on what you're testing. Death Valley leads on alluvial and canyon slope distributions, Atacama leads on diurnal thermal swings, and Haughton Crater matches Jezero's impact-breccia, carbonate, clay, and sulfate geology. Our radar overlay lets engineers compare those trade-offs side by side without losing nuance."

### [1:35 – 2:00] Reproducible Pipeline & Validation
**Visual:** Show `data/processed/sites.json` or the terminal running `py -m pytest` (30 passed) and `docs/report/validation_results.md`.  
**Narration:** "Behind the interface is a reproducible Python feature-extraction and scoring pipeline backed by 30 automated contract and scientific-validation tests. Vanguard Atlas is open-source, lightweight, and ready for mission teams to plug in new orbital rasters or candidate field sites."
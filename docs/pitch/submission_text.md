# Vanguard Atlas — Submission Copy
## 1. Project Summary (Submission Page Text)

**Vanguard Atlas** is an open-source planetary analog comparison tool that helps mission planners, engineers, and researchers identify where on Earth to test hardware and field procedures for the Moon and Mars—and clearly shows where the analogy breaks down.

Rather than hiding trade-offs behind a single overall "similarity score," Vanguard Atlas evaluates terrestrial field sites independently across core planetary dimensions (**Terrain**, **Thermal**, **Geology**, and **Subsurface**) against real orbital target footprints. Every candidate site displays per-dimension similarity scores (`0.0` to `1.0`), explicit data-confidence badges (`high`, `medium`, `low`), documented operational strengths, and physical breakdown limits.

### Key Capabilities
1. **Multi-Dimensional Orbital & Terrestrial Pipeline:** Extracts slope statistics (`slope_median`, `slope_p90`, `slope_mean`, `pct_below_10deg`) across 5 km circular footprints from **30 m Copernicus GLO-30 DEM** tiles on Earth, **240 m LRO LOLA GDRDSM** on the Moon, and **463 m MGS MOLA MEGDR** on Mars, paired with **WorldClim v2.1** climate baselines and published PDS/USGS geological and subsurface catalogs.
2. **No Blended Index:** Keeps terrain, thermal, geological, and subsurface scores strictly separate so an engineer testing mobility on flat slopes is never misled by a site's thermal or mineralogical mismatch.
3. **Literature-Backed Validation:** Automated validation tests verify scoring accuracy against published planetary analog studies (including Atacama Desert, Haughton Impact Crater, Death Valley, and McMurdo Dry Valleys) alongside negative controls (Hawaiian basaltic shield volcanoes).
4. **Interactive Dual-Body Atlas:** Built as a zero-backend static web application (`vanguardatlas.github.io`) featuring interactive Moon and Mars target maps, ranked comparison tables, multi-axis radar charts, and side-by-side site cards.

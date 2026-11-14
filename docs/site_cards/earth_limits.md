# What Earth Can't Replicate: Vanguard Atlas

Standard limits of Earth as an analog for the Moon and Mars. Every site card picks the relevant ones and says how each affects *that* site (section 6 of the site card standard in `docs/criteria.md`, section 7).

**Owner:** Venice, with Ely (displays it on the site card).
**Status:** Final text. Body constants below are verified against NASA's Planetary Fact Sheets (NSSDCA, Mars and Moon fact sheets). Radiation has no numbers on purpose.

---

## Why this file exists

An analog need not match everything, but we must say where it breaks down. These limits apply to **every** Earth site. Stating them is part of the answer.

## 1. Gravity

| Body | Surface gravity | Ratio to Earth |
| --- | --- | --- |
| Earth | 9.80 m/s² | 1 |
| Mars | 3.71 m/s² | 0.379 |
| Moon | 1.62 m/s² | 0.165 |

*Source: NASA NSSDCA Planetary Fact Sheets.*

- **Why it matters:** human movement and work, regolith behaviour, rover traction, excavation, health effects.
- **Where Earth fails:** no Earth location has reduced gravity. A matching slope score says nothing about how a rover or astronaut handles it in lower gravity.
- **Partial workarounds (not site-based):** parabolic flight, offloading rigs.

## 2. Atmosphere and vacuum

| Body | Surface pressure |
| --- | --- |
| Earth | 1 atm (101.325 kPa) |
| Mars | about 0.636 kPa mean (6.36 mb), seasonal range 4.0 to 8.7 mb |
| Moon | about 3 × 10⁻¹⁵ bar at night (a tenuous exosphere) |

*Source: NASA NSSDCA Mars and Moon Fact Sheets.*

- **Why it matters:** habitat and suit design, dust transport, heat transfer, landing systems.
- **Where Earth fails:** even the highest, driest Earth sites have far denser air than Mars, and nothing on Earth is a vacuum. Treat wind, dust and thermal results with caution.
- **Especially relevant to:** `thermal`, `dust_wind`.

## 3. Radiation

- **Why it matters:** crew dose, electronics reliability, whether shelter is worth the effort.
- **Where Earth fails:** Earth's thick atmosphere and global magnetic field shield the surface. NASA's fact sheet notes the Moon and Mars have only localized regional magnetic fields, no global one. No Earth site, even a cave or high altitude, reproduces the surface radiation environment.
- **Especially relevant to:** `subsurface`. Earth caves are analogs for shape and access, not shielding behaviour.
- **Numbers:** never quote dose figures without a checked source.
- **Source to cite:** surface radiation measurements from Mars and lunar missions (instrument team papers), agency radiation-protection reports. `[source needed]` until a specific paper is confirmed.

## 4. Polar illumination and cold traps (Moon)

- **Why it matters:** lunar polar terrain can sit in near-permanent shadow at very low temperatures where volatiles like water ice may persist, while nearby ridges get long sunlight. This drives power, thermal and resource planning.
- **Where Earth fails:** Earth has seasonal light/dark cycles but no permanently shadowed, airless cold traps.
- **Card handling:** list under **Breakdowns**, not under "Earth can't replicate". Only applies if a lunar polar target is chosen. *(Rex)*
- **Source to cite:** Diviner-based temperature and illumination papers; peer-reviewed permanently shadowed region studies. `[source needed]` until confirmed.

## 5. Other limits (use if relevant)

- **Biology:** Earth sites are full of life and organics; microbial or vegetation effects can confuse spectral and thermal signals.
- **Weathering and water:** liquid water erosion and vegetation reshape Earth terrain differently from airless or arid worlds.
- **Dust properties:** lunar regolith is sharp and electrostatically active, unlike weathered Earth soil. Source: Apollo-era regolith studies.
- **Scale and resolution:** dataset resolutions differ across bodies, so a match at one scale may not hold at another (a data limit, not a physical one).

## Quick reference: limit by criterion

| Criterion | Main limits |
| --- | --- |
| `terrain` | Gravity, weathering, vegetation |
| `thermal` | Atmosphere/vacuum, polar illumination (Moon) |
| `geology` | Weathering, biology masking spectra |
| `subsurface` | Radiation, gravity (cave stability) |
| `water_ice` | Abundant liquid water, polar cold traps |
| `dust_wind` | Atmosphere, dust properties |

## How to use on a site card

1. Copy only limits that matter for that site.
2. Rewrite each in one site-specific sentence (e.g. "Rub' al Khali dunes have far denser air than Mars, so wind transport rates will not transfer").
3. Add a source or write `[source needed]`.
4. Never paste a number you haven't checked.

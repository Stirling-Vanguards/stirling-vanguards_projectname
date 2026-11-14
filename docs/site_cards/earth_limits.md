# What Earth Can't Replicate

Standard limits of Earth as an analog for the Moon and Mars. Every site card pulls from this list and says how each limit affects *that* site (see section 6 of `_template.md`).

**Owner:** Venice, with Ely (who displays it on the site card).
**Status:** Draft. Numbers marked *(verify)* must be checked against the listed source before they go in the report or the app.

> Rex may add a "what Earth can't replicate" field to the data contract. If he does, he will announce it in the group chat. Until then this content lives on the card only.

---

## Why this file exists

The challenge says an analog does not need to match everything, but we have to explain where it breaks down. These limits apply to **every** Earth site. Naming them honestly is part of the answer, not a weakness.

---

## 1. Gravity

| Body | Surface gravity (approx.) |
| --- | --- |
| Earth | 9.8 m/s² (1 g) |
| Mars | about 3.7 m/s², roughly 0.38 g *(verify)* |
| Moon | about 1.6 m/s², roughly 0.17 g *(verify)* |

- **Why it matters:** affects how humans move and work, dust and regolith behaviour, rover traction, excavation, and long-term health effects.
- **Where an Earth site fails:** no Earth location has reduced gravity. Slope scores say nothing about how a rover or astronaut handles that slope in lower gravity.
- **Partial workarounds (not site-based):** parabolic flights, suspended-load or offloading rigs. These are not location analogs.
- **Source to cite:** NASA planetary fact sheets, or a planetary science reference text.

## 2. Atmosphere and vacuum

| Body | Atmosphere |
| --- | --- |
| Earth | about 101 kPa surface pressure |
| Mars | very thin, mostly CO₂, well under 1 kPa *(verify)* |
| Moon | essentially none (a very tenuous exosphere) |

- **Why it matters:** pressure and composition drive habitat design, suit design, dust transport, heat transfer, and parachute or aerobraking feasibility.
- **Where an Earth site fails:** even the highest, driest Earth sites have far denser air than Mars. Nothing on Earth is a vacuum. Wind, dust, and thermal results from Earth need extra caution.
- **Especially relevant to:** the `thermal` and `dust_wind` criteria.
- **Source to cite:** NASA planetary fact sheets, and Mars atmosphere papers from rover or orbiter instrument teams.

## 3. Radiation

- **Why it matters:** crew dose, electronics reliability, and where shelter (caves, regolith cover) is worth the effort.
- **Where an Earth site fails:** Earth's magnetic field and thick atmosphere shield the surface. Moon and Mars surfaces get much higher exposure from galactic cosmic rays and solar particle events. No Earth site, even at altitude or in caves, reproduces the surface radiation environment.
- **Especially relevant to:** the `subsurface` criterion. Caves on Earth are good analogs for *shape and access*, not for radiation shielding behaviour.
- **Numbers:** do not quote dose figures from memory.
- **Source to cite:** surface radiation measurements from Mars and lunar surface missions (instrument team papers), and agency radiation-protection reports.

## 4. Polar illumination and cold traps (Moon)

- **Why it matters:** at lunar polar sites, some terrain is in near-permanent shadow with extremely low temperatures where volatiles like water ice may persist, while nearby ridges can have long periods of sunlight. This drives power, thermal, and resource planning.
- **Where an Earth site fails:** Earth's axial tilt and atmosphere give no equivalent. Polar Earth sites have seasonal light and dark cycles, but no permanently shadowed, airless cold traps.
- **How the card should handle it:** list it under "where the analogy breaks down" for any site compared to a lunar polar target.
- **Source to cite:** lunar orbiter temperature and illumination studies (for example Diviner-based papers), and peer-reviewed permanently shadowed region studies.

## 5. Other limits worth mentioning (use if relevant)

- **Biology:** Earth sites are full of life and organic material. Mars and Moon surfaces are not, so microbial or vegetation effects can confuse spectral and thermal signals.
- **Weathering and water:** liquid water erosion and vegetation reshape Earth terrain in ways that do not match airless or arid worlds. Source: geomorphology literature on Earth-Mars comparisons.
- **Dust properties:** lunar regolith is sharp and electrostatically active, unlike weathered Earth soil. Source: Apollo-era regolith studies and lunar sample analyses.
- **Scale and resolution:** Moon, Mars, and Earth datasets have different resolutions, so a match at one scale may not hold at another. This is a data limit, not a physical one, but it belongs on the card.

---

## Quick reference: which limit hits which criterion

| Criterion | Main Earth limits that apply |
| --- | --- |
| `terrain` | Gravity, weathering and vegetation |
| `thermal` | Atmosphere and vacuum, polar illumination (Moon) |
| `geology` | Weathering, biology masking spectral signals |
| `subsurface` | Radiation, gravity (cave stability) |
| `water_ice` (optional) | Abundant liquid water on Earth, polar cold traps |
| `dust_wind` (optional) | Atmosphere, dust properties |

---

## How to use this on a site card

1. Copy only the limits that matter for that site.
2. Rewrite each in one sentence specific to the site (for example, "Rub' al Khali dunes have much denser air than Mars, so wind transport rates will not transfer").
3. Add a source or write `[source needed]`.
4. Never paste a number you haven't checked.

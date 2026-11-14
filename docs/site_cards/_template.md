# Site Card: [Site name]
## 1. Basics

| Field | Value |
| --- | --- |
| `site_id` (contract) | |
| `name` (contract) | |
| `coordinates` (contract) | [lon, lat] (longitude first) |
| `target_body` (contract) | `moon` or `mars` (the body this site is an analog **for**) |
| Region / country (card text only) | |
| Compared against (card text only) | Name of the Moon or Mars target site |
| `confidence` (contract) | `high` / `medium` / `low`. One value per site: the **lowest-rated scored dimension** (rule in `docs/criteria.md` §4) |
| Card author | |
| Last updated | |

## 2. One-line summary

One or two sentences: what is this site, and why is it a meaningful analog? Say *why*, not just "it looks similar".

## 3. Dimension scores

Scores are 0 to 1. A score is how closely this site's feature distribution matches the target. Copy values from the pipeline output, never from memory. State which cell the site score comes from (best-matching cell in the region, unless Rex decides otherwise).

A dimension we did not score is **`null`, never 0**. Write "not scored" in the table.

| Dimension | Score (contract) | One-line reason (card text only) | Source / dataset |
| --- | --- | --- | --- |
| `terrain` | | | |
| `thermal` | | | |
| `geology` | | | |
| `subsurface` | | | |
| `water_ice` (optional) | | | |
| `dust_wind` (optional) | | | |

## 4. Strengths (`strengths`)

What matches well. One bullet per point, each tied to a dimension.

- **[Dimension]:** ... *(source)*
- **[Dimension]:** ... *(source)*

## 5. Breakdowns (`breakdowns`)

Where the analogy fails. Be specific. An honest breakdown makes the card more credible.

- **[Dimension]:** ... *(source)*
- **[Dimension]:** ... *(source)*

## 6. What Earth can't replicate

Pull the relevant items from `docs/site_cards/earth_limits.md` and say how each one affects *this* site. Do not just paste the whole list. This section is **card text only** until Rex adds a contract field for it (suggested: `earth_limits[]`).

Polar illumination and cold traps do **not** go here. Put them in section 5 (Breakdowns).

- **Gravity:**
- **Atmosphere / vacuum:**
- **Radiation:**
- **Other (only if not covered above):**

## 7. Exploration uses (`exploration_uses`)

Start each bullet with "Use this site to test...". Name a concrete activity.

- Use this site to test ...
- Use this site to test ...

## 8. Confidence note

Why `confidence` is high, medium, or low. Name the weakest dimension and why (resolution gap, proxy data, catalog-only, and so on).

List the confidence of each scored dimension here too (card text only):

- `terrain`:
- `thermal`:
- `geology`:
- `subsurface`:

## 9. Data sources (`data_sources`)

Every dataset used. Each must also be logged in `data/DATA_SOURCES.md`.

| Dataset | Agency | Used for | Access verified? |
| --- | --- | --- | --- |
| | | | yes / no |

## 10. References

Peer-reviewed papers, instrument documentation, or agency reports that support the claims above. Confirm each reference exists before listing it.

1.

## 11. Review checklist

- [ ] Scores match the pipeline output
- [ ] Every claim has a source or `[source needed]`
- [ ] Breakdowns are filled in, not skipped
- [ ] "What Earth can't replicate" is specific to this site
- [ ] Datasets logged in `data/DATA_SOURCES.md`
- [ ] AI help logged in `docs/ai_usage_log.md`

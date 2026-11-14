# Site Card: [Site name]

> Copy this file to `docs/site_cards/<site_id>.md` and fill in every section.
> Field names match the frozen data contract (`docs/data_contract.md`). Do not invent new fields here.
> Every scientific claim needs a source. If you don't have one yet, write `[source needed]`.
> Never use the fake sites from `data/processed/sample_sites.json` for a real card.

## 1. Basics

| Field | Value |
| --- | --- |
| `site_id` | |
| `name` | |
| `coordinates` | [lon, lat] (longitude first) |
| `target_body` | `moon` or `mars` (the body this site is an analog **for**) |
| Region / country | |
| Compared against | Name of the Moon or Mars target site |
| `confidence` | `high` / `medium` / `low` (see rule in `docs/criteria.md`) |
| Card author | |
| Last updated | |

## 2. One-line summary

One or two sentences: what is this site, and why is it a meaningful analog? Say *why*, not just "it looks similar".

## 3. Dimension scores

Scores are 0 to 1. A score is how closely this site's feature distribution matches the target. Copy values from the pipeline output, never from memory.

| Dimension | Score | One-line reason | Source / dataset |
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

Pull the relevant items from `docs/site_cards/earth_limits.md` and say how each one affects *this* site. Do not just paste the whole list.

- **Gravity:**
- **Atmosphere / vacuum:**
- **Radiation:**
- **Other (e.g. polar illumination):**

## 7. Exploration uses (`exploration_uses`)

Start each bullet with "Use this site to test...". Name a concrete activity.

- Use this site to test ...
- Use this site to test ...

## 8. Confidence note

Why `confidence` is high, medium, or low. Name the weakest dimension and why (resolution gap, proxy data, catalog-only, and so on).

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

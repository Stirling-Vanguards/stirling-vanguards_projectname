# Data Contract

**STATUS: FROZEN (Fri Nov 13, 2026).**
Changes only via Rex, and every change is announced in the group chat.
Schema: `docs/data_contract.schema.json`. 
Sample: `data/processed/sample_sites.json`.

One record per site. A file in `data/processed/` is a JSON array of records.

```json
{
  "site_id": "...",
  "name": "...",
  "coordinates": [lon, lat],
  "target_body": "moon | mars",
  "dimension_scores": {"terrain": 0.0, "thermal": 0.0, "geology": 0.0, "subsurface": 0.0},
  "confidence": "high | medium | low",
  "strengths": ["..."],
  "breakdowns": ["..."],
  "exploration_uses": ["..."],
  "data_sources": ["..."]
}
```

## Field rules
| Field | Rule |
| --- | --- |
| `site_id` | Unique, lowercase, snake_case string |
| `name` | Display name |
| `coordinates` | `[lon, lat]` in degrees (lon -180..180, lat -90..90). Longitude first |
| `target_body` | `moon` or `mars` (the target the Earth site is matched against) |
| `dimension_scores` | Required: `terrain`, `thermal`, `geology`, `subsurface`. Each a number 0..1. Optional stretch: `water_ice`, `dust_wind` |
| `confidence` | `high`, `medium`, or `low` |
| `strengths` | List of short strings: where the analogy holds |
| `breakdowns` | List of short strings: where the analogy fails |
| `exploration_uses` | List of strings: "use this site to test..." |
| `data_sources` | List of dataset names, each also logged in `data/DATA_SOURCES.md` |

## Open items for Rex to decide
- Whether to add `what_earth_cant_replicate` (gravity, vacuum, atmosphere, radiation) to each record or keep it as a shared doc (`docs/site_cards/earth_limits.md`). Not in the contract yet; adding it means updating this file, the schema, and the sample.
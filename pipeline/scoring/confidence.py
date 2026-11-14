"""Confidence: implements the rules in pipeline/config.yaml (Venice's v1 draft).

  high   : both sides direct measurements at comparable resolution
  medium : one side modelled, or resampled by a large factor
  low    : catalog-only, sparse, or proxy data

Inputs come from config `scoring.data_quality`, e.g.
  data_quality:
    earth: {terrain: {kind: direct, resolution_m: 30}}
    mars:  {terrain: {kind: direct, resolution_m: 463}}
kind is one of: direct | modelled | catalog | proxy.

A site's confidence is the LOWEST confidence of its scored dimensions (conservative).
"""
ORDER = {"low": 0, "medium": 1, "high": 2}
VALID_KINDS = {"direct", "modelled", "catalog", "proxy"}


def _cap(level, cap):
    return level if ORDER[level] <= ORDER[cap] else cap


def dimension_confidence(dim, body, detail, quality_cfg, resample_limit=4):
    """Return (level, reason) for one scored dimension."""
    if detail.get("verified") is False:
        return "low", "target profile is not verified yet"

    q_target = (quality_cfg.get(body) or {}).get(dim)
    q_earth = (quality_cfg.get("earth") or {}).get(dim)
    if not q_target or not q_earth:
        return "low", f"no data_quality entry for {dim} (earth and/or {body}) in config"

    kinds = {q_target.get("kind"), q_earth.get("kind")}
    if not kinds <= VALID_KINDS:
        return "low", f"unknown data kind {sorted(k for k in kinds if k not in VALID_KINDS)}"
    if kinds & {"catalog", "proxy"}:
        return "low", "catalog-only or proxy data on at least one side"

    level, reason = "high", "both sides direct measurements at comparable resolution"
    if "modelled" in kinds:
        level, reason = "medium", "one side is modelled"

    res_t, res_e = q_target.get("resolution_m"), q_earth.get("resolution_m")
    if not res_t or not res_e:
        level, reason = _cap(level, "medium"), "resolution not stated in config"
    else:
        ratio = max(res_t, res_e) / min(res_t, res_e)
        if ratio > resample_limit:
            level = _cap(level, "medium")
            reason = f"resolutions differ by {ratio:.1f}x (limit {resample_limit}x)"

    if detail.get("missing"):
        level = _cap(level, "medium")
        reason += "; some features could not be compared"
    return level, reason


def site_confidence(per_dimension):
    """per_dimension: {dim: (level, reason)}. Returns (level, reasons dict)."""
    if not per_dimension:
        return "low", {}
    lowest = min((lvl for lvl, _ in per_dimension.values()), key=ORDER.get)
    return lowest, {d: f"{lvl}: {why}" for d, (lvl, why) in per_dimension.items()}
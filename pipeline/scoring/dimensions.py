"""Score ONE dimension for ONE Earth site against ONE target.

Two kinds of dimension:
  numeric  (terrain, thermal, water_ice, dust_wind): features listed in targets.yaml under
           `features`; each compared with a tolerance from config (scoring.tolerances).
  overlap  (geology, subsurface): category lists. Target list comes from targets.yaml
           (`target_classes` / `target_features`); the Earth side is a ';'-separated CSV cell.

Every function returns a `detail` dict so narrative.py and confidence.py can explain the
score. A score of None means "not scored". It is never turned into 0.
"""
from .similarity import (
    feature_similarity, is_missing, mean_ignore_none, set_overlap,
)

LABELS = {
    "terrain": "Terrain", "thermal": "Thermal", "geology": "Geology",
    "subsurface": "Subsurface", "water_ice": "Water/ice", "dust_wind": "Dust/wind",
}

# dimension -> (target key in targets.yaml, Earth CSV column)
OVERLAP_DIMENSIONS = {
    "geology": ("target_classes", "geology_classes"),
    "subsurface": ("target_features", "subsurface_features"),
}

# targets.yaml feature name -> other names the ingest scripts may use.
# read_ldsm.py / read_mola.py output e.g. "median_slope_deg"; targets.yaml says "slope_median".
# TODO (Rex/Joash): pick ONE naming and delete this table.
ALIASES = {
    "slope_median": ["median_slope_deg"],
    "slope_p90": ["p90_slope_deg"],
    "slope_mean": ["mean_slope_deg"],
}


def lookup(values, name):
    """Find a feature by its name or a known alias. None if absent or NaN."""
    for key in [name, *ALIASES.get(name, [])]:
        if key in values and not is_missing(values[key]):
            return values[key]
    return None


def _empty(kind, reason=None):
    detail = {"score": None, "kind": kind, "features": [], "missing": [],
              "matched": [], "unmatched": [], "verified": True}
    if reason:
        detail["missing"].append(("-", reason))
    return detail


def score_numeric(earth_row, target_feats, feature_names, tolerances):
    detail = _empty("numeric")
    sims = []
    for name in feature_names:
        tol = tolerances.get(name)
        earth_v = lookup(earth_row, name)
        target_v = lookup(target_feats, name)
        if tol is None:
            detail["missing"].append((name, "no tolerance in config"))
            continue
        if earth_v is None:
            detail["missing"].append((name, "Earth value missing"))
            continue
        if target_v is None:
            detail["missing"].append((name, "target value missing"))
            continue
        sim = feature_similarity(earth_v, target_v, tol)
        sims.append(sim)
        detail["features"].append({
            "name": name, "earth": float(earth_v), "target": float(target_v),
            "tolerance": float(tol), "similarity": sim,
        })
    detail["score"] = mean_ignore_none(sims)
    return detail


def score_overlap(earth_row, earth_column, target_items):
    detail = _empty("overlap")
    earth_cell = earth_row.get(earth_column)
    if is_missing(earth_cell):
        detail["missing"].append((earth_column, "Earth column missing or empty"))
        return detail
    score, matched, unmatched = set_overlap(earth_cell, target_items)
    if score is None:
        detail["missing"].append(("-", "target list is empty (needs Venice's cited classes)"))
        return detail
    detail.update(score=score, matched=matched, unmatched=unmatched)
    return detail


def score_dimension(dim, earth_row, target_dim_cfg, target_feats, tolerances,
                    require_verified=False):
    """Dispatch on dimension kind. `target_dim_cfg` is the dimension block from targets.yaml."""
    if dim in OVERLAP_DIMENSIONS:
        target_key, earth_col = OVERLAP_DIMENSIONS[dim]
        detail = score_overlap(earth_row, earth_col, target_dim_cfg.get(target_key))
    else:
        detail = score_numeric(earth_row, target_feats,
                               target_dim_cfg.get("features") or [], tolerances)

    # targets.yaml marks unverified entries with `verified: false`. A missing key means
    # "computed by the pipeline", which counts as verified.
    if target_dim_cfg.get("verified") is False:
        detail["verified"] = False
        if require_verified:
            detail["score"] = None
            detail["missing"].append(("-", "target profile not verified (require_verified_targets)"))
    return detail
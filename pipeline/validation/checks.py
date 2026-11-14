"""Validation checks. Pure functions: records in, result dicts out.

Statuses:
  PASS / FAIL    a real verdict
  INCONCLUSIVE   too few Earth sites to say anything about rank
  NOT CHECKED    the data needed was not there (site missing, dimension not scored, no tolerance)
"""
from pipeline.scoring.dimensions import OVERLAP_DIMENSIONS, score_dimension


def identity_check(target, target_feats, tolerances, dims):
    """A site that is IDENTICAL to the target must score 1.0 on every dimension we can score.

    `target` is one entry of targets.yaml. This catches broken math, unit mix-ups and alias
    mistakes without making any scientific claim.
    """
    row = dict(target_feats)
    for dim, (target_key, earth_col) in OVERLAP_DIMENSIONS.items():
        items = ((target.get("dimensions") or {}).get(dim) or {}).get(target_key) or []
        if items:
            row[earth_col] = ";".join(items)

    results = []
    for dim in dims:
        dim_cfg = (target.get("dimensions") or {}).get(dim)
        if not dim_cfg:
            continue
        detail = score_dimension(dim, row, dim_cfg, target_feats, tolerances)
        score = detail["score"]
        if score is None:
            status = "NOT CHECKED"
        else:
            status = "PASS" if abs(score - 1.0) < 1e-9 else "FAIL"
        results.append({
            "check": "identity", "target": target["site_id"], "dimension": dim,
            "score": score, "status": status,
            "note": "; ".join(f"{name}: {why}" for name, why in detail["missing"]),
        })
    return results


def pool_scores(records, target_id, dimension):
    """{earth_site_id: score} for one target and dimension, from scoring records."""
    suffix = f"_vs_{target_id}"
    return {
        r["site_id"][: -len(suffix)]: r["dimension_scores"][dimension]
        for r in records
        if r["site_id"].endswith(suffix) and dimension in r["dimension_scores"]
    }


def rank_check(records, target_id, site_id, dimension, direction="high",
               min_percentile=0.75, min_sites=8):
    """Does `site_id` rank high (or low) among all Earth sites for this target and dimension?

    percentile = share of the OTHER sites it beats (ties count half).
    For direction "low" it is the share of other sites that score higher.
    """
    base = {"check": f"expect_{direction}", "target": target_id, "site": site_id,
            "dimension": dimension, "score": None, "percentile": None, "pool_size": 0}
    pool = pool_scores(records, target_id, dimension)
    base["pool_size"] = len(pool)
    if site_id not in pool:
        return {**base, "status": "NOT CHECKED",
                "note": "site not scored for this target/dimension (missing from Earth table or data)"}
    score = pool[site_id]
    base["score"] = round(score, 3)
    if len(pool) < min_sites:
        return {**base, "status": "INCONCLUSIVE",
                "note": f"only {len(pool)} Earth sites scored, need {min_sites} for a rank check"}

    others = [v for k, v in pool.items() if k != site_id]
    if direction == "high":
        beaten = sum(v < score for v in others) + 0.5 * sum(v == score for v in others)
    else:
        beaten = sum(v > score for v in others) + 0.5 * sum(v == score for v in others)
    pct = beaten / len(others)
    base["percentile"] = round(pct, 2)
    status = "PASS" if pct >= min_percentile else "FAIL"
    return {**base, "status": status, "note": ""}


def summarize(results):
    """Counts per status, for the report header."""
    counts = {}
    for r in results:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    return counts
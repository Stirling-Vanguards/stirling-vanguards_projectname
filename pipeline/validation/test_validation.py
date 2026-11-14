"""Scientific-validity tests (Rex). Run from the repo root:  python -m pytest tests/test_validation.py

The first three tests need no data. The last one runs the real known-analog checks and is
skipped until Joash's data/interim/earth_features.csv exists and validation_sites.yaml
has expectations.
"""
from unittest import skipIf

from pipeline.scoring.similarity import feature_similarity, set_overlap
from pipeline.validation import checks
from pipeline.validation.run_validation import REPO, _expectations, evaluate, VALIDATION_YAML
from pipeline.scoring.score_sites import _load_yaml


def test_similarity_basics():
    assert feature_similarity(5, 5, 10) == 1.0
    assert feature_similarity(10, 5, 10) == 0.5
    assert feature_similarity(20, 5, 10) == 0.0          # floored at 0
    assert feature_similarity(None, 5, 10) is None        # missing is not zero
    assert feature_similarity(float("nan"), 5, 10) is None
    score, matched, unmatched = set_overlap("Basalt;sand", ["basalt", "lava tube"])
    assert score == 0.5 and matched == ["basalt"] and unmatched == ["lava tube"]
    assert set_overlap("basalt", [])[0] is None           # empty target list is not a 0


def test_identity_scores_one():
    target = {"site_id": "t", "dimensions": {
        "terrain": {"features": ["slope_median", "slope_p90"]},
        "geology": {"target_classes": ["basalt"], "verified": False}}}
    feats = {"median_slope_deg": 6.0, "p90_slope_deg": 15.0}   # ingest-style names, via aliases
    res = checks.identity_check(target, feats, {"slope_median": 5, "slope_p90": 10},
                                ["terrain", "geology"])
    assert {r["dimension"]: r["status"] for r in res} == {"terrain": "PASS", "geology": "PASS"}


def _records(scores, target="jezero_crater", dim="terrain"):
    return [{"site_id": f"{s}_vs_{target}", "dimension_scores": {dim: v}} for s, v in scores.items()]


def test_rank_check_logic():
    pool = {f"s{i}": i / 10 for i in range(10)}            # 0.0 ... 0.9
    pool["analog"] = 0.95
    recs = _records(pool)
    assert checks.rank_check(recs, "jezero_crater", "analog", "terrain")["status"] == "PASS"
    assert checks.rank_check(recs, "jezero_crater", "s1", "terrain")["status"] == "FAIL"
    assert checks.rank_check(recs, "jezero_crater", "s1", "terrain", direction="low")["status"] == "PASS"
    assert checks.rank_check(recs, "jezero_crater", "ghost", "terrain")["status"] == "NOT CHECKED"
    small = _records({"a": 0.9, "b": 0.1})
    assert checks.rank_check(small, "jezero_crater", "a", "terrain")["status"] == "INCONCLUSIVE"


@skipIf(
    not (REPO / "data" / "interim" / "earth_features.csv").exists()
    or not _expectations(_load_yaml(VALIDATION_YAML)),
    reason="needs earth_features.csv and expectations in validation_sites.yaml")
def test_known_analogs_verified_expectations_hold():
    result = evaluate(sensitivity=False)
    failed = [r for r in result["rank"] if r["status"] == "FAIL" and r["verified"]]
    assert not failed, f"verified known analogs scored poorly: {failed}"
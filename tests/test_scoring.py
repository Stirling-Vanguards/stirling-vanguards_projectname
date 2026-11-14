"""Pipeline tests for pipeline/scoring (Rex, reviewed by Vince). Run from the repo root:
    python -m pytest tests/test_scoring.py

Each test builds a tiny throwaway repo in a temp folder, so these need no real data and never
touch data/ or app/. They check behaviour that must hold for ANY data:
  * output records follow the contract and contain no blended score
  * missing data is never turned into 0
  * confidence rules, id sanitising, feature-name aliases, export refusing bad records
"""
import json
import re
import shutil
from pathlib import Path

import pytest
import yaml

from pipeline.scoring import confidence, export
from pipeline.scoring.score_sites import run

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_KEYS = {
    "site_id", "name", "coordinates", "target_body", "dimension_scores", "confidence",
    "strengths", "breakdowns", "exploration_uses", "data_sources",
}

CONFIG = {
    "dimensions": ["terrain", "thermal", "geology", "subsurface"],
    "stretch_dimensions": [],
    "paths": {"raw": "data/raw", "interim": "data/interim", "processed": "data/processed",
              "targets": "pipeline/targets/targets.yaml", "schema": "docs/data_contract.schema.json",
              "app_data": "app/public/data"},
    "scoring": {
        "tolerances": {"slope_median": 5.0, "temp_max": 50.0},
        "resample_factor_limit": 4,
        "data_quality": {
            "earth": {d: {"kind": "direct", "resolution_m": 240} for d in
                      ("terrain", "thermal", "geology", "subsurface")},
            "moon": {d: {"kind": "direct", "resolution_m": 240} for d in
                     ("terrain", "thermal", "geology", "subsurface")},
        },
        "earth_data_sources": {"terrain": ["Earth DEM"]},
    },
}
TARGETS = {"targets": [{
    "site_id": "t", "name": "T", "target_body": "moon",
    "dimensions": {
        "terrain": {"features": ["slope_median"], "data_sources": ["LOLA"], "computed": True},
        "thermal": {"features": ["temp_max"], "data_sources": ["Diviner"], "computed": True},
        "geology": {"target_classes": ["basalt"], "data_sources": ["M3"], "verified": True},
        "subsurface": {"target_features": ["lava tube"], "data_sources": ["pits"], "verified": True},
    },
    "breakdowns": ["Cold traps have no Earth equivalent"],
}]}
HEADER = "site_id,name,lon,lat,slope_median,temp_max,geology_classes,subsurface_features\n"
GOOD_ROW = "alpha,Alpha,10.0,20.0,6.0,300,basalt;sand,lava tube\n"


def make_repo(tmp_path, csv_rows=GOOD_ROW, config=None, target_feats="default"):
    """Write a minimal repo layout into tmp_path and return it."""
    (tmp_path / "pipeline" / "targets").mkdir(parents=True)
    (tmp_path / "data" / "interim" / "targets").mkdir(parents=True)
    (tmp_path / "docs").mkdir()
    (tmp_path / "pipeline" / "config.yaml").write_text(yaml.safe_dump(config or CONFIG))
    (tmp_path / "pipeline" / "targets" / "targets.yaml").write_text(yaml.safe_dump(TARGETS))
    (tmp_path / "data" / "interim" / "earth_features.csv").write_text(HEADER + csv_rows)
    if target_feats == "default":
        target_feats = {"slope_median": 6.0, "temp_max": 300}
    if target_feats is not None:
        (tmp_path / "data" / "interim" / "targets" / "t.json").write_text(json.dumps(target_feats))
    shutil.copy(ROOT / "docs" / "data_contract.schema.json", tmp_path / "docs")
    return tmp_path


# ---------- output shape ----------

def test_complete_site_gives_a_valid_contract_record(tmp_path):
    repo = make_repo(tmp_path)
    records, report = run(repo=repo)
    assert len(records) == 1 and report["n_skipped"] == 0
    assert export.validate_records(records, repo / "docs" / "data_contract.schema.json") == []
    rec = records[0]
    assert rec["site_id"] == "alpha_vs_t" and rec["target_body"] == "moon"
    assert set(rec["dimension_scores"]) == {"terrain", "thermal", "geology", "subsurface"}
    assert all(0 <= v <= 1 for v in rec["dimension_scores"].values())


def test_no_blended_score_anywhere(tmp_path):
    records, _ = run(repo=make_repo(tmp_path))
    rec = records[0]
    assert set(rec) == CONTRACT_KEYS
    assert not {"overall", "total", "score", "mean"} & set(rec["dimension_scores"])


def test_site_id_is_sanitised_to_the_schema_pattern(tmp_path):
    repo = make_repo(tmp_path, csv_rows="Rub' al Khali!,Rub al Khali,51.0,20.0,6.0,300,basalt,lava tube\n")
    records, _ = run(repo=repo)
    assert re.fullmatch(r"[a-z0-9_]+", records[0]["site_id"])
    assert records[0]["site_id"] == "rub_al_khali_vs_t"


# ---------- missing data ----------

def test_incomplete_site_is_skipped_unless_draft(tmp_path):
    repo = make_repo(tmp_path, csv_rows="beta,Beta,1.0,2.0,6.0,,basalt,lava tube\n")   # no temp_max
    records, report = run(repo=repo)
    assert records == [] and report["n_skipped"] == 1
    draft, _ = run(repo=repo, draft=True)
    assert len(draft) == 1


def test_missing_data_is_never_scored_as_zero(tmp_path):
    repo = make_repo(tmp_path, csv_rows="beta,Beta,1.0,2.0,6.0,,basalt,lava tube\n")
    draft, _ = run(repo=repo, draft=True)
    assert "thermal" not in draft[0]["dimension_scores"]


def test_feature_without_tolerance_is_not_given_a_default(tmp_path):
    cfg = json.loads(json.dumps(CONFIG))
    del cfg["scoring"]["tolerances"]["slope_median"]
    records, report = run(repo=make_repo(tmp_path, config=cfg), draft=True)
    assert "terrain" not in records[0]["dimension_scores"]
    assert any("no tolerance" in w for w in report["warnings"])


def test_target_without_features_file_is_skipped_with_a_warning(tmp_path):
    records, report = run(repo=make_repo(tmp_path, target_feats=None))
    assert records == []
    assert any("no data/interim/targets/t.json" in w for w in report["warnings"])


def test_ingest_style_feature_names_are_accepted(tmp_path):
    repo = make_repo(tmp_path, target_feats={"median_slope_deg": 6.0, "temp_max": 300})
    records, _ = run(repo=repo)
    assert records[0]["dimension_scores"]["terrain"] == 1.0


# ---------- text fields ----------

def test_exploration_uses_comes_only_from_curated_text(tmp_path):
    repo = make_repo(tmp_path)
    records, report = run(repo=repo)
    assert records[0]["exploration_uses"] == []
    assert any("no exploration_uses" in w for w in report["warnings"])

    (repo / "docs" / "site_cards").mkdir()
    (repo / "docs" / "site_cards" / "site_text.yaml").write_text(
        yaml.safe_dump({"alpha_vs_t": {"exploration_uses": ["Use this site to test X"]}}))
    records, _ = run(repo=repo)
    assert records[0]["exploration_uses"] == ["Use this site to test X"]


def test_curated_target_breakdowns_are_included(tmp_path):
    records, _ = run(repo=make_repo(tmp_path))
    assert "Cold traps have no Earth equivalent" in records[0]["breakdowns"]


# ---------- confidence ----------

QUALITY = CONFIG["scoring"]["data_quality"]


def test_confidence_high_when_direct_and_comparable():
    assert confidence.dimension_confidence("terrain", "moon", {"missing": []}, QUALITY)[0] == "high"


def test_confidence_medium_when_resolutions_differ_a_lot():
    q = json.loads(json.dumps(QUALITY))
    q["earth"]["terrain"]["resolution_m"] = 10          # 24x finer than the target
    assert confidence.dimension_confidence("terrain", "moon", {"missing": []}, q)[0] == "medium"


def test_confidence_low_for_catalog_unverified_or_unknown():
    q = json.loads(json.dumps(QUALITY))
    q["earth"]["geology"]["kind"] = "catalog"
    assert confidence.dimension_confidence("geology", "moon", {"missing": []}, q)[0] == "low"
    assert confidence.dimension_confidence("terrain", "moon", {"verified": False, "missing": []}, QUALITY)[0] == "low"
    assert confidence.dimension_confidence("terrain", "mars", {"missing": []}, QUALITY)[0] == "low"   # no mars entry


def test_site_confidence_is_the_lowest_dimension():
    level, _ = confidence.site_confidence({"terrain": ("high", "x"), "thermal": ("low", "y")})
    assert level == "low"


# ---------- export ----------

def test_export_refuses_invalid_records_and_writes_nothing(tmp_path):
    schema = ROOT / "docs" / "data_contract.schema.json"
    bad = [{"site_id": "Bad-Id"}]
    out = tmp_path / "out.json"
    with pytest.raises(ValueError):
        export.export_records(bad, schema, out)
    assert not out.exists()


def test_export_writes_both_copies(tmp_path):
    repo = make_repo(tmp_path)
    records, _ = run(repo=repo)
    written = export.export_records(records, repo / "docs" / "data_contract.schema.json",
                                    repo / "data" / "processed" / "sites.json",
                                    repo / "app" / "public" / "data" / "sites.json")
    assert len(written) == 2 and all(p.exists() for p in written)
    assert json.loads(written[0].read_text()) == json.loads(written[1].read_text())
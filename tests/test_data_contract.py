"""Data-contract tests (Kurt). Run from the repo root:  python -m pytest tests/test_data_contract.py

What these protect: the frozen contract in docs/data_contract.md and its schema
(docs/data_contract.schema.json). The map, site card and ranked table all read these fields,
so a record that breaks the contract breaks the app.

  * the schema itself has not drifted from the frozen field list
  * every real data file the app could load is valid
  * the schema REJECTS bad records (so a passing file means something)
  * the fields the app code reads are all in the contract

Time-box: this file is meant to stay small. Scientific-validity tests live in test_validation.py.
"""
import copy
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "docs" / "data_contract.schema.json"
CONTRACT_DOC = ROOT / "docs" / "data_contract.md"
SAMPLE_PATH = ROOT / "data" / "processed" / "sample_sites.json"
MOCK_PATH = ROOT / "app" / "public" / "mock_sites.json"

# The frozen contract (Fri Nov 13). Changing this list means Rex announced a contract change.
CONTRACT_FIELDS = {
    "site_id", "name", "coordinates", "target_body", "dimension_scores", "confidence",
    "strengths", "breakdowns", "exploration_uses", "data_sources",
}
CORE_DIMENSIONS = {"terrain", "thermal", "geology", "subsurface"}
STRETCH_DIMENSIONS = {"water_ice", "dust_wind"}

# Fields read by app/src (siteCard.js, rankedTable.js, map.js, state.js)
APP_READS = {
    "site_id", "name", "coordinates", "target_body", "dimension_scores", "confidence",
    "strengths", "breakdowns", "exploration_uses", "data_sources",
}


def _schema():
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def _errors(records):
    validator = Draft202012Validator(_schema())
    return [f"{'/'.join(str(p) for p in e.path)}: {e.message}" for e in validator.iter_errors(records)]


def _sample():
    return json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))


def _data_files():
    """Every JSON file the pipeline writes or the app could load (the mock file is excluded)."""
    files = sorted((ROOT / "data" / "processed").glob("*.json"))
    files += sorted((ROOT / "app" / "public" / "data").glob("*.json"))
    return files


# ---------- the schema itself ----------

def test_schema_is_a_valid_json_schema():
    Draft202012Validator.check_schema(_schema())


def test_schema_matches_the_frozen_contract():
    item = _schema()["items"]
    assert set(item["required"]) == CONTRACT_FIELDS, "required fields changed: needs Rex's sign-off"
    assert set(item["properties"]) == CONTRACT_FIELDS
    dims = item["properties"]["dimension_scores"]
    assert set(dims["required"]) == CORE_DIMENSIONS
    assert set(dims["properties"]) == CORE_DIMENSIONS | STRETCH_DIMENSIONS
    assert dims["additionalProperties"] is False, "no unknown dimensions (and no blended score)"
    assert item["additionalProperties"] is False


def test_contract_doc_mentions_every_field():
    text = CONTRACT_DOC.read_text(encoding="utf-8")
    missing = [f for f in sorted(CONTRACT_FIELDS) if f"`{f}`" not in text and f'"{f}"' not in text]
    assert not missing, f"docs/data_contract.md does not mention: {missing}"


def test_app_only_reads_fields_in_the_contract():
    assert APP_READS <= set(_schema()["items"]["properties"])


# ---------- real data ----------

def test_sample_file_is_valid():
    assert _errors(_sample()) == []


def test_sample_is_a_useful_frontend_fixture():
    sites = _sample()
    assert {s["target_body"] for s in sites} == {"moon", "mars"}
    assert {s["confidence"] for s in sites} == {"high", "medium", "low"}
    assert any(STRETCH_DIMENSIONS & set(s["dimension_scores"]) for s in sites), "no stretch-dimension example"


def test_all_processed_and_app_data_files_are_valid():
    problems = {}
    for path in _data_files():
        data = json.loads(path.read_text(encoding="utf-8"))
        errs = _errors(data)
        ids = [r.get("site_id") for r in data] if isinstance(data, list) else []
        if len(ids) != len(set(ids)):
            errs.append("duplicate site_id values")
        if errs:
            problems[str(path.relative_to(ROOT))] = errs[:5]
    assert not problems, f"contract violations: {problems}"


# ---------- the schema must REJECT bad records ----------

def _bad_records():
    base = _sample()[0]

    def mutated(change):
        rec = copy.deepcopy(base)
        change(rec)
        return [rec]

    return {
        "unknown target_body": mutated(lambda r: r.update(target_body="venus")),
        "score above 1": mutated(lambda r: r["dimension_scores"].update(terrain=1.5)),
        "score below 0": mutated(lambda r: r["dimension_scores"].update(terrain=-0.1)),
        "null core score": mutated(lambda r: r["dimension_scores"].update(terrain=None)),
        "score as string": mutated(lambda r: r["dimension_scores"].update(terrain="0.5")),
        "bad confidence": mutated(lambda r: r.update(confidence="very high")),
        "uppercase/hyphen id": mutated(lambda r: r.update(site_id="Bad-Id")),
        "missing strengths": mutated(lambda r: r.pop("strengths")),
        "missing core dimension": mutated(lambda r: r["dimension_scores"].pop("thermal")),
        "blended score sneaked in": mutated(lambda r: r["dimension_scores"].update(overall=0.5)),
        "extra top-level field": mutated(lambda r: r.update(overall_score=0.9)),
        "latitude out of range": mutated(lambda r: r.update(coordinates=[10, 200])),
        "three coordinates": mutated(lambda r: r.update(coordinates=[1, 2, 3])),
        "empty name": mutated(lambda r: r.update(name="")),
        "non-string strength": mutated(lambda r: r.update(strengths=[1])),
    }


def test_schema_rejects_each_kind_of_bad_record():
    accepted = [label for label, recs in _bad_records().items() if not _errors(recs)]
    assert not accepted, f"schema wrongly ACCEPTED: {accepted}"


def test_optional_stretch_dimensions_may_be_absent():
    rec = copy.deepcopy(_sample()[0])
    for d in STRETCH_DIMENSIONS:
        rec["dimension_scores"].pop(d, None)
    assert _errors([rec]) == []


# ---------- the mock file the app currently loads ----------

def test_mock_file_has_what_the_map_needs():
    """mock_sites.json is UI-only and deliberately NOT schema-valid (null scores, hyphenated ids).
    It only has to satisfy the map's own isValidSite() check."""
    if not MOCK_PATH.exists():
        pytest.skip("no mock file")
    for s in json.loads(MOCK_PATH.read_text(encoding="utf-8")):
        assert isinstance(s["site_id"], str)
        assert len(s["coordinates"]) == 2 and all(isinstance(n, (int, float)) for n in s["coordinates"])
        assert s["target_body"] in ("moon", "mars")
"""Entry point: run all validation checks and write a report.

Run from the repo root:
    python -m pipeline.validation.run_validation
    python -m pipeline.validation.run_validation --strict          # unverified expectations also fail
    python -m pipeline.validation.run_validation --no-sensitivity  # skip the +/-25% tolerance runs

INPUTS   same as pipeline/scoring (config.yaml, targets.yaml, earth_features.csv, target JSONs)
         plus pipeline/validation/validation_sites.yaml
OUTPUTS  data/interim/validation_report.json   full detail (gitignored with the rest of interim/)
         docs/report/validation_results.md     table for the findings report (commit this)

Exit code 1 if any VERIFIED check FAILS (or any check with --strict). Unverified expectations
are shown but never block, because they have no citation behind them yet.
"""
import argparse
import copy
import json
import tempfile
from pathlib import Path

import yaml

from pipeline.scoring import export
from pipeline.scoring.score_sites import REPO, _load_target_features, _load_yaml, make_id, run
from . import checks

VALIDATION_YAML = Path(__file__).with_name("validation_sites.yaml")


def _expectations(vcfg):
    """Flatten validation_sites.yaml into one dict per expectation."""
    out = []
    for site in vcfg.get("validation_sites") or []:
        for direction in ("high", "low"):
            for exp in site.get(f"expect_{direction}") or []:
                out.append({
                    "site": site["site_id"], "name": site.get("name", site["site_id"]),
                    "target": exp["target"], "dimension": exp["dimension"],
                    "direction": direction,
                    "verified": bool(site.get("verified")) and bool(site.get("source_citation")),
                    "citation": site.get("source_citation"),
                })
    return out


def _run_rank_checks(records, expectations, settings):
    results = []
    for e in expectations:
        r = checks.rank_check(
            records, e["target"], e["site"], e["dimension"], e["direction"],
            settings.get("min_percentile", 0.75), settings.get("min_sites_for_rank", 8))
        r.update(verified=e["verified"], citation=e["citation"])
        results.append(r)
    return results


def _scaled_config(cfg, scale):
    """Write a temp config with every tolerance multiplied by `scale`. Returns the path."""
    cfg = copy.deepcopy(cfg)
    tol = (cfg.setdefault("scoring", {}).get("tolerances")) or {}
    cfg["scoring"]["tolerances"] = {k: v * scale for k, v in tol.items()}
    tmp = tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False, encoding="utf-8")
    yaml.safe_dump(cfg, tmp)
    tmp.close()
    return tmp.name


def evaluate(repo=REPO, config_path=None, earth_csv=None, sensitivity=True):
    """Run everything. Returns a dict with identity, rank and sensitivity results."""
    repo = Path(repo)
    config_path = config_path or repo / "pipeline" / "config.yaml"
    cfg = _load_yaml(config_path)
    vcfg = _load_yaml(VALIDATION_YAML)
    settings = vcfg.get("settings") or {}
    sc = cfg.get("scoring") or {}
    paths = cfg["paths"]
    dims = list(cfg.get("dimensions") or []) + list(cfg.get("stretch_dimensions") or [])

    # 1. identity: no Earth data needed, only targets + tolerances
    identity = []
    targets = (_load_yaml(repo / paths["targets"]).get("targets")) or []
    for t in targets:
        feats = _load_target_features(repo / paths["interim"] / "targets", t["site_id"])
        if feats is None:
            identity.append({"check": "identity", "target": t["site_id"], "dimension": "-",
                             "score": None, "status": "NOT CHECKED",
                             "note": "no target features JSON yet"})
            continue
        identity += checks.identity_check(t, feats, sc.get("tolerances") or {}, dims)

    # 2. known-analog rank checks (draft=True so partially scored sites still count)
    expectations = _expectations(vcfg)
    records, _ = run(config_path, earth_csv, draft=True, repo=repo)
    rank = _run_rank_checks(records, expectations, settings)

    # 3. sensitivity: do the verdicts survive +/-25% tolerances?
    sens = []
    if sensitivity and expectations:
        for scale in settings.get("tolerance_scales") or [0.75, 1.0, 1.25]:
            tmp = _scaled_config(cfg, scale)
            try:
                recs, _ = run(tmp, earth_csv, draft=True, repo=repo)
            finally:
                Path(tmp).unlink(missing_ok=True)
            for r in _run_rank_checks(recs, expectations, settings):
                sens.append({"scale": scale, "site": r["site"], "target": r["target"],
                             "dimension": r["dimension"], "check": r["check"],
                             "score": r["score"], "percentile": r["percentile"],
                             "status": r["status"]})

    return {"identity": identity, "rank": rank, "sensitivity": sens,
            "n_expectations": len(expectations), "n_earth_records": len(records)}


def _md_table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    lines += ["| " + " | ".join("" if c is None else str(c) for c in row) + " |" for row in rows]
    return "\n".join(lines)


def write_markdown(result, path):
    parts = ["# Validation results", "",
             "_Generated by `python -m pipeline.validation.run_validation`. Do not edit by hand._", ""]

    parts += ["## 1. Identity check (method sanity)", "",
              "A site identical to the target must score 1.0 on every dimension.", "",
              _md_table(["Target", "Dimension", "Score", "Status", "Note"],
                        [[r["target"], r["dimension"], r["score"], r["status"], r["note"]]
                         for r in result["identity"]]), ""]

    parts += ["## 2. Known analogs", ""]
    if not result["rank"]:
        parts += ["No expectations defined yet (see `pipeline/validation/validation_sites.yaml`).", ""]
    else:
        parts += [_md_table(
            ["Site", "Target", "Dimension", "Expected", "Score", "Percentile", "Pool", "Status", "Cited"],
            [[r["site"], r["target"], r["dimension"], r["check"].replace("expect_", ""), r["score"],
              r["percentile"], r["pool_size"],
              r["status"] + ("" if r["verified"] else " (unverified)"),
              r["citation"] or "no"] for r in result["rank"]]), ""]

    if result["sensitivity"]:
        parts += ["## 3. Sensitivity to tolerances", "",
                  "Each tolerance in `config.yaml` multiplied by the scale shown.", "",
                  _md_table(["Scale", "Site", "Target", "Dimension", "Score", "Percentile", "Status"],
                            [[s["scale"], s["site"], s["target"], s["dimension"], s["score"],
                              s["percentile"], s["status"]] for s in result["sensitivity"]]), ""]

    parts += ["## Notes", "",
              "- Percentile = share of the other Earth sites the analog matches or beats, per target and dimension.",
              "- INCONCLUSIVE means too few Earth sites were scored for a rank to mean anything.",
              "- Rows marked (unverified) have no published source behind the expectation yet. "
              "Do not present them as validation in the report until they do.", ""]
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def exit_code(result, strict=False):
    bad = [r for r in result["identity"] if r["status"] == "FAIL"]
    bad += [r for r in result["rank"] if r["status"] == "FAIL" and (strict or r["verified"])]
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--earth", default=None)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--no-sensitivity", action="store_true")
    args = ap.parse_args()

    result = evaluate(config_path=args.config, earth_csv=args.earth, sensitivity=not args.no_sensitivity)
    paths = _load_yaml(args.config or REPO / "pipeline" / "config.yaml")["paths"]
    export.write_json(result, REPO / paths["interim"] / "validation_report.json")
    md = write_markdown(result, REPO / "docs" / "report" / "validation_results.md")

    allr = result["identity"] + result["rank"]
    print(f"identity + known-analog checks: {checks.summarize(allr)}")
    if not result["n_expectations"]:
        print("No expectations in validation_sites.yaml yet, only identity checks ran.")
    print(f"report: {md}")
    code = exit_code(result, args.strict)
    print("RESULT:", "FAIL" if code else "ok")
    raise SystemExit(code)


if __name__ == "__main__":
    main()
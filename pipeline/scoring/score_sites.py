"""Entry point: score every Earth site against every target and write contract records.

Run from the repo root:
    python -m pipeline.scoring.score_sites            # validated export
    python -m pipeline.scoring.score_sites --draft    # partial dimensions, NOT validated, UI dev only

INPUTS (paths come from pipeline/config.yaml)
  pipeline/targets/targets.yaml            target profiles (Rex / Venice)
  data/interim/targets/<site_id>.json      target feature values, flat {feature: number}
  data/interim/earth_features.csv          one row per Earth site or grid cell (Joash):
        site_id, name, lon, lat, <one numeric column per feature in targets.yaml>,
        geology_classes (';'-separated), subsurface_features (';'-separated)
  docs/site_cards/site_text.yaml           OPTIONAL curated text (Venice / Ely), see narrative.py

OUTPUTS
  data/processed/sites.json                contract-valid records
  app/public/data/sites.json               copy for the web app
  data/interim/scoring_report.json         warnings, skipped sites, confidence reasons

Extra config this script reads (add to pipeline/config.yaml, all keys optional except tolerances):
  scoring:
    tolerances: {slope_median: 5.0, slope_p90: 10.0}   # same unit as the feature. METHOD CHOICE
    resample_factor_limit: 4
    strength_min: 0.7
    breakdown_max: 0.4
    require_verified_targets: false
    data_quality: {earth: {terrain: {kind: direct, resolution_m: 30}}, ...}   # see confidence.py
    earth_data_sources: {terrain: ["<dataset name logged in DATA_SOURCES.md>"]}

There is no overall score. Dimensions are scored and exported separately.
"""
import argparse
import json
import re
from collections import Counter
from pathlib import Path

import pandas as pd
import yaml

from . import confidence as conf
from . import export, narrative
from .dimensions import score_dimension

REPO = Path(__file__).resolve().parents[2]
REQUIRED_COLUMNS = ["site_id", "name", "lon", "lat"]


def _load_yaml(path):
    p = Path(path)
    return (yaml.safe_load(p.read_text(encoding="utf-8")) or {}) if p.exists() else {}


def make_id(*parts):
    """Lowercase snake_case id that satisfies the schema pattern ^[a-z0-9_]+$."""
    return re.sub(r"[^a-z0-9]+", "_", "_".join(parts).lower()).strip("_")


def _load_target_features(targets_dir, site_id):
    path = Path(targets_dir) / f"{site_id}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("features", data)


def _read_earth_table(csv_path):
    df = pd.read_csv(csv_path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"{csv_path} is missing required column(s): {missing}")
    # NaN -> None so "missing" is explicit everywhere downstream
    return df.astype(object).where(df.notna(), None).to_dict("records")


def run(config_path=None, earth_csv=None, draft=False, repo=REPO):
    """Score everything. Returns (records, report). Writes nothing."""
    repo = Path(repo)
    cfg = _load_yaml(config_path or repo / "pipeline" / "config.yaml")
    paths = cfg["paths"]
    sc = cfg.get("scoring") or {}
    core = list(cfg.get("dimensions") or [])
    all_dims = core + list(cfg.get("stretch_dimensions") or [])
    tolerances = sc.get("tolerances") or {}
    quality = sc.get("data_quality") or {}
    earth_sources = sc.get("earth_data_sources") or {}

    targets = (_load_yaml(repo / paths["targets"]).get("targets")) or []
    rows = _read_earth_table(earth_csv or repo / paths["interim"] / "earth_features.csv")
    overrides_all = _load_yaml(repo / "docs" / "site_cards" / "site_text.yaml")

    records, skipped = [], []
    warn = Counter()
    conf_reasons = {}

    for target in targets:
        tid, body = target["site_id"], target["target_body"]
        feats = _load_target_features(repo / paths["interim"] / "targets", tid)
        if feats is None:
            warn[f"{tid}: no data/interim/targets/{tid}.json yet, target skipped"] += 1
            continue

        for row in rows:
            earth_id = make_id(str(row["site_id"]))
            try:
                coords = [float(row["lon"]), float(row["lat"])]
            except (TypeError, ValueError):
                skipped.append({"site": earth_id, "target": tid, "reason": "lon/lat missing"})
                continue

            details = {}
            for dim in all_dims:
                dim_cfg = (target.get("dimensions") or {}).get(dim)
                if not dim_cfg:
                    continue
                details[dim] = score_dimension(
                    dim, row, dim_cfg, feats, tolerances,
                    require_verified=bool(sc.get("require_verified_targets", False)))
                for feature, why in details[dim]["missing"]:
                    warn[f"{tid} / {dim} / {feature}: {why}"] += 1

            scored = {d: x for d, x in details.items() if x["score"] is not None}
            not_scored_core = [d for d in core if d not in scored]
            if not scored or (not_scored_core and not draft):
                skipped.append({"site": earth_id, "target": tid,
                                "reason": f"core dimension(s) not scored: {not_scored_core or core}"})
                continue

            per_dim_conf = {d: conf.dimension_confidence(
                d, body, x, quality, sc.get("resample_factor_limit", 4)) for d, x in scored.items()}
            site_conf, reasons = conf.site_confidence(per_dim_conf)

            rec_id = make_id(earth_id, "vs", tid)
            text = overrides_all.get(rec_id) or overrides_all.get(earth_id) or {}
            strengths, breakdowns, uses = narrative.build_text(
                details, target, text, sc.get("strength_min", 0.7), sc.get("breakdown_max", 0.4))
            if not uses:
                warn[f"{rec_id}: no exploration_uses (add to docs/site_cards/site_text.yaml)"] += 1

            sources = []
            for dim in scored:
                sources += list((target["dimensions"][dim].get("data_sources")) or [])
                sources += list(earth_sources.get(dim) or [])
            sources = list(dict.fromkeys(sources))
            if any("verify" in s.lower() for s in sources):
                warn[f"{rec_id}: data_sources still say 'verify'. Replace with the logged dataset name"] += 1

            records.append({
                "site_id": rec_id,
                "name": str(row["name"]),
                "coordinates": coords,
                "target_body": body,
                "dimension_scores": {d: round(x["score"], 3) for d, x in scored.items()},
                "confidence": site_conf,
                "strengths": strengths,
                "breakdowns": breakdowns,
                "exploration_uses": uses,
                "data_sources": sources,
            })
            conf_reasons[rec_id] = reasons

    report = {
        "n_records": len(records),
        "n_skipped": len(skipped),
        "warnings": [f"{msg} (x{n})" if n > 1 else msg for msg, n in sorted(warn.items())],
        "skipped": skipped,
        "confidence_reasons": conf_reasons,
        "draft": draft,
    }
    return records, report


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--earth", default=None, help="Earth features CSV (default: data/interim/earth_features.csv)")
    ap.add_argument("--draft", action="store_true",
                    help="allow sites with missing core dimensions; writes data/interim/sites_draft.json, no validation")
    args = ap.parse_args()

    cfg = _load_yaml(args.config or REPO / "pipeline" / "config.yaml")
    paths = cfg["paths"]
    records, report = run(args.config, args.earth, draft=args.draft)

    report_path = export.write_json(report, REPO / paths["interim"] / "scoring_report.json")
    if args.draft:
        out = export.write_json(records, REPO / paths["interim"] / "sites_draft.json")
        print(f"DRAFT: {len(records)} records -> {out} (not validated, do not ship)")
    else:
        written = export.export_records(
            records, REPO / paths["schema"],
            REPO / paths["processed"] / "sites.json",
            REPO / paths["app_data"] / "sites.json")
        print(f"{len(records)} records validated and written: " + ", ".join(str(p) for p in written))
    print(f"{report['n_skipped']} skipped, {len(report['warnings'])} warning type(s). See {report_path}")
    for w in report["warnings"][:10]:
        print("  warning:", w)


if __name__ == "__main__":
    main()
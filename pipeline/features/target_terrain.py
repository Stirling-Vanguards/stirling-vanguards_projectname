"""Compute terrain FEATURES for each target from the raw LOLA / MOLA files.

Run from the repo root:
    py -m pipeline.features.target_terrain
    py -m pipeline.features.target_terrain --moon data/raw/ldsm_75s_240m.img --mars data/raw/megt44n000hb.img

Reads : pipeline/targets/targets.yaml  (coordinates [lon, lat] and footprint_radius_km per target)
Writes: data/interim/targets/<site_id>.json   ({"features": {...}, "provenance": {...}})

Output feature names match what pipeline/scoring/dimensions.py already understands
(median_slope_deg, p90_slope_deg, mean_slope_deg). Only measured values are written.
`roughness` and `crater_density` are NOT computed here, so they are simply absent and the
scorer reports them as missing instead of guessing.

Moon and Mars slopes use different baselines (see data/DATA_SOURCES.md). The provenance block
records that so it cannot be forgotten downstream.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "pipeline" / "ingest"))

FEATURE_KEYS = ["mean_slope_deg", "median_slope_deg", "p90_slope_deg"]


def _stats_moon(img_path, lon, lat, radius_m):
    import read_ldsm
    slope = read_ldsm.load_slope(img_path)
    return read_ldsm.site_stats(slope, lon, lat, radius_m), {
        "dataset": "LRO LOLA GDRDSM (ldsm_75s_240m)",
        "slope_baseline": "30-120 m (laser shots), 240 m pixels"}


def _stats_mars(img_path, lon, lat, radius_m):
    import read_mola
    dem = read_mola.open_dem(img_path)
    return read_mola.site_stats(dem, lon % 360.0, lat, radius_m), {
        "dataset": "MGS MOLA MEGDR (megt44n000hb)",
        "slope_baseline": "about 926 m (central difference), 463 m pixels"}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--moon", default=str(REPO / "data/raw/ldsm_75s_240m.img"))
    ap.add_argument("--mars", default=str(REPO / "data/raw/megt44n000hb.img"))
    ap.add_argument("--out", default=str(REPO / "data/interim/targets"))
    args = ap.parse_args()

    cfg = yaml.safe_load((REPO / "pipeline/config.yaml").read_text(encoding="utf-8"))
    targets = yaml.safe_load((REPO / cfg["paths"]["targets"]).read_text(encoding="utf-8"))["targets"]
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    for t in targets:
        sid, body = t["site_id"], t["target_body"]
        if not t.get("coordinates") or not t.get("footprint_radius_km"):
            print(f"skip {sid}: coordinates or footprint_radius_km not set in targets.yaml")
            continue
        lon, lat = t["coordinates"]
        radius_m = float(t["footprint_radius_km"]) * 1000.0
        fn = _stats_moon if body == "moon" else _stats_mars
        stats, info = fn(args.moon if body == "moon" else args.mars, lon, lat, radius_m)
        if not stats.get("n_pixels"):
            print(f"skip {sid}: no valid pixels inside the footprint")
            continue
        features = {k: round(stats[k], 4) for k in FEATURE_KEYS if k in stats}
        payload = {
            "site_id": sid,
            "features": features,
            "provenance": {
                **info,
                "coordinates_lon_lat": [lon, lat],
                "footprint_radius_km": t["footprint_radius_km"],
                "n_pixels": stats["n_pixels"],
                "pct_below_10deg": round(stats.get("pct_below_10deg", float("nan")), 2),
                "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "coordinates_verified": bool(t.get("verified", False)),
            },
        }
        path = out_dir / f"{sid}.json"
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"{sid}: {features} -> {path}")


if __name__ == "__main__":
    main()

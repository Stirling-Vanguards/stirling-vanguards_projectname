"""
pipeline/targets/load.py

Loads pipeline/config.yaml and pipeline/targets/targets.yaml and checks them
for mistakes. Scoring code can also import load_config() / load_targets().

Run from the repo root:
    python pipeline/targets/load.py            # errors fail, warnings just print
    python pipeline/targets/load.py --strict   # warnings fail too (use before final submission)

Needs: pip install pyyaml
"""
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "pipeline" / "config.yaml"
TARGETS_PATH = ROOT / "pipeline" / "targets" / "targets.yaml"

ALLOWED_BODIES = {"moon", "mars"}
ALLOWED_DIMS = {"terrain", "thermal", "geology", "subsurface", "water_ice", "dust_wind"}
CONFIDENCE_LEVELS = {"high", "medium", "low"}


def _read_yaml(path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{path.name} is empty or not a YAML mapping")
    return data


def load_config():
    return _read_yaml(CONFIG_PATH)


def load_targets():
    return _read_yaml(TARGETS_PATH)


def active_dimensions(cfg):
    """Core dimensions plus any stretch dimensions that were switched on."""
    return list(cfg.get("dimensions") or []) + list(cfg.get("stretch_dimensions") or [])


def check_config(cfg):
    errors, warnings = [], []
    dims = active_dimensions(cfg)

    if not cfg.get("dimensions"):
        errors.append("config: 'dimensions' is empty")
    for d in dims:
        if d not in ALLOWED_DIMS:
            errors.append(f"config: unknown dimension '{d}' (allowed: {sorted(ALLOWED_DIMS)})")

    weights = cfg.get("weights") or {}
    for d in dims:
        if d not in weights:
            errors.append(f"config: no weight for dimension '{d}'")
    for d, w in weights.items():
        if not isinstance(w, (int, float)) or w < 0:
            errors.append(f"config: weight for '{d}' must be a number >= 0")

    rules = cfg.get("confidence_rules") or {}
    missing = CONFIDENCE_LEVELS - set(rules)
    if missing:
        errors.append(f"config: confidence_rules missing {sorted(missing)}")

    for key in ("common_scale_km", "grid_cell_km"):
        if cfg.get(key) is None:
            warnings.append(f"config: '{key}' is not decided yet (null)")

    return errors, warnings


def check_targets(data, cfg):
    errors, warnings = [], []
    targets = data.get("targets") or []
    dims = active_dimensions(cfg)

    if not targets:
        return ["targets: no targets listed"], warnings

    seen_ids = set()
    bodies = set()

    for t in targets:
        sid = t.get("site_id", "<missing site_id>")
        label = f"target '{sid}'"

        if "site_id" not in t:
            errors.append("targets: an entry has no site_id")
        elif sid in seen_ids:
            errors.append(f"{label}: duplicate site_id")
        seen_ids.add(sid)

        body = t.get("target_body")
        if body not in ALLOWED_BODIES:
            errors.append(f"{label}: target_body must be 'moon' or 'mars', got {body!r}")
        else:
            bodies.add(body)

        # coordinates are [lon, lat], same order as the data contract
        coords = t.get("coordinates")
        if coords is None:
            warnings.append(f"{label}: coordinates not filled in yet")
        else:
            ok = isinstance(coords, list) and len(coords) == 2
            if ok:
                lon, lat = coords
                ok = -180 <= lon <= 180 and -90 <= lat <= 90
            if not ok:
                errors.append(f"{label}: coordinates must be [lon, lat] (lon -180..180, lat -90..90)")

        if t.get("footprint_radius_km") is None:
            warnings.append(f"{label}: footprint_radius_km not filled in yet")

        tdims = t.get("dimensions") or {}
        for d in dims:
            if d not in tdims:
                errors.append(f"{label}: missing dimension '{d}'")
                continue
            block = tdims[d] or {}
            if not block.get("data_sources"):
                errors.append(f"{label}/{d}: data_sources is empty")

            if block.get("computed"):
                if not block.get("features"):
                    errors.append(f"{label}/{d}: computed is true but features is empty")
            else:
                # hand-entered (literature) dimension: needs a citation and a verified flag
                if "verified" not in block:
                    errors.append(f"{label}/{d}: needs a 'verified' flag (true/false)")
                if not block.get("source_citation"):
                    warnings.append(f"{label}/{d}: source_citation not filled in yet")
                if block.get("verified") is False:
                    warnings.append(f"{label}/{d}: verified is false, don't present as fact")

    for b in sorted(ALLOWED_BODIES - bodies):
        errors.append(f"targets: no target for body '{b}'")

    return errors, warnings


def main():
    strict = "--strict" in sys.argv
    try:
        cfg = load_config()
        targets = load_targets()
    except (FileNotFoundError, ValueError, yaml.YAMLError) as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    errors, warnings = check_config(cfg)
    e2, w2 = check_targets(targets, cfg)
    errors += e2
    warnings += w2

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")

    if errors or (strict and warnings):
        print(f"\nFailed: {len(errors)} error(s), {len(warnings)} warning(s)")
        sys.exit(1)
    print(f"\nOK: {len(errors)} error(s), {len(warnings)} warning(s)")


if __name__ == "__main__":
    main()
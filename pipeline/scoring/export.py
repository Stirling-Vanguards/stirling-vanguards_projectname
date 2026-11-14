"""Validate records against docs/data_contract.schema.json, then write them.

Validation fails LOUDLY: if any record breaks the contract, nothing is written.
"""
import json
from pathlib import Path


def validate_records(records, schema_path):
    """Return a list of human-readable error strings (empty list = valid)."""
    from jsonschema import Draft202012Validator  # needs `pip install jsonschema` (in requirements.txt)

    schema = json.loads(Path(schema_path).read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    errors = []
    for err in sorted(validator.iter_errors(records), key=lambda e: [str(p) for p in e.path]):
        idx = err.path[0] if err.path and isinstance(err.path[0], int) else None
        who = records[idx].get("site_id", f"record {idx}") if idx is not None else "file"
        where = "/".join(str(p) for p in list(err.path)[1:]) or "(record)"
        errors.append(f"[{who}] {where}: {err.message}")

    seen, dupes = set(), set()
    for r in records:
        sid = r.get("site_id")
        (dupes if sid in seen else seen).add(sid)
    errors.extend(f"[{sid}] duplicate site_id" for sid in sorted(map(str, dupes)))
    return errors


def write_json(records, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def export_records(records, schema_path, processed_path, app_path=None):
    """Validate, then write to data/processed/ and (optionally) the app's public data folder."""
    errors = validate_records(records, schema_path)
    if errors:
        shown = "\n  ".join(errors[:25])
        more = f"\n  ... and {len(errors) - 25} more" if len(errors) > 25 else ""
        raise ValueError(f"{len(errors)} contract violation(s), nothing written:\n  {shown}{more}")
    written = [write_json(records, processed_path)]
    if app_path:
        written.append(write_json(records, app_path))
    return written
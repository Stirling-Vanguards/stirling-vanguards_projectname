"""Feature-level similarity. Pure functions, no file access, easy to unit test.

Numeric features:  similarity = max(0, 1 - |earth - target| / tolerance)
    1.0 = identical, 0.0 = off by one tolerance or more.
    The tolerance is a METHOD CHOICE. It lives in pipeline/config.yaml
    (scoring.tolerances) and must be justified in the report.

Category features: similarity = share of the target's classes that the Earth site also has.
"""
import math


def is_missing(value):
    """True for None and NaN. Everything else (including 0) is a real value."""
    if value is None:
        return True
    try:
        return math.isnan(float(value))
    except (TypeError, ValueError):
        return False


def feature_similarity(earth_value, target_value, tolerance):
    """0-1 similarity for one numeric feature, or None if either value is missing.

    Missing data returns None, never 0: "unknown" is not the same as "very different".
    """
    if is_missing(earth_value) or is_missing(target_value):
        return None
    if tolerance is None or float(tolerance) <= 0:
        raise ValueError(f"tolerance must be a positive number, got {tolerance!r}")
    gap = abs(float(earth_value) - float(target_value))
    return max(0.0, 1.0 - gap / float(tolerance))


def parse_list(value):
    """Accept a list, or a ';'-separated string (CSV cell), or missing. Returns a clean list."""
    if is_missing(value):
        return []
    if isinstance(value, (list, tuple, set)):
        items = value
    else:
        items = str(value).split(";")
    return [str(i).strip() for i in items if str(i).strip()]


def set_overlap(earth_items, target_items):
    """Share of target items found on the Earth side (case-insensitive).

    Returns (score, matched, unmatched). score is None when the target list is empty,
    because there is nothing to compare against.
    """
    target = parse_list(target_items)
    if not target:
        return None, [], []
    earth_lower = {e.lower() for e in parse_list(earth_items)}
    matched = [t for t in target if t.lower() in earth_lower]
    unmatched = [t for t in target if t.lower() not in earth_lower]
    return len(matched) / len(target), matched, unmatched


def mean_ignore_none(values):
    """Average of the non-None values, or None if there are none."""
    kept = [v for v in values if v is not None]
    return sum(kept) / len(kept) if kept else None
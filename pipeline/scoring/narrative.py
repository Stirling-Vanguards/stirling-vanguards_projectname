"""Text fields for each record: strengths, breakdowns, exploration_uses.

Rules:
  * Generated lines state only numbers the pipeline computed. No scientific claims.
  * Curated lines come from people (targets.yaml `breakdowns`, and the optional overrides
    file docs/site_cards/site_text.yaml, written by Venice/Ely). They are appended.
  * exploration_uses is NEVER generated: it is science content, so it comes only from the
    overrides file. If it is missing the list is empty and score_sites.py warns.

Overrides file format (keys are the record's site_id OR the Earth site_id):
    rub_al_khali_vs_jezero_crater:
      strengths: ["..."]
      breakdowns: ["..."]
      exploration_uses: ["Use this site to test ..."]
"""
from .dimensions import LABELS


def _fmt(x):
    return f"{x:.3g}"


def _evidence(detail, best):
    """One short factual phrase explaining a dimension score."""
    if detail["kind"] == "overlap":
        if best and detail["matched"]:
            return "matches " + ", ".join(detail["matched"])
        if not best and detail["unmatched"]:
            return "no match for " + ", ".join(detail["unmatched"])
        return ""
    used = [f for f in detail["features"] if f["similarity"] is not None]
    if not used:
        return ""
    pick = max(used, key=lambda f: f["similarity"]) if best else min(used, key=lambda f: f["similarity"])
    label = "closest" if best else "largest gap"
    return (f"{label}: {pick['name']} {_fmt(pick['earth'])} on Earth vs "
            f"{_fmt(pick['target'])} at the target")


def build_text(details, target_cfg, overrides=None, strength_min=0.7, breakdown_max=0.4):
    """Return (strengths, breakdowns, exploration_uses) as lists of strings."""
    strengths, breakdowns = [], []
    for dim, d in details.items():
        score = d.get("score")
        if score is None:
            continue
        label = LABELS.get(dim, dim)
        if score >= strength_min:
            strengths.append(f"{label} ({score:.2f}): {_evidence(d, best=True)}".rstrip(": "))
        elif score <= breakdown_max:
            breakdowns.append(f"{label} ({score:.2f}): {_evidence(d, best=False)}".rstrip(": "))

    # Curated, target-level limits (e.g. cold traps, vacuum) from targets.yaml
    breakdowns.extend(target_cfg.get("breakdowns") or [])

    overrides = overrides or {}
    strengths.extend(overrides.get("strengths") or [])
    breakdowns.extend(overrides.get("breakdowns") or [])
    uses = list(overrides.get("exploration_uses") or [])
    return strengths, breakdowns, uses
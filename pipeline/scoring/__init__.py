"""Scoring: turns raw FEATURE values into per-dimension 0-1 scores and contract records.

Run from the repo root:
    python -m pipeline.scoring.score_sites            # full run, validated export
    python -m pipeline.scoring.score_sites --draft    # partial dimensions allowed, NOT validated

There is deliberately no overall / blended score anywhere in this package.
"""
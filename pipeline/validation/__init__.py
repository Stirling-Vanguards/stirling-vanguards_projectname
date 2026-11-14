"""Validation: does the scoring method behave sensibly, and does it agree with known analogs?

Run from the repo root:
    python -m pipeline.validation.run_validation
    python -m pipeline.validation.run_validation --strict   # unverified expectations also fail the run

Three kinds of check (see checks.py):
  1. identity     a site identical to the target must score 1.0 (method sanity, no science claims)
  2. known analog sites from the literature must rank high (or low) on the dimensions we expect
  3. sensitivity  do those results survive changing the tolerances by +/-25%?
"""
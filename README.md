# Stirling Vanguards: Vanguard Atlas

NASA Space Apps Challenge 2026, Abu Dhabi local event.

Challenge: *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.*

We compare Earth sites with Moon and Mars targets one dimension at a time: terrain, thermal, geology, subsurface, plus water/ice and dust/wind if we get to them. There's no blended similarity score. Averaging everything into one number hides the trade-offs we're trying to expose.

Each site card says what the place is good for, where the analogy stops working, what Earth can't reproduce, what you could actually test there, and how confident we are in the call.

## Live demo

TODO: add the GitHub Pages link once the final build is up.

## Run the web app locally

ES modules need a local server. Opening `index.html` straight from disk won't work.

```bash
cd app
python -m http.server 8000
# open http://localhost:8000
```

The app reads static files and makes no data or API calls. The only things it fetches are the basemap tiles and the MapLibre library (see "Known limitations").

## Run the data pipeline

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

TODO (Rex/Joash): add the ingestion, scoring and export commands once the entry points exist.

## Store layout

| Path | Purpose |
| --- | --- |
| `app/` | Static web app: map, site card, ranked table. Deployed on GitHub Pages. |
| `pipeline/` | Python pipeline: ingest, features, targets, scoring, validation. |
| `data/processed/` | Small processed files only. Raw data is gitignored. |
| `data/DATA_SOURCES.md` | Every dataset we used, with agency, URL, license and access date. |
| `docs/` | Data contract, site cards, design, report, pitch. |

## Data

Site records follow `docs/data_contract.md` (schema: `docs/data_contract.schema.json`). Coordinates are `[longitude, latitude]`. Credits for every dataset are in `data/DATA_SOURCES.md`.

> The app currently reads `app/public/mock_sites.json`. That file is fake, for UI testing only. Swap it for real processed data before submission.

## Known limitations

TODO (Venice/Rex): where the analogies break down, and what Earth can't replicate: reduced gravity, vacuum or thin atmosphere, radiation.

## Team

Stirling Vanguards: Rex, Joash, Kurt, Ely, Vince, Venice.

## License

MIT. See `LICENSE`.

"""Compute terrain features for the 8 Earth analog sites from Copernicus GLO-30 GeoTIFFs.

Run from the repo root:
    py -m pipeline.features.earth_terrain

Reads : data/raw/Copernicus_DSM_COG_10_*.tif
Writes: data/interim/earth_features.csv
"""
import argparse
import csv
from pathlib import Path

import numpy as np
import rasterio
from rasterio.windows import from_bounds

REPO = Path(__file__).resolve().parents[2]
EARTH_RADIUS_M = 6371000.0

EARTH_SITES = [
    {
        "site_id": "atacama_desert",
        "name": "Atacama Desert, Chile",
        "lon": -69.25,
        "lat": -24.5,
        "tile": "Copernicus_DSM_COG_10_S25_00_W070_00_DEM.tif",
    },
    {
        "site_id": "haughton_crater",
        "name": "Haughton Crater, Devon Island, Canada",
        "lon": -89.7,
        "lat": 75.4,
        "tile": "Copernicus_DSM_COG_10_N75_00_W090_00_DEM.tif",
    },
    {
        "site_id": "death_valley",
        "name": "Death Valley, USA",
        "lon": -116.9,
        "lat": 36.5,
        "tile": "Copernicus_DSM_COG_10_N36_00_W117_00_DEM.tif",
    },
    {
        "site_id": "antarctic_dry_valleys",
        "name": "McMurdo Dry Valleys, Antarctica",
        "lon": 162.0,
        "lat": -77.5,
        "tile": "Copernicus_DSM_COG_10_S78_00_E162_00_DEM.tif",
    },
    {
        "site_id": "iceland_lava_fields",
        "name": "Askja / Highlands Lava Fields, Iceland",
        "lon": -18.5,
        "lat": 64.5,
        "tile": "Copernicus_DSM_COG_10_N64_00_W019_00_DEM.tif",
    },
    {
        "site_id": "mauna_kea",
        "name": "Mauna Kea, Hawaii, USA",
        "lon": -155.5,
        "lat": 19.8,
        "tile": "Copernicus_DSM_COG_10_N19_00_W156_00_DEM.tif",
    },
    {
        "site_id": "rio_tinto",
        "name": "Rio Tinto, Spain",
        "lon": -6.6,
        "lat": 37.7,
        "tile": "Copernicus_DSM_COG_10_N37_00_W007_00_DEM.tif",
    },
    {
        "site_id": "samail_ophiolite",
        "name": "Samail Ophiolite, Oman",
        "lon": 57.8,
        "lat": 23.1,
        "tile": "Copernicus_DSM_COG_10_N23_00_E057_00_DEM.tif",
    },
]


def compute_site_slope(tif_path: Path, lon: float, lat: float, radius_m: float = 5000.0) -> dict:
    with rasterio.open(tif_path) as src:
        cos_lat = max(np.cos(np.radians(lat)), 0.05)
        dlat_deg = np.degrees(radius_m / EARTH_RADIUS_M) * 1.25
        dlon_deg = np.degrees(radius_m / (EARTH_RADIUS_M * cos_lat)) * 1.25

        window = from_bounds(
            lon - dlon_deg,
            lat - dlat_deg,
            lon + dlon_deg,
            lat + dlat_deg,
            src.transform,
        )
        z = src.read(1, window=window).astype("float32")
        win_transform = src.window_transform(window)

        nodata = src.nodata
        if nodata is not None:
            z = np.where(z == nodata, np.nan, z)

        rows, cols = np.indices(z.shape)
        lons, lats = rasterio.transform.xy(win_transform, rows, cols)
        lons = np.asarray(lons, dtype="float64").reshape(z.shape)
        lats = np.asarray(lats, dtype="float64").reshape(z.shape)

        res_lon_deg = abs(win_transform.a)
        res_lat_deg = abs(win_transform.e)

        dy = EARTH_RADIUS_M * np.radians(res_lat_deg)
        dx = EARTH_RADIUS_M * np.radians(res_lon_deg) * np.cos(np.radians(lats))

        dzdy = np.gradient(z, axis=0) / dy
        dzdx = np.gradient(z, axis=1) / dx
        slope = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))

        dlat_rad = np.radians(lats - lat)
        dlon_rad = np.radians(lons - lon)
        dist = EARTH_RADIUS_M * np.sqrt(
            dlat_rad ** 2 + (np.cos(np.radians(lats)) * dlon_rad) ** 2
        )

        valid = (dist <= radius_m) & np.isfinite(slope)
        s = slope[valid]
        if s.size == 0:
            raise ValueError(f"No valid DEM pixels found within {radius_m}m of ({lon}, {lat}) in {tif_path.name}")

        return {
            "n_pixels": int(s.size),
            "mean_slope_deg": round(float(np.mean(s)), 4),
            "median_slope_deg": round(float(np.median(s)), 4),
            "p90_slope_deg": round(float(np.percentile(s, 90)), 4),
        }


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--raw-dir", default=str(REPO / "data/raw"))
    ap.add_argument("--out", default=str(REPO / "data/interim/earth_features.csv"))
    ap.add_argument("--radius-km", type=float, default=5.0)
    args = ap.parse_args()

    raw_dir = Path(args.raw_dir)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    radius_m = args.radius_km * 1000.0

    rows = []
    for site in EARTH_SITES:
        tif_path = raw_dir / site["tile"]
        if not tif_path.exists():
            raise FileNotFoundError(f"Missing tile: {tif_path}")
        stats = compute_site_slope(tif_path, site["lon"], site["lat"], radius_m=radius_m)
        row = {
            "site_id": site["site_id"],
            "name": site["name"],
            "lon": site["lon"],
            "lat": site["lat"],
            "mean_slope_deg": stats["mean_slope_deg"],
            "median_slope_deg": stats["median_slope_deg"],
            "p90_slope_deg": stats["p90_slope_deg"],
        }
        rows.append(row)
        print(
            f"{site['site_id']:22s} | n={stats['n_pixels']:6d} | "
            f"mean={row['mean_slope_deg']:6.2f} | med={row['median_slope_deg']:6.2f} | p90={row['p90_slope_deg']:6.2f}"
        )

    fieldnames = ["site_id", "name", "lon", "lat", "mean_slope_deg", "median_slope_deg", "p90_slope_deg"]
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nWrote {len(rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
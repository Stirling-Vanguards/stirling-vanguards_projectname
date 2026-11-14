"""Compute Earth climate/thermal features from local WorldClim v2.1 10m GeoTIFFs.

Run from repo root:
    py -m pipeline.features.earth_climate
"""
import csv
from pathlib import Path
import numpy as np
import rasterio

REPO = Path(__file__).resolve().parents[2]
WC_DIR = REPO / "data/raw/worldclim"
CSV_PATH = REPO / "data/interim/earth_features.csv"

def sample_raster(tif_path: Path, lon: float, lat: float) -> float:
    with rasterio.open(tif_path) as src:
        val = list(src.sample([(lon, lat)]))[0][0]
        if src.nodata is not None and np.isclose(val, src.nodata):
            return float("nan")
        return float(val)

def main():
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8-sig")))
    for row in rows:
        sid = row["site_id"]
        lon, lat = float(row["lon"]), float(row["lat"])
        tmins, tmaxs = [], []
        for m in range(1, 13):
            tmin_f = WC_DIR / f"wc2.1_10m_tmin_{m:02d}.tif"
            tmax_f = WC_DIR / f"wc2.1_10m_tmax_{m:02d}.tif"
            tmins.append(sample_raster(tmin_f, lon, lat))
            tmaxs.append(sample_raster(tmax_f, lon, lat))

        t_min_c = float(np.nanmin(tmins))
        t_max_c = float(np.nanmax(tmaxs))
        diurnal_k = float(np.nanmean(np.array(tmaxs) - np.array(tmins)))
        seasonal_k = t_max_c - t_min_c

        row["temp_min"] = round(t_min_c + 273.15, 2)
        row["temp_max"] = round(t_max_c + 273.15, 2)
        row["diurnal_swing"] = round(diurnal_k, 2)
        row["seasonal_variation"] = round(seasonal_k, 2)
        print(f"{sid:22s} | T_min={row['temp_min']}K | T_max={row['temp_max']}K | diurnal={row['diurnal_swing']}K | seasonal={row['seasonal_variation']}K")

    fieldnames = [
        "site_id", "name", "lon", "lat",
        "mean_slope_deg", "median_slope_deg", "p90_slope_deg",
        "temp_min", "temp_max", "diurnal_swing", "seasonal_variation",
    ]
    with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"\nUpdated {CSV_PATH} with WorldClim v2.1 thermal features.")

if __name__ == "__main__":
    main()

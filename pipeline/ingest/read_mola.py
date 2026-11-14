"""Read MOLA MEGDR topography tile (megt44n000hb) and summarize slope around a point.

Usage (from repo root):
    py pipeline/ingest/read_mola.py data/raw/megt44n000hb.img 18.4 77.6 5000
    (args: latitude, longitude east 0-360, radius in meters)

Elevation is converted to slope here (MOLA has no pre-made slope map).
Output is raw FEATURE values, NOT 0-1 scores. Scoring belongs to pipeline/scoring.
"""
import json
import sys
from pathlib import Path

import numpy as np

META = json.loads((Path(__file__).parent / "mola_megt44n000hb.meta.json").read_text())
R = META["projection"]["sphere_radius_m"]
PPD = META["pixels_per_degree"]
PIX_M = META["pixel_size_m"]
N_ROWS, N_COLS = META["shape"]
LAT_N = META["bounds"]["lat_max"]
LON_W = META["bounds"]["lon_min"]


def open_dem(img_path):
    """Memory-map the tile (127 MB) so only the window we need is read."""
    return np.memmap(img_path, dtype=META["dtype"], mode="r", shape=(N_ROWS, N_COLS))


def lonlat_to_rowcol(lon, lat):
    """Fractional pixel position (pixel centres at .0). Upper-left corner is lon 0, lat 44."""
    return (LAT_N - lat) * PPD - 0.5, (lon - LON_W) * PPD - 0.5


def site_stats(dem, lon, lat, radius_m=5000, flat_threshold_deg=10):
    b = META["bounds"]
    if not (b["lat_min"] <= lat <= b["lat_max"] and b["lon_min"] <= lon <= b["lon_max"]):
        raise ValueError(f"(lat {lat}, lon {lon}) is outside this tile {b}. Use lon 0-360.")
    row, col = lonlat_to_rowcol(lon, lat)
    cos_lat = max(np.cos(np.radians(lat)), 0.05)
    rr = int(np.ceil(radius_m / PIX_M)) + 2
    cr = int(np.ceil(radius_m / (PIX_M * cos_lat))) + 2
    r0, r1 = max(int(row) - rr, 0), min(int(row) + rr + 2, N_ROWS)
    c0, c1 = max(int(col) - cr, 0), min(int(col) + cr + 2, N_COLS)

    z = np.asarray(dem[r0:r1, c0:c1], dtype="float32")
    lats = LAT_N - (np.arange(r0, r1) + 0.5) / PPD
    lons = LON_W + (np.arange(c0, c1) + 0.5) / PPD

    dy = PIX_M                                   # north-south spacing, constant
    dx = PIX_M * np.cos(np.radians(lats))        # east-west spacing shrinks with latitude
    dzdy = np.gradient(z, axis=0) / dy
    dzdx = np.gradient(z, axis=1) / dx[:, None]
    slope = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))

    dlat = np.radians(lats - lat)[:, None]
    dlon = np.radians(lons - lon)[None, :]
    dist = R * np.sqrt(dlat ** 2 + (np.cos(np.radians(lats))[:, None] * dlon) ** 2)
    inside = dist <= radius_m

    s, e = slope[inside], z[inside]
    if s.size == 0:
        return {"n_pixels": 0}
    return {
        "n_pixels": int(s.size),
        "mean_slope_deg": float(s.mean()),
        "median_slope_deg": float(np.median(s)),
        "p90_slope_deg": float(np.percentile(s, 90)),
        f"pct_below_{flat_threshold_deg}deg": float((s < flat_threshold_deg).mean() * 100),
        "mean_elevation_m": float(e.mean()),
        "relief_m": float(e.max() - e.min()),
    }


if __name__ == "__main__":
    img, lat, lon, radius = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
    dem = open_dem(img)
    print(f"tile elevation min/max (m): {int(dem.min())} / {int(dem.max())}  (label says whole dataset is -8208 / 21249)")
    print(json.dumps(site_stats(dem, lon, lat, radius), indent=2))

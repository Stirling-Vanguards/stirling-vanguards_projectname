"""Read LOLA GDRDSM slope map (ldsm_75s_240m) and summarize slope around a point.

Usage (from repo root):
    python pipeline/ingest/read_ldsm.py data/raw/ldsm_75s_240m.img -88.0 30.0 5000

Output is raw FEATURE values (degrees, percentages), NOT 0-1 scores.
Scoring belongs to Rex (pipeline/scoring). Check before exporting to data/processed/.
"""
import json
import sys
from pathlib import Path

import numpy as np
from pyproj import Transformer

META = json.loads((Path(__file__).parent / "ldsm_75s_240m.meta.json").read_text())

CRS = (f"+proj=stere +lat_0={META['projection']['lat_origin']} "
       f"+lat_ts={META['projection']['lat_origin']} "
       f"+lon_0={META['projection']['lon_central_meridian']} "
       f"+R={META['projection']['sphere_radius_m']} +units=m +no_defs")
# lat_ts = -90 follows the label's "true at the pole". Verify against a known feature.
TO_XY = Transformer.from_crs(
    f"+proj=longlat +R={META['projection']['sphere_radius_m']} +no_defs", CRS, always_xy=True
)


def load_slope(img_path):
    """Return slope in degrees as float32 array, invalid pixels = NaN."""
    raw = np.fromfile(img_path, dtype=META["dtype"]).reshape(META["shape"])
    deg = raw.astype("float32") * META["scaling_factor"] + META["value_offset"]
    lo, hi = META["valid_slope_range_deg"]
    deg[(deg < lo) | (deg > hi)] = np.nan
    return deg


def lonlat_to_rowcol(lon, lat):
    x, y = TO_XY.transform(lon, lat)
    px = META["pixel_size_m"]
    col = (x - META["upper_left_x_m"]) / px - 0.5
    row = (META["upper_left_y_m"] - y) / px - 0.5
    return row, col, x, y


def site_stats(slope, lon, lat, radius_m=5000, flat_threshold_deg=10):
    """Slope summary inside a circle. Returns a dict of raw features."""
    if not (META["coverage"]["lat_min"] <= lat <= META["coverage"]["lat_max"]):
        raise ValueError(f"lat {lat} outside {META['coverage']}")
    row, col, _, _ = lonlat_to_rowcol(lon, lat)
    px = META["pixel_size_m"]
    r_pix = radius_m / px
    r0, r1 = int(max(row - r_pix - 1, 0)), int(min(row + r_pix + 2, slope.shape[0]))
    c0, c1 = int(max(col - r_pix - 1, 0)), int(min(col + r_pix + 2, slope.shape[1]))
    rr, cc = np.mgrid[r0:r1, c0:c1]
    inside = (rr - row) ** 2 + (cc - col) ** 2 <= r_pix ** 2
    vals = slope[r0:r1, c0:c1][inside]
    vals = vals[~np.isnan(vals)]
    if vals.size == 0:
        return {"n_pixels": 0}
    return {
        "n_pixels": int(vals.size),
        "mean_slope_deg": float(vals.mean()),
        "median_slope_deg": float(np.median(vals)),
        "p90_slope_deg": float(np.percentile(vals, 90)),
        f"pct_below_{flat_threshold_deg}deg": float((vals < flat_threshold_deg).mean() * 100),
    }


if __name__ == "__main__":
    img, lat, lon, radius = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
    s = load_slope(img)
    print(f"slope min/max/NaN%: {np.nanmin(s):.2f} / {np.nanmax(s):.2f} / {np.isnan(s).mean()*100:.1f}")
    print(json.dumps(site_stats(s, lon, lat, radius), indent=2))

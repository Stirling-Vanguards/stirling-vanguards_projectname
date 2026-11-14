### LRO LOLA Gridded Slope Map (GDRDSM): ldsm_75s_240m

- **Source:** Lunar Orbital Data Explorer (ODE), PDS Geosciences Node
- **PDS4 ID:** urn:nasa:pds:lro_lola_rdr:data_gridded:ldsm_75s_240m
- **Accessed:** 2026-11-14 by Joash
- **Instrument:** LRO / LOLA (Lunar Orbiter Laser Altimeter)
- **Coverage:** 75°S to 90°S (lunar south pole), all longitudes
- **Format:** 16-bit signed integer .img (3812 x 3812), detached PDS3 .lbl and PDS4 .xml labels
- **Resolution:** 240 m/pixel, polar stereographic projection
- **Conversion to degrees:** slope = raw * 0.0015 + 45
- **Used for:** terrain dimension (slope) for the Moon target
- **Local path:** data/raw/ (not committed)
- **Code:** pipeline/ingest/read_ldsm.py
- **Limitations:** slope is computed from a 30-120 m baseline, not 240 m. Based on LOLA laser 1 and 2 data through mission phase LRO_SM_17. Polar coverage only; does not cover latitudes north of 75°S.
- **Credit:** NASA LRO / LOLA Science Team (Goddard Space Flight Center), distributed by the PDS Geosciences Node

# Source Link
- https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldsm_75s_240m.lbl
- https://ode.rsl.wustl.edu/moon/map/productfootprint.aspx?product_idgeo=33203689&showlinks=true
- https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldsm_75s_240m.xml

### MGS MOLA MEGDR Topography: megt44n000hb

- **Source:** Mars Orbital Data Explorer (ODE), PDS Geosciences Node
- **PDS4 ID:** urn:nasa:pds:mgs_mola_topography_derived:data_meg128:megt44n000hb
- **Accessed:** 2026-11-14 by Joash
- **Instrument:** Mars Global Surveyor / MOLA (Mars Orbiter Laser Altimeter)
- **Coverage:** 0 to 44°N, 0 to 90°E (includes the candidate Jezero Crater area; Mars target not yet confirmed)
- **Format:** 16-bit signed big-endian .img (5632 x 11520), values in meters relative to the areoid; PDS4 .xml, PDS3 .lbl, and ENVI .hdr labels
- **Resolution:** 128 pixels/degree (about 463 m/pixel), equirectangular projection
- **Used for:** terrain dimension (slope derived from elevation) for the Mars target
- **Local path:** data/raw/ (not committed)
- **Code:** pipeline/ingest/read_mola.py
- **Limitations:** bins with no laser shots are interpolated (only about 55% of bins near the equator have a shot, with gaps up to 12 km), so slope there is partly estimated. Slope is computed over about a 926 m baseline, much coarser than the LOLA map, so Moon and Mars slopes are not directly comparable without a common baseline.
- **Credit:** NASA MGS / MOLA Science Team (Goddard Space Flight Center), distributed by the PDS Geosciences Node

# Source Link
- https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg128/megt44n000hb.xml
- https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg128/megt44n000hb.lbl
- https://ode.rsl.wustl.edu/mars/productsearch


### Copernicus DEM GLO-30 (Global 30 m Digital Elevation Model)

- **Source:** Copernicus Space Component Data Access / AWS Open Data Registry (Copernicus DEM 30m COG)
- **DOI:** https://doi.org/10.5069/G9028PQB
- **Accessed:** 2026-11-14 by Kurt
- **Instrument:** TanDEM-X / TerraSAR-X radar interferometry (WorldDEM derived)
- **Coverage:** 85°S to 84°N (1° x 1° Cloud-Optimized GeoTIFF tiles covering all 8 Earth analog footprints)
- **Format:** 32-bit floating-point Cloud-Optimized GeoTIFF (.tif)
- **Resolution:** 1 arcsecond (about 30 m at the equator), WGS84 (EPSG:4326)
- **Used for:** terrain dimension (slope computed over a 5 km circular radius per Earth site)
- **Local path:** data/raw/ (not committed)
- **Code:** pipeline/features/earth_terrain.py
- **Limitations:** Digital Surface Model (DSM) rather than a bare-earth DTM, so vegetation canopies and human structures can locally increase slope estimates at non-arid sites.
- **Credit:** © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.

# Source Link
- https://copernicus-dem-30m.s3.amazonaws.com/
- https://doi.org/10.5069/G9028PQB
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
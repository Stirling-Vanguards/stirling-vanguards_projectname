// AUTO-GENERATED from public/data/ — do not hand-edit.
// Offline fallback only. The live site always reads manifest.json -> sites.<hash>.json.
export const OFFLINE_SNAPSHOT = {
  "manifest": {
    "data_file": "sites.9f9dcd6e.json",
    "generated_at": "2026-11-14T13:38:06+00:00",
    "quality": {
      "errors": 0,
      "published": 4,
      "quarantined": 0,
      "warnings": 0
    },
    "run_id": "40f3f658fd7a",
    "schema_version": "1",
    "sites_sha256": "1f5e4ffe6177db2f2151e278aca80e66097ab0059cb66fedadcdbd0732ddcb24",
    "version": 1
  },
  "meta": {
    "common_scale_km": 4.0,
    "data_file": "sites.9f9dcd6e.json",
    "dimensions": [
      {
        "core": true,
        "key": "terrain",
        "label": "Terrain"
      },
      {
        "core": true,
        "key": "thermal",
        "label": "Thermal"
      },
      {
        "core": true,
        "key": "geology",
        "label": "Geology"
      },
      {
        "core": true,
        "key": "subsurface",
        "label": "Subsurface"
      },
      {
        "core": false,
        "key": "water_ice",
        "label": "Water/ice"
      },
      {
        "core": false,
        "key": "dust_wind",
        "label": "Dust/wind"
      }
    ],
    "generated_at": "2026-11-14T13:38:06+00:00",
    "git_sha": null,
    "note": "Dimensions are separate properties. No blended similarity score exists.",
    "quality": {
      "errors": 0,
      "published": 4,
      "quarantined": 0,
      "warnings": 0
    },
    "run_id": "40f3f658fd7a",
    "schema_version": "1",
    "score_range": [
      0.0,
      1.0
    ]
  },
  "sites": [
    {
      "breakdowns": [
        "Earth atmosphere and humidity are unlike Mars"
      ],
      "confidence": "low",
      "coordinates": [
        -69.25,
        -24.5
      ],
      "data_sources": [
        "MGS MOLA MEGDR (megt44n000hb)",
        "demo_earth_catalog",
        "demo_earth_dem",
        "demo_target_catalog"
      ],
      "dimension_scores": {
        "geology": 0.75,
        "subsurface": 0.8667,
        "terrain": 0.9896,
        "thermal": 0.4685
      },
      "exploration_uses": [
        "Use this site to test rover dust mitigation"
      ],
      "name": "Atacama Desert",
      "site_id": "atacama_desert",
      "strengths": [
        "Hyper-arid surface with very low organic load"
      ],
      "target_body": "mars"
    },
    {
      "breakdowns": [
        "Seasonal liquid water has no Martian equivalent"
      ],
      "confidence": "low",
      "coordinates": [
        -89.7,
        75.4
      ],
      "data_sources": [
        "MGS MOLA MEGDR (megt44n000hb)",
        "demo_earth_catalog",
        "demo_earth_dem",
        "demo_target_catalog"
      ],
      "dimension_scores": {
        "geology": 0.6562,
        "subsurface": 0.7333,
        "terrain": 0.9692,
        "thermal": 0.5778
      },
      "exploration_uses": [
        "Use this site to test field habitat operations"
      ],
      "name": "Devon Island",
      "site_id": "devon_island",
      "strengths": [
        "Cold, dry polar desert with impact-derived terrain"
      ],
      "target_body": "mars"
    },
    {
      "breakdowns": [
        "Permanently shadowed cold traps cannot be reproduced"
      ],
      "confidence": "low",
      "coordinates": [
        162.0,
        -77.5
      ],
      "data_sources": [
        "LRO LOLA GDRDSM (ldsm_75s_240m)",
        "demo_earth_catalog",
        "demo_earth_dem",
        "demo_target_catalog"
      ],
      "dimension_scores": {
        "geology": 0.9187,
        "subsurface": 0.6667,
        "terrain": 0.5958,
        "thermal": 0.4704
      },
      "exploration_uses": [
        "Use this site to test subsurface sampling"
      ],
      "name": "Antarctic Dry Valleys",
      "site_id": "antarctic_dry_valleys",
      "strengths": [
        "Extremely dry, cold ground with minimal weathering"
      ],
      "target_body": "moon"
    },
    {
      "breakdowns": [
        "Vacuum, low gravity and radiation cannot be replicated"
      ],
      "confidence": "low",
      "coordinates": [
        -19.0,
        64.9
      ],
      "data_sources": [
        "LRO LOLA GDRDSM (ldsm_75s_240m)",
        "demo_earth_catalog",
        "demo_earth_dem",
        "demo_target_catalog"
      ],
      "dimension_scores": {
        "geology": 0.9688,
        "subsurface": 0.8667,
        "terrain": 0.5842,
        "thermal": 0.4
      },
      "exploration_uses": [
        "Use this site to test traverse planning on rough lava"
      ],
      "name": "Iceland Lava Fields",
      "site_id": "iceland_lava_fields",
      "strengths": [
        "Basaltic terrain with young lava morphologies"
      ],
      "target_body": "moon"
    }
  ],
  "note": "Offline snapshot of the published dataset. Generated from public/data; used ONLY when fetch is unavailable."
};

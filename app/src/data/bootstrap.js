/**
 * Data bootstrap — deliberately INDEPENDENT of MapLibre and of the map module.
 *
 * The audited app called loadSites() inside map.js:init(), which only ran when
 * `maplibregl` was defined. A CDN failure therefore left the table and card
 * empty even though the data file was fine. Here data loads first, always.
 *
 * Publish chain: manifest.json (never cached) -> sites.<hash8>.json (immutable)
 * -> meta.json (dimension labels) -> state.sites.
 */
import { OFFLINE_SNAPSHOT } from './offlineSnapshot.js';

const CORE = ['terrain', 'thermal', 'geology', 'subsurface'];
const OPTIONAL = ['water_ice', 'dust_wind'];
const BODIES = ['moon', 'mars'];
const CONFIDENCE = ['high', 'medium', 'low'];
const FORBIDDEN = /placeholder|mock|todo|fake|sample/i;
const DEMO_SOURCE = /^demo_|placeholder|mock|fake|sample/i;

/** Set true before submission: demo-sourced records are then quarantined. */
export const BLOCK_DEMO_DATA = false;

export function hasDemoSources(site) {
  return Array.isArray(site?.data_sources) && site.data_sources.some((d) => DEMO_SOURCE.test(String(d)));
}

/** Optional dimensions sent as null mean "not scored": drop them (never 0). */
function normalize(s) {
  if (!s || typeof s !== 'object' || !s.dimension_scores || typeof s.dimension_scores !== 'object') return s;
  const scores = { ...s.dimension_scores };
  for (const dim of OPTIONAL) if (scores[dim] === null) delete scores[dim];
  return { ...s, dimension_scores: scores };
}

/** Client-boundary mirror of the frozen contract. 0 is a valid score; null is not. */
export function isValidSite(s) {
  if (!s || typeof s !== 'object') return false;
  if (typeof s.site_id !== 'string' || !/^[a-z0-9_]+$/.test(s.site_id)) return false;
  if (typeof s.name !== 'string' || !s.name.length || FORBIDDEN.test(s.name)) return false;
  if (!Array.isArray(s.coordinates) || s.coordinates.length !== 2) return false;
  const [lon, lat] = s.coordinates;
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) return false;
  if (!BODIES.includes(s.target_body) || !CONFIDENCE.includes(s.confidence)) return false;
  if (!s.dimension_scores || typeof s.dimension_scores !== 'object') return false;
  for (const dim of CORE) {
    const v = s.dimension_scores[dim];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) return false;
  }
  // Optional dimensions are OMITTED when not measured, never null.
  for (const [dim, v] of Object.entries(s.dimension_scores)) {
    if (v === null || (typeof v === 'number' && (v < 0 || v > 1))) return false;
    if (!CORE.includes(dim) && !OPTIONAL.includes(dim)) return false;
  }
  if (!Array.isArray(s.data_sources) || !s.data_sources.length) return false;
  return true;
}

/**
 * Returns { sites, meta, manifest, offline, skipped, reason }.
 * A quality-gate failure is FATAL (fail-closed, no fallback).
 * A transport/parse failure falls back to the published offline snapshot and
 * is reported to the caller so the UI can show an honest warning.
 */
export async function loadSiteData({ base = 'public/data', onSkipped } = {}) {
  try {
    const manifestRes = await fetch(`${base}/manifest.json`, { cache: 'no-store' });
    if (!manifestRes.ok) throw new Error(`Could not load data manifest (HTTP ${manifestRes.status})`);
    const manifest = await manifestRes.json();
    if (manifest.quality?.errors) {
      const err = new Error('Published dataset failed its quality gate');
      err.fatal = true;
      throw err;
    }

    const dataFile = manifest.data_file || 'sites.json';
    const res = await fetch(`${base}/${dataFile}`);
    if (!res.ok) throw new Error(`Could not load ${dataFile} (HTTP ${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Site data must be a JSON array.');

    const sites = data.map(normalize).filter((s) => isValidSite(s) && !(BLOCK_DEMO_DATA && hasDemoSources(s)));
    const skipped = data.length - sites.length;
    if (skipped) {
      onSkipped?.(skipped);
      console.warn(`[data] quarantined ${skipped} invalid site record(s) at client boundary`);
    }

    let meta = null;
    try {
      const metaRes = await fetch(`${base}/meta.json`);
      if (metaRes.ok) meta = await metaRes.json();
    } catch { /* labels are optional decoration */ }

    return { sites, meta, manifest, offline: false, skipped, reason: null };
  } catch (err) {
    if (err.fatal) throw err;

    const snap = OFFLINE_SNAPSHOT;
    return {
      sites: snap.sites.map(normalize).filter((s) => isValidSite(s) && !(BLOCK_DEMO_DATA && hasDemoSources(s))),
      meta: snap.meta,
      manifest: snap.manifest,
      offline: true,
      skipped: 0,
      reason: err.message,
    };
  }
}

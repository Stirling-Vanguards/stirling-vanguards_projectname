/**
 * Shared store. The map, ranked table, site card, comparison view and target
 * pages all subscribe to this. No module owns the data fetch.
 *
 * Dimension keys and labels come from meta.json (generated from the frozen
 * contract), never from a hard-coded JS array.
 */
const listeners = new Set();

function deriveDimensions(meta, sites) {
  if (Array.isArray(meta?.dimensions) && meta.dimensions.length) {
    return meta.dimensions.map((d) => ({ key: d.key, label: d.label, core: Boolean(d.core) }));
  }
  const keys = [...new Set(sites.flatMap((s) => Object.keys(s.dimension_scores || {})))];
  return keys.map((key) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    core: true,
  }));
}

const state = {
  sites: [],
  meta: null,
  manifest: null,
  dimensions: [],
  selectedSiteId: null,
  selectedDimension: null,     // never a blended score
  filters: { targetBody: 'all', confidence: 'all' },
  direction: 'desc',
  dataStatus: { offline: false, skipped: 0, reason: null },
};

export function getState() { return state; }

/** Shallow merge. For filters, pass the whole object. */
export function setState(patch) {
  Object.assign(state, patch);

  if ('sites' in patch || 'meta' in patch) {
    const dims = deriveDimensions(state.meta, state.sites);
    state.dimensions = dims;
    if (!dims.some((d) => d.key === state.selectedDimension)) {
      state.selectedDimension = dims[0]?.key ?? null;
    }
  }
  // A filter change that hides the selected site clears the selection so the
  // card, the map ring and the table highlight always agree.
  if (('filters' in patch || 'sites' in patch) && state.selectedSiteId !== null
      && !getVisibleSites().some((s) => s.site_id === state.selectedSiteId)) {
    state.selectedSiteId = null;
    patch = { ...patch, selectedSiteId: null };
  }
  listeners.forEach((fn) => {
    try { fn(state, patch); } catch (err) { console.error('[state] listener failed', err); }
  });
}

/** Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** A number 0..1, or null when not scored. Never returns 0 for missing data. */
export function getScore(site, dimension) {
  const v = site?.dimension_scores?.[dimension];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null;
}

export function getDimension(key) {
  return state.dimensions.find((d) => d.key === key) ?? null;
}
export function getDimensionLabel(key) {
  return getDimension(key)?.label ?? key;
}
export function getCoreDimensions() {
  return state.dimensions.filter((d) => d.core);
}

export function getVisibleSites() {
  const { targetBody, confidence } = state.filters;
  return state.sites.filter((s) =>
    (targetBody === 'all' || s.target_body === targetBody) &&
    (confidence === 'all' || s.confidence === confidence));
}

export function getSelectedSite() {
  return state.sites.find((s) => s.site_id === state.selectedSiteId) ?? null;
}

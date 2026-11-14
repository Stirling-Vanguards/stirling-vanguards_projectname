// app/src/state.js
// Tiny shared store so the map, ranked table, site card and comparison view agree.
// PROPOSED location and shape: agree with Ely and Vince before they build on it.

const state = {
  sites: [],                    // array of site records (data contract shape)
  selectedSiteId: null,         // site_id or null
  selectedDimension: 'terrain', // one of DIMENSIONS; never a blended score
  filters: { targetBody: 'all', confidence: 'all' }, // 'all' | 'moon' | 'mars' ; 'all' | 'high' | 'medium' | 'low'
};

const listeners = new Set();

export const DIMENSIONS = [
  { key: 'terrain', label: 'Terrain' },
  { key: 'thermal', label: 'Thermal' },
  { key: 'geology', label: 'Geology' },
  { key: 'subsurface', label: 'Subsurface' },
];

export function getState() {
  return state;
}

// Shallow merge. For filters, pass the whole object:
//   setState({ filters: { ...getState().filters, targetBody: 'mars' } })
export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state, patch));
}

// Returns an unsubscribe function. Callback gets (state, patch).
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Returns a number between 0 and 1, or null when not scored. Never returns 0 for missing data.
export function getScore(site, dimension) {
  const v = site && site.dimension_scores ? site.dimension_scores[dimension] : null;
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : null;
}

// Sites that pass the current filters.
export function getVisibleSites() {
  const { targetBody, confidence } = state.filters;
  return state.sites.filter(
    (s) =>
      (targetBody === 'all' || s.target_body === targetBody) &&
      (confidence === 'all' || s.confidence === confidence)
  );
}

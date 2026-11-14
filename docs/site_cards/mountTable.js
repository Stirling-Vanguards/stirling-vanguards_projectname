import { getState, setState, subscribe } from '../state.js';
import { renderRankedTable } from './rankedTable.js';

// TODO (Kurt): what does state.js use for "no filter"? null, '' or 'all'?
// Change this one constant to match.
const NO_FILTER = null;
const toUi = (v) => (v == null || v === NO_FILTER ? 'all' : v);
const toState = (v) => (v === 'all' ? NO_FILTER : v);
const select = (site) => setState({ selectedSiteId: site.site_id });

export function mountTable(slot) {
  const s = getState();
  let lastSites = s.sites ?? [];
  const table = renderRankedTable(lastSites, {
    dimension: s.selectedDimension,
    body: toUi(s.filters?.targetBody),
    confidence: toUi(s.filters?.confidence),
    onOpen: select,
    onLocate: select,
    onDimensionChange: (d) => setState({ selectedDimension: d }),
    onFilterChange: ({ body, confidence }) =>
      setState({ filters: { ...getState().filters, targetBody: toState(body), confidence: toState(confidence) } }),
  });
  slot.replaceChildren(table.element);

  // Inbound sync (Kurt's toggle, loaded data). Uses getState(), so it doesn't depend on what subscribe passes.
  subscribe(() => {
    const n = getState();
    const next = n.sites ?? [];
    if (next !== lastSites) { lastSites = next; table.setSites(next); }
    table.setDimension(n.selectedDimension);
    table.setFilters({ body: toUi(n.filters?.targetBody), confidence: toUi(n.filters?.confidence) });
  });
}

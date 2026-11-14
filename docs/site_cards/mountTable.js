import { DIMENSIONS, getState, setState, subscribe } from '../state.js';
import { renderRankedTable } from './rankedTable.js';

// state.js uses 'all' for "no filter", the same value the table uses, so no mapping is needed.
const select = (site) => setState({ selectedSiteId: site.site_id });

export function mountTable(slot) {
  const s = getState();
  let lastSites = s.sites;
  const table = renderRankedTable(lastSites, {
    dimension: s.selectedDimension,
    body: s.filters.targetBody,
    confidence: s.filters.confidence,
    rankDimensions: DIMENSIONS.map((d) => d.key),
    onLocate: select, // selecting also opens the card (Kurt mounts it on selectedSiteId change)
    onDimensionChange: (d) => setState({ selectedDimension: d }),
    onFilterChange: ({ body, confidence }) =>
      setState({ filters: { ...getState().filters, targetBody: body, confidence } }),
  });
  slot.replaceChildren(table.element);

  // Inbound sync: Kurt's toggle, and sites arriving after mount.
  return subscribe((n) => {
    if (n.sites !== lastSites) { lastSites = n.sites; table.setSites(lastSites); }
    table.setDimension(n.selectedDimension);
    table.setFilters({ body: n.filters.targetBody, confidence: n.filters.confidence });
  });
}

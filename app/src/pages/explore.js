import { bootSite, renderDatasetStrip } from '../site.js';
import { getState, getSelectedSite, setState, subscribe } from '../state.js';
import { h } from '../dom.js';
import { renderSiteCard } from '../components/siteCard.js';
import { mountRankedTable } from '../components/rankedTable.js';
import { mountComparison } from '../components/comparison.js';
import { mountDimensionToggle } from '../components/dimensionToggle.js';
import { mountLegend } from '../components/legend.js';
import { mountMap } from '../map/map.js';

const $ = (id) => document.getElementById(id);

async function main() {
  await bootSite();   // data is loaded BEFORE the map, table or card mount

  renderDatasetStrip($('dataset-strip'));
  mountDimensionToggle($('dimension-toggle'), { coreOnly: true });
  mountLegend($('map-legend'));
  mountRankedTable($('site-table-slot'));
  mountComparison($('comparison-slot'));

  const cardSlot = $('site-card-slot');
  function drawCard() {
    const site = getSelectedSite();
    $('selection-label').textContent = site ? site.name : 'none';
    try {
      cardSlot.replaceChildren(renderSiteCard(site));
    } catch (err) {
      console.error('[card] render failed', err);
      cardSlot.replaceChildren(h('p', { class: 'va-alert va-alert--danger', text: `Could not show this site card: ${err.message}` }));
    }
  }
  drawCard();
  subscribe((st, patch) => {
    if ('sites' in patch || 'selectedSiteId' in patch || 'meta' in patch) drawCard();
  });

  // Deep link from a target page: /explore.html?site=atacama_desert
  const requested = new URLSearchParams(location.search).get('site');
  if (requested && getState().sites.some((s) => s.site_id === requested)) {
    setState({ selectedSiteId: requested });
  } else if (!getState().selectedSiteId && getState().sites.length) {
    setState({ selectedSiteId: getState().sites[0].site_id });
  }

  mountMap('map');   // independently degrades to the SVG map if WebGL is missing
}

main();

import { getState, subscribe } from './state.js';
import { renderSiteCard } from './components/siteCard.js';
import { mountTable } from './components/mountTable.js';

const cardSlot = document.getElementById('site-card-slot');
const tableSlot = document.getElementById('site-table-slot');

// Curated "what Earth can't replicate" items come from Venice's copy. Empty = section hidden.
const EARTH_LIMITS = [];

function showCard() {
  if (!cardSlot) return;
  const { sites, selectedSiteId } = getState();
  const site = (sites ?? []).find((s) => s.site_id === selectedSiteId);
  if (!site) {
    const p = document.createElement('p');
    p.textContent = 'Select a site on the map or in the table to see its card.';
    cardSlot.replaceChildren(p);
    return;
  }
  try {
    cardSlot.replaceChildren(renderSiteCard(site, EARTH_LIMITS));
  } catch (err) {
    console.error(err);
    const p = document.createElement('p');
    p.textContent = `Could not show this site card: ${err.message}`;
    cardSlot.replaceChildren(p);
  }
}

if (tableSlot) mountTable(tableSlot);

subscribe((state, patch) => {
  if ('selectedSiteId' in patch || 'sites' in patch) showCard();
});

showCard();

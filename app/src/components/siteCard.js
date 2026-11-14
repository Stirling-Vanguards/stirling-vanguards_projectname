/** Site card — one contract record. Uses textContent only, never innerHTML with data. */
import { renderRadar } from './radar.js';
import { limitsFor } from '../data/targets.js';
import { h, badge, list, cardSection } from '../dom.js';

export function renderSiteCard(site, limits = site ? limitsFor(site.target_body) : []) {
  if (!site) {
    return h('div', { class: 'va-empty' }, [
      h('span', { class: 'va-empty__title', text: 'No site selected' }),
      'Select a site on the map or in the ranked table to see its card.',
    ]);
  }

  const limitList = limits.length
    ? h('ul', {}, limits.map((l) => h('li', {
      text: `${l.title}: ${l.consequence} (${l.source || '[source needed]'})`,
    })))
    : h('p', { class: 'va-muted', text: 'No curated limits yet.' });

  const sources = list(site.data_sources, 'va-source-list');

  return h('article', { class: 'site-card' }, [
    h('header', { class: 'card-head' }, [
      h('h2', { text: site.name }),
      badge(site.target_body, site.confidence),
    ]),
    renderRadar(site.dimension_scores),
    h('div', {
      class: 'va-radar-disclaimer',
      text: 'Axes are separate properties. The polygon area is not an overall grade. Scores range 0–1 per dimension.',
    }),
    cardSection('Strengths', list(site.strengths)),
    cardSection('Where the analogy breaks down', list(site.breakdowns)),
    cardSection('Use this site to test', list(site.exploration_uses)),
    cardSection("What Earth can't replicate", limitList),
    cardSection('Data sources', sources),
    h('p', {
      class: 'va-note',
      style: 'margin-top:var(--space-5)',
      text: `Coordinates [lon, lat]: ${site.coordinates[0]}, ${site.coordinates[1]} · record ${site.site_id}`,
    }),
  ]);
}

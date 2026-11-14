import { renderRadar } from './radar.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent, never innerHTML
  return node;
}
function list(items = []) {
  const ul = el('ul');
  items.forEach((t) => ul.append(el('li', '', t)));
  return ul;
}
function section(title, content) {
  const wrap = el('section', 'card-section');
  wrap.append(el('h3', '', title), content);
  return wrap;
}

// site: one contract record. limits: curated static [{title, consequence, source?}]
export function renderSiteCard(site, limits = []) {
  const card = el('article', 'site-card');
  const head = el('header', 'card-head');
  head.append(
    el('h2', '', site.name),
    el('span', `badge badge-${site.target_body}`, `vs ${site.target_body === 'moon' ? 'Moon' : 'Mars'}`),
    el('span', `badge conf-${site.confidence}`, `Confidence: ${site.confidence}`),
  );
  card.append(head, renderRadar(site.dimension_scores));
  card.append(el('p', 'note', 'Axes are separate properties. The polygon area is not an overall grade.'));
  card.append(section('Strengths', list(site.strengths)));
  card.append(section('Where the analogy breaks down', list(site.breakdowns)));
  card.append(section('Use this site to test', list(site.exploration_uses)));

  if (limits.length) {
    const ul = el('ul');
    limits.forEach((l) =>
      ul.append(el('li', '', `${l.title}: ${l.consequence} (${l.source || '[source needed]'})`)));
    card.append(section("What Earth can't replicate", ul));
  }
  card.append(section('Data sources', list(site.data_sources)));
  return card;
}

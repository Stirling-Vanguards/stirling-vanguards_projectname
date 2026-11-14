// Ranked table: sorts by ONE selected dimension. No blended score anywhere.
const CORE = ['terrain', 'thermal', 'geology', 'subsurface'];
const OPTIONAL = ['water_ice', 'dust_wind'];
const LABELS = {
  terrain: 'Terrain', thermal: 'Thermal', geology: 'Geology',
  subsurface: 'Subsurface', water_ice: 'Water/ice', dust_wind: 'Dust/wind',
};
const BODY = { moon: 'Moon', mars: 'Mars' };
const valid = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

// Pure function, easy to test. Missing/null scores always sort last.
export function filterAndSort(sites, { body = 'all', confidence = 'all', dimension = 'terrain', direction = 'desc' } = {}) {
  const rows = sites.filter((s) =>
    (body === 'all' || s.target_body === body) &&
    (confidence === 'all' || s.confidence === confidence));
  return rows.sort((a, b) => {
    const av = a.dimension_scores?.[dimension];
    const bv = b.dimension_scores?.[dimension];
    if (!valid(av) && !valid(bv)) return 0;
    if (!valid(av)) return 1;
    if (!valid(bv)) return -1;
    return direction === 'desc' ? bv - av : av - bv;
  });
}

function select(label, options, value, onChange) {
  const wrap = el('label', 'filter');
  wrap.append(el('span', '', label));
  const sel = el('select');
  options.forEach(([v, text]) => {
    const o = el('option', '', text);
    o.value = v;
    sel.append(o);
  });
  sel.value = value;
  sel.addEventListener('change', () => onChange(sel.value));
  wrap.append(sel);
  return wrap;
}

// onOpen(site) / onLocate(site) are callbacks so this file doesn't depend on
// Kurt's map or a shared-state module yet. Wire them once that's agreed.
export function renderRankedTable(initialSites, { dimension = 'terrain', onOpen, onLocate } = {}) {
  let sites = initialSites;
  const state = { body: 'all', confidence: 'all', dimension, direction: 'desc' };

  const root = el('section', 'ranked');
  const controls = el('div', 'ranked-controls');
  const status = el('p', 'ranked-status');
  status.setAttribute('aria-live', 'polite');
  const tableWrap = el('div', 'ranked-table-wrap');
  root.append(controls, status, tableWrap);

  const dims = () => [...CORE, ...OPTIONAL.filter((d) => sites.some((s) => valid(s.dimension_scores?.[d])))];

  function drawControls() {
    controls.replaceChildren(
      select('Target', [['all', 'All'], ['moon', 'Moon'], ['mars', 'Mars']], state.body,
        (v) => { state.body = v; drawTable(); }),
      select('Confidence', [['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']], state.confidence,
        (v) => { state.confidence = v; drawTable(); }),
      select('Rank by', dims().map((d) => [d, LABELS[d]]), state.dimension,
        (v) => { state.dimension = v; drawTable(); }),
    );
    const dir = el('button', 'dir-toggle', state.direction === 'desc' ? 'Highest first' : 'Lowest first');
    dir.type = 'button';
    dir.addEventListener('click', () => {
      state.direction = state.direction === 'desc' ? 'asc' : 'desc';
      dir.textContent = state.direction === 'desc' ? 'Highest first' : 'Lowest first';
      drawTable();
    });
    controls.append(dir);
  }

  function drawTable() {
    const rows = filterAndSort(sites, state);
    const order = state.direction === 'desc' ? 'high to low' : 'low to high';
    status.textContent = `Showing ${rows.length} of ${sites.length} sites, ranked by ${LABELS[state.dimension]} (${order}). Dimensions are ranked one at a time, not combined.`;

    if (!rows.length) {
      tableWrap.replaceChildren(el('p', 'ranked-empty', 'No sites match these filters. Try setting Target or Confidence to All.'));
      return;
    }

    const cols = dims();
    const table = el('table', 'ranked-table');
    table.append(el('caption', 'sr-only', `Sites ranked by ${LABELS[state.dimension]}`));

    const hr = el('tr');
    ['#', 'Site', 'Target'].forEach((t) => { const th = el('th', '', t); th.scope = 'col'; hr.append(th); });
    cols.forEach((d) => {
      const th = el('th', d === state.dimension ? 'is-ranked' : '', LABELS[d]);
      th.scope = 'col';
      if (d === state.dimension) th.setAttribute('aria-sort', state.direction === 'desc' ? 'descending' : 'ascending');
      hr.append(th);
    });
    ['Confidence', 'Actions'].forEach((t) => { const th = el('th', '', t); th.scope = 'col'; hr.append(th); });
    table.append(el('thead')).firstChild.append(hr);

    const tbody = el('tbody');
    rows.forEach((site, i) => {
      const tr = el('tr');
      tr.append(el('td', 'rank', String(i + 1)), el('th', 'site-name', site.name), el('td', '', BODY[site.target_body] ?? site.target_body));
      tr.firstChild.nextSibling.scope = 'row';
      cols.forEach((d) => {
        const v = site.dimension_scores?.[d];
        tr.append(el('td', `score${d === state.dimension ? ' is-ranked' : ''}${valid(v) ? '' : ' not-scored'}`,
          valid(v) ? v.toFixed(2) : 'not scored'));
      });
      tr.append(el('td', `conf-${site.confidence}`, site.confidence));
      const actions = el('td', 'actions');
      [['Open card', onOpen], ['Locate on map', onLocate]].forEach(([label, fn]) => {
        if (!fn) return;
        const b = el('button', '', label);
        b.type = 'button';
        b.setAttribute('aria-label', `${label}: ${site.name}`);
        b.addEventListener('click', () => fn(site));
        actions.append(b);
      });
      tr.append(actions);
      tbody.append(tr);
    });
    table.append(tbody);
    tableWrap.replaceChildren(table);
  }

  drawControls();
  drawTable();

  return {
    element: root,
    // For syncing with Kurt's dimension toggle later
    setDimension(d) { state.dimension = d; drawControls(); drawTable(); },
    setSites(next) { sites = next; drawControls(); drawTable(); },
  };
}

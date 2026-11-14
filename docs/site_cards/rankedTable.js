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

// Pure function. Missing/null scores always sort last.
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

function makeSelect(label, onChange) {
  const wrap = el('label', 'filter');
  wrap.append(el('span', '', label));
  const sel = el('select');
  sel.addEventListener('change', () => onChange(sel.value));
  wrap.append(sel);
  return { wrap, sel };
}
function fillOptions(sel, options, value) {
  sel.replaceChildren(...options.map(([v, text]) => {
    const o = el('option', '', text);
    o.value = v;
    return o;
  }));
  sel.value = value;
}

// Callbacks only; this file never imports state.js.
// onDimensionChange(d) / onFilterChange({ body, confidence }) fire on USER changes in the table.
// setDimension / setFilters / setSites are for inbound sync and never fire callbacks.
export function renderRankedTable(initialSites, {
  dimension = 'terrain', body = 'all', confidence = 'all', rankDimensions,
  onOpen, onLocate, onDimensionChange, onFilterChange,
} = {}) {
  let sites = initialSites;
  const state = { body, confidence, dimension, direction: 'desc' };

  const dims = () => {
    const list = [...CORE, ...OPTIONAL.filter((d) => sites.some((s) => valid(s.dimension_scores?.[d])))];
    if (!list.includes(state.dimension) && LABELS[state.dimension]) list.push(state.dimension);
    return list;
  };

    const rankable = () => {
    const list = rankDimensions ? [...rankDimensions] : dims();
    if (!list.includes(state.dimension) && LABELS[state.dimension]) list.push(state.dimension);
    return list;
  };

  const root = el('section', 'ranked');
  const controls = el('div', 'ranked-controls');
  const status = el('p', 'ranked-status');
  status.setAttribute('aria-live', 'polite');
  const tableWrap = el('div', 'ranked-table-wrap');
  root.append(controls, status, tableWrap);

  const bodyCtl = makeSelect('Target', (v) => {
    state.body = v; drawTable();
    onFilterChange?.({ body: state.body, confidence: state.confidence });
  });
  const confCtl = makeSelect('Confidence', (v) => {
    state.confidence = v; drawTable();
    onFilterChange?.({ body: state.body, confidence: state.confidence });
  });
  const dimCtl = makeSelect('Rank by', (v) => {
    state.dimension = v; drawTable();
    onDimensionChange?.(v);
  });
  const dirBtn = el('button', 'dir-toggle');
  dirBtn.type = 'button';
  dirBtn.addEventListener('click', () => {
    state.direction = state.direction === 'desc' ? 'asc' : 'desc';
    syncControls(); fillOptions(dimCtl.sel, rankable().map((d) => [d, LABELS[d]]), state.dimension);
  });
  controls.append(bodyCtl.wrap, confCtl.wrap, dimCtl.wrap, dirBtn);

  fillOptions(bodyCtl.sel, [['all', 'All'], ['moon', 'Moon'], ['mars', 'Mars']], state.body);
  fillOptions(confCtl.sel, [['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']], state.confidence);

  function syncControls() {
    fillOptions(dimCtl.sel, dims().map((d) => [d, LABELS[d]]), state.dimension);
    bodyCtl.sel.value = state.body;
    confCtl.sel.value = state.confidence;
    dirBtn.textContent = state.direction === 'desc' ? 'Highest first' : 'Lowest first';
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
    const addTh = (text, cls = '') => { const th = el('th', cls, text); th.scope = 'col'; hr.append(th); return th; };
    ['#', 'Site', 'Target'].forEach((t) => addTh(t));
    cols.forEach((d) => {
      const th = addTh(LABELS[d], d === state.dimension ? 'is-ranked' : '');
      if (d === state.dimension) th.setAttribute('aria-sort', state.direction === 'desc' ? 'descending' : 'ascending');
    });
    ['Confidence', 'Actions'].forEach((t) => addTh(t));
    const thead = el('thead');
    thead.append(hr);
    table.append(thead);

    const tbody = el('tbody');
    rows.forEach((site, i) => {
      const tr = el('tr');
      const nameTh = el('th', 'site-name', site.name);
      nameTh.scope = 'row';
      tr.append(el('td', 'rank', String(i + 1)), nameTh, el('td', '', BODY[site.target_body] ?? site.target_body));
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

  syncControls();
  drawTable();

  return {
    element: root,
    setDimension(d) {
      if (d === state.dimension) return;
      state.dimension = d; syncControls(); drawTable();
    },
    setFilters({ body: b = state.body, confidence: c = state.confidence } = {}) {
      if (b === state.body && c === state.confidence) return;
      state.body = b; state.confidence = c; syncControls(); drawTable();
    },
    setSites(next) { sites = next; syncControls(); drawTable(); },
  };
}

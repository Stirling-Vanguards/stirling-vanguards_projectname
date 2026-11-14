/**
 * Vanguard Atlas — design system gallery
 * ---------------------------------------------------------------------------
 * This file only drives the SHOWCASE. Every visible component is styled by the
 * production stylesheets at ../src/styles/index.css — no shadow copies here.
 *
 * The "product in context" section loads the REAL published dataset from
 * app/public/data/. If the page is opened over file:// (where fetch is blocked)
 * it falls back to an embedded copy of the same four records, so the gallery
 * still demonstrates every state offline.
 */

/* ------------------------------------------------------------------ helpers */
function h(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? 'true' : v === false ? 'false' : String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}
const SVG_NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, text) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text !== undefined) n.textContent = text;
  return n;
}
const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------ theme control */
const THEME_KEY = 'va-ds-theme';
const CONTRAST_KEY = 'va-ds-contrast';
const root = document.documentElement;

function applyTheme(theme) {
  root.dataset.theme = theme;
  const btn = $('theme-toggle');
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  btn.querySelector('use').setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* file:// */ }
  renderSwatches();
}
function applyContrast(on) {
  if (on) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
  $('contrast-toggle').setAttribute('aria-pressed', String(on));
  try { localStorage.setItem(CONTRAST_KEY, on ? 'high' : 'normal'); } catch { /* file:// */ }
  renderSwatches();
}
$('theme-toggle').addEventListener('click', () =>
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
$('contrast-toggle').addEventListener('click', () =>
  applyContrast(root.dataset.contrast !== 'high'));

/* Saved preferences are restored at the bottom of this module, after all
   constants are initialised (custom-property swatch data lives below). */

/* ------------------------------------------------------------ toast + copy */
let toastTimer;
function toast(message) {
  const el = $('ds-toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 1800);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); } catch { /* file:// */ }
  toast(`Copied ${text}`);
}

/* --------------------------------------------------------------- swatches */
const probe = h('span', { style: 'position:absolute;visibility:hidden;pointer-events:none' });
document.body.append(probe);
function resolvedColor(token) {
  probe.style.color = `var(${token}, transparent)`;
  return getComputedStyle(probe).color;
}
function toHex(css) {
  const m = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!m) return css;
  return '#' + [m[1], m[2], m[3]]
    .map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}
const SWATCH_GROUPS = {
  'sw-brand': [
    ['--c-blue-700', 'CTA gradient start'], ['--c-blue-600', 'Solid CTA start'],
    ['--c-blue-500', 'Canonical brand blue'], ['--c-blue-400', 'Accent / focus'],
    ['--c-blue-300', 'Info text'], ['--accent-soft', 'Selected surface'],
  ],
  'sw-surface': [
    ['--bg-app', 'App canvas'], ['--bg-sunken', 'Recessed / strip'],
    ['--bg-panel', 'Panel'], ['--bg-raised', 'Raised / table head'],
    ['--bg-hover', 'Hover'], ['--fg-primary', 'Primary text'],
    ['--fg-secondary', 'Secondary text'], ['--fg-muted', 'Muted text'],
    ['--fg-disabled', 'Disabled / not scored'], ['--border-default', 'Hairline border'],
  ],
  'sw-dim': [
    ['--dim-terrain', 'TR · core'], ['--dim-thermal', 'TH · core'],
    ['--dim-geology', 'GE · core'], ['--dim-subsurface', 'SS · core'],
    ['--dim-water_ice', 'WI · optional'], ['--dim-dust_wind', 'DW · optional'],
  ],
  'sw-signal': [
    ['--body-moon', 'Moon · solid ring'], ['--body-mars', 'Mars · dashed ring'],
    ['--signal-high', 'High confidence'], ['--signal-medium', 'Medium confidence'],
    ['--signal-low', 'Low confidence'], ['--status-info', 'Info'],
    ['--status-warn', 'Warning'], ['--status-danger', 'Error'],
    ['--not-scored', 'Not scored marker'], ['--ramp-2', 'Ramp midpoint'],
  ],
};
function renderSwatches() {
  for (const [id, list] of Object.entries(SWATCH_GROUPS)) {
    const host = $(id);
    if (!host) continue;
    host.replaceChildren(...list.map(([token, role]) => {
      const css = resolvedColor(token);
      return h('button', {
        class: 'ds-swatch', type: 'button', title: `Copy ${token}`,
        onclick: () => copy(token),
      }, [
        h('span', { class: 'ds-swatch__chip', style: `background:${css}` }),
        h('span', { class: 'ds-swatch__meta' }, [
          h('span', { class: 'ds-swatch__name', text: token }),
          h('span', { class: 'ds-swatch__hex', text: toHex(css) }),
          h('span', { class: 'ds-swatch__role', text: role }),
        ]),
      ]);
    }));
  }
}

/* --------------------------------------------------- type / space / radius */
function renderScales() {
  const scale = [
    ['--text-2xs', '11px / eyebrow'], ['--text-xs', '12px / metadata'],
    ['--text-sm', '13px / dense UI'], ['--text-md', '14px / UI default'],
    ['--text-base', '16px / body'], ['--text-lg', '18px / card title'],
    ['--text-xl', '22px / section'], ['--text-2xl', '28px / heading'],
    ['--text-3xl', '36px / hero small'], ['--text-5xl', '72px / hero'],
  ];
  $('type-scale').replaceChildren(...scale.map(([tok, role]) =>
    h('div', { class: 'ds-type-row' }, [
      h('span', { class: 'ds-type-row__tag', text: `${tok} · ${role}` }),
      h('span', { class: 'ds-type-row__sample', style: `font-size:var(${tok});font-family:var(--font-display)`, text: 'Vanguard Atlas · 0123456789' }),
    ])));

  const spaces = [
    ['--space-1', 2], ['--space-2', 4], ['--space-3', 8], ['--space-4', 12],
    ['--space-5', 16], ['--space-6', 20], ['--space-7', 24], ['--space-8', 32],
    ['--space-9', 40], ['--space-10', 48], ['--space-11', 64], ['--space-12', 96],
  ];
  $('space-scale').replaceChildren(...spaces.map(([tok, px]) =>
    h('div', { class: 'ds-space-row' }, [
      h('span', { class: 'ds-space-row__name', text: `${tok} · ${px}px` }),
      h('span', { class: 'ds-space-row__bar', style: `width:${px * 3}px` }),
    ])));

  const radii = [['--radius-xs', '4'], ['--radius-sm', '6'], ['--radius-md', '10'],
                 ['--radius-lg', '14'], ['--radius-xl', '20'], ['--radius-full', 'pill']];
  $('radius-specimens').replaceChildren(...radii.map(([tok, label]) =>
    h('span', {
      class: 'va-chip', style: `border-radius:var(${tok});padding:var(--space-3) var(--space-5)`,
      text: `${tok} · ${label}`,
    })));
}

/* ------------------------------------------------------------- dimension UI */
const CODES = { terrain: 'TR', thermal: 'TH', geology: 'GE', subsurface: 'SS', water_ice: 'WI', dust_wind: 'DW' };
const DIM_META = {
  terrain: 'contour', thermal: 'thermo', geology: 'strata',
  subsurface: 'layers', water_ice: 'crystal', dust_wind: 'wind',
};
const FALLBACK_DIMS = [
  { key: 'terrain', label: 'Terrain', core: true },
  { key: 'thermal', label: 'Thermal', core: true },
  { key: 'geology', label: 'Geology', core: true },
  { key: 'subsurface', label: 'Subsurface', core: true },
  { key: 'water_ice', label: 'Water/ice', core: false },
  { key: 'dust_wind', label: 'Dust/wind', core: false },
];

const state = {
  dims: FALLBACK_DIMS,
  sites: [],
  meta: null,
  manifest: null,
  live: false,
  dim: 'terrain',
  body: 'all',
  confidence: 'all',
  direction: 'desc',
  selectedSiteId: null,
};

function makeSegments(host, dims, { excludeOptional = false, onChange } = {}) {
  const list = excludeOptional ? dims.filter((d) => d.core) : dims;
  host.setAttribute('role', 'group');
  host.replaceChildren(...list.map((d) =>
    h('button', {
      class: 'va-segment', type: 'button', 'data-dim': d.key,
      'aria-pressed': String(state.dim === d.key),
      title: `${d.label} · ${CODES[d.key] || d.key}`,
      onclick: () => onChange(d.key),
    }, [
      h('span', { class: 'va-segment__code', text: CODES[d.key] || '··' }),
      d.label,
    ])));
}
function syncSegments() {
  document.querySelectorAll('.va-segment[data-dim]').forEach((btn) =>
    btn.setAttribute('aria-pressed', String(btn.dataset.dim === state.dim)));
  const label = state.dims.find((d) => d.key === state.dim)?.label ?? state.dim;
  const t = $('legend-title');
  if (t) t.textContent = `${label} match`;
}
function setDim(key) {
  if (!state.dims.some((d) => d.key === key)) return;
  state.dim = key;
  syncSegments();
  renderEverything();
}

function renderDimensionShowcase() {
  const onChange = (k) => setDim(k);
  makeSegments($('dim-segments'), state.dims, { excludeOptional: true, onChange });

  $('dim-key').replaceChildren(...state.dims.map((d) =>
    h('div', { class: 'va-dim-key__item', 'data-dim': d.key }, [
      h('span', { class: 'va-dim-key__swatch' }),
      h('span', { class: 'va-dim-key__code', text: CODES[d.key] || '··' }),
      h('span', { text: d.label }),
      h('span', { class: 'va-dim-key__core', text: d.core ? 'core' : 'optional' }),
    ])));

  $('dim-chips').replaceChildren(...state.dims.map((d) =>
    h('span', { class: 'va-chip', 'data-dim': d.key }, [
      h('span', { class: 'va-chip__code', text: CODES[d.key] || '··' }),
      d.label,
    ])));
}

/* --------------------------------------------------------- score readouts */
function renderScoreDemo() {
  // Deliberately shows a measured 0.00 next to two omitted optional dimensions.
  const rows = [
    ['terrain', 0], ['thermal', 0.4685], ['geology', 0.9187], ['subsurface', 0.8667],
    ['water_ice', null], ['dust_wind', null],
  ];
  $('score-list').replaceChildren(...rows.map(([key, value]) => {
    const label = state.dims.find((d) => d.key === key)?.label ?? key;
    const missing = value === null;
    return h('div', {
      class: `va-score-row${missing ? ' va-score-row--missing' : ''}`,
      'data-dim': key,
    }, [
      h('span', { class: 'va-score-row__label' }, [
        h('span', { class: 'va-score-row__code', text: CODES[key] || '··' }),
        label,
      ]),
      h('span', { class: 'va-score-row__track' }, [
        h('span', {
          class: 'va-score-row__fill',
          'data-value': missing ? '' : String(value),
          style: missing ? '' : `width:${Math.max(value * 100, 0.6)}%`,
        }),
      ]),
      h('span', { class: 'va-score-row__value' }, [
        missing
          ? h('span', { class: 'va-score--missing', text: 'not scored' })
          : h('span', { class: `va-score${value === 0 ? ' va-score--zero' : ''}`, text: value.toFixed(2) }),
      ]),
    ]);
  }));
}

function meter(level) {
  const bars = { high: 3, medium: 2, low: 1 }[level];
  return h('span', { class: `va-meter va-meter--${level}` }, [
    h('span', { class: 'va-meter__bars', 'aria-hidden': 'true' },
      [1, 2, 3].map((i) => h('span', { class: `va-meter__bar${i <= bars ? ' is-on' : ''}` }))),
    h('span', { class: 'va-meter__label', text: `${level} confidence` }),
  ]);
}
$('meters')?.replaceChildren(meter('high'), meter('medium'), meter('low'));

/* ------------------------------------------------------------ radar chart */
let radarUid = 0;
function renderRadar(scores = {}, size = 240) {
  const dims = state.dims.filter((d) => typeof scores[d.key] === 'number' && Number.isFinite(scores[d.key]));
  const missingCore = state.dims.filter((d) => d.core && typeof scores[d.key] !== 'number');
  if (missingCore.length) {
    return h('p', { class: 'radar-error', text: 'Scores unavailable for this site.' });
  }
  const uid = `radar-${++radarUid}`;
  const c = size / 2, R = size * 0.32, n = dims.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const summary = dims.map((d) => `${d.label} ${scores[d.key].toFixed(2)}`).join(', ');
  const svg = s('svg', {
    viewBox: `0 0 ${size} ${size}`, role: 'img', class: 'radar',
    'aria-labelledby': `${uid}-title ${uid}-desc`,
  });
  svg.append(
    s('title', { id: `${uid}-title` }, 'Per-dimension match scores'),
    s('desc', { id: `${uid}-desc` }, `${summary}. Scores range 0 to 1 and are separate properties, not an overall grade.`),
  );
  for (const ring of [0.25, 0.5, 0.75, 1]) {
    svg.append(s('polygon', {
      points: dims.map((_, i) => pt(i, R * ring).join(',')).join(' '), class: 'radar-ring',
    }));
  }
  dims.forEach((d, i) => {
    const [x, y] = pt(i, R);
    svg.append(s('line', { x1: c, y1: c, x2: x, y2: y, class: 'radar-axis' }));
    const [lx, ly] = pt(i, R + 24);
    svg.append(s('text', {
      x: lx, y: ly, class: 'radar-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle',
    }, `${CODES[d.key]} ${scores[d.key].toFixed(2)}`));
  });
  svg.append(s('polygon', {
    points: dims.map((d, i) => pt(i, R * scores[d.key]).join(',')).join(' '), class: 'radar-shape',
  }));
  return svg;
}

/* -------------------------------------------------------------- site card */
function section(title, content) {
  return h('section', { class: 'card-section' }, [h('h3', { text: title }), content]);
}
function list(items = [], cls = '') {
  return h('ul', { class: cls || undefined }, items.map((t) => h('li', { text: t })));
}
function renderSiteCard(site) {
  if (!site) {
    return h('p', { class: 'va-empty' }, [
      h('span', { class: 'va-empty__title', text: 'No site selected' }),
      'Select a site in the table or on the map to see its card.',
    ]);
  }
  const bodyLabel = site.target_body === 'moon' ? 'Moon' : 'Mars';
  return h('article', { class: 'site-card' }, [
    h('header', { class: 'card-head' }, [
      h('h2', { text: site.name }),
      h('span', { class: `badge badge-${site.target_body}` }, [
        h('span', { class: 'va-badge__glyph', text: bodyLabel[0] }), ` vs ${bodyLabel}`,
      ]),
      h('span', { class: `badge conf-${site.confidence}`, text: `Confidence: ${site.confidence}` }),
      h('span', { class: 'va-spacer' }),
      meter(site.confidence),
    ]),
    renderRadar(site.dimension_scores),
    h('div', { class: 'va-radar-disclaimer', text: 'Axes are separate properties. The polygon area is not an overall grade. Scores range 0–1 per dimension.' }),
    section('Strengths', list(site.strengths)),
    section('Where the analogy breaks down', list(site.breakdowns)),
    section('Use this site to test', list(site.exploration_uses)),
    section('Data sources', list(site.data_sources, 'va-source-list')),
  ]);
}

/* ------------------------------------------------------------ ranked table */
const BODY_LABEL = { moon: 'Moon', mars: 'Mars' };
const valid = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;

function visibleSites() {
  return state.sites.filter((site) =>
    (state.body === 'all' || site.target_body === state.body) &&
    (state.confidence === 'all' || site.confidence === state.confidence));
}
function rankedSites() {
  const rows = visibleSites().slice();
  return rows.sort((a, b) => {
    const av = a.dimension_scores?.[state.dim];
    const bv = b.dimension_scores?.[state.dim];
    if (!valid(av) && !valid(bv)) return 0;
    if (!valid(av)) return 1;   // not scored always sorts last
    if (!valid(bv)) return -1;
    return state.direction === 'desc' ? bv - av : av - bv;
  });
}
function tableColumns() {
  const cols = state.dims.filter((d) => d.core).map((d) => d.key);
  state.dims.filter((d) => !d.core).forEach((d) => {
    if (state.sites.some((site) => valid(site.dimension_scores?.[d.key]))) cols.push(d.key);
  });
  return cols;
}
function makeFilter(label, value, options, onchange) {
  const sel = h('select', { onchange: (e) => onchange(e.target.value) },
    options.map(([v, text]) => h('option', { value: v, text })));
  sel.value = value;
  return h('label', { class: 'filter' }, [h('span', { text: label }), sel]);
}
function renderTable(host) {
  const rows = rankedSites();
  const cols = tableColumns();
  const dimLabel = state.dims.find((d) => d.key === state.dim)?.label ?? state.dim;
  const status = h('p', { class: 'ranked-status', 'aria-live': 'polite' },
    `Showing ${rows.length} of ${state.sites.length} sites, ranked by ${dimLabel} (${state.direction === 'desc' ? 'high to low' : 'low to high'}). Dimensions are ranked one at a time, not combined.`);

  const controls = h('div', { class: 'ranked-controls' }, [
    makeFilter('Target', state.body, [['all', 'All'], ['moon', 'Moon'], ['mars', 'Mars']],
      (v) => { state.body = v; renderEverything(); }),
    makeFilter('Confidence', state.confidence,
      [['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']],
      (v) => { state.confidence = v; renderEverything(); }),
    makeFilter('Rank by', state.dim, state.dims.map((d) => [d.key, d.label]),
      (v) => setDim(v)),
    h('button', {
      class: 'dir-toggle', type: 'button',
      text: state.direction === 'desc' ? 'Highest first' : 'Lowest first',
      onclick: () => { state.direction = state.direction === 'desc' ? 'asc' : 'desc'; renderEverything(); },
    }),
  ]);

  if (!rows.length) {
    host.replaceChildren(h('section', { class: 'ranked' }, [
      controls, status,
      h('p', { class: 'ranked-empty', text: 'No sites match these filters. Try setting Target or Confidence to All.' }),
    ]));
    return;
  }

  const thead = h('thead');
  const hr = h('tr');
  ['#', 'Site', 'Target'].forEach((t) => hr.append(h('th', { scope: 'col', text: t })));
  cols.forEach((key) => {
    const th = h('th', {
      scope: 'col', class: key === state.dim ? 'is-ranked' : null,
      text: state.dims.find((d) => d.key === key)?.label ?? key,
    });
    if (key === state.dim) th.setAttribute('aria-sort', state.direction === 'desc' ? 'descending' : 'ascending');
    hr.append(th);
  });
  ['Confidence', 'Actions'].forEach((t) => hr.append(h('th', { scope: 'col', text: t })));
  thead.append(hr);

  const tbody = h('tbody');
  rows.forEach((site, i) => {
    const tr = h('tr', {
      'aria-selected': String(site.site_id === state.selectedSiteId),
    });
    tr.append(
      h('td', { class: 'rank', text: String(i + 1) }),
      h('th', { class: 'site-name', scope: 'row', text: site.name }),
      h('td', { text: BODY_LABEL[site.target_body] ?? site.target_body }),
    );
    cols.forEach((key) => {
      const v = site.dimension_scores?.[key];
      tr.append(h('td', {
        class: `score${key === state.dim ? ' is-ranked' : ''}${valid(v) ? '' : ' not-scored'}`,
        text: valid(v) ? v.toFixed(2) : 'not scored',
      }));
    });
    tr.append(h('td', { class: `conf-${site.confidence}`, text: site.confidence }));
    tr.append(h('td', { class: 'actions' }, [
      h('button', {
        type: 'button', text: 'Open card', 'aria-label': `Open card: ${site.name}`,
        onclick: () => { state.selectedSiteId = site.site_id; renderEverything(); },
      }),
    ]));
    tbody.append(tr);
  });

  const table = h('table', { class: 'ranked-table' }, [
    h('caption', { class: 'sr-only', text: `Sites ranked by ${dimLabel}` }), thead, tbody,
  ]);
  host.replaceChildren(h('section', { class: 'ranked' }, [
    controls, status,
    h('div', { class: 'ranked-table-wrap' }, [table]),
  ]));
}

/* ------------------------------------------------------------- provenance */
function metaRow(label, value) {
  return h('div', {}, [h('dt', { text: label }), h('dd', { text: String(value ?? '—') })]);
}
function renderMetaStrip() {
  const { manifest, meta } = state;
  const q = manifest?.quality ?? {};
  $('meta-strip').replaceChildren(
    metaRow('Run ID', manifest?.run_id),
    metaRow('Generated (UTC)', String(manifest?.generated_at ?? '').replace('T', ' ').replace('+00:00', 'Z')),
    metaRow('Schema version', meta?.schema_version ?? manifest?.schema_version),
    metaRow('Common scale', meta?.common_scale_km != null ? `${meta.common_scale_km} km` : null),
    metaRow('Score range', meta?.score_range ? `${meta.score_range[0]} – ${meta.score_range[1]}` : null),
    metaRow('Published / quarantined', `${q.published ?? 0} / ${q.quarantined ?? 0}`),
    metaRow('Quality errors / warnings', `${q.errors ?? 0} / ${q.warnings ?? 0}`),
    metaRow('Data file', manifest?.data_file),
  );
}
function renderDatasetStrip() {
  const { manifest, meta } = state;
  const q = manifest?.quality ?? {};
  $('dataset-strip').replaceChildren(
    h('div', {}, [h('dt', { text: 'Dataset' }), h('dd', { text: `run ${manifest?.run_id ?? '—'}` })]),
    h('div', {}, [h('dt', { text: 'Generated' }), h('dd', { text: String(manifest?.generated_at ?? '—').slice(0, 16).replace('T', ' ') + ' UTC' })]),
    h('div', {}, [h('dt', { text: 'Quality gate' }), h('dd', { text: `${q.errors ?? 0} errors · ${q.warnings ?? 0} warnings · ${q.published ?? 0} published` })]),
    h('div', {}, [h('dt', { text: 'Common scale' }), h('dd', { text: meta?.common_scale_km != null ? `${meta.common_scale_km} km` : 'not set' })]),
    h('div', {}, [h('dt', { text: 'Rule' }), h('dd', { text: 'No overall score · dimensions separate' })]),
  );
}

/* ------------------------------------------------------------- legend */
function legend() {
  const label = state.dims.find((d) => d.key === state.dim)?.label ?? state.dim;
  return h('div', { class: 'va-legend' }, [
    h('div', { class: 'legend-title', text: `${label} match` }),
    h('div', { class: 'legend-ramp va-ramp', 'aria-hidden': 'true' }),
    h('div', { class: 'legend-scale' }, [h('span', { text: '0 (far)' }), h('span', { text: '1 (close)' })]),
    h('div', { class: 'legend-row' }, [
      h('span', { class: 'swatch va-ramp__swatch--not-scored' }), 'Not scored',
    ]),
    h('div', { class: 'legend-row' }, [h('span', { class: 'ring ring--moon' }), 'Moon target']),
    h('div', { class: 'legend-row' }, [h('span', { class: 'ring ring--mars' }), 'Mars target']),
    h('p', { class: 'legend-note', text: 'Each map view shows one dimension. There is no overall score.' }),
  ]);
}

/* ------------------------------------------------------------- workspace */
function bodyToggle() {
  const opts = [['all', 'All'], ['moon', 'Moon'], ['mars', 'Mars']];
  $('body-toggle').replaceChildren(...opts.map(([key, label]) =>
    h('button', {
      class: 'va-segment', type: 'button', 'aria-pressed': String(state.body === key), text: label,
      onclick: () => { state.body = key; renderEverything(); },
    })));
}
function renderEverything() {
  const selected = state.sites.find((site) => site.site_id === state.selectedSiteId) ?? null;
  $('selection-label').textContent = selected ? selected.name : 'none';
  $('card-slot').replaceChildren(renderSiteCard(selected ?? state.sites[0]));
  renderTable($('table-slot'));
  renderTable($('workspace-table'));
  $('workspace-card').replaceChildren(renderSiteCard(selected));
  $('workspace-legend').replaceChildren(legend());
  makeSegments($('workspace-dims'), state.dims, { excludeOptional: true, onChange: setDim });
  bodyToggle();
  syncSegments();
}

/* ------------------------------------------------------------------- data */
const FALLBACK_MANIFEST = {
  data_file: 'sites.9f9dcd6e.json', generated_at: '2026-11-14T13:38:06+00:00',
  run_id: '40f3f658fd7a', schema_version: '1',
  quality: { errors: 0, warnings: 0, published: 4, quarantined: 0 },
};
const FALLBACK_META = {
  schema_version: '1', common_scale_km: 4.0, score_range: [0, 1],
  dimensions: FALLBACK_DIMS,
  note: 'Dimensions are separate properties. No blended similarity score exists.',
};
const FALLBACK_SITES = [
  { site_id: 'atacama_desert', name: 'Atacama Desert', coordinates: [-69.25, -24.5], target_body: 'mars', confidence: 'low',
    dimension_scores: { terrain: 0.9896, thermal: 0.4685, geology: 0.75, subsurface: 0.8667 },
    strengths: ['Hyper-arid surface with very low organic load'],
    breakdowns: ['Earth atmosphere and humidity are unlike Mars'],
    exploration_uses: ['Use this site to test rover dust mitigation'],
    data_sources: ['MGS MOLA MEGDR (megt44n000hb)', 'demo_earth_catalog', 'demo_earth_dem', 'demo_target_catalog'] },
  { site_id: 'devon_island', name: 'Devon Island', coordinates: [-89.7, 75.4], target_body: 'mars', confidence: 'low',
    dimension_scores: { terrain: 0.9692, thermal: 0.5778, geology: 0.6562, subsurface: 0.7333 },
    strengths: ['Cold, dry polar desert with impact-derived terrain'],
    breakdowns: ['Seasonal liquid water has no Martian equivalent'],
    exploration_uses: ['Use this site to test field habitat operations'],
    data_sources: ['MGS MOLA MEGDR (megt44n000hb)', 'demo_earth_catalog', 'demo_earth_dem', 'demo_target_catalog'] },
  { site_id: 'antarctic_dry_valleys', name: 'Antarctic Dry Valleys', coordinates: [162.0, -77.5], target_body: 'moon', confidence: 'low',
    dimension_scores: { terrain: 0.5958, thermal: 0.4704, geology: 0.9187, subsurface: 0.6667 },
    strengths: ['Extremely dry, cold ground with minimal weathering'],
    breakdowns: ['Permanently shadowed cold traps cannot be reproduced'],
    exploration_uses: ['Use this site to test subsurface sampling'],
    data_sources: ['LRO LOLA GDRDSM (ldsm_75s_240m)', 'demo_earth_catalog', 'demo_earth_dem', 'demo_target_catalog'] },
  { site_id: 'iceland_lava_fields', name: 'Iceland Lava Fields', coordinates: [-19.0, 64.9], target_body: 'moon', confidence: 'low',
    dimension_scores: { terrain: 0.5842, thermal: 0.4, geology: 0.9688, subsurface: 0.8667 },
    strengths: ['Basaltic terrain with young lava morphologies'],
    breakdowns: ['Vacuum, low gravity and radiation cannot be replicated'],
    exploration_uses: ['Use this site to test traverse planning on rough lava'],
    data_sources: ['LRO LOLA GDRDSM (ldsm_75s_240m)', 'demo_earth_catalog', 'demo_earth_dem', 'demo_target_catalog'] },
];

async function loadData() {
  const base = '../public/data';
  try {
    const res = await fetch(`${base}/manifest.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
    const manifest = await res.json();
    if (manifest.quality?.errors) throw new Error('published dataset failed its quality gate');
    const [meta, sites] = await Promise.all([
      fetch(`${base}/meta.json`).then((r) => r.json()),
      fetch(`${base}/${manifest.data_file || 'sites.json'}`).then((r) => r.json()),
    ]);
    if (!Array.isArray(sites)) throw new Error('site data is not an array');
    return { manifest, meta, sites, live: true };
  } catch (err) {
    console.info('[gallery] live dataset unavailable, using embedded copy:', err.message);
    return { manifest: FALLBACK_MANIFEST, meta: FALLBACK_META, sites: FALLBACK_SITES, live: false };
  }
}

/* -------------------------------------------------------------------- boot */
try {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  if (localStorage.getItem(CONTRAST_KEY) === 'high') root.dataset.contrast = 'high';
  const themeBtn = $('theme-toggle');
  themeBtn.querySelector('use').setAttribute('href', root.dataset.theme === 'dark' ? '#i-sun' : '#i-moon');
  themeBtn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  $('contrast-toggle').setAttribute('aria-pressed', String(root.dataset.contrast === 'high'));
} catch { /* file:// — dark default is correct */ }

renderSwatches();
renderScales();
renderScoreDemo();
renderMetaStrip(); // replaced with real values below

/* Side-nav active state */
const navLinks = [...document.querySelectorAll('.ds-sidenav a')];
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });
document.querySelectorAll('.ds-section').forEach((sec) => observer.observe(sec));

loadData().then((data) => {
  state.manifest = data.manifest;
  state.meta = data.meta;
  state.sites = data.sites;
  state.live = data.live;
  state.dims = (data.meta?.dimensions?.length ? data.meta.dimensions : FALLBACK_DIMS)
    .map((d) => ({ key: d.key, label: d.label, core: Boolean(d.core) }));
  state.selectedSiteId = state.sites[0]?.site_id ?? null;

  $('data-status').textContent = data.live
    ? '· live dataset loaded from public/data/'
    : '· offline view using embedded copy of the same dataset';
  $('data-status').style.color = data.live ? 'var(--status-success)' : 'var(--status-warn)';

  renderSwatches();
  renderDimensionShowcase();
  renderMetaStrip();
  renderDatasetStrip();
  renderScoreDemo();
  renderEverything();
});

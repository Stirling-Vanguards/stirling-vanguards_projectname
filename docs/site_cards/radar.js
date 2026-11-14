// Radar chart as plain SVG. Draws only valid scores; never draws missing as 0.
const NS = 'http://www.w3.org/2000/svg';
const CORE = ['terrain', 'thermal', 'geology', 'subsurface'];
const OPTIONAL = ['water_ice', 'dust_wind']; // drawn only when a valid number
const LABELS = {
  terrain: 'Terrain', thermal: 'Thermal', geology: 'Geology',
  subsurface: 'Subsurface', water_ice: 'Water/ice', dust_wind: 'Dust/wind',
};
const valid = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;

function s(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderRadar(scores = {}, { size = 260 } = {}) {
  const dims = [...CORE, ...OPTIONAL.filter((d) => valid(scores[d]))];
  const missingCore = CORE.filter((d) => !valid(scores[d]));
  if (missingCore.length) {
    console.error('Radar: invalid core scores', missingCore, scores);
    const p = document.createElement('p');
    p.className = 'radar-error';
    p.textContent = 'Scores unavailable for this site.';
    return p;
  }

  const c = size / 2, R = size * 0.34, n = dims.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const summary = dims.map((d) => `${LABELS[d]} ${scores[d].toFixed(2)}`).join(', ');

  const root = s('svg', {
    viewBox: `0 0 ${size} ${size}`, role: 'img', class: 'radar',
    'aria-labelledby': 'radar-title radar-desc',
  });
  root.append(
    s('title', { id: 'radar-title' }, 'Per-dimension match scores'),
    s('desc', { id: 'radar-desc' }, `${summary}. Scores range 0 to 1 and are separate properties, not an overall grade.`),
  );

  for (const ring of [0.25, 0.5, 0.75, 1]) {
    const points = dims.map((_, i) => pt(i, R * ring).join(',')).join(' ');
    root.append(s('polygon', { points, class: 'radar-ring' }));
  }
  dims.forEach((d, i) => {
    const [x, y] = pt(i, R);
    root.append(s('line', { x1: c, y1: c, x2: x, y2: y, class: 'radar-axis' }));
    const [lx, ly] = pt(i, R + 22);
    root.append(s('text', { x: lx, y: ly, class: 'radar-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' },
      `${LABELS[d]} ${scores[d].toFixed(2)}`));
  });
  const shape = dims.map((d, i) => pt(i, R * scores[d]).join(',')).join(' ');
  root.append(s('polygon', { points: shape, class: 'radar-shape' }));
  return root;
}

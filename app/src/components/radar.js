/**
 * Radar as plain SVG. Draws only valid scores; never draws missing as 0.
 *
 * The audited file had a stray top-level block (lines 20-27) referencing
 * undefined `size`/`uid`/`summary`. It threw at module evaluation and stopped
 * siteCard.js -> main.js from ever mounting. That block is gone.
 *
 * The polygon AREA is not an overall grade: renderSiteCard always adds a
 * disclaimer next to this chart.
 */
import { getState } from '../state.js';
import { s, h, validScore, code } from '../dom.js';

let radarUid = 0;

export function renderRadar(scores = {}, { size = 240 } = {}) {
  const dimensions = getState().dimensions;
  const dims = dimensions.filter((d) => validScore(scores[d.key]));
  const missingCore = dimensions.filter((d) => d.core && !validScore(scores[d.key]));

  if (missingCore.length || dims.length < 3) {
    console.error('[radar] invalid core scores', missingCore, scores);
    return h('p', { class: 'radar-error', text: 'Scores unavailable for this site.' });
  }

  const uid = `radar-${++radarUid}`;
  const c = size / 2;
  const R = size * 0.32;
  const n = dims.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const summary = dims.map((d) => `${d.label} ${scores[d.key].toFixed(2)}`).join(', ');

  const root = s('svg', {
    viewBox: `0 0 ${size} ${size}`,
    role: 'img',
    class: 'radar',
    'aria-labelledby': `${uid}-title ${uid}-desc`,
  });
  root.append(
    s('title', { id: `${uid}-title` }, 'Per-dimension match scores'),
    s('desc', { id: `${uid}-desc` },
      `${summary}. Scores range 0 to 1 and are separate properties, not an overall grade.`),
  );

  for (const ring of [0.25, 0.5, 0.75, 1]) {
    root.append(s('polygon', {
      points: dims.map((_, i) => pt(i, R * ring).join(',')).join(' '),
      class: 'radar-ring',
    }));
  }

  dims.forEach((d, i) => {
    const [x, y] = pt(i, R);
    root.append(s('line', { x1: c, y1: c, x2: x, y2: y, class: 'radar-axis' }));
    const [lx, ly] = pt(i, R + 24);
    root.append(s('text', {
      x: lx, y: ly, class: 'radar-label',
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
    }, `${code(d.key)} ${scores[d.key].toFixed(2)}`));
  });

  root.append(s('polygon', {
    points: dims.map((d, i) => pt(i, R * scores[d.key]).join(',')).join(' '),
    class: 'radar-shape',
  }));
  return root;
}

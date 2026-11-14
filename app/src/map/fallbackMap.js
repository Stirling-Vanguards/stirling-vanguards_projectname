/**
 * Dependency-free SVG map used when WebGL / MapLibre is unavailable.
 * Equirectangular projection, Natural Earth land outlines, clickable markers.
 * It reads the SAME state and the SAME score ramp as the MapLibre map, so the
 * product never goes dark just because a graphics context failed.
 */
import { getState, getScore, getVisibleSites, setState, subscribe } from '../state.js';
import { cssVar } from '../design/tokens.js';
import { WORLD_LAND } from '../data/worldLand.js';
import { s, h, fmtScore, dimLabel, BODY_LABEL } from '../dom.js';

const W = 720, H = 360;
const project = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

function hexToRgb(str) {
  const m = String(str).trim().match(/#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [113, 132, 155];
}
function rampColor(v) {
  const stops = [0, 1, 2, 3, 4].map((i) => hexToRgb(cssVar(`--ramp-${i}`, '#21918c')));
  const t = Math.max(0, Math.min(1, v)) * 4;
  const i = Math.min(3, Math.floor(t));
  const f = t - i;
  const c = stops[i].map((n, k) => Math.round(n + (stops[i + 1][k] - n) * f));
  return `rgb(${c.join(',')})`;
}
function multiPath(coords) {
  return coords.map((ring) => ring.map(([lon, lat], i) => {
    const [x, y] = project([lon, lat]);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z').join(' ');
}

export function mountFallbackMap(host) {
  const wrap = h('div', { class: 'va-fallback-map' });
  const svg = s('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img', class: 'va-fallback-map__svg',
    'aria-label': 'Simplified world map of Earth analog sites',
  });
  const land = s('g', { class: 'va-fallback-map__land' });
  const grid = s('g', { class: 'va-fallback-map__grid' });
  const marks = s('g', { class: 'va-fallback-map__marks' });

  for (let lon = -150; lon <= 150; lon += 30) {
    const [x] = project([lon, 0]);
    grid.append(s('line', { x1: x, y1: 0, x2: x, y2: H }));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project([0, lat]);
    grid.append(s('line', { x1: 0, y1: y, x2: W, y2: y }));
  }

  svg.append(grid, land, marks);
  wrap.append(svg, h('p', {
    class: 'va-fallback-map__note',
    text: 'Atlas view · all published sites on an equirectangular grid. Click a marker to select it. Use “Interactive globe” to pan and zoom.',
  }));
  host.replaceChildren(wrap);

  // Land outlines are inlined, so the offline map needs no network at all.
  (WORLD_LAND.features ?? []).forEach((f) => {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    polys.forEach((poly) => land.append(s('path', { d: multiPath(poly) })));
  });

  function drawMarkers() {
    const st = getState();
    const dim = st.selectedDimension;
    const notScored = cssVar('--not-scored', '#71849b');
    const bodies = {
      moon: cssVar('--body-moon', '#b9cfe8'),
      mars: cssVar('--body-mars', '#e2824f'),
    };
    marks.replaceChildren(...getVisibleSites().map((site) => {
      const [x, y] = project(site.coordinates);
      const score = getScore(site, dim);
      const selected = site.site_id === st.selectedSiteId;
      const label = dimLabel(dim);
      const g = s('g', {
        class: 'va-fallback-map__mark',
        tabindex: '0', role: 'button',
        'aria-label': `${site.name}, ${BODY_LABEL[site.target_body]}, ${label} ${fmtScore(score)}`,
      });
      const select = () => setState({ selectedSiteId: site.site_id });
      g.addEventListener('click', select);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
      });
      g.append(s('title', {}, `${site.name} · ${label}: ${fmtScore(score)}`));
      if (selected) {
        g.append(s('circle', { cx: x, cy: y, r: 13, class: 'va-fallback-map__select' }));
      }
      g.append(s('circle', {
        cx: x, cy: y, r: 7,
        fill: score === null ? 'transparent' : rampColor(score),
        stroke: score === null ? notScored : bodies[site.target_body] ?? notScored,
        'stroke-width': 3,
        'stroke-dasharray': site.target_body === 'mars' ? '3 2' : null,
      }));
      if (score === null) {
        g.append(s('circle', { cx: x, cy: y, r: 2, fill: notScored }));
      }
      return g;
    }));
  }

  drawMarkers();
  const unsub = subscribe((st, patch) => {
    if ('sites' in patch || 'filters' in patch || 'selectedDimension' in patch ||
        'selectedSiteId' in patch || 'meta' in patch) drawMarkers();
  });
  // Remove the SVG too, so switching to the globe leaves no stale focusable markers.
  return () => { unsub(); wrap.remove(); };
}

/**
 * Interactive target-body map (Moon / Mars). Dependency-free SVG, same
 * approach as fallbackMap.js, so it needs no WebGL and no network.
 *
 * Honest by construction: no verified surface basemap is bundled for these
 * bodies, so this draws a coordinate grid only. The marker comes from
 * TARGETS[body].marker and is labelled illustrative/unverified. Earth analog
 * sites are NOT plotted here (they live on Earth); the atlas page shows them.
 *
 * Controls: drag to pan, wheel / +/- to zoom, arrows to pan, 0 to reset.
 * Moon also offers a south-polar view, the natural frame for a polar target.
 */
import { s, h } from '../dom.js';
import { TARGETS } from '../data/targets.js';

const EQ = { w: 720, h: 360 };
const POLAR = { w: 400, h: 400, R: 180, span: 30 }; // lat -90 .. -60
const MAX_K = 16;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hemi = (v, pos, neg) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;

const GEO = {
  global: {
    dims: EQ,
    project: ([lon, lat]) => [((lon + 180) / 360) * EQ.w, ((90 - lat) / 180) * EQ.h],
    unproject: (x, y) => (x < 0 || y < 0 || x > EQ.w || y > EQ.h ? null : [(x / EQ.w) * 360 - 180, 90 - (y / EQ.h) * 180]),
  },
  polar: {
    dims: POLAR,
    project: ([lon, lat]) => {
      const r = clamp(((lat + 90) / POLAR.span) * POLAR.R, 0, POLAR.R), a = (lon * Math.PI) / 180;
      return [POLAR.w / 2 + r * Math.sin(a), POLAR.h / 2 - r * Math.cos(a)];
    },
    unproject: (x, y) => {
      const dx = x - POLAR.w / 2, dy = y - POLAR.h / 2, r = Math.hypot(dx, dy);
      if (r > POLAR.R) return null;
      return [(Math.atan2(dx, -dy) * 180) / Math.PI, -90 + (r / POLAR.R) * POLAR.span];
    },
  },
};

export function mountBodyMap(host, body) {
  const target = TARGETS[body];
  const marker = target?.marker;
  if (!host || !target || !marker) return () => {};

  const modes = body === 'moon' ? ['polar', 'global'] : ['global'];
  const MODE_LABEL = { polar: 'South polar view', global: 'Global view' };
  let mode = modes[0];
  let view = { cx: 0, cy: 0, k: 1 };
  let drag = null;

  const svg = s('svg', {
    class: 'va-bodymap__svg', role: 'application', tabindex: '0',
    'aria-label': `Interactive ${body === 'moon' ? 'lunar' : 'Martian'} coordinate map. Drag to pan, scroll or plus and minus to zoom, arrow keys to pan, zero to reset.`,
  });
  const readout = h('p', { class: 'va-bodymap__readout va-mono', text: 'Hover the map for coordinates' });
  const info = h('p', { class: 'va-bodymap__info' });
  const modeBtn = h('button', { class: 'va-btn va-btn--sm', type: 'button', 'aria-pressed': 'false' });
  const btn = (text, label, fn) => h('button', { class: 'va-btn va-btn--sm', type: 'button', text, 'aria-label': label, onclick: fn });

  const geo = () => GEO[mode];
  const toSvg = (e) => {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  };

  function apply() {
    const { dims } = geo();
    const w = dims.w / view.k, hh = dims.h / view.k;
    view.cx = clamp(view.cx, w / 2, dims.w - w / 2);
    view.cy = clamp(view.cy, hh / 2, dims.h - hh / 2);
    svg.setAttribute('viewBox', `${view.cx - w / 2} ${view.cy - hh / 2} ${w} ${hh}`);
    svg.querySelectorAll('[data-fixed]').forEach((n) => {
      const [x, y] = n.dataset.at.split(',');
      n.setAttribute('transform', `translate(${x} ${y}) scale(${1 / view.k})`);
    });
    svg.dataset.zoom = view.k.toFixed(2);
  }

  function zoomAround(factor, e) {
    const before = e ? toSvg(e) : null;
    view.k = clamp(view.k * factor, 1, MAX_K);
    apply();
    if (before) {
      const after = toSvg(e);
      view.cx += before[0] - after[0];
      view.cy += before[1] - after[1];
      apply();
    }
  }

  function reset() {
    const { dims } = geo();
    view = { cx: dims.w / 2, cy: dims.h / 2, k: 1 };
    apply();
  }

  function pan(dx, dy) {
    const { dims } = geo();
    view.cx += (dx * dims.w) / view.k;
    view.cy += (dy * dims.h) / view.k;
    apply();
  }

  function drawScene() {
    const { dims, project } = geo();
    svg.replaceChildren();
    const grid = s('g', { class: 'va-bodymap__grid' });
    const labels = s('g', { class: 'va-bodymap__labels' });
    const lab = (txt, x, y, extra = {}) => labels.append(
      s('text', { x: 0, y: 0, 'data-fixed': '1', 'data-at': `${x},${y}`, class: 'va-bodymap__label', ...extra }, txt));

    if (mode === 'polar') {
      const c = [dims.w / 2, dims.h / 2];
      svg.append(s('circle', { cx: c[0], cy: c[1], r: dims.R, class: 'va-bodymap__bg' }));
      [-90, -85, -80, -70, -60].forEach((lat) => {
        if (lat === -90) return;
        const r = ((lat + 90) / dims.span) * dims.R;
        grid.append(s('circle', { cx: c[0], cy: c[1], r, class: lat === -60 ? 'is-edge' : '' }));
        lab(`${Math.abs(lat)}°S`, c[0] + 3, c[1] - r - 3, { 'text-anchor': 'start' });
      });
      for (let lon = -180; lon < 180; lon += 30) {
        const [x, y] = project([lon, -60]);
        grid.append(s('line', { x1: c[0], y1: c[1], x2: x, y2: y, class: lon === 0 ? 'is-axis' : '' }));
        const a = (lon * Math.PI) / 180, r2 = dims.R + 12;
        lab(`${Math.abs(lon)}°${lon === 0 || lon === -180 ? '' : lon > 0 ? 'E' : 'W'}`,
          c[0] + r2 * Math.sin(a), c[1] - r2 * Math.cos(a) + 3, { 'text-anchor': 'middle' });
      }
    } else {
      svg.append(s('rect', { x: 0, y: 0, width: dims.w, height: dims.h, class: 'va-bodymap__bg' }));
      for (let lon = -150; lon <= 150; lon += 30) {
        const [x] = project([lon, 0]);
        grid.append(s('line', { x1: x, y1: 0, x2: x, y2: dims.h, class: lon === 0 ? 'is-axis' : '' }));
        lab(`${Math.abs(lon)}°${lon === 0 ? '' : lon > 0 ? 'E' : 'W'}`, x + 3, dims.h - 5, { 'text-anchor': 'start' });
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const [, y] = project([0, lat]);
        grid.append(s('line', { x1: 0, y1: y, x2: dims.w, y2: y, class: lat === 0 ? 'is-axis' : '' }));
        lab(`${Math.abs(lat)}°${lat === 0 ? '' : lat > 0 ? 'N' : 'S'}`, 4, y - 3, { 'text-anchor': 'start' });
      }
    }

    const [mx, my] = project([marker.lon, marker.lat]);
    const mk = s('g', {
      class: 'va-bodymap__marker', 'data-fixed': '1', 'data-at': `${mx},${my}`,
      tabindex: '0', role: 'img', 'aria-label': `${marker.label}. ${marker.note}`,
    });
    mk.append(
      s('title', {}, `${marker.label} · ${marker.note}`),
      s('circle', { r: 11, class: `va-bodymap__ring va-bodymap__ring--${body}` }),
      s('circle', { r: 2.6, class: 'va-bodymap__dot' }),
      s('text', { x: 16, y: 4, class: 'va-bodymap__marker-label' }, marker.label),
    );
    svg.append(grid, labels, mk);

    info.replaceChildren(
      h('strong', { text: marker.label }),
      ` · ${hemi(marker.lon, 'E', 'W')}, ${hemi(marker.lat, 'N', 'S')} · `,
      marker.note,
    );
    modeBtn.textContent = mode === 'polar' ? 'Global view' : 'South polar view';
    modeBtn.setAttribute('aria-pressed', String(mode === 'polar'));
    reset();
  }

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAround(e.deltaY < 0 ? 1.2 : 1 / 1.2, e);
  }, { passive: false });
  svg.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    svg.setPointerCapture?.(e.pointerId);
    svg.classList.add('is-dragging');
  });
  svg.addEventListener('pointermove', (e) => {
    if (drag) {
      const m = svg.getScreenCTM();
      if (m) {
        view.cx -= (e.clientX - drag.x) / m.a;
        view.cy -= (e.clientY - drag.y) / m.d;
        drag = { x: e.clientX, y: e.clientY };
        apply();
      }
      return;
    }
    const [x, y] = toSvg(e);
    const ll = geo().unproject(x, y);
    readout.textContent = ll ? `Cursor ${hemi(ll[0], 'E', 'W')}, ${hemi(ll[1], 'N', 'S')}` : 'Cursor outside the mapped area';
  });
  const endDrag = () => { drag = null; svg.classList.remove('is-dragging'); };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', () => { if (!drag) readout.textContent = 'Hover the map for coordinates'; });
  svg.addEventListener('keydown', (e) => {
    const step = 0.08;
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) { e.preventDefault(); pan(...map[e.key]); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAround(1.4); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAround(1 / 1.4); }
    else if (e.key === '0') { e.preventDefault(); reset(); }
  });

  modeBtn.addEventListener('click', () => { mode = mode === 'polar' ? 'global' : 'polar'; drawScene(); });

  const toolbar = h('div', { class: 'va-bodymap__toolbar', role: 'toolbar', 'aria-label': 'Map controls' }, [
    btn('+', 'Zoom in', () => zoomAround(1.4)),
    btn('−', 'Zoom out', () => zoomAround(1 / 1.4)),
    btn('Reset', 'Reset view', reset),
    modes.length > 1 ? modeBtn : null,
  ]);

  const wrap = h('figure', { class: 'va-bodymap', 'data-body': body }, [
    h('div', { class: 'va-bodymap__stage' }, [svg]),
    h('div', { class: 'va-bodymap__bar' }, [toolbar, readout]),
    info,
    h('figcaption', { class: 'va-note', text: `${target.name} map · coordinate grid only. No verified surface basemap is bundled for this body yet, and the marker is an illustrative placement, not the verified target location. Earth analog sites are plotted on the Earth atlas.` }),
  ]);
  host.replaceChildren(wrap);
  drawScene();

  return () => wrap.remove();
}

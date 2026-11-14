/** Tiny DOM + formatting helpers shared by every component. */
import { getDimensionLabel } from './state.js';

/** 2-letter codes are a non-colour channel for dimension identity. */
export const DIM_CODES = {
  terrain: 'TR', thermal: 'TH', geology: 'GE',
  subsurface: 'SS', water_ice: 'WI', dust_wind: 'DW',
};

export function h(tag, attrs = {}, children = []) {
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
export function s(tag, attrs = {}, text) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    n.setAttribute(k, String(v));
  }
  if (text !== undefined) n.textContent = text;
  return n;
}

export const BODY_LABEL = { moon: 'Moon', mars: 'Mars' };
export const validScore = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
export const fmtScore = (v) => (validScore(v) ? v.toFixed(2) : 'not scored');
export const dimLabel = (key) => getDimensionLabel(key) ?? key;
export const code = (key) => DIM_CODES[key] ?? '··';

/** Confidence = colour + 3-bar meter + text. Colour is never the only channel. */
export function confidenceMeter(level) {
  const bars = { high: 3, medium: 2, low: 1 }[level] ?? 0;
  return h('span', { class: `va-meter va-meter--${level}` }, [
    h('span', { class: 'va-meter__bars', 'aria-hidden': 'true' },
      [1, 2, 3].map((i) => h('span', { class: `va-meter__bar${i <= bars ? ' is-on' : ''}` }))),
    h('span', { class: 'va-meter__label', text: `${level} confidence` }),
  ]);
}

export function badge(body, confidence) {
  const label = BODY_LABEL[body] ?? body;
  return h('span', { class: 'card-head__badges' }, [
    h('span', { class: `badge badge-${body}` }, [
      h('span', { class: 'va-badge__glyph', text: label[0] }), ` vs ${label}`,
    ]),
    h('span', { class: `badge conf-${confidence}`, text: `Confidence: ${confidence}` }),
    confidenceMeter(confidence),
  ]);
}

export function list(items = [], cls = '') {
  return h('ul', { class: cls || null }, (items ?? []).map((t) => h('li', { text: t })));
}

export function cardSection(title, content) {
  return h('section', { class: 'card-section' }, [h('h3', { text: title }), content]);
}

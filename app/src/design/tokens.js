/**
 * Vanguard Atlas — design token runtime bridge
 * ---------------------------------------------------------------------------
 * Why this file exists:
 * The audited app hard-coded map colours in JS (`#440154`, `#1f2937`,
 * `#2563eb`, ...). That split the design system in two and made theming
 * impossible. MapLibre paint expressions need literal colour strings, so they
 * cannot use a CSS custom property directly — but they CAN read the resolved value
 * from the document at runtime. This module is the single seam between
 * tokens.css and the map.
 *
 * Usage (app/src/map/map.js):
 *   import { mapPaint, cssVar, subscribeTheme } from '../design/tokens.js';
 *   'circle-color': mapPaint.scoreColor()
 *   'circle-stroke-color': mapPaint.bodyColor()
 *   subscribeTheme(() => applyPaint(map));   // re-apply after a theme switch
 *
 * No build step, no dependencies, no network.
 */

let cache = null;
const themeListeners = new Set();

/** Resolve one custom property to its computed string value. */
export function cssVar(name, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Resolve several tokens at once. Results are cached per theme. */
export function getTokens() {
  const theme = document.documentElement.dataset.theme || 'dark';
  const contrast = document.documentElement.dataset.contrast || 'normal';
  const key = `${theme}:${contrast}`;
  if (cache && cache.key === key) return cache.value;

  const value = {
    theme,
    accent: cssVar('--accent'),
    accentStrong: cssVar('--focus'),
    onAccent: cssVar('--on-accent'),
    notScored: cssVar('--not-scored'),
    ramp: [
      cssVar('--ramp-0'), cssVar('--ramp-1'), cssVar('--ramp-2'),
      cssVar('--ramp-3'), cssVar('--ramp-4'),
    ],
    bodies: {
      moon: cssVar('--body-moon'),
      mars: cssVar('--body-mars'),
    },
    dimensions: {
      terrain: cssVar('--dim-terrain'),
      thermal: cssVar('--dim-thermal'),
      geology: cssVar('--dim-geology'),
      subsurface: cssVar('--dim-subsurface'),
      water_ice: cssVar('--dim-water_ice'),
      dust_wind: cssVar('--dim-dust_wind'),
    },
    panel: cssVar('--bg-glass'),
    border: cssVar('--border-default'),
  };
  cache = { key, value };
  return value;
}

/** MapLibre paint expressions, built from resolved tokens. */
export const mapPaint = {
  /**
   * One shared sequential ramp for the ACTIVE dimension.
   * A feature without a `score` property is "not scored" (omitted, never 0).
   */
  scoreColor() {
    const t = getTokens();
    return [
      'case',
      ['has', 'score'],
      ['interpolate', ['linear'], ['get', 'score'],
        0,    t.ramp[0],
        0.25, t.ramp[1],
        0.5,  t.ramp[2],
        0.75, t.ramp[3],
        1,    t.ramp[4],
      ],
      t.notScored,
    ];
  },
  /** Target body is carried by RING + glyph as well as colour. */
  bodyColor() {
    const t = getTokens();
    return ['match', ['get', 'target_body'],
      'moon', t.bodies.moon,
      'mars', t.bodies.mars,
      t.notScored,
    ];
  },
  selectionRing() {
    return getTokens().accentStrong;
  },
  basemapBackground() {
    return cssVar('--c-space-850', '#060a14');
  },
};

/** Clear the cache. Call after any runtime token override. */
export function invalidateTokens() {
  cache = null;
}

/**
 * Fires when `data-theme` or `data-contrast` changes on <html>.
 * Returns an unsubscribe function.
 */
export function subscribeTheme(fn) {
  themeListeners.add(fn);
  return () => themeListeners.delete(fn);
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    if (!mutations.some((m) => m.attributeName === 'data-theme' || m.attributeName === 'data-contrast')) return;
    invalidateTokens();
    themeListeners.forEach((fn) => {
      try { fn(getTokens()); } catch (err) { console.error('[tokens] theme listener failed', err); }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });
}

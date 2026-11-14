/**
 * Map mounting — progressive enhancement.
 *
 * DEFAULT: the dependency-free SVG atlas. It always shows every published site,
 * needs no WebGL and no network, and is fully keyboard accessible.
 * OPT-IN:  the vendored MapLibre GL map for pan/zoom, enabled by the
 *          "Interactive globe" button in the page topbar.
 *
 * This is the fix for the audited app's worst failure mode: data loading lived
 * inside map.js:init(), which only ran when `maplibregl` was defined, so a CDN
 * or WebGL failure killed the entire UI. Here data is already in state before
 * any map mounts, and a WebGL failure simply falls back to the atlas.
 *
 * All paint colours come from design/tokens.js — no hard-coded hex in JS.
 */
import { getState, getScore, getVisibleSites, setState, subscribe } from '../state.js';
import { mapPaint, cssVar, subscribeTheme } from '../design/tokens.js';
import { h, dimLabel, BODY_LABEL } from '../dom.js';
import { WORLD_LAND } from '../data/worldLand.js';
import { mountFallbackMap } from './fallbackMap.js';

function graticule() {
  const features = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[lon, -85], [lon, 85]] } });
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] } });
  }
  return { type: 'FeatureCollection', features };
}

function toGeoJSON() {
  const dim = getState().selectedDimension;
  return {
    type: 'FeatureCollection',
    features: getVisibleSites().map((site) => {
      const score = getScore(site, dim);
      const properties = {
        site_id: site.site_id,
        name: site.name,
        target_body: site.target_body,
        confidence: site.confidence || 'unknown',
      };
      if (score !== null) properties.score = score;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: site.coordinates },
        properties,
      };
    }),
  };
}

function makeStyle() {
  return {
    version: 8,
    sources: {
      graticule: { type: 'geojson', data: graticule() },
      land: { type: 'geojson', data: WORLD_LAND },
      sites: { type: 'geojson', data: toGeoJSON() },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': cssVar('--c-space-850', '#060a14') } },
      { id: 'grid', type: 'line', source: 'graticule',
        paint: { 'line-color': cssVar('--c-space-650', '#1e2e48'), 'line-width': 0.6 } },
      { id: 'land-fill', type: 'fill', source: 'land',
        paint: { 'fill-color': cssVar('--c-space-750', '#101a2c'), 'fill-opacity': 0.92 } },
      { id: 'land-outline', type: 'line', source: 'land',
        paint: { 'line-color': cssVar('--c-space-650', '#1e2e48'), 'line-width': 0.8 } },
      { id: 'sites-selected', type: 'circle', source: 'sites',
        filter: ['==', ['get', 'site_id'], ''],
        paint: {
          'circle-radius': 15,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': mapPaint.selectionRing(),
        } },
      { id: 'sites-circles', type: 'circle', source: 'sites',
        paint: {
          'circle-radius': 9,
          'circle-color': mapPaint.scoreColor(),
          'circle-stroke-width': 3,
          'circle-stroke-color': mapPaint.bodyColor(),
          'circle-stroke-opacity': 0.95,
        } },
    ],
  };
}

/** Returns a disposer, or null when WebGL is unavailable (caller falls back). */
function mountWebGLMap(host, containerId) {
  const gl = window.maplibregl;
  if (!gl || typeof gl.Map !== 'function' || (typeof gl.supported === 'function' && !gl.supported())) {
    console.info('[map] WebGL unavailable — staying on the SVG atlas');
    return null;
  }

  let map;
  try {
    map = new gl.Map({
      container: containerId,
      style: makeStyle(),
      center: [0, 20],
      zoom: 1.2,
      renderWorldCopies: false,
      attributionControl: true,
    });
  } catch (err) {
    console.warn('[map] MapLibre init failed — staying on the SVG atlas', err);
    return null;
  }

  map.addControl(new gl.NavigationControl({ showCompass: false }), 'top-right');
  const popup = new gl.Popup({ closeButton: false, closeOnClick: false, offset: 14 });

  function popupNode(feature) {
    const dim = getState().selectedDimension;
    const scoreText = feature.properties.score === undefined
      ? 'not scored'
      : Number(feature.properties.score).toFixed(2);
    return h('div', { class: 'va-map-popup' }, [
      h('strong', { text: feature.properties.name }),
      h('span', { text: `${BODY_LABEL[feature.properties.target_body] ?? feature.properties.target_body} · ${dimLabel(dim)}: ${scoreText}` }),
    ]);
  }

  function applyPaint() {
    if (map.getLayer('sites-circles')) {
      map.setPaintProperty('sites-circles', 'circle-color', mapPaint.scoreColor());
      map.setPaintProperty('sites-circles', 'circle-stroke-color', mapPaint.bodyColor());
    }
    if (map.getLayer('sites-selected')) {
      map.setPaintProperty('sites-selected', 'circle-stroke-color', mapPaint.selectionRing());
    }
    if (map.getLayer('bg')) {
      map.setPaintProperty('bg', 'background-color', cssVar('--c-space-850', '#060a14'));
    }
  }
  function refreshData() {
    const src = map.getSource('sites');
    if (src) src.setData(toGeoJSON());
  }
  function refreshSelection() {
    if (map.getLayer('sites-selected')) {
      map.setFilter('sites-selected', ['==', ['get', 'site_id'], getState().selectedSiteId ?? '']);
    }
  }
  const onLocate = (e) => {
    if (e.detail?.site) map.easeTo({ center: e.detail.site.coordinates, zoom: Math.max(map.getZoom(), 3) });
  };

  map.on('load', () => {
    map.on('mousemove', 'sites-circles', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features?.[0];
      if (!f) return;
      popup.setLngLat(f.geometry.coordinates).setDOMContent(popupNode(f)).addTo(map);
    });
    map.on('mouseleave', 'sites-circles', () => { map.getCanvas().style.cursor = ''; popup.remove(); });
    map.on('click', 'sites-circles', (e) => {
      const id = e.features?.[0]?.properties?.site_id;
      if (id) setState({ selectedSiteId: id });
    });
    refreshSelection();
    applyPaint();
  });
  map.on('error', (e) => console.warn('[map]', e?.error?.message ?? e));

  const unsubState = subscribe((st, patch) => {
    if ('sites' in patch || 'filters' in patch || 'selectedDimension' in patch) refreshData();
    if ('selectedSiteId' in patch) refreshSelection();
  });
  const unsubTheme = subscribeTheme(applyPaint);
  window.addEventListener('va:locate', onLocate);

  return () => {
    unsubState(); unsubTheme();
    window.removeEventListener('va:locate', onLocate);
    popup.remove();
    try { map.remove(); } catch { /* already gone */ }
  };
}

/**
 * Mounts the default SVG atlas and wires the optional globe toggle.
 */
export function mountMap(containerId = 'map') {
  const host = document.getElementById(containerId);
  const button = document.getElementById('map-mode');
  if (!host) return;

  let dispose = null;
  // Deep link: explore.html?view=globe opens the MapLibre map directly.
  const initialMode = new URLSearchParams(location.search).get('view') === 'globe' ? 'webgl' : 'atlas';
  let mode = initialMode;

  function setMode(next) {
    if (dispose) { dispose(); dispose = null; }
    mode = next;
    if (button) {
      button.setAttribute('aria-pressed', String(mode === 'webgl'));
      button.textContent = mode === 'webgl' ? 'Atlas view' : 'Interactive globe';
    }
    if (mode === 'webgl') {
      const webglDispose = mountWebGLMap(host, containerId);
      if (webglDispose) { dispose = webglDispose; return; }
      mode = 'atlas';
      if (button) {
        button.setAttribute('aria-pressed', 'false');
        button.textContent = 'Interactive globe';
      }
    }
    dispose = mountFallbackMap(host);
  }

  button?.addEventListener('click', () => setMode(mode === 'webgl' ? 'atlas' : 'webgl'));
  setMode(initialMode);
}

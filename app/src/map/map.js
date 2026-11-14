// app/src/map/map.js  (Kurt)
// MapLibre GL JS map: one marker per site, colored by ONE selected dimension.
// Coordinates are [lon, lat], which is the order MapLibre expects.

import { DIMENSIONS, getScore, getState, getVisibleSites, setState, subscribe } from '../state.js';

// Relative to app/index.html (the page), not to this file.
// Swap to the real processed data once Rex freezes the contract.
const DATA_URL = 'public/mock_sites.json';

// Basemap tiles are a live network request. For the demo, decide with Vince/Rex:
// keep online tiles, or set false to use a plain offline background.
const USE_ONLINE_TILES = true;

const NOT_SCORED_COLOR = '#9aa0a6';
const BODY_COLORS = { moon: '#1f2937', mars: '#c2410c' };

// ---------- data ----------

function isValidSite(s) {
  return (
    s &&
    typeof s.site_id === 'string' &&
    Array.isArray(s.coordinates) &&
    s.coordinates.length === 2 &&
    s.coordinates.every((n) => typeof n === 'number') &&
    (s.target_body === 'moon' || s.target_body === 'mars')
  );
}

async function loadSites() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load ${DATA_URL} (HTTP ${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Site data must be a JSON array.');
  const valid = data.filter(isValidSite);
  if (valid.length !== data.length) {
    console.warn(`Skipped ${data.length - valid.length} invalid site record(s).`);
  }
  return valid;
}

// Build GeoJSON for the active dimension. "score" is omitted when not scored, never set to 0.
function toGeoJSON(sites, dimension) {
  return {
    type: 'FeatureCollection',
    features: sites.map((s) => {
      const score = getScore(s, dimension);
      const properties = {
        site_id: s.site_id,
        name: s.name,
        target_body: s.target_body,
        confidence: s.confidence || 'unknown',
      };
      if (score !== null) properties.score = score;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.coordinates },
        properties,
      };
    }),
  };
}

// ---------- map ----------

function makeStyle() {
  const style = {
    version: 8,
    sources: {},
    layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#dfe6ea' } }],
  };
  if (USE_ONLINE_TILES) {
    style.sources.osm = {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    };
    style.layers.push({ id: 'osm', type: 'raster', source: 'osm' });
  }
  return style;
}

function showError(message) {
  const el = document.getElementById('map-status');
  if (el) {
    el.textContent = message;
    el.hidden = false;
  }
}

function renderLegend() {
  const el = document.getElementById('map-legend');
  if (!el) return;
  el.innerHTML = `
    <div class="legend-title" id="legend-title"></div>
    <div class="legend-ramp" aria-hidden="true"></div>
    <div class="legend-scale"><span>0 (far)</span><span>1 (close)</span></div>
    <div class="legend-row"><span class="swatch" style="background:${NOT_SCORED_COLOR}"></span>Not scored</div>
    <div class="legend-row"><span class="ring" style="border-color:${BODY_COLORS.moon}"></span>Moon target</div>
    <div class="legend-row"><span class="ring" style="border-color:${BODY_COLORS.mars}"></span>Mars target</div>
    <div class="legend-note">Each map view shows one dimension. There is no overall score.</div>`;
}

function renderToggle() {
  const el = document.getElementById('dimension-toggle');
  if (!el) return;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Dimension shown on the map');
  el.innerHTML = '';
  DIMENSIONS.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.dimension = key;
    btn.textContent = label;
    btn.addEventListener('click', () => setState({ selectedDimension: key }));
    el.appendChild(btn);
  });
}

function syncToggle(dimension) {
  document.querySelectorAll('#dimension-toggle button').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.dimension === dimension));
  });
  const title = document.getElementById('legend-title');
  const label = DIMENSIONS.find((d) => d.key === dimension)?.label ?? dimension;
  if (title) title.textContent = `${label} match`;
}

function init() {
  renderLegend();
  renderToggle();

  const map = new maplibregl.Map({
    container: 'map',
    style: makeStyle(),
    center: [30, 25],
    zoom: 1.4,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

  function refreshData() {
    const { selectedDimension } = getState();
    const src = map.getSource('sites');
    if (src) src.setData(toGeoJSON(getVisibleSites(), selectedDimension));
  }

  function refreshSelection() {
    const { selectedSiteId } = getState();
    if (!map.getLayer('sites-selected')) return;
    map.setFilter('sites-selected', ['==', ['get', 'site_id'], selectedSiteId ?? '']);
  }

  // Load site data right away. The table and card must not wait for basemap tiles.
  loadSites()
    .then((sites) => setState({ sites }))
    .catch((err) => {
      console.error(err);
      showError(`Site data failed to load: ${err.message}`);
    });

  // 'style.load' fires when the style is ready, without waiting for tiles (works offline).
  map.on('style.load', () => {
    map.addSource('sites', { type: 'geojson', data: toGeoJSON(getVisibleSites(), getState().selectedDimension) });

    map.addLayer({
      id: 'sites-circles',
      type: 'circle',
      source: 'sites',
      paint: {
        'circle-radius': 9,
        'circle-color': [
          'case',
          ['has', 'score'],
          ['interpolate', ['linear'], ['get', 'score'], 0, '#440154', 0.5, '#21918c', 1, '#fde725'],
          NOT_SCORED_COLOR,
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': [
          'match', ['get', 'target_body'],
          'moon', BODY_COLORS.moon,
          'mars', BODY_COLORS.mars,
          '#000000',
        ],
      },
    });

    // Highlight ring for the selected site
    map.addLayer({
      id: 'sites-selected',
      type: 'circle',
      source: 'sites',
      filter: ['==', ['get', 'site_id'], ''],
      paint: {
        'circle-radius': 15,
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#2563eb',
      },
    });

    map.on('mousemove', 'sites-circles', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features[0];
      const dim = getState().selectedDimension;
      const label = DIMENSIONS.find((d) => d.key === dim)?.label ?? dim;
      const scoreText = f.properties.score === undefined ? 'not scored' : Number(f.properties.score).toFixed(2);
      popup
        .setLngLat(f.geometry.coordinates)
        .setHTML(`<strong></strong><br>${label}: ${scoreText}`)
        .addTo(map);
      popup.getElement().querySelector('strong').textContent = f.properties.name; // textContent avoids HTML injection
    });
    map.on('mouseleave', 'sites-circles', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
    map.on('click', 'sites-circles', (e) => {
      setState({ selectedSiteId: e.features[0].properties.site_id });
    });

    syncToggle(getState().selectedDimension);
    refreshSelection();
  });

  // React to state changes from anywhere (map toggle, Ely's table/filters, Vince's view).
  subscribe((state, patch) => {
    if ('selectedDimension' in patch) syncToggle(state.selectedDimension);
    if ('selectedDimension' in patch || 'filters' in patch || 'sites' in patch) refreshData();
    if ('selectedSiteId' in patch) {
      refreshSelection();
      const site = state.sites.find((s) => s.site_id === state.selectedSiteId);
      if (site) map.easeTo({ center: site.coordinates, zoom: Math.max(map.getZoom(), 3) });
    }
  });

  syncToggle(getState().selectedDimension);
}

if (typeof maplibregl === 'undefined') {
  showError('MapLibre failed to load. Check your connection or the script URL in index.html.');
} else {
  init();
}

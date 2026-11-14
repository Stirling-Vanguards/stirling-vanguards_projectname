/**
 * Shared page chrome + bootstrap. Every page calls bootSite() before mounting
 * anything, so a map/WebGL failure can never leave the rest of the UI empty.
 */
import { loadSiteData, hasDemoSources } from './data/bootstrap.js';
import { getState, setState } from './state.js';
import { h } from './dom.js';

const THEME_KEY = 'va-theme';
const root = document.documentElement;

function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch { /* file:// */ }

  const btn = document.getElementById('theme-toggle');
  const sync = () => {
    if (!btn) return;
    const dark = root.dataset.theme !== 'light';
    btn.textContent = dark ? 'Light mode' : 'Dark mode';
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  btn?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch { /* file:// */ }
    sync();
  });
  sync();
}

function initNav() {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.va-nav a').forEach((a) => {
    const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
    if (href === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-year]').forEach((n) => { n.textContent = String(new Date().getFullYear()); });
}

/** A single, honest, global banner for data-transport / quality problems. */
export function showStatus(text, kind = 'warn') {
  const host = document.querySelector('[data-global-status]');
  if (!host) return;
  host.replaceChildren(h('div', { class: `va-alert va-alert--${kind}`, role: 'status' }, [
    h('span', { class: 'va-alert__icon', text: kind === 'danger' ? '×' : '!' }),
    h('span', { text }),
  ]));
}

export function clearStatus() {
  const host = document.querySelector('[data-global-status]');
  if (host) host.replaceChildren();
}

/** Render the manifest/meta provenance strip. Reads only sidecar files. */
export function renderDatasetStrip(host) {
  if (!host) return;
  const { manifest, meta } = getState();
  const q = manifest?.quality ?? {};
  const row = (label, value) => h('div', {}, [
    h('dt', { text: label }),
    h('dd', { text: String(value ?? '—') }),
  ]);
  host.replaceChildren(
    row('Dataset', `run ${manifest?.run_id ?? '—'}`),
    row('Generated', String(manifest?.generated_at ?? '—').slice(0, 16).replace('T', ' ') + ' UTC'),
    row('Quality gate', `${q.errors ?? 0} errors · ${q.warnings ?? 0} warnings · ${q.published ?? 0} published`),
    row('Common scale', meta?.common_scale_km != null ? `${meta.common_scale_km} km` : 'not set'),
    row('Rule', 'No overall score · dimensions separate'),
  );
}

/** Loads data into the shared store and returns the load result. */
export async function bootSite() {
  initTheme();
  initNav();

  try {
    const result = await loadSiteData();
    setState({
      sites: result.sites,
      meta: result.meta,
      manifest: result.manifest,
      dataStatus: { offline: result.offline, skipped: result.skipped, reason: result.reason },
    });
    const notes = [];
    if (result.sites.some(hasDemoSources)) {
      notes.push('Demo data: scores come from demo_* catalogs, not verified science data. Do not present as findings.');
    }
    if (result.offline) {
      notes.push('Live data endpoint unavailable — showing the offline snapshot of the published dataset.');
    } else if (result.skipped) {
      notes.push(`${result.skipped} invalid record(s) quarantined at the client boundary.`);
    }
    if (notes.length) showStatus(notes.join(' '), 'warn');
    return result;
  } catch (err) {
    console.error('[boot] data load failed', err);
    showStatus(`Site data failed to load: ${err.message}. The page shell remains available.`, 'danger');
    setState({
      sites: [], meta: null, manifest: null,
      dataStatus: { offline: true, skipped: 0, reason: err.message },
    });
    return { sites: [], meta: null, manifest: null, offline: true, skipped: 0, reason: err.message, fatal: true };
  }
}

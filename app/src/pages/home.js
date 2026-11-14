import { bootSite, renderDatasetStrip } from '../site.js';
import { getState } from '../state.js';
import { h } from '../dom.js';

async function main() {
  await bootSite();
  const st = getState();

  renderDatasetStrip(document.getElementById('home-strip'));

  const stats = [
    ['Published sites', String(st.sites.length)],
    ['Dimensions', String(st.dimensions.length)],
    ['Common scale', st.meta?.common_scale_km != null ? `${st.meta.common_scale_km} km` : '—'],
    ['Quality errors', String(st.manifest?.quality?.errors ?? '—')],
  ];
  document.getElementById('home-stats').replaceChildren(...stats.map(([label, value]) =>
    h('div', { class: 'va-stat' }, [
      h('dt', { text: label }),
      h('dd', { text: value }),
    ])));
}

main();

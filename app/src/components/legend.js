/** Map legend. One shared perceptual ramp; hue never identifies the dimension. */
import { getState, subscribe } from '../state.js';
import { h } from '../dom.js';

export function renderLegend() {
  const st = getState();
  const label = st.dimensions.find((d) => d.key === st.selectedDimension)?.label ?? st.selectedDimension ?? '—';
  return h('div', { class: 'va-legend' }, [
    h('div', { class: 'legend-title', text: `${label} match` }),
    h('div', { class: 'legend-ramp va-ramp', 'aria-hidden': 'true' }),
    h('div', { class: 'legend-scale' }, [
      h('span', { text: '0 (far)' }), h('span', { text: '1 (close)' }),
    ]),
    h('div', { class: 'legend-row' }, [
      h('span', { class: 'swatch va-ramp__swatch--not-scored' }), 'Not scored',
    ]),
    h('div', { class: 'legend-row' }, [h('span', { class: 'ring ring--moon' }), 'Moon target']),
    h('div', { class: 'legend-row' }, [h('span', { class: 'ring ring--mars' }), 'Mars target']),
    h('p', { class: 'legend-note', text: 'Each map view shows one dimension. There is no overall score.' }),
  ]);
}

export function mountLegend(host) {
  if (!host) return () => {};
  const draw = () => host.replaceChildren(renderLegend());
  draw();
  return subscribe((st, patch) => {
    if ('selectedDimension' in patch || 'meta' in patch || 'sites' in patch) draw();
  });
}

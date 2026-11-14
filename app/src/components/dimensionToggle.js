/**
 * The product's primary control: exactly ONE active dimension.
 * There is deliberately no "All" / "Overall" segment.
 */
import { getState, setState, subscribe } from '../state.js';
import { h, code } from '../dom.js';

export function mountDimensionToggle(host, { coreOnly = true, id = null } = {}) {
  if (!host) return () => {};
  host.setAttribute('role', 'group');
  host.setAttribute('aria-label', 'Dimension shown');
  if (id) host.id = id;

  function draw() {
    const st = getState();
    const dims = coreOnly ? st.dimensions.filter((d) => d.core) : st.dimensions;
    host.replaceChildren(...dims.map((d) => h('button', {
      class: 'va-segment',
      type: 'button',
      'data-dim': d.key,
      'aria-pressed': String(d.key === st.selectedDimension),
      title: `${d.label} · ${code(d.key)}`,
      onclick: () => setState({ selectedDimension: d.key }),
    }, [
      h('span', { class: 'va-segment__code', text: code(d.key) }),
      d.label,
    ])));
  }

  draw();
  return subscribe((st, patch) => {
    if ('meta' in patch || 'sites' in patch) { draw(); return; }
    if ('selectedDimension' in patch) {
      host.querySelectorAll('.va-segment[data-dim]').forEach((btn) =>
        btn.setAttribute('aria-pressed', String(btn.dataset.dim === st.selectedDimension)));
    }
  });
}

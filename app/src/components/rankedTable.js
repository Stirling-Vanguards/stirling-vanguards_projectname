/**
 * Ranked table — sorts by ONE selected dimension. No blended score anywhere.
 * Dimension keys/labels come from meta.json via state.dimensions.
 */
import { getState, setState, subscribe } from '../state.js';
import { h, fmtScore, validScore, BODY_LABEL } from '../dom.js';

/** Pure function. Missing/null scores always sort last. */
export function filterAndSort(sites, {
  body = 'all', confidence = 'all', dimension = 'terrain', direction = 'desc',
} = {}) {
  const rows = sites.filter((s) =>
    (body === 'all' || s.target_body === body) &&
    (confidence === 'all' || s.confidence === confidence));
  return rows.sort((a, b) => {
    const av = a.dimension_scores?.[dimension];
    const bv = b.dimension_scores?.[dimension];
    if (!validScore(av) && !validScore(bv)) return 0;
    if (!validScore(av)) return 1;
    if (!validScore(bv)) return -1;
    return direction === 'desc' ? bv - av : av - bv;
  });
}

function makeSelect(label, value, options, onChange) {
  const sel = h('select', { onchange: (e) => onChange(e.target.value) },
    options.map(([v, text]) => h('option', { value: v, text })));
  sel.value = value;
  return h('label', { class: 'filter' }, [h('span', { text: label }), sel]);
}

export function mountRankedTable(slot) {
  if (!slot) return () => {};

  function draw() {
    const st = getState();
    const dims = st.dimensions;
    const dimLabel = dims.find((d) => d.key === st.selectedDimension)?.label ?? st.selectedDimension ?? '—';
    const rows = filterAndSort(st.sites, {
      body: st.filters.targetBody,
      confidence: st.filters.confidence,
      dimension: st.selectedDimension,
      direction: st.direction,
    });

    const controls = h('div', { class: 'ranked-controls' }, [
      makeSelect('Target', st.filters.targetBody,
        [['all', 'All'], ['moon', 'Moon'], ['mars', 'Mars']],
        (v) => setState({ filters: { ...getState().filters, targetBody: v } })),
      makeSelect('Confidence', st.filters.confidence,
        [['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']],
        (v) => setState({ filters: { ...getState().filters, confidence: v } })),
      makeSelect('Rank by', st.selectedDimension, dims.map((d) => [d.key, d.label]),
        (v) => setState({ selectedDimension: v })),
      h('button', {
        class: 'dir-toggle', type: 'button',
        text: st.direction === 'desc' ? 'Highest first' : 'Lowest first',
        onclick: () => setState({ direction: getState().direction === 'desc' ? 'asc' : 'desc' }),
      }),
    ]);

    const status = h('p', { class: 'ranked-status', 'aria-live': 'polite' },
      `Showing ${rows.length} of ${st.sites.length} sites, ranked by ${dimLabel} (${st.direction === 'desc' ? 'high to low' : 'low to high'}). Dimensions are ranked one at a time, not combined.`);

    if (!rows.length) {
      slot.replaceChildren(h('section', { class: 'ranked' }, [
        controls, status,
        h('p', { class: 'ranked-empty', text: st.sites.length
          ? 'No sites match these filters. Try setting Target or Confidence to All.'
          : 'No site data loaded yet.' }),
      ]));
      return;
    }

    const hr = h('tr');
    ['#', 'Site', 'Target'].forEach((t) => hr.append(h('th', { scope: 'col', text: t })));
    dims.forEach((d) => {
      const th = h('th', {
        scope: 'col',
        class: d.key === st.selectedDimension ? 'is-ranked' : null,
        text: d.label,
      });
      if (d.key === st.selectedDimension) {
        th.setAttribute('aria-sort', st.direction === 'desc' ? 'descending' : 'ascending');
      }
      hr.append(th);
    });
    ['Confidence', 'Actions'].forEach((t) => hr.append(h('th', { scope: 'col', text: t })));

    const tbody = h('tbody');
    rows.forEach((site, i) => {
      const tr = h('tr', { 'aria-selected': String(site.site_id === st.selectedSiteId) });
      tr.append(
        h('td', { class: 'rank', text: String(i + 1) }),
        h('th', { class: 'site-name', scope: 'row', text: site.name }),
        h('td', { text: BODY_LABEL[site.target_body] ?? site.target_body }),
      );
      dims.forEach((d) => {
        const v = site.dimension_scores?.[d.key];
        const scored = validScore(v);
        tr.append(h('td', {
          class: `score${d.key === st.selectedDimension ? ' is-ranked' : ''}${scored ? '' : ' not-scored'}`,
          text: scored ? fmtScore(v) : 'not scored',
        }));
      });
      tr.append(h('td', { class: `conf-${site.confidence}`, text: site.confidence }));
      tr.append(h('td', { class: 'actions' }, [
        h('button', {
          type: 'button', text: 'Open card',
          'aria-label': `Open card: ${site.name}`,
          onclick: () => setState({ selectedSiteId: site.site_id }),
        }),
        h('button', {
          type: 'button', text: 'Locate',
          'aria-label': `Locate on map: ${site.name}`,
          onclick: () => {
            setState({ selectedSiteId: site.site_id });
            window.dispatchEvent(new CustomEvent('va:locate', { detail: { site } }));
          },
        }),
      ]));
      tbody.append(tr);
    });

    const table = h('table', { class: 'ranked-table' }, [
      h('caption', { class: 'sr-only', text: `Sites ranked by ${dimLabel}` }),
      h('thead', {}, [hr]),
      tbody,
    ]);
    slot.replaceChildren(h('section', { class: 'ranked' }, [
      controls, status,
      h('div', { class: 'ranked-table-wrap' }, [table]),
    ]));
  }

  draw();
  return subscribe((st, patch) => {
    if ('sites' in patch || 'meta' in patch || 'filters' in patch ||
        'selectedDimension' in patch || 'direction' in patch || 'selectedSiteId' in patch) draw();
  });
}

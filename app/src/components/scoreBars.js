/**
 * Per-dimension score bars. ONE bar per dimension, never an aggregate.
 * 0.00 is a visible measured "no match"; an omitted optional dimension is
 * "not scored" on a dashed track. Both states are always distinguishable.
 */
import { getState } from '../state.js';
import { h, validScore, fmtScore, code } from '../dom.js';

export function renderScoreBars(scores = {}, { includeOptional = true } = {}) {
  const dims = getState().dimensions.filter((d) => d.core || includeOptional);
  return h('div', { class: 'va-score-list' }, dims.map((d) => {
    const v = scores?.[d.key];
    const missing = !validScore(v);
    return h('div', {
      class: `va-score-row${missing ? ' va-score-row--missing' : ''}`,
      'data-dim': d.key,
    }, [
      h('span', { class: 'va-score-row__label' }, [
        h('span', { class: 'va-score-row__code', text: code(d.key) }),
        d.label,
      ]),
      h('span', { class: 'va-score-row__track' }, [
        h('span', {
          class: 'va-score-row__fill',
          'data-value': missing ? '' : String(v),
          style: missing ? '' : `width:${Math.max(v * 100, 0.6)}%`,
        }),
      ]),
      h('span', { class: 'va-score-row__value' }, [
        h('span', {
          class: missing ? 'va-score--missing' : `va-score${v === 0 ? ' va-score--zero' : ''}`,
          text: fmtScore(v),
        }),
      ]),
    ]);
  }));
}

export function renderScoreScale() {
  return h('div', { class: 'va-score-scale' }, [
    h('span', { text: '0.00 · no match' }),
    h('span', { text: '1.00 · close match' }),
  ]);
}

/**
 * Earth-vs-target comparison view (Vince's #comparison-slot, previously empty).
 *
 * Honest by construction: target measurements are `verified: false` in
 * pipeline/targets/targets.yaml and coordinates are null. We therefore show
 * the Earth site's per-dimension scores next to the *planned* target features,
 * never a fabricated target number and never a blended comparison score.
 */
import { getState, getSelectedSite, subscribe } from '../state.js';
import { renderScoreBars, renderScoreScale } from './scoreBars.js';
import { TARGETS } from '../data/targets.js';
import { h, code, dimLabel, BODY_LABEL } from '../dom.js';

export function renderComparison(site) {
  if (!site) {
    return h('div', { class: 'va-empty' }, [
      h('span', { class: 'va-empty__title', text: 'No comparison yet' }),
      'Select a site to compare its dimensions against the target profile.',
    ]);
  }

  const target = TARGETS[site.target_body] ?? null;
  const dims = getState().dimensions.filter((d) => d.core);

  const targetRows = dims.map((d) => h('div', { class: 'va-compare__row', 'data-dim': d.key }, [
    h('span', { class: 'va-compare__code', text: code(d.key) }),
    h('span', { class: 'va-compare__dim', text: d.label }),
    h('span', { class: 'va-compare__planned', text: (target?.planned?.[d.key] ?? []).join(' · ') || 'not defined' }),
  ]));

  return h('div', { class: 'va-compare' }, [
    h('div', { class: 'va-rule-flag', text: 'Dimensions are compared one at a time. This product has no overall similarity score.' }),

    h('h3', { class: 'va-compare__head', text: `Earth site · ${site.name}` }),
    renderScoreBars(site.dimension_scores, { includeOptional: true }),
    renderScoreScale(),

    h('h3', { class: 'va-compare__head', text: `Target · ${target?.name ?? BODY_LABEL[site.target_body]}` }),
    h('div', { class: 'va-alert va-alert--warn' }, [
      h('span', { class: 'va-alert__icon', text: '!' }),
      h('span', {}, [
        h('strong', { text: 'Target baseline pending verification. ' }),
        target?.note ?? 'No target measurements are published as fact.',
      ]),
    ]),
    h('p', { class: 'va-compare__note', text: 'Features planned for measurement (from the target profile), not measured values:' }),
    h('div', { class: 'va-compare__grid' }, targetRows),
    h('p', { class: 'va-compare__note', text: `Source: pipeline/targets/targets.yaml · ${target?.site_id ?? '—'} · verified: false` }),
  ]);
}

export function mountComparison(slot) {
  if (!slot) return () => {};
  const draw = () => slot.replaceChildren(renderComparison(getSelectedSite()));
  draw();
  return subscribe((st, patch) => {
    if ('sites' in patch || 'selectedSiteId' in patch || 'meta' in patch) draw();
  });
}

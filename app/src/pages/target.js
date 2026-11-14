import { bootSite, renderDatasetStrip } from '../site.js';
import { getState } from '../state.js';
import { TARGETS, limitsFor } from '../data/targets.js';
import { renderScoreBars, renderScoreScale } from '../components/scoreBars.js';
import { mountBodyMap } from '../map/bodyMap.js';
import { h, code, confidenceMeter, BODY_LABEL } from '../dom.js';

const $ = (id) => document.getElementById(id);

async function main() {
  const body = document.body.dataset.body;
  const target = TARGETS[body];
  if (!target) return;

  mountBodyMap($('body-map'), body);   // needs no data, so it works even if the data load fails
  await bootSite();
  const st = getState();
  const sites = st.sites.filter((s) => s.target_body === body);
  const coreDims = st.dimensions.filter((d) => d.core);

  $('target-intro').replaceChildren(
    h('h2', { text: `${BODY_LABEL[body]} target profile` }),
    h('p', { class: 'va-brand-copy', style: 'max-width:76ch;margin-top:var(--space-3)', text: target.summary }),
    h('div', { class: 'va-alert va-alert--warn', style: 'margin-top:var(--space-5)' }, [
      h('span', { class: 'va-alert__icon', text: '!' }),
      h('span', {}, [
        h('strong', { text: 'Unverified target profile. ' }),
        target.note,
      ]),
    ]),
  );

  $('analog-count').textContent = `${sites.length} site(s) · one dimension at a time, never combined`;

  $('target-sites').replaceChildren(...(sites.length ? sites.map((site) =>
    h('article', { class: 'va-target-card' }, [
      h('div', { class: 'va-target-card__head' }, [
        h('h3', { text: site.name }),
        h('span', { class: `badge badge-${body}`, text: `vs ${BODY_LABEL[body]}` }),
        confidenceMeter(site.confidence),
      ]),
      renderScoreBars(site.dimension_scores, { includeOptional: true }),
      renderScoreScale(),
      h('ul', {}, (site.strengths ?? []).map((t) => h('li', { text: t }))),
      h('div', { class: 'va-target-card__foot' }, [
        h('a', {
          class: 'va-btn va-btn--sm',
          href: `explore.html?site=${encodeURIComponent(site.site_id)}`,
          text: 'Open in atlas',
        }),
      ]),
    ])) : [h('div', { class: 'va-empty' }, [
      h('span', { class: 'va-empty__title', text: 'No analog sites published yet' }),
      'This target has no contract-valid records in the current dataset.',
    ])]));

  const limits = [
    ...target.breakdowns.map((text) => h('div', { class: 'va-limit' }, [
      h('strong', { text: 'Target constraint' }), text,
    ])),
    ...limitsFor(body).map((l) => h('div', { class: 'va-limit' }, [
      h('strong', { text: l.title }),
      `${l.consequence} `,
      h('span', { class: 'va-muted', text: `(${l.source})` }),
    ])),
  ];
  $('target-breakdowns').replaceChildren(...limits);

  $('target-planned').replaceChildren(
    ...coreDims.map((d) => h('div', { class: 'va-planned__row', 'data-dim': d.key }, [
      h('strong', { text: `${code(d.key)} · ${d.label}` }),
      h('span', { text: (target.planned?.[d.key] ?? []).join(' · ') || 'not defined' }),
    ])),
    h('p', {
      class: 'va-note',
      style: 'margin-top:var(--space-4)',
      text: `Datasets listed for this target: ${target.datasets.join(' · ')}. Source: pipeline/targets/targets.yaml (verified: false).`,
    }),
  );

  renderDatasetStrip($('target-strip'));
}

main();

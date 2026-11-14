/**
 * Curated target profiles and "what Earth can't replicate" copy.
 *
 * These are NOT contract fields and NOT published measurements. They are a
 * faithful transcription of pipeline/targets/targets.yaml (every profile has
 * `verified: false` and coordinates: null there) plus the limitations listed
 * in the repo README. The UI must label them as unverified, and nothing here
 * may be presented as a measured target value.
 */
export const TARGETS = {
  moon: {
    site_id: 'lunar_south_pole',
    name: 'Lunar South Polar Site',
    body: 'moon',
    verified: false,
    note: 'Target coordinates and measured feature values are not yet verified. No target measurements are published as fact.',
    marker: { lon: 0, lat: -90, label: 'South pole (reference point)', note: 'Illustrative: a reference point, not a chosen or verified landing site.' },
    summary: 'A permanently shadowed polar environment near the lunar south pole, proposed for a permanent surface base.',
    breakdowns: [
      'Permanently shadowed regions and cold traps have no real Earth equivalent',
      'Vacuum, low gravity and radiation cannot be replicated on Earth',
    ],
    planned: {
      terrain: ['slope median', 'slope p90', 'roughness', 'crater density'],
      thermal: ['temperature min / max', 'diurnal swing', 'seasonal variation'],
      geology: ['target lithology classes — citation pending'],
      subsurface: ['pit / lava tube types and scales — catalog pending'],
    },
    datasets: ['LRO LOLA GDRDSM (ldsm_75s_240m)', 'LRO Diviner (verify access)', 'Kaguya / Chandrayaan-1 M3 (verify access)'],
  },
  mars: {
    site_id: 'jezero_crater',
    name: 'Jezero Crater',
    body: 'mars',
    verified: false,
    note: 'Target coordinates and measured feature values are not yet verified. No target measurements are published as fact.',
    marker: { lon: 77.58, lat: 18.38, label: 'Jezero Crater (approx.)', note: 'Approximate placement, verify against a mission source before publishing. Not the verified target coordinates.' },
    summary: 'An ancient impact crater with a preserved river delta, the landing site for the Mars 2020 Perseverance rover.',
    breakdowns: [
      'Mars atmosphere is much thinner than Earth’s, so wind and dust behave differently',
      'Gravity and radiation environment cannot be replicated on Earth',
    ],
    planned: {
      terrain: ['slope median', 'slope p90', 'roughness', 'crater density'],
      thermal: ['temperature min / max', 'diurnal swing', 'seasonal variation'],
      geology: ['clays, carbonates, olivine — citation pending'],
      subsurface: ['pit / cave catalog — verify availability'],
    },
    datasets: ['MGS MOLA MEGDR (megt44n000hb)', 'THEMIS (verify access)', 'CRISM (verify access)'],
  },
};

/**
 * Earth limits. Curated copy (Venice's section), kept out of the frozen site
 * record. `bodies` says which target the limit applies to, so a Mars card never
 * shows a lunar-only limit. `source` stays "[source needed]" until Venice
 * supplies a verified reference; never show repo paths as citations.
 */
export const EARTH_LIMITS = [
  {
    title: 'Reduced gravity',
    bodies: ['moon', 'mars'],
    consequence: 'Earth cannot reproduce lunar or Martian gravity during long-duration field tests.',
    source: '[source needed]',
  },
  {
    title: 'Vacuum / thin atmosphere',
    bodies: ['moon', 'mars'],
    consequence: 'Pressure, atmospheric chemistry and humidity always differ from the target.',
    source: '[source needed]',
  },
  {
    title: 'Radiation environment',
    bodies: ['moon', 'mars'],
    consequence: 'Earth’s atmosphere and magnetic field change the surface radiation dose, so shielding behaviour cannot be tested as it would be on the target.',
    source: '[source needed]',
  },
  {
    title: 'Permanently shadowed cold traps',
    bodies: ['moon'],
    consequence: 'Lunar polar cold traps are airless and permanently shadowed; Earth’s seasonal polar night is not the same.',
    source: '[source needed]',
  },
];

/** Limits relevant to one target body ('moon' | 'mars'). */
export function limitsFor(body) {
  return EARTH_LIMITS.filter((l) => l.bodies.includes(body));
}

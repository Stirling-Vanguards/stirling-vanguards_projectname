# Vanguard Atlas — Orbital Design System

**Version** 1.0 · **Status** proposed for team ratification · **Date** 2026-11-14
**Scope** `data-platform/app/` · **Owner** UI design · **Source mockup** `STIRLING VANGUARDS.zip` → `_reference/design-mockup/1.png`, `2.png`, `3.png`

> **Living reference:** open `app/design-system/index.html` in a browser (or serve
> the folder with `python -m http.server`). It renders every foundation, component
> and state from the *real* production stylesheets, plus a working "product in
> context" preview driven by `app/public/data/*.json`.
>
> **Implementation status (2026-11-14):** the design system is now wired into a
> complete static site — `index.html` (brand home), `explore.html` (analog finder),
> `moon.html`, `mars.html` — using `src/styles/index.css` as the single stylesheet.
> The map uses the token bridge in `src/design/tokens.js`, `pages.css` was added
> for page composition, and MapLibre GL JS + Natural Earth land data are vendored
> locally. See `DESIGN_SYSTEM.md` §9 for the original migration map; the steps
> listed there are now applied in this `app/` tree.

---

## 1. What this is, and what it is not

The supplied mockups describe a **cinematic marketing/explore site**: full-bleed
planetary photography, a near-black starfield, a heavy geometric display face with
an outlined hero line, a vivid blue CTA, glowing image tiles, a minimal
masthead/footer. The application in this repository is a **dense scientific
instrument**: a MapLibre map, a ranked table, a site card and a radar.

A design system that only copies the mockup would leave the actual product
unstyled. A system that only solves the data UI would throw away the brand.
This system therefore defines **one brand, two surfaces**:

| | Brand surface | Instrument surface |
| --- | --- | --- |
| Where | landing / home, Moon, Mars, target pages | analog finder workspace |
| Background | starfield + planetary photography | flat `--bg-app`, panel hairlines |
| Type | `--font-display` heavy uppercase + wide-tracked light body | `--font-ui` compact + tabular `--font-mono` numerics |
| Effects | glow, text-shadow, outline type, image scrims | **none** — flat surfaces only |
| Motion | `--dur-4` 480ms cinematic reveals | `--dur-2` 160ms state changes |
| Rule | tell the story | keep numbers legible over a live basemap |

Both surfaces share the same tokens, the same blue accent and the same wordmark.

---

## 2. Non-negotiable principles

These encode the project's frozen data contract and its scientific rule. A
component that violates one is a defect, not a variation.

1. **Never blend dimensions.** Features may only be aggregated *within* one
   dimension. The system ships **no** "overall similarity" component, no average,
   no composite hero number, no star rating, no "All dimensions" segment.
   The radar polygon area is explicitly disclaimed as *not* an overall grade.
2. **`0.00` ≠ "not scored".** A measured zero is a valid "no match" and must be
   drawn (visible 2px bar stub, real `0.00` readout, `--ramp-0` marker). An
   omitted optional dimension renders as italic `not scored` on a dashed track,
   never as `0`, `–`, `N/A` or an absent cell.
3. **Colour is never the only channel.** Dimensions = hue + 2-letter code +
   swatch + label. Target bodies = hue + solid/dashed ring + monogram.
   Confidence = hue + 3-bar meter + text label.
4. **Brand glows; instruments do not.** Glow, starfields and outlined display
   type are confined to brand components. Data surfaces use flat panels and 1px
   hairlines so numbers stay readable against MapLibre tiles.
5. **Labels come from the contract's sidecars.** `meta.json` supplies dimension
   keys/labels, `manifest.json` supplies run/quality metadata. No hard-coded
   `DIMENSIONS` / `CORE` / `LABELS` arrays in JS. `docs/data_contract.*` stays
   frozen — all new metadata lives in sidecars.

---

## 3. Foundations

### 3.1 Colour

Sampled from the mockup's CTA gradient (`#034A86 → #1672D8 → #39B1FF`) and its
near-black space canvas. `:root` is **dark by default**. A `data-theme="light"`
variant inverts *instrument* surfaces only for accessibility and print; brand
surfaces (hero, starfield, image tiles) stay dark in both themes because the
photography is the brand. `data-contrast="high"` strengthens hairlines and muted
text without changing hue identity.

| Role | Token | Dark | Notes |
| --- | --- | --- | --- |
| App canvas | `--bg-app` | `#03050B` | flat; no starfield |
| Recessed strip | `--bg-sunken` | `#060A14` | dataset strip, callouts |
| Panel | `--bg-panel` | `#0A1120` | card, table, sidebar |
| Raised | `--bg-raised` | `#101A2C` | table head, controls |
| Hover | `--bg-hover` | `#16233A` | row hover |
| Primary text | `--fg-primary` | `#F5F8FF` | ≈ 15:1 on panel |
| Secondary | `--fg-secondary` | `#C6D4E8` | ≈ 10:1 |
| Muted | `--fg-muted` | `#93A7C2` | ≈ 6:1 |
| Disabled / not scored | `--fg-disabled` | `#6C809B` | never used for a real score |
| Canonical blue | `--c-blue-500` | `#1672D8` | sampled from the CTA |
| Accent / focus | `--c-blue-400` | `#39B1FF` | focus ring, active control |
| Glass | `--bg-glass` | `rgba(9,16,30,.86)` | map overlays, popups |

**Accessibility fix to the mockup.** The bright CTA gradient ends at `#39B1FF`,
where white text falls to ~2.4:1. Text-bearing buttons therefore use
`--gradient-cta-solid` (`#034A86 → #0A59AC → #1672D8`, ≥ 4.5:1 white text at
every stop). The original bright `--gradient-cta` is reserved for decorative
rules and glows. This is the one deliberate deviation from the mockup.

**Dimension identity** — six hues, each with a code and glyph role:

| Key | Label | Code | Core | Dark hue |
| --- | --- | --- | --- | --- |
| `terrain` | Terrain | TR | ✓ | `#EFC75E` |
| `thermal` | Thermal | TH | ✓ | `#FF7A66` |
| `geology` | Geology | GE | ✓ | `#A99BFF` |
| `subsurface` | Subsurface | SS | ✓ | `#4FD1A5` |
| `water_ice` | Water/ice | WI | optional | `#6FD6E8` |
| `dust_wind` | Dust/wind | DW | optional | `#E88BC4` |

**Target bodies:** Moon `#B9CFE8` + solid ring + `M` monogram; Mars `#E2824F` +
dashed ring + `M` monogram. **Confidence:** high `#5FD3A0` (3 bars), medium
`#EFC75E` (2 bars), low `#EE8A7E` (1 bar). Confidence overlaps some dimension
hues; the bar count and text label carry the meaning, colour only reinforces it.

**Score ramp** (`--ramp-0 … --ramp-4`, viridis-derived):
`#44307A → #3B528B → #21918C → #5EC962 → #FDE725`. *One shared perceptual ramp
for every dimension.* Hue never identifies the active dimension — the segmented
control and the legend title do. `--not-scored` (`#71849B`) is a hollow, flat
marker, visually distinct from every ramp stop.

### 3.2 Typography

| Mode | Stack | Usage |
| --- | --- | --- |
| `--font-display` | Poppins / Montserrat / Century Gothic / Segoe UI / system | wordmark, hero, section titles, panel headings |
| `--font-body` | Poppins / Montserrat / Segoe UI / system | wide-tracked brand paragraph copy |
| `--font-ui` | system-ui / Segoe UI / Roboto | **all** dense data UI, tables, cards |
| `--font-mono` | IBM Plex Mono / Space Mono / ui-monospace | scores, coordinates, IDs, run hashes, timestamps |

The stacks are deliberately dependency-free: with no vendored fonts the system
still renders correctly offline. For pixel parity with the mockup, vendor
Poppins 300/400/500/600/700/800 and IBM Plex Mono 400/600 as `.woff2` into
`app/public/fonts/` and add `@font-face` rules to `index.css`. The gallery loads
them from Google Fonts as an *optional enhancement only*.

Two tracking modes: `--tracking-brand: .10em` for hero/nav copy and
`--tracking-ui: 0` for all data UI. Wide-tracked type in a table is a legibility
defect — do not mix modes inside one block.

Scale: 11 / 12 / 13 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 72 px
(`--text-2xs` … `--text-5xl`). Numerics always `font-variant-numeric:
tabular-nums`. The signature **outline hero line** uses
`-webkit-text-stroke: 1.5px` with transparent fill, with a solid-colour fallback
for browsers without text-stroke.

### 3.3 Space, radius, elevation, motion

- **4px base grid**, `--space-1` (2px) … `--space-12` (96px). The audited
  placeholder tokens (`--space-1..4 = .25/.5/1/1.5rem`) were re-based; legacy
  class names still resolve.
- **Radius:** 4 / 6 / 10 / 14 / 20 / 28 / pill. Controls 6, panels 10, cards 14,
  image tiles 20, badges and chips pill.
- **Elevation:** `--shadow-1 … --shadow-4`. On dark, every shadow is paired with
  a 1px hairline; a shadow alone disappears.
- **Motion:** `--dur-1` 90ms → `--dur-4` 480ms. Animate opacity, transform, colour
  and border only — never layout. `prefers-reduced-motion` zeroes all four tokens.

### 3.4 Iconography

Inline SVG `<symbol>` sprites only, 24×24 grid, 1.5px stroke, `currentColor`
fill/stroke, `aria-hidden="true"` where decorative. No icon fonts, no emoji, no
raster icons. Dimension glyph roles are documented in `tokens.json` (`contour`,
`thermo`, `strata`, `layers`, `crystal`, `wind`); the 2-letter code is the
guaranteed non-colour fallback if a glyph is unavailable.

---

## 4. Token architecture

```
src/design/tokens.json     machine-readable source of truth (themes, scale,
                           dimensions, bodies, confidence, rules)
        │ mirrored
        ▼
src/styles/tokens.css      runtime custom properties
   primitives --c-*  →  semantics --bg-*/--fg-*/--accent-*/--dim-*  →  components
        │ bridge for canvas / WebGL consumers
        ▼
src/design/tokens.js       cssVar(), getTokens(), mapPaint.scoreColor(),
                           mapPaint.bodyColor(), subscribeTheme()
        │
        ▼
map.js · table · card      consume class names and resolved values, never hex
```

**Rules.** Component CSS may reference *semantic* tokens and scale tokens only —
a raw hex outside `tokens.css` is a review failure. A value change updates
`tokens.json` **and** `tokens.css` together. `tokens.js` resolves values through
a probe element, so MapLibre receives literal colour strings while the theme
still switches at runtime; `subscribeTheme()` lets the map re-apply paint
properties after a theme change. Legacy aliases (`--color-*`, `--font-body`,
`--radius`, `--focus-ring`) are retained so existing markup keeps working.

---

## 5. Component inventory

Every component styles both the canonical `.va-*` class **and** the legacy class
names emitted by `siteCard.js`, `rankedTable.js`, `radar.js` and `map.js`.
This is what makes adoption a one-line stylesheet swap.

### Brand surface

| Component | Class | Required states |
| --- | --- | --- |
| Masthead / nav | `.va-masthead`, `.va-nav` | `aria-current="page"` underline, hover, focus |
| Hero | `.va-hero`, `.va-display-outline`, `.va-brand-copy` | full-bleed art, gradient scrim, ≤ 600px reflow |
| Section title | `.va-section-title` | glow, centred, clamp-scaled |
| Image tile | `.va-tile` | rest / hover lift / focus, scrim, label, blue rim |
| Footer | `.va-footer` | 3-column → stacked |
| Primary CTA | `.va-btn--primary` | gradient-solid, hover brighten, focus, disabled |

### Instrument surface

| Component | Class | States / notes |
| --- | --- | --- |
| Button | `.va-btn` (+ `--secondary`, `--ghost`, `--danger`, `--sm`, `--lg`, `--icon`) | rest, hover, active, focus-visible, disabled, `aria-busy` spinner |
| Segmented control | `.va-segmented` / `.va-segment` / legacy `#dimension-toggle` | `aria-pressed`, per-dimension hue via `[data-dim]`, optional dims excluded from map toggle |
| Filter field | `.va-field`, `.filter`, `select` | label, hint, disabled, hover |
| Badge | `.badge`, `.va-badge` | moon solid / mars dashed, confidence high/medium/low, neutral |
| Confidence meter | `.va-meter` | 3 / 2 / 1 filled bars + text label |
| Chip | `.va-chip[data-dim]` | hue + code + label |
| Score list | `.va-score-row` | measured value, measured `0.00`, missing (dashed track + italic "not scored") |
| Score value | `.va-score` | mono, tabular, `--zero` / `--missing` |
| Radar | `.radar*` | ring, axis, label, shape; **always** with `.va-radar-disclaimer` |
| Ramp / legend | `.va-ramp`, `.legend-*` | shared ramp, not-scored swatch, solid/dashed body rings, legend note |
| Site card | `.site-card`, `.card-head`, `.card-section`, `.va-source-list` | selected, empty, error, data sources as mono chips |
| Ranked table | `.ranked*` | sticky head, `aria-sort`, `is-ranked` column, `not-scored` cell, hover, `aria-selected`, actions, empty state |
| Provenance | `.va-dataset-strip`, `.va-meta-list` | reads manifest/meta sidecars |
| Alerts | `.va-alert--info/success/warn/danger` | icon + strong lead + body |
| Empty / skeleton | `.va-empty`, `.va-skeleton` | shimmer (disabled under reduced motion) |
| Rule flag | `.va-rule-flag` | the permanent "no overall score" reminder |
| Workspace | `.va-workspace`, `.va-topbar`, `.va-panel`, legacy `#app` | 1200 / 900 / 600px reflow |
| Map overlays | `#map-legend`, `#map-status`, `.va-map-overlay`, `.va-map-fallback` | glass, blur, error banner, CDN-down fallback |

### Explicitly **not** shipped

Overall similarity score, composite index, weighted average, star rating,
"All dimensions combined" segment, an aggregate hero KPI, or any component that
renders a missing optional dimension as `0.00`.

---

## 6. Data-visualisation semantics

| Situation | Render | Never |
| --- | --- | --- |
| Score `0.0` | `0.00`, `--ramp-0` marker, 2px visible bar stub | hidden, "not scored", `–` |
| Optional dimension absent | omitted from data; italic `not scored`, dashed track | `0.00`, `null`, empty cell |
| Core dimension missing | record quarantined upstream; card shows `Scores unavailable for this site.` | a radar with a zero-filled vertex |
| Active dimension | highlighted table column, `aria-sort`, legend title, segment `aria-pressed` | a hue-coded marker ramp |
| Confidence | weakest-link, 3-bar meter + text, never averaged | a percentage or blended grade |
| Radar | shape comparison across separate axes | area interpreted as an overall grade |

Map markers: one shared sequential ramp, `circle-stroke-color` from
`mapPaint.bodyColor()` (solid/dashed ring pattern where supported), hollow ring
for the selected site in `mapPaint.selectionRing()`. A feature without a `score`
property is "not scored" — the property is omitted, never set to `0`.

---

## 7. Accessibility

| Requirement | Implementation |
| --- | --- |
| Contrast | primary ≈ 15:1, muted ≈ 6:1 on panels; `--gradient-cta-solid` keeps white CTA text ≥ 4.5:1 |
| Colour independence | 4 channels per dimension, 3 per body, 3 per confidence |
| Focus | `:focus-visible` → `2px solid var(--focus)` + 2px offset on all interactive elements and the map canvas |
| Touch | `--touch-min: 44px` on coarse pointers; desktop controls ≥ 40px (up from the audited 36px) |
| Semantics | `aria-pressed` segments, `aria-sort` ranked column, `aria-live` status and card slot, radar `role="img"` + `<title>`/`<desc>` with unique ids |
| Motion | `prefers-reduced-motion` zeroes durations, disables shimmer/fade |
| Zoom / reflow | rem type, reflow at 1200/900/600px, table scrolls horizontally rather than clipping |
| High contrast | `data-contrast="high"` strengthens hairlines and muted text |
| Safe rendering | `textContent` / DOM builders only — no `innerHTML` with site data |

---

## 8. Content voice

Use verbatim:

- `not scored` — for an omitted optional dimension.
- `0.00` with the caption *no match* — for a measured zero.
- `Showing 4 of 4 sites, ranked by Terrain (high to low). Dimensions are ranked one at a time, not combined.`
- `Axes are separate properties. The polygon area is not an overall grade.`
- `Each map view shows one dimension. There is no overall score.`
- `Site data failed to load. The ranked table and site card remain available.`
- `Confidence: low` — never `Low confidence in the overall match`.

Never write: `Overall`, `Combined`, `Similarity: 78%`, `Total score`, `N/A`,
`–`, or a blank cell for missing data. Uppercase is for display type, eyebrows
and labels only — never for full sentences.

---

## 9. Adoption / migration

1. **`app/index.html`** — replace the four stylesheet `<link>` tags with
   `<link rel="stylesheet" href="src/styles/index.css">`. Delete the inline
   `<style>` on the visually-hidden `<h1>` (`.sr-only` is provided).
2. **`app/src/styles/`** — delete the placeholder `tokens.css`,
   `components.css`, `layout.css`, and `src/map/map.css`. Ship the six new files.
3. **`app/src/map/map.js`** — import `{ mapPaint, subscribeTheme }` from
   `../design/tokens.js`. Replace `#440154 / #21918c / #fde725`, `#9aa0a6`,
   `#1f2937 / #c2410c`, `#2563eb`, `#fee2e2`, `#dfe6ea` with
   `mapPaint.scoreColor()`, `mapPaint.bodyColor()`,
   `mapPaint.selectionRing()`, `mapPaint.basemapBackground()` and the token-based
   overlay classes. Add `data-dim` to each toggle button and
   `.ring--moon` / `.ring--mars` to legend rings. Re-apply paint on
   `subscribeTheme()`.
4. **`app/src/state.js`** — remove the hard-coded `DIMENSIONS` array; consume
   `meta.json` supplied by `frontend/bootstrap.js`.
5. **`app/src/main.js`** — mount `bootstrap.js` first, before any module
   subscribes. Delete the stray top-level block in `components/radar.js`
   (lines 20–27 of the audited file) that throws at module evaluation.
6. **`app/public/fonts/`** — optional: vendor the two font families and add
   `@font-face` blocks to `index.css`.
7. **`docs/data_contract.*`** — **do not change.** Frozen. All new metadata is
   read from `manifest.json`, `meta.json` and `lineage.json` sidecars, so Rex's
   change-control process is respected.

### Adoption checklist

- [ ] Live site renders contract-valid records with the new stylesheet
- [ ] No raw hex remains in JS or component CSS (`grep -R "#[0-9a-fA-F]\{6\}" app/src`)
- [ ] Theme switch re-colours MapLibre markers without a reload
- [ ] A `0.00` score and an omitted optional dimension look different
- [ ] Table and card still work with the MapLibre CDN unavailable
- [ ] Keyboard Tab reaches every control with a visible focus ring
- [ ] `meta.json` is the only source of dimension labels/keys

---

## 10. Files delivered

```
app/
├── public/assets/                      imagery cropped from the supplied mockup
│   ├── starfield.jpg  earth-limb.jpg  planet-mars.jpg
│   └── tile-earth.jpg  tile-moon.jpg  tile-mars.jpg
├── src/styles/
│   ├── index.css                       single entry point (six @imports)
│   ├── tokens.css                      primitives + semantics + themes
│   ├── base.css                        reset, typography, focus, utilities
│   ├── layout.css                      brand shell + instrument workspace
│   ├── components.css                  full component library (+ legacy classes)
│   ├── viz.css                         scores, radar, ramp, legend, dimension key
│   └── map.css                         map overlays + MapLibre control overrides
├── src/design/
│   ├── tokens.json                     machine-readable source of truth
│   └── tokens.js                       CSS-var → MapLibre paint bridge
└── design-system/
    ├── index.html                      living gallery / showcase
    ├── gallery.css                     gallery chrome only
    ├── gallery.js                      theme switch, live data, interactions
    └── DESIGN_SYSTEM.md                this document
```

---

## 11. Open decisions for the team

1. **Fonts.** Vendor Poppins + IBM Plex Mono, or accept the system stack? The
   mockup's exact letterforms need the vendored files; offline robustness does not.
2. **Light theme scope.** Currently an accessibility/print variant for instrument
   surfaces only. Confirm that brand pages should remain permanently dark.
3. **Common spatial support.** `common_scale_km` is `4.0` in the current demo
   `meta.json` but was `null` in the audited config. The design system surfaces
   it in the dataset strip; the science team must ratify it before publication.
4. **Per-dimension confidence.** The contract currently has one overall
   (weakest-link) confidence. If per-dimension confidence is added later, add a
   meter per score row — do **not** add a blended confidence number.
5. **Dimension glyphs.** The 2-letter codes are shipped and sufficient; the six
   SVG glyphs are specified but not yet drawn. Add them to the sprite when the
   icon set is produced.

# Light Mode Contrast Audit - 2026-07-01

## Scope

Audited every generated static page under `docs/**/index.html` in light color scheme at:

- Desktop: 1280 x 900
- Mobile: 390 x 844

WCAG 2 Level AA thresholds used by the rendered-page audit:

- Text: 4.5:1 for normal text
- Large text: 3:1
- Non-text component boundaries and adjacent surfaces: 3:1

The complete grouped failure record is saved locally at `reports/light-mode-contrast-audit-2026-07-01.initial.json`.
The final zero-failure audit result is saved locally at `reports/light-mode-contrast-audit-2026-07-01.json`.
Those JSON files are intentionally repo-ignored by `.gitignore`.

## Pages Audited

- `about/index.html`
- `index.html`
- `m1/index.html`
- `p1/index.html`
- `p3/content-qa/index.html`
- `p3/diagnostic/index.html`
- `p3/index.html`
- `p3/need-to-know/index.html`
- `p3/repair-lane/index.html`
- `p3/review/index.html`
- `p3/topics/algebra/exam-training/index.html`
- `p3/topics/algebra/field-guide/index.html`
- `p3/topics/algebra/learn/index.html`
- `p3/topics/algebra/skill-check/index.html`
- `p3/topics/algebra/worksheet/index.html`
- `p3/topics/complex-numbers/exam-training/index.html`
- `p3/topics/complex-numbers/field-guide/index.html`
- `p3/topics/complex-numbers/learn/index.html`
- `p3/topics/complex-numbers/skill-check/index.html`
- `p3/topics/complex-numbers/worksheet/index.html`
- `p3/topics/differential-equations/exam-training/index.html`
- `p3/topics/differential-equations/field-guide/index.html`
- `p3/topics/differential-equations/learn/index.html`
- `p3/topics/differential-equations/skill-check/index.html`
- `p3/topics/differential-equations/worksheet/index.html`
- `p3/topics/differentiation/exam-training/index.html`
- `p3/topics/differentiation/field-guide/index.html`
- `p3/topics/differentiation/learn/index.html`
- `p3/topics/differentiation/skill-check/index.html`
- `p3/topics/differentiation/worksheet/index.html`
- `p3/topics/index.html`
- `p3/topics/integration/exam-training/index.html`
- `p3/topics/integration/field-guide/index.html`
- `p3/topics/integration/learn/index.html`
- `p3/topics/integration/skill-check/index.html`
- `p3/topics/integration/worksheet/index.html`
- `p3/topics/logarithmic-and-exponential-functions/exam-training/index.html`
- `p3/topics/logarithmic-and-exponential-functions/field-guide/index.html`
- `p3/topics/logarithmic-and-exponential-functions/learn/index.html`
- `p3/topics/logarithmic-and-exponential-functions/skill-check/index.html`
- `p3/topics/logarithmic-and-exponential-functions/worksheet/index.html`
- `p3/topics/numerical-solution-of-equations/exam-training/index.html`
- `p3/topics/numerical-solution-of-equations/field-guide/index.html`
- `p3/topics/numerical-solution-of-equations/learn/index.html`
- `p3/topics/numerical-solution-of-equations/skill-check/index.html`
- `p3/topics/numerical-solution-of-equations/worksheet/index.html`
- `p3/topics/trigonometry/exam-training/index.html`
- `p3/topics/trigonometry/field-guide/index.html`
- `p3/topics/trigonometry/learn/index.html`
- `p3/topics/trigonometry/skill-check/index.html`
- `p3/topics/trigonometry/worksheet/index.html`
- `p3/topics/vectors/exam-training/index.html`
- `p3/topics/vectors/field-guide/index.html`
- `p3/topics/vectors/learn/index.html`
- `p3/topics/vectors/skill-check/index.html`
- `p3/topics/vectors/worksheet/index.html`
- `s1/index.html`

## Initial Audit Findings

Initial totals:

- Pages audited: 57
- Grouped failing points: 573
- Raw failing instances: 3906
- Text failures: 8
- Border failures: 2772
- Adjacent surface failures: 1126

Failure families found across the static pages:

- Theme toggle on all 57 pages: white or near-white control surface adjacent to near-white page/header surface, minimum ratio 1.00:1 against a 3:1 non-text threshold.
- Secondary buttons across P3 topic, course, and training pages: pale blue/white button surfaces adjacent to pale page or card surfaces, repeated minimum ratios from 1.00:1 to about 1.04:1.
- Question figures on exam-training pages: white figure surface adjacent to white or very pale parent surfaces, minimum ratio 1.00:1 against the 3:1 adjacent-surface threshold.
- Home/about navigation: white or translucent nav text and borders on near-white light-mode headers, including text ratios down to 1.00:1 against the 4.5:1 text threshold.
- `p3/need-to-know/index.html` contract skill cards: repeated white card surfaces on white parent surfaces, minimum ratio 1.00:1.
- Practice, learn-step, review empty-state, and summary cards: white card surfaces on pale blue/white parent surfaces, typically 1.00:1 to 1.04:1.
- Widespread decorative borders: pale borders on pale surfaces around cards, panels, buttons, nav items, and topic tiles, below the 3:1 non-text threshold.
- Home P3 hero tiles and action cards: slate borders and muted text on a mid-gray adjacent surface after the first repair pass, requiring the darker border/text side to be darkened further.
- `p3/repair-lane/index.html` module tabs: white active-tab text was being measured against a pale inherited surface because a transparent structural-card rule had higher specificity than the button rule.

## Repairs Applied

- Added a light-only contrast override scoped to `:root:not([data-theme="dark"])`.
- Darkened actionable controls, nav links, secondary buttons, and theme toggle surfaces to muted navy with white text.
- Replaced low-contrast pale structural fills with transparent light-mode panels and dark navy boundaries.
- Darkened decorative borders for card, panel, figure, topic tile, and question figure boundaries.
- Preserved exam/question imagery as light paper content while adding a stronger figure boundary.
- Darkened the text side of the remaining home P3 hero contrast failures to black.
- Added a specific repair-module-tab rule so active/hover tabs retain a dark control surface.

## Final Audit Result

Final totals:

- Pages audited: 57
- Grouped failing points: 0
- Raw failing instances: 0
- Text failures: 0
- Border failures: 0
- Adjacent surface failures: 0


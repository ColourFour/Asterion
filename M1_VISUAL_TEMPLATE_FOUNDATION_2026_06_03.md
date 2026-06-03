# M1 Visual Template Foundation - 2026-06-03

## Source and Scope

- Source content: `content-model/M1/m1-total.pdf`
- Prior audit: `M1_FIELD_GUIDE_AUDIT_2026_06_02.md`
- Purpose: add reusable instructional visual templates to the draft M1 Field Guide before any Skill Check generation.
- Trust boundary: these are draft instructional templates, not reviewed exam diagrams or mastery evidence.

## Templates Created

| Template id | Visual type | Appears in | Supports |
| --- | --- | --- | --- |
| `m1-template-displacement-time-crossing` | Displacement-time graph with labelled axes, slope marker, intercepts, crossing point | Velocity and Constant Acceleration -> Displacement-time graph | Displacement-time graph; displacement and velocity |
| `m1-template-velocity-time-area-gradient` | Velocity-time graph with labelled axes, shaded area, gradient marker | Velocity and Constant Acceleration -> Velocity-time graphs | Velocity-time graphs; acceleration; constant acceleration equations |
| `m1-template-piecewise-discontinuity` | Piecewise/discontinuity graph | Velocity and Constant Acceleration -> Graphs with discontinuities | Graphs with discontinuities |
| `m1-template-free-body-diagrams` | Free-body diagram set for horizontal surface, slope, vertical motion, angled pull | Force and Motion -> Newton's first law | Newton's first law; combinations of forces; weight/gravity; normal contact |
| `m1-template-resolving-triangle` | Resolving-force triangle with angle reference and sine/cosine component labels | Force and Motion -> Resolving forces in horizontal and vertical directions | Resolving angled forces; equilibrium; non-equilibrium resolving |
| `m1-template-normal-reaction-cases` | Normal reaction cases for horizontal, inclined plane, angled-force cases | Force and Motion -> Normal contact force | Normal contact force; inclined planes; angled pulls/pushes |
| `m1-template-friction-direction` | Friction direction cases for impending left/right and up/down slope motion | Friction -> Limit of friction | Friction direction; limiting friction; direction changes |
| `m1-template-connected-particles` | Connected-particle setup set for rods, tow-bars, strings over pulleys, table/hanging mass, slope systems | Connected Particles -> Objects connected by strings | Rods; tow-bars; strings; pulleys; table/hanging mass; slope-connected systems |
| `m1-template-calculus-motion-flow` | Derivative/integral flow for s, v, and a | General Motion in a Straight Line -> Velocity as derivative of displacement | Motion calculus setup |
| `m1-template-momentum-before-after-table` | Before/after momentum table | Momentum -> Collisions and conservation of momentum | Momentum sign conventions; collision setup |
| `m1-template-work-energy-setup` | Work-energy setup diagram with displacement, force angle, height change, resistance, normal reaction | Work and Energy -> Work done by force | Work by angled force; resistance; slope energy setup |
| `m1-template-energy-table` | Energy accounting table with KE, GPE, work terms, losses | Work and Energy -> Work energy principle | Kinetic energy; gravitational potential energy; work-energy principle; conservation with losses |
| `m1-template-power-setup` | Power setup showing force/velocity alignment and P = Fv vs P = W/t scope | Work and Energy -> Power | Power formula selection |

All required visual-template categories are represented at least once.

## Files Changed

- `src/data/courseSeedContent.ts`: added typed `CourseSeedVisualTemplate` support on Field Guide sections.
- `src/data/m1SeedContent.ts`: added inline SVG visual templates and attached them to relevant M1 sections.
- `scripts/build-static-site.ts`: renders section-level visual templates on seed Field Guide pages.
- `src/static-study/static-study.css`: adds scoped responsive styling for visual-template cards and inline SVGs.
- `src/tests/courseSeedContent.test.ts`: asserts the M1 template inventory and required fields.
- `docs/assets/static-study.css`: regenerated static CSS.
- `docs/m1/topics/**/field-guide/index.html`: regenerated M1 Field Guide pages with templates.

## Visual Checks

- Rendered generated pages inspected:
  - `docs/m1/topics/velocity-and-constant-acceleration/field-guide/index.html`
  - `docs/m1/topics/force-and-motion/field-guide/index.html`
  - `docs/m1/topics/friction/field-guide/index.html`
  - `docs/m1/topics/connected-particles/field-guide/index.html`
  - `docs/m1/topics/general-motion-in-a-straight-line/field-guide/index.html`
  - `docs/m1/topics/momentum/field-guide/index.html`
  - `docs/m1/topics/work-and-energy/field-guide/index.html`
- Browser smoke pass with Playwright against `vite preview` checked desktop 1280px and mobile 390px.
- Result: visual cards and inline SVGs rendered, draft warning remained visible, no console errors, no page-level horizontal overflow.
- Mobile note: dense diagrams use contained figure scrolling so labels remain larger without breaking the page width.

## Validation Results

- `npm run build`: passed; generated 172 static HTML pages.
- `npm run static:check`: passed; static site check passed for 172 HTML pages.
- `npm test`: passed; 56 files and 463 tests passed.
- `git diff --check`: passed.

## Remaining Visual Gaps

- These are generic templates, not source-reviewed final diagram assets.
- Some templates combine several cases in one SVG; later Skill Check work may need smaller per-question diagram variants.
- No automated visual snapshot tests were added.
- Diagram labels are instructional, not exam-specific. Skill Check generation must still specify assumptions, sign conventions, and force directions per prompt.
- Momentum and energy templates are table-first; future question generation may need reusable before/after arrow diagrams and slope-specific work-energy variants.

## Skill Check Readiness Decision

Decision: `partial_generation_ready`.

This visual foundation is strong enough to start a narrow first-pass draft Skill Check generation batch, but not broad M1 generation. M1 remains draft/source-filled content and must not be promoted into mastery, Guardian unlocks, adaptive evidence, teacher evidence, or official readiness claims.

Recommended first batch:

- Batch size: 12 to 18 draft questions.
- Start with calculation-first and template-backed subtopics:
  - Displacement and velocity
  - Acceleration
  - Equations of constant acceleration
  - Displacement-time graph interpretation
  - Velocity-time graph area/gradient interpretation
  - Resolving forces into horizontal and vertical components
  - Momentum definition
  - Collisions and conservation of momentum with before/after table
  - Work done by force
  - Kinetic energy
  - Work-energy principle
  - Power formula selection

Keep blocked or cautious until more diagram-specific templates/review:

- Full friction limiting-force cases with competing largest/smallest force setups.
- Multi-body connected-particle systems after string breaks or pulley constraints change.
- Complex slope systems combining friction, connected particles, and energy.
- Any prompt requiring a precise exam-style diagram not covered by the current generic templates.

## Before Broader Generation

- Split dense multi-case templates into smaller reusable diagram variants where question stems need one clear diagram.
- Add reviewed sign-convention examples for velocity, acceleration, momentum, and work.
- Add diagram-template tasks for slope friction with applied forces, pulley stages, and work-energy on rough inclines.
- Review all generated Skill Check prompts against `m1-total.pdf` and the official 9709 syllabus before marking anything as student-ready beyond draft practice.

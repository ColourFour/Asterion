# M1 Module Audit and Improvement Plan - 2026-06-03

## Executive Decision

Decision: `ready_for_item_level_review`

M1 is not ready for limited student draft use. It is now broad enough to review systematically: all seven topics exist, all current Field Guide subtopics have at least one draft Skill Check, visual templates render, and trust boundaries are visible. The next pass should improve quality, solve and verify items, split risky visuals, and add worked examples. It should not generate more Skill Check volume.

## Scope Audited

- Source PDF: `content-model/M1/m1-total.pdf`.
- M1 seed content: `src/data/m1SeedContent.ts`.
- M1 Skill Checks: `src/data/m1SkillCheckItems.ts`, `src/data/skillCheckItems.ts`.
- Course wiring: `src/data/courseSeedContent.ts`, `src/lib/topicStudy.ts`, `src/lib/courseExamTraining.ts`.
- Static build/rendering: `scripts/build-static-site.ts`, `src/static-study/static-study.css`, generated `docs/m1/topics/**`.
- Relevant tests under `src/tests/**`, especially `courseSeedContent`, `courseExamTraining`, `staticStudyRoutes`, and `skillChecklist`.
- Prior M1 reports:
  - `M1_CONTENT_FILL_2026_06_02.md`
  - `M1_FIELD_GUIDE_AUDIT_2026_06_02.md`
  - `M1_VISUAL_TEMPLATE_FOUNDATION_2026_06_03.md`
  - `M1_SKILL_CHECK_SEED_2026_06_03.md`
  - `M1_SKILL_CHECK_REVIEW_001_2026_06_03.md`
  - `M1_SKILL_CHECK_FULL_DRAFT_COVERAGE_2026_06_03.md`

PDF note: direct text extraction from the PDF mostly exposes headings, so I inspected PDF metadata and rendered page samples. The PDF has 31 pages, authored by Blake Rooker, and includes worked examples, diagrams, and problem-style prompts across the seven areas. The current app seed content is a summary/scaffold of that source, not a full transfer of the PDF's worked-example depth.

## Current Strengths

- All seven M1 topics are present and route through centralized course seed data.
- Every current M1 Field Guide subtopic has at least one draft Skill Check item.
- The 46-item suite is bounded: 37 numeric, 2 two-value, 7 multiple-choice; only one challenge item.
- Draft/support-only warnings are consistently visible on generated M1 pages.
- Skill Check review metadata is locked to `draft_review_needed`, `sourceSkillReviewed: false`, `markEventReviewed: false`, `affectsMastery: false`, `supportOnly: true`, and `evidenceEnabled: false`.
- Visual templates render in Field Guides and Practice pages, and mobile page-level overflow was not detected.
- M1 Exam Training routes exist, image URLs resolve, and mark saving is disabled with clear review-needed copy.
- P3 static practice still renders after the M1 additions.

## Major Weaknesses

- Field Guides are still mostly bullet/method scaffolds. They do not yet carry the worked-example depth visible in the source PDF.
- Visual templates are generic and sometimes dense. They help orientation, but they are not yet per-question diagram contracts.
- Practice pages repeat the same visual-template card for every item that references it, producing duplicate HTML IDs such as repeated `m1-template-connected-particles`. This did not break rendering in the browser pass, but it is an HTML validity and anchor/focus risk.
- The Field Guide hero still links to "Practice placeholder" even though M1 now has populated draft Skill Checks. This is a student-facing clarity issue.
- Exam Training topic routing is rough and overlapping. For example, force/friction share broad routing buckets, and velocity/general motion share kinematics buckets.
- No full item-level solution pass has been done for all 46 items. The first 16 were reviewed previously; the expanded 30 need independent solving.
- No automated visual snapshot test covers the SVG templates or mobile label readability.

## Topic and Coverage Audit

| Topic | Subtopics | Skill Checks | Coverage state | Thin or overrepresented areas |
| --- | ---: | ---: | --- | --- |
| Velocity and Constant Acceleration | 6 | 7 | Formally complete | Graph items are template/prose driven and need stronger numeric labelling variants. |
| Force and Motion | 7 | 8 | Formally complete | Resolving/equilibrium is underdeveloped beyond simple cases; normal reaction is only safest horizontal case. |
| Friction | 3 | 6 | Formally complete | Friction is intentionally shallow: no rough-slope largest/smallest force item, no angled-pull normal reaction item. |
| Connected Particles | 3 | 6 | Formally complete | Connected strings dominate; rod thrust/tension sign interpretation is not really tested. |
| General Motion in a Straight Line | 4 | 6 | Formally complete | Safe calculus checks are good; distance vs displacement after sign changes is still not tested. |
| Momentum | 2 | 6 | Formally complete | Good density for signed momentum; still lacks richer before/after arrow variants. |
| Work and Energy | 6 | 7 | Formally complete | Direct formulas are covered; resistance, rough slopes, and multi-work-term balances are missing. |

Coverage is complete against the current seeded subtopic list, not against a reviewed official Cambridge 9709 syllabus contract.

## Topic Ratings

Scale: 1-2 unusable or misleading; 3-4 rough scaffold, not safe for student use; 5-6 useful draft with clear caveats; 7-8 solid draft/pilot-ready after review; 9-10 polished and review-backed.

| Topic | Field Guide quality | Visual support | Skill Check coverage | Skill Check quality | Student usability | Review readiness | Overall confidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Velocity and Constant Acceleration | 6 | 6 | 7 | 6 | 6 | 5 | 6 |
| Force and Motion | 5 | 6 | 7 | 5 | 5 | 4 | 5 |
| Friction | 5 | 5 | 6 | 5 | 5 | 4 | 5 |
| Connected Particles | 4 | 5 | 6 | 4 | 4 | 3 | 4 |
| General Motion in a Straight Line | 6 | 5 | 7 | 6 | 6 | 5 | 6 |
| Momentum | 6 | 6 | 6 | 6 | 6 | 5 | 6 |
| Work and Energy | 5 | 5 | 7 | 5 | 5 | 4 | 5 |

## Module Ratings

| Area | Rating | Rationale |
| --- | ---: | --- |
| Coverage completeness | 7 | All current topics/subtopics are represented, but not syllabus-contract reviewed. |
| Mathematical reliability | 5 | Sampled items look controlled and prior 16 passed review, but all 46 have not been independently solved. |
| Visual learning support | 5 | Templates render and are useful, but they are generic, repeated, and sometimes crowded. |
| Practice usefulness | 5 | Good as support-only review material; not yet strong enough for unsupervised confidence claims. |
| Exam-training usefulness | 5 | Image pairs exist and resolve, but routing is rough and overlapping. |
| Pilot safety | 4 | Trust warnings are good, but item-level review and duplicate-ID fixes are needed before students use it. |
| Maintainability | 6 | Data is centralized and tested, but inline SVG repetition and no readiness metadata by subtopic are risks. |

## Field Guide Quality

The Field Guide covers all current subtopics and generally states correct formula scope:

- `s=vt` only under constant velocity.
- suvat only when acceleration is constant.
- `sum F=ma` as resultant force, not individual force.
- `R=mg` only under restricted horizontal/no-other-vertical-force assumptions.
- `F <= mu R`, with equality only at limiting friction.
- signed momentum and no-external-impulse wording for conservation.
- work done by angled force as `Fs cos theta`.
- power split between average `W/t` and aligned-force `Fv`.

Weakness: it reads more like a checklist than a teachable guide in the visual-heavy areas. Force resolving, friction, connected particles, and work-energy need full worked examples with setup diagrams, equations, and interpretation.

## Missing Worked Examples

Highest priority missing worked examples:

- Displacement-time graph with labelled points and gradient.
- Velocity-time graph with signed areas and a below-axis variant.
- Discontinuity/stage-change graph interpretation.
- Resolving components when angle is measured from horizontal vs vertical.
- Equilibrium resolving with two axes and two unknowns.
- Normal reaction where `R != mg`.
- Limiting friction on a slope with possible up/down slip directions.
- Friction direction reversal across two stages.
- Rod/tow-bar tension vs thrust sign interpretation.
- String/pulley shared acceleration with separate-body equations.
- Before/after momentum table with a reversed direction.
- Angled-force work, normal reaction doing zero work, and resistance doing negative work.
- Work-energy principle with resistance contrasted against conservation of energy.
- Power formula choice: average power vs instantaneous `Fv`.

## Visual Template Quality

All 13 visual template IDs are present and render:

- `m1-template-displacement-time-crossing`
- `m1-template-velocity-time-area-gradient`
- `m1-template-piecewise-discontinuity`
- `m1-template-free-body-diagrams`
- `m1-template-resolving-triangle`
- `m1-template-normal-reaction-cases`
- `m1-template-friction-direction`
- `m1-template-connected-particles`
- `m1-template-calculus-motion-flow`
- `m1-template-momentum-before-after-table`
- `m1-template-work-energy-setup`
- `m1-template-energy-table`
- `m1-template-power-setup`

Browser checks found no page-level horizontal overflow and SVG text used 15px font sizing. On mobile, figures are contained in horizontally scrollable panels. That prevents page breakage, but it also means the most complex diagrams require careful student scrolling.

Missing visual variants:

- Velocity-time graph below the axis for negative displacement.
- Displacement vs distance journey number line.
- Simple one-question graph templates with actual numeric axes and marked coordinates.
- Free-body diagram for one selected body only, rather than multi-case panels.
- Slope resolving with friction and normal reaction.
- Angled pull/push changing normal reaction.
- Separate rod tension and rod thrust diagrams.
- Table-plus-hanging-mass pulley diagram.
- Smooth pulley two-body free-body diagram with matching acceleration arrows.
- Momentum before/after arrow diagram, not only a table.
- Rough slope work-energy diagram with resistance and height/path separated.
- Normal reaction zero-work visual.
- Power at constant speed with driving force balanced by resistance.

## Skill Check Quality

The suite is controlled and mostly direct. It is appropriate for item-level review, not expansion.

Sampled item families look mathematically plausible:

- Velocity area item: triangle plus rectangle gives 84 m.
- Displacement-time gradient item: `(17-5)/(6-2)=3 m s^-1`.
- Signed discontinuity item: final minus initial `-2-4=-6 m s^-1`.
- Resolving from vertical item: horizontal component `30 sin 40 = 19.3 N`.
- Non-limiting friction item correctly reinforces `F <= mu R`, not always equality.
- Pulley item gives `(3-2)g=(3+2)a`, so `a=1.96 m s^-2`.
- Momentum rebound item gives `2 m s^-1`.
- Work-angle item gives `20*5*cos60 = 50 J`.
- Work-energy principle item gives `25 = 1/2(2)v^2`, so `v=5 m s^-1`.

However, this was not a full item-level solution pass. The next pass must solve every item independently and check stored answers, accepted alternatives, tolerances, units, rounding, wording, and feedback.

## High-Risk Items and Item Types

Prioritize these exact items for item-level review:

- `m1-sc-velocity-discontinuity-001`: signed jump wording can be confused with jump magnitude.
- `m1-sc-velocity-vt-graph-area-001`: graph is described in prose while the generic template lacks matching numeric labels.
- `m1-sc-velocity-dt-graph-gradient-001`: template is generic; prompt supplies coordinates, but no matching marked graph is rendered.
- `m1-sc-force-normal-horizontal-001`: safe only because no other vertical forces and zero vertical acceleration are explicit.
- `m1-sc-force-resolving-horizontal-001`: requires horizontal angle reference clarity.
- `m1-sc-force-resolving-vertical-angle-001`: sine/cosine risk from angle measured from vertical.
- `m1-sc-friction-not-limiting-001`: important concept, but easy to overgeneralize incorrectly.
- `m1-sc-friction-direction-reversal-001`: stage-specific friction direction must stay explicit.
- `m1-sc-connected-rod-force-001`: avoids thrust/tension sign interpretation by asking magnitude only; expansion risk is high.
- `m1-sc-connected-pulley-common-acceleration-001`: highest-risk current connected-particles item.
- `m1-sc-momentum-rebound-001`: signed velocities need careful checking.
- `m1-sc-energy-work-done-angle-001`: safe only because angle is explicitly to direction of motion.
- `m1-sc-energy-work-energy-principle-001`: must not be confused with conservation of energy.
- `m1-sc-energy-conservation-smooth-001`: safe only because smooth/no-resistance/vertical-height wording is explicit.
- `m1-sc-energy-power-fv-001`: `P=Fv` scope depends on force and velocity alignment.

High-risk item types for later generation:

- distance travelled after velocity sign changes.
- rough-slope friction with largest/smallest applied force.
- normal reaction with angled forces or slopes.
- rod/tow-bar tension vs thrust sign.
- multi-stage connected particles.
- pulley systems after a string breaks or a body reaches a pulley.
- momentum with multiple collisions or coefficient of restitution.
- work-energy with resistance, normal reaction, and multiple named work terms.

## Exam Training Integration

M1 Exam Training routes exist:

- `docs/m1/exam-training/index.html`
- `docs/m1/topics/{topic}/exam-training/index.html` for all seven topics.

`npm run static:check` reports 258 M1 catalog records and 258 local image pairs. Browser URL checks confirmed M1 question and mark-scheme image URLs resolve in the preview server.

Trust boundary is clear:

- Mixed M1 Exam Training says routes are not mastery evidence or official progress evidence.
- Topic Exam Training says rough topic image pairs are not mastery evidence, adaptive evidence, or final syllabus-contract coverage.
- Attempt saving is disabled: pages show "Saving marks as progress is held back until this course routing is reviewed."

Main risk: rough routing creates duplicated and broad topic buckets. The current route is useful for image-first draft practice, not reviewed topic evidence.

## Student Usability

What works:

- The route structure is understandable: topic overview, Field Guide, Practice, Exam Training.
- M1 draft warnings are visible on mobile and desktop.
- Practice cards clearly say draft/review-needed.
- Skill Check answer contracts are hidden inside details blocks.
- Mobile pages did not show page-level horizontal overflow.

Clarity issues:

- Field Guide pages still link to "Practice placeholder"; this should become "Draft Skill Checks" or "Draft Practice".
- Some visual-heavy checks ask students to "Use the template" but the template is generic and not numerically aligned to the prompt.
- Dense visual templates may help reviewers but can overwhelm weaker students.
- Practice pages repeat large visual cards. Connected Particles repeats the same dense template five times, increasing cognitive load.
- Field Guide prose is often checklist-like and does not always show what the student's first written line should be.

## Trust Boundary Audit

Confirmed:

- M1 remains draft/review-needed.
- M1 Skill Checks are support-only and evidence-disabled in data and rendered copy.
- M1 does not feed mastery, Guardian unlocks, adaptive evidence, teacher evidence, official readiness, or course completion.
- M1 Exam Training disables attempt saving as progress.
- `src/lib/topicStudy.ts` remains P3-region based for legacy study topics; M1 seeded content is separate.
- `src/lib/courseExamTraining.ts` uses catalog filtering and rough seed-topic aliases only.
- P3 static practice still renders, with 44 practice cards found on the sampled Algebra page and image URLs resolving.

Risk to watch: P3 has separate support records and Guardian logic. M1 must not be added to those flows until reviewed course contracts exist.

## Bugs and Rendering Risks

- Duplicate visual-template IDs are generated on practice pages when multiple items reference the same template. Fix by rendering each template once per page, or suffixing practice-card template IDs with the Skill Check item ID.
- The "Practice placeholder" button label is stale now that M1 has draft Skill Checks.
- SVG templates are inline in data. That is easy to ship statically, but hard to snapshot-test and easy to duplicate.
- Mobile diagram handling relies on horizontal scrolling inside figure cards. That is acceptable for draft review, but not ideal for weaker students.
- No visual snapshot regression checks exist for label overlap, SVG clipping, or duplicate IDs.

## Maintainability Risks

- M1 has no explicit subtopic readiness metadata. Readiness exists only in reports and test counts.
- Skill Check sourceRefs can reference a visual template even when the item does not render it directly, which is diagnostically useful but can confuse future authors.
- Course routing aliases for M1 are broad and duplicated across topics.
- The current tests lock counts and support-only status, but they do not solve the math or inspect rendering semantics.
- Inline SVGs inside course data make `src/data/m1SeedContent.ts` large and harder to review.

## Prioritized Future Improvement Plan

### P0 - Must Fix Before Student Pilot

1. Run a full item-level review of all 46 M1 Skill Checks.
   - Solve each item independently.
   - Check stored answers, accepted alternatives, tolerances, units, rounding, sign conventions, and feedback.
   - Mark each item as keep, revise, or remove.
2. Fix duplicate visual-template IDs on generated practice pages.
   - Either render each template once per page with item links, or generate unique IDs per Skill Check card.
3. Remove or revise any item that relies on a generic visual without enough numeric information.
   - Start with graph items and connected-particle visual items.
4. Keep `m1-sc-connected-pulley-common-acceleration-001` out of student pilot unless a reviewer confirms the assumptions and answer route.
5. Replace stale "Practice placeholder" button copy with "Draft Skill Checks" or "Draft Practice".
6. Add a hard test that M1 support-only records cannot be consumed by mastery, Guardian, adaptive routing, teacher evidence, readiness, or course completion.

### P1 - Should Fix Before Expanding M1

1. Add worked examples for every visual-heavy subtopic listed in this report.
2. Split dense SVG templates into smaller single-purpose variants.
3. Add subtopic readiness metadata in code, not just reports.
   - Suggested statuses: `draft_scaffold`, `item_level_review_needed`, `teacher_review_needed`, `pilot_candidate`, `blocked`.
4. Add a browser smoke script for M1 pages to CI or local validation.
   - Check draft warnings, no page overflow, visual template presence, image URL resolution, and P3 smoke page rendering.
5. Create a syllabus-contract audit file for M1 against the official Cambridge 9709 syllabus before any readiness claims.
6. Split rough M1 Exam Training routing aliases where catalog metadata supports more precise topic routing.
7. Add per-item reviewer notes so future passes can distinguish "math verified" from "renderer contract verified".

### P2 - Quality Improvements

1. Add an M1 student-facing "How to use draft checks" note that emphasizes paper working and self-marking discipline without implying readiness.
2. Improve feedback text to say what wrong sign/unit/rounding would mean physically.
3. Add smaller mobile-friendly diagram cards for graph, resolving, pulley, and work-energy topics.
4. Add table-style answer inputs for momentum and energy accounting where one scalar answer hides too much method.
5. Add checks for duplicate template references and unused template references.
6. Add topic-level "best first review item" ordering for anxious or weak students.

### Later

1. Add reviewed M1 source-skill contracts once teacher review exists.
2. Add official exam-readiness labels only after image routing and item-level review are complete.
3. Consider interactive diagram annotation only after static diagram contracts are stable.
4. Consider M1 progress surfaces only after reviewed evidence semantics exist.
5. Consider a limited student pilot after P0 and the most important P1 items are complete.

## Exact Recommended Next Tasks

1. `M1_SKILL_CHECK_ITEM_LEVEL_REVIEW_2026_06_03.md`
   - Solve all 46 items.
   - Produce keep/revise/remove decisions.
   - Fix only verified item issues, not new generation.
2. Duplicate-ID rendering fix.
   - Update `scripts/build-static-site.ts` so repeated visual templates do not duplicate HTML IDs.
   - Add a static test or HTML scan for duplicate IDs on generated M1 practice pages.
3. M1 Field Guide worked-example pass.
   - Add structured worked examples for force resolving, friction, connected particles, and work-energy first.
4. M1 visual-variant pass.
   - Split connected particles, normal reaction, resolving, friction, graph, and energy templates into smaller variants.
5. M1 syllabus-contract audit.
   - Compare current topics/subtopics/formula scope with the official 9709 Mechanics 1 syllabus.
   - Keep M1 draft/review-needed unless every contract is reviewed.
6. Exam Training routing review.
   - Audit the 258 M1 catalog image pairs and identify which rough topic routes are too broad or duplicated.

## Validation Results

- `npm run build`: passed; generated 172 static HTML pages in `docs/`.
- `npm run static:check`: passed; M1 reports 258 catalog records and 258 local image pairs.
- `npm test`: passed; 56 test files, 464 tests.
- Browser/Playwright preview at `http://127.0.0.1:4173/`: passed after correcting lazy-image false positives.
  - Checked all seven M1 Field Guide pages and all seven M1 Practice pages at 1280px and 390px.
  - Checked M1 mixed Exam Training and Velocity topic Exam Training at 1280px and 390px.
  - Checked P3 Algebra Practice at 1280px and 390px.
  - Confirmed no console errors, no page-level horizontal overflow, math rendered, M1 visual templates rendered, M1 image URLs resolved, P3 image URLs resolved, draft/support-only warnings visible, and P3 practice cards still render.
- `git diff --check`: passed.

## Final State

Current honest state: M1 is a useful draft scaffold with complete first-pass coverage and visible trust boundaries. It is not mastery-ready, not official exam-readiness content, and not ready for limited student draft use. The strongest areas are General Motion, Momentum, and basic Velocity. The weakest areas are Connected Particles, Friction, Force resolving/normal reaction, and Work-Energy modelling. The project should do item-level review and targeted fixes next, not a student pilot and not more Skill Check generation.

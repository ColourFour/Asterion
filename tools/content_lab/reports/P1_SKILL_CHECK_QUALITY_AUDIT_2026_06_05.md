# P1 Skill Check Quality Audit - 2026-06-05

## Scope

This audit covers the current P1 Skill Check branch only. It inspects active P1 course/topic metadata from `src/data/courses.ts`, active P1 seed topic content from `src/data/courseSeedContent.ts` and `src/data/p1SeedContent.ts`, authored P1 Skill Check items from `src/data/p1SkillCheckItems.ts`, checklist grouping from `src/lib/skillChecklist.ts`, and static route/render behavior from `src/lib/staticStudyRoutes.ts` and `scripts/build-static-site.ts`.

No content or UI changes were made in this audit pass.

## Executive Summary

- Active P1 has 9 topics, 38 authored Field Guide subtopics, and 121 authored P1 Skill Check items.
- Every active P1 Field Guide subtopic has at least 3 authored Skill Check items.
- P1 Skill Check items remain support-only and do not affect mastery: `draft_review_needed`, `supportOnly: true`, `evidenceEnabled: false`, and `affectsMastery: false`.
- The rendered P1 Skill Check page currently uses a topic-level default set of 3 items with `items.slice(0, 3)`. This preserves the small cognitive-load target, but it does not create exact Field Guide phase -> Skill Check group routing.
- The biggest student-facing quality risk is Integration: improper-integral and volume-of-revolution subtopics are present as P1 Skill Check groups even though the seed content itself flags them as needing course-contract review. Their source prompts include visible draft/admin phrasing such as "Draft placeholder" and "Teacher-guided draft only".
- Quadratics, Functions and Transformations, Coordinate Geometry, Circular Measure, Trigonometry, Binomial Expansion, Series, and Differentiation are generally short, focused, varied, and workable as support checks, with the main gap being exact phase-level routing and default item selection.

## 1. P1 Topic Inventory

| Topic slug | Topic title | Syllabus code | Field Guide phases/subtopics | Existing Skill Check groups | Current Skill Check questions | Exact Field Guide -> Skill Check links? | Student-facing safe? |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| `quadratics` | Quadratics | 9709 P1 1.1 | Solving by factoring; Solving inequalities; Solving by quadratic formula; Discriminant; Graphs of quadratic functions | 5 groups, 3 items each | 15 | Partial. Data has exact subtopic IDs, but rendered Field Guide links to topic-level "Try 3 quick questions". | Yes. Support-only metadata remains internal. |
| `functions` | Functions and Transformations | 9709 P1 1.2 | Composite functions; Inverse functions; Translations; Reflections; Stretches | 5 groups, 3 items each | 15 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Yes. |
| `coordinate-geometry` | Coordinate Geometry | 9709 P1 1.3 | Parallel and perpendicular lines; Equation of a straight line; Circles; Points of intersection | 4 groups, 4-5 items each | 18 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Mostly yes. Some items cite exam-bank references in metadata only; that is not visible to students. |
| `circular-measure` | Circular Measure | 9709 P1 1.4 | Radians; Arc length and sector area | 2 groups, 3 items each | 6 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Yes. |
| `trigonometry` | Trigonometry | 9709 P1 1.5 | Exact values; Graphs of trigonometric functions; Trigonometric equations; Trigonometric identities | 4 groups, 3-4 items each | 13 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Yes. |
| `binomial-expansion` | Binomial Expansion | 9709 P1 1.6 | Binomial expansion; More complex expansions | 2 groups, 3 items each | 6 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Yes. |
| `series` | Series | 9709 P1 1.7 | Arithmetic progressions; Geometric progressions; Infinite geometric progressions | 3 groups, 3 items each | 9 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Yes. |
| `differentiation` | Differentiation | 9709 P1 1.8 | Gradient of tangent; Differentiation of polynomials; Chain rule; Second derivative; Equations of tangents and normals; Stationary points; Rates of change | 7 groups, 3 items each | 21 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | Yes, with later syllabus-contract review still needed before mastery use. |
| `integration` | Integration | 9709 P1 1.9 | Basic integration; Constant of integration; Definite integrals; Area bounded between curves; Improper integrals; Volumes of revolution | 6 groups, 3 items each | 18 | Partial. Data has exact subtopic IDs, rendered links are topic-level. | No for the last two groups. Improper integrals and volumes of revolution are explicitly marked draft/teacher-guided in source content and include visible draft/admin phrasing before render cleanup. |

### Runtime Linking Finding

The active P1 Field Guide renderer uses generic topic-level phases:

- Understand
- Method
- Mistakes
- Self-check
- Exam focus
- Practice

The 38 P1 `fieldGuideSections` exist in active data and are used by Skill Check item mappings, but the current P1 Field Guide page does not render one panel per `fieldGuideSection`. Therefore, the desired path "Field Guide phase -> Skill Check for that exact skill" is not yet exact in the rendered static site. It is currently "topic Field Guide -> first 3 topic Skill Checks".

## 2. Coverage Table

| Topic | Skill / subtopic | Existing checks | Missing? | Quality issue | Priority |
| --- | --- | ---: | --- | --- | --- |
| Quadratics | Solving by factoring | 3 | No | Good mix of direct solve, method choice, and application. | Low |
| Quadratics | Solving inequalities | 3 | No | All are multiple-choice; good for short checks, but no free-response interval entry. | Medium |
| Quadratics | Quadratic formula | 3 | No | Good exact-root and denominator-error coverage. | Low |
| Quadratics | Discriminant | 3 | No | Strong root-count coverage; parameter item is a suitable challenge. | Low |
| Quadratics | Graphs of quadratic functions | 3 | No | Focused on vertex, symmetry, intercepts; suitable. | Low |
| Functions and Transformations | Composite functions | 3 | No | Good order variation: `fg`, `gf`, expression composition. | Low |
| Functions and Transformations | Inverse functions | 3 | No | Mostly linear inverses; lacks a restricted-domain inverse check. | Medium |
| Functions and Transformations | Translations | 3 | No | Good notation and point-mapping variety. | Low |
| Functions and Transformations | Reflections | 3 | No | Good axis and point-mapping variety. | Low |
| Functions and Transformations | Stretches | 3 | No | Good vertical/horizontal distinction and reciprocal scale factor. | Low |
| Coordinate Geometry | Parallel and perpendicular lines | 4 | No | Strong gradient and perpendicular-bisector coverage. | Low |
| Coordinate Geometry | Equation of a straight line | 4 | No | Good point-gradient and two-point coverage. | Low |
| Coordinate Geometry | Circles | 5 | No | Good centre/radius, diameter, completing square, tangent checks. | Low |
| Coordinate Geometry | Points of intersection | 5 | No | Good line-line, line-circle, discriminant method sequence. | Low |
| Circular Measure | Radians | 3 | No | Basic conversion only; no angle use inside formula selection. | Medium |
| Circular Measure | Arc length and sector area | 3 | No | Good arc, area, perimeter setup; lacks compound sector/triangle area check. | Medium |
| Trigonometry | Exact values | 3 | No | Clean but all recall-level. | Medium |
| Trigonometry | Graphs | 3 | No | Period/amplitude checks are focused; no graph-to-solution interpretation. | Medium |
| Trigonometry | Equations | 4 | No | Good interval discipline and tangent-period reasoning. | Low |
| Trigonometry | Identities | 3 | No | Basic identities only; no equation simplification with possible lost solutions. | Medium |
| Binomial Expansion | Basic expansion | 3 | No | Good coefficient row/sign variation. | Low |
| Binomial Expansion | More complex expansions | 3 | No | Strong targeted coefficient setup. | Low |
| Series | Arithmetic progressions | 3 | No | Covers term, unknown difference, sum. | Low |
| Series | Geometric progressions | 3 | No | Covers term, negative ratio, possible ratios. | Low |
| Series | Infinite geometric progressions | 3 | No | Covers convergence condition and sums. | Low |
| Differentiation | Gradient of tangent | 3 | No | Focused and useful. | Low |
| Differentiation | Differentiation of polynomials | 3 | No | Includes negative powers; good range. | Low |
| Differentiation | Chain rule | 3 | No | All multiple-choice and linear-inside powers; appropriate for P1 support but should remain short. | Low |
| Differentiation | Second derivative | 3 | No | Good derivative-vs-second-derivative distinction. | Low |
| Differentiation | Tangents and normals | 3 | No | Good normal-gradient and tangent-equation coverage. | Low |
| Differentiation | Stationary points | 3 | No | Good coordinate/nature/x-value spread. | Low |
| Differentiation | Rates of change | 3 | No | Good rate interpretation check. | Low |
| Integration | Basic integration | 3 | No | Includes negative powers; suitable. | Low |
| Integration | Constant of integration | 3 | No | Good curve-from-gradient checks. | Low |
| Integration | Definite integrals | 3 | No | Good upper-lower and symmetry trap coverage. | Low |
| Integration | Area between curves | 3 | No | Good setup and evaluation coverage. | Low |
| Integration | Improper integrals | 3 | Scope concern | Likely outside current P1 seed-safe surface; source prompts expose draft/admin language. | High |
| Integration | Volumes of revolution | 3 | Scope concern | Likely outside current P1 seed-safe surface; source prompts expose draft/admin language. | High |

### Coverage Pattern

Every major active P1 subtopic has:

- at least one basic/foundation check,
- at least one method/application check except where all items are intentionally core/challenge,
- a worked route,
- deterministic answers,
- clean enough notation for KaTeX rendering in normal cases,
- cognitive-load-safe item count in the authored group.

The missing part is not raw item count. The missing part is exact phase-level selection and student-facing scope cleanup for questionable Integration material.

## 3. Question-Quality Rubric

### Rubric Summary By Topic

| Topic | Curriculum-safe | Focused | Varied | Rigorous | Student-clear | Answerable | Worked solution | Notation | Cognitive-load safe | Field Guide alignment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quadratics | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Functions and Transformations | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Coordinate Geometry | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Circular Measure | Pass | Pass | Partial | Partial | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Trigonometry | Pass | Pass | Partial | Partial | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Binomial Expansion | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Series | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Differentiation | Pass with review caveat | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Data pass, rendered partial |
| Integration | Partial | Pass for first 4 groups | Partial | Partial | Partial | Pass | Pass | Pass | Pass | Data pass, rendered partial |

### Rubric Details

**Curriculum-safe**

- Strong for Quadratics, Functions, Coordinate Geometry, Circular Measure, Trigonometry, Binomial Expansion, Series, and most Differentiation/Integration power-rule work.
- Weak for Integration improper integrals and volumes of revolution because active seed content marks these as teacher-guided draft/course-contract review material. They should not be default P1 Skill Check material until the course contract confirms them.

**Focused**

- Most items test one skill: one discriminant decision, one transformation, one gradient relationship, one binomial coefficient, one integral setup, etc.
- The coordinate discriminant/tangency method-sequence item is broader than most checks but still acceptable as a challenge item.

**Varied**

- Quadratics, Functions, Coordinate Geometry, Binomial, Series, Differentiation are meaningfully varied.
- Circular Measure could use one compound-shape/triangle-sector item if that remains in the Field Guide.
- Trigonometry exact values are mostly recall variations; a method/application check could ask students to use exact values inside an equation or triangle expression.

**Rigorous**

- Strongest rigor appears in Coordinate Geometry, Quadratics discriminant, Binomial target terms, Series unknown ratio, Differentiation stationary points, and Integration area.
- Some first checks are intentionally mechanical, which is acceptable for foundation slots.

**Student-clear**

- Most prompts are concise and answerable.
- Integration advanced prompts are not student-facing clean in source because they contain "Draft placeholder" or "Teacher-guided draft only". The builder has some visible-copy cleanup, but the source content should not rely on render-time masking for student safety.

**Answerable**

- Deterministic answers exist for all P1 items.
- Multiple-choice items generally include at least 4 options and plausible distractors.
- Numeric items include common equivalent answer strings in many cases.

**Worked solution quality**

- All audited P1 items have worked routes, usually 3 short lines.
- Worked routes are useful and generally identify the method, not just the final answer.
- Some challenge items would benefit from one extra line explaining why the method is chosen, especially intersection/tangency and area-between-curves checks.

**Notation quality**

- Math notation is mostly clean and KaTeX-compatible.
- Minor cleanup recommended: normalize prime notation in seed formulas where `f\prime` appears instead of `f'(x)` or `f\\prime(x)` in display intent.
- Some answer aliases are inconsistent but acceptable for deterministic support checks.

**Cognitive-load safe**

- The authored item bank is large, but the static Skill Check page renders only 3 default items. This preserves the small default experience.
- Future implementation must not expose all 121 items or a "1 of 44" style sequence by default.

**Field Guide alignment**

- Data alignment is strong: every item has a `fieldGuideSubtopicId`.
- Rendered alignment is incomplete: P1 Field Guide phases are generic topic phases, not the authored subtopics, and all Field Guide action buttons currently send the student to the topic Skill Check page rather than an exact subtopic group.

## 4. Current Pain Points

### Repetitive Questions

- Trigonometry exact values are mostly recall checks with standard angles.
- Circular Measure radians are mostly conversion checks.
- Integration improper and volume items repeat the same advanced setup pattern and should not be part of the default P1 learner flow.

### Weak Or Too-Easy Questions

- First-check foundation items are intentionally easy. That is acceptable if each group has a method/application follow-up.
- Some exact-value and radian-conversion groups need a method/application item if they become exact Field Guide phase checks.

### Overly Broad Questions

- `p1-sc-coordinate-intersections-005` asks for a method sequence for parameter line-circle intersection. It is useful as a challenge, but it should not be the first or only check after a Field Guide phase.
- Integration volume questions are broad relative to the current P1 support-safe status.

### Outside-Scope Or Scope-Questionable Questions

- `p1-sc-integration-improper-001`
- `p1-sc-integration-improper-002`
- `p1-sc-integration-improper-003`
- `p1-sc-integration-volumes-001`
- `p1-sc-integration-volumes-002`
- `p1-sc-integration-volumes-003`

These should be removed from default P1 Skill Check exposure or held behind an explicitly non-default extra practice bucket only after syllabus-contract review.

### Missing Worked Solutions

- No missing worked routes were found in the P1 authored items.

### Poor Formula Formatting

- No widespread formula rendering issue was found in Skill Check items.
- Seed formula strings using `f\prime` should be reviewed for display consistency.

### Unclear Answers

- Most expected answers are clear.
- Numeric answer acceptance remains string-based, so equivalent forms may be missed in some cases. This is acceptable for support checks but should not become mastery evidence.

### Bad Distractors

- Most multiple-choice distractors are plausible common mistakes.
- Strong distractor design appears in transformations, stationary points, coordinate geometry, and binomial expansions.
- Trigonometry exact-value distractors are basic but acceptable for foundation checks.

### Topics With No Checks

- None. Every active P1 topic and every active P1 Field Guide subtopic has authored checks.

### Checks That Should Be Split Smaller

- Coordinate Geometry intersections should stay split into line-line, simple line-circle, full line-circle, and discriminant/tangency groups.
- Integration should split "safe P1 integration" from "advanced/course-contract-review integration". The latter should not share the default P1 Skill Check route.

### Checks That Should Move To Exam Training Instead

- Coordinate Geometry exam-bank-reference items can remain as Skill Checks because they test one method step and are not image-first exam questions.
- Improper integrals and volume-of-revolution items should not move to Exam Training yet; they should be quarantined until P1 syllabus-contract review confirms scope.

## 5. Improvement Plan

### Global Plan

1. Keep the authored bank, but expose only 3 short checks by default for a selected Field Guide subtopic.
2. Add a topic/subtopic selection mechanism or URL hash support so Field Guide actions can target the exact Skill Check group.
3. Preserve the current small default experience: basic -> method/application -> mixed/challenge where appropriate.
4. Keep optional extra practice collapsed or non-default.
5. Remove student-visible draft/admin/source/audit language from source prompts, not just render output.
6. Quarantine or replace Integration improper-integral and volume-of-revolution groups until syllabus-contract review confirms scope.

### Topic-Level Target Groups

| Topic | Target Skill Check groups | Starter 3-question set | Optional extra practice | Optional challenge | Field Guide phase link target | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Quadratics | Factoring; inequalities; formula; discriminant; graphs | One direct method item, one common-error item, one application or interpretation item per group | Existing third/fourth variants if added later | Parameter discriminant | Exact subtopic ID, e.g. `p1-quadratics-discriminant` | Medium |
| Functions and Transformations | Composition; inverses; translations; reflections; stretches | One notation check, one point/value check, one transformation description | Restricted-domain inverse check | Combined transformation point mapping | Exact subtopic ID | Medium |
| Coordinate Geometry | Gradients/parallel/perpendicular; straight lines; circles; intersections | One direct fact, one equation setup, one interpretation/application | Additional exam-bank-reference method checks | Discriminant/tangency sequence | Exact subtopic ID | Medium |
| Circular Measure | Radians; arc/sector | One conversion, one formula substitution, one perimeter/area setup | Compound sector-triangle item | Shaded-region setup | Exact subtopic ID | Medium |
| Trigonometry | Exact values; graphs; equations; identities | One recall/method, one interval/graph check, one identity/application check | Additional equation intervals | Identity equation with lost-solution warning | Exact subtopic ID | Medium |
| Binomial Expansion | Basic expansion; target coefficients | One row/pattern, one coefficient, one sign/power item | Larger positive-integer power coefficient | Term-selection from general term | Exact subtopic ID | Low |
| Series | AP; GP; infinite GP | One term, one unknown parameter, one sum/convergence item | Worded AP/GP setup | Negative ratio or threshold condition | Exact subtopic ID | Low |
| Differentiation | Tangent gradient; polynomials; chain rule; second derivative; tangent/normal lines; stationary points; rates | One direct derivative, one geometry/application, one interpretation/classification item per group | Written line-equation variants | Stationary classification or rate interpretation | Exact subtopic ID | Medium |
| Integration | Basic; constant; definite; area | One reverse-power-rule, one limit/constant setup, one area interpretation item | More area-between-curves setup | Split-area/sign-area item | Exact subtopic ID for first 4 groups only | High |

### Recommended 3-Question Starter Sets By Major Subskill

- Quadratics / factoring: direct roots; efficient method choice; rectangle/application rejecting invalid root.
- Quadratics / inequalities: open interval; outside interval; endpoint inclusion.
- Quadratics / formula: simple formula roots; exact surd roots; denominator-error trap.
- Quadratics / discriminant: compute `D`; repeated/no-real-root interpretation; parameter condition.
- Quadratics / graphs: vertex and line of symmetry; opening direction; x-intercepts.
- Functions / composition: `fg(4)`; `gf(3)`; symbolic `fg(x)`.
- Functions / inverses: inverse value; inverse expression; solve for input from output.
- Functions / transformations: notation description; point mapping; reciprocal horizontal scale factor.
- Coordinate Geometry / gradients: perpendicular gradient; parallel gradient from rearranged line; compare two lines.
- Coordinate Geometry / straight lines: point-gradient line; gradient from two points; requested final forms.
- Coordinate Geometry / circles: centre/radius; diameter-to-circle; completing square or tangent method.
- Coordinate Geometry / intersections: line-line; simple line-circle; full line-circle or discriminant method.
- Circular Measure / radians: degrees to radians; radians to degrees; exact angle choice.
- Circular Measure / sectors: arc length; sector area; sector perimeter setup.
- Trigonometry / exact values: one exact value recall; one swapped-angle distractor; one use inside a simple equation.
- Trigonometry / graphs: sine period; tangent period; amplitude.
- Trigonometry / equations: sine interval; cosine zero interval; tangent period interval.
- Trigonometry / identities: Pythagorean rearrangement; tangent ratio; `1+tan^2x` application.
- Binomial / expansion: full small expansion; coefficient of `x`; alternating signs.
- Binomial / coefficients: coefficient of `x^2`; sign-sensitive coefficient; choose `r` for a target power.
- Series / AP: term; common difference from term; sum.
- Series / GP: term; negative ratio; possible ratios from known term.
- Series / infinite GP: compute sum; convergence condition; sum with fractional ratio.
- Differentiation / tangent gradient: derivative then substitute; negative x-value; multiple-choice gradient trap.
- Differentiation / polynomials: basic power rule; constant removal; negative powers.
- Differentiation / chain rule: linear bracket; inner coefficient; negative inner derivative.
- Differentiation / second derivative: evaluate second derivative; identify expression; avoid first-derivative answer.
- Differentiation / tangents/normals: normal gradient; tangent equation; negative reciprocal.
- Differentiation / stationary points: coordinate and nature; x-values; second-derivative classification.
- Differentiation / rates: derivative as velocity; interpretation of derivative; contextual rate value.
- Integration / basic: simple antiderivative; higher power; negative power.
- Integration / constant: use point after integrating; sign of `C`; curve equation.
- Integration / definite: upper-minus-lower; symmetric even function; simple polynomial definite integral.
- Integration / area: upper-minus-lower setup; evaluate simple region; choose correct integrand.

### Optional Extra Practice Sets

- Extra practice should stay collapsed/non-default and should not appear as a long sequence.
- A reasonable cap is 3 default checks plus up to 3 optional checks per subtopic.
- Extra practice can reuse the existing authored surplus in larger groups such as Coordinate Geometry circles/intersections and Trigonometry equations.

### Optional Challenge Sets

- Use challenge items sparingly and only after the basic and method checks.
- Good challenge candidates: Quadratics parameter discriminant, Coordinate Geometry line-circle discriminant, Differentiation stationary classification, Integration area/sign handling.
- Do not use Integration improper integrals or volumes as challenge items until course-contract review confirms P1 scope.

## Recommended Next Implementation Packet

- Goal: Make P1 Skill Check selection exact to Field Guide subtopic while keeping a 3-item default set.
- Locked decisions:
  - P1 Skill Check remains support-only and does not affect mastery.
  - Default view shows at most 3 items for the selected subtopic.
  - No "Skill Check 1 of 44" flow.
  - No draft/admin/source/audit language in student-facing strings.
- File/module ownership:
  - `scripts/build-static-site.ts`: exact subtopic hash/link rendering and default item selection.
  - `src/data/p1SkillCheckItems.ts`: source-copy cleanup and Integration quarantine/replacement if approved.
  - `src/data/p1SeedContent.ts`: remove or hide advanced Integration subtopics if not P1-contract safe.
  - `src/tests/skillChecklist.test.ts`: update expectations for quarantined or replaced Integration groups.
- Data flow:
  - Field Guide section ID -> Skill Check item `fieldGuideSubtopicId` -> render 3 matching items.
- Edge cases:
  - Unknown hash falls back to first safe subtopic.
  - Topic with no safe group shows a short empty state and Field Guide review link.
  - Quarantined groups are not rendered by default.
- Tests to add/update:
  - P1 exact subtopic group selection.
  - P1 default item count remains 3.
  - P1 rendered copy excludes draft/admin/source/audit terms.
  - Integration quarantine does not expose improper/volume items by default.
- Commands:
  - `npm test`
  - `npm run build`

## Phase 5 Curriculum Safety Addendum

### Local Authority Used

This pass used the repo's P1 source-filled course data as the active authority:

- `src/data/p1SeedContent.ts`
- `src/data/courseSeedContent.ts`
- `src/data/p1SkillCheckItems.ts`
- `src/data/skillCheckItems.ts`

The active P1 Field Guide sections in `p1SeedContent.ts` are the source of truth for whether a Skill Check group can exist. A Skill Check item is considered active only when its `fieldGuideTopicId` and `fieldGuideSubtopicId` match one of those P1 Field Guide sections.

### Active Scope Decision

All active P1 Skill Check groups currently map to a P1 Field Guide subtopic from the local source data:

- Quadratics: factoring, inequalities, formula, discriminant, graphs.
- Functions and Transformations: composite functions, inverse functions, translations, reflections, stretches.
- Coordinate Geometry: parallel/perpendicular lines, straight-line equations, circles, intersections.
- Circular Measure: radians, arc length and sector area.
- Trigonometry: exact values, graphs, equations, identities.
- Binomial Expansion: basic expansion, targeted coefficients/complex expansions.
- Series: AP, finite GP, infinite GP with `|r|<1` check.
- Differentiation: tangent gradient, polynomials, simple linear-bracket chain rule, second derivative, tangents/normals, stationary points, rates of change.
- Integration: basic integration, constant of integration, definite integrals, area bounded between curves.

### Needs Syllabus Confirmation

These are not active student-facing P1 Skill Check groups:

| Candidate skill | Current status | Reason |
| --- | --- | --- |
| Improper integrals | Quarantined | Not present in active P1 Field Guide sections after the safety cleanup. Keep out until syllabus-contract review confirms P1 scope. |
| Volumes of revolution | Quarantined | Not present in active P1 Field Guide sections after the safety cleanup. Keep out until syllabus-contract review confirms P1 scope. |

### Source Reference Cleanup

Some Coordinate Geometry Skill Check items previously carried `exam-bank reference` metadata pointing to local P1 exam-bank records. Those records are P1 records, but the local catalog marks them `needs_review` and `student_runtime_safe=false`, so Phase 5 does not use them as curriculum authority. Active P1 Skill Check items now use only the authored P1 content-map source reference:

- `content-model/P1/p1-content map.pdf`

### Safety Gates Added

`src/tests/skillChecklist.test.ts` now checks that active P1 Skill Checks:

- map to an existing P1 topic and Field Guide section;
- follow Field Guide section order for Skill Check group routing;
- use only authored P1 content-map source metadata;
- do not cite unreviewed canonical question IDs, question assets, mark-scheme assets, or Content Lab candidates;
- remain support-only and mastery-ineligible;
- keep quarantined improper-integral and volume-of-revolution groups out of active P1;
- do not route the default P1 Skill Check structure from complexity/difficulty-style metadata.

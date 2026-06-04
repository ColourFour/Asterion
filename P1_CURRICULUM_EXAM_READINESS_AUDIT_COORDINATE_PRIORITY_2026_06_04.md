# P1 Curriculum and Exam-Readiness Audit - Coordinate Geometry Priority - 2026-06-04

## 1. Executive verdict

**Final decision: READY_WITH_COORDINATE_WARNINGS**

The current P1 Field Guide and Skill Check layer is a useful draft scaffold, not a high-level Paper 1 preparation layer. It is cleared only for a guided draft trial or colleague review where the reviewer understands that every P1 Skill Check remains `draft_review_needed`, `supportOnly: true`, `affectsMastery: false`, and `evidenceEnabled: false`.

Coordinate Geometry is viable enough to show Asterion's intended support loop because the current unit covers the visible foundation topics: gradients, straight-line equations, centre-radius circle form, and basic intersections. It is not yet strong enough to demonstrate real Paper 1 exam readiness at a high level. Old Paper 1 evidence shows that coordinate geometry questions regularly require multi-step modelling: complete the square from expanded circle equations, find centres/radii, use distance and midpoint formulae, form equations of tangents/normals, substitute line equations into circles, use discriminants for tangency/intersection conditions, and connect algebraic intersections to geometry. The current Skill Checks mostly test one-step recognition or calculation.

The immediate recommendation is a bounded **Coordinate Geometry Viability Pass 001** before the colleague assessment. That pass should not enable evidence or mastery. It should add or replace a small number of Coordinate Geometry checks and strengthen Field Guide worked examples so the unit demonstrates the bridge from foundation facts to real exam workflows.

## 2. Sources found and source limitations

### Official syllabus evidence

No official Cambridge syllabus PDF was found in the repo. The audit used official Cambridge PDFs from Cambridge International, temporarily downloaded outside the repo for text extraction:

- `/tmp/asterion_syllabus/9709_2023_2025_syllabus.pdf`
- `/tmp/asterion_syllabus/9709_2026_2027_syllabus.pdf`
- Official URLs:
  - `https://www.cambridgeinternational.org/Images/597421-2023-2025-syllabus.pdf`
  - `https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf`

The P1 subject-content wording for 2023-2025 and 2026-2027 is materially aligned for the audited P1 topics. The 2026-2027 Coordinate Geometry section explicitly requires straight-line equations from sufficient information; forms `y = mx + c`, `y - y1 = m(x - x1)`, and `ax + by + c = 0`; distances, gradients, midpoints, intersections, parallel/perpendicular gradients; circle centre-radius and expanded forms; algebraic line-circle problems; elementary circle geometry such as tangent perpendicular to radius, angle in a semicircle, and symmetry; and graph intersections as algebraic solutions.

### Local P1 content-map files found

Local content-model PDFs exist, but text extraction exposed mostly headings rather than detailed content. They are useful as evidence of the authored content map, not as official syllabus evidence:

- `content-model/P1/p1-content map.pdf`
- `content-model/P1/quadratics.pdf`
- `content-model/P1/functions.pdf`
- `content-model/P1/coordinate-geometry.pdf`
- `content-model/P1/arc-sector.pdf`
- `content-model/P1/trig.pdf`
- `content-model/P1/binomial.pdf`
- `content-model/P1/series.pdf`
- `content-model/P1/differentation.pdf`
- `content-model/P1/integration.pdf`

### Local old Paper 1 exam evidence found

No full old question-paper PDFs or full mark-scheme PDFs were found. The repo does contain canonical question and mark-scheme image crops, plus JSON OCR/mark-scheme text:

- `public/assets/exam-bank-data/p1/**/questions/q##.png`
- `public/assets/exam-bank-data/p1/**/mark_scheme/q##.png`
- `public/assets/exam-bank-data/question_bank.json`
- `public/assets/exam-bank-data/question_bank.topic_routing.v1.json`
- `public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json`

Available P1 paper/session folders:

`11autumn21`, `11autumn22`, `11autumn23`, `11autumn24`, `11autumn25`, `11summer21`, `11summer22`, `11summer23`, `11summer24`, `11summer25`, `12autumn21`, `12autumn22`, `12autumn23`, `12autumn24`, `12autumn25`, `12spring21`, `12spring22`, `12spring23`, `12spring24`, `12spring25`, `12summer21`, `12summer22`, `12summer23`, `12summer24`, `12summer25`, `13autumn21`, `13autumn22`, `13autumn23`, `13autumn24`, `13autumn25`, `13summer21`, `13summer22`, `13summer23`, `13summer24`, `13summer25`, `15autumn25`, `15summer25`.

Exam-bank summary:

| File | Total records | P1 records | Question images | Mark-scheme images | Topic routing | Reviewed/runtime-safe P1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `asterion_exam_bank_catalog_v1.json` | 1301 | 401 | 401 | 401 | 0 in catalog | 0 |
| `question_bank.json` | 1301 | 401 | 401 | 401 | 401 topic IDs | 0 |
| `question_bank.topic_routing.v1.json` | 1301 | 401 | n/a | n/a | 401 DeepSeek sidecar routes | 0 |
| `asterion_question_bank_v1.json` | 57 | 0 | 0 | 0 | 0 | 0 |

Important limitation: the P1 topic routes are model-generated sidecar routes, not reviewed P1 skill labels. They are usable for audit sampling and image-first exploration, but not as curriculum authority.

P1 routed topic counts in the sidecar:

| Route | Count | Review-required count |
| --- | ---: | ---: |
| Series | 82 | 3 |
| Differentiation | 63 | 5 |
| Functions | 59 | 6 |
| Trigonometry | 46 | 5 |
| Integration | 44 | 5 |
| Coordinate Geometry | 41 | 1 |
| Circular Measure | 36 | 4 |
| Quadratics | 27 | 4 |
| Unrouted/none | 3 | 3 |

### Asterion authored and generated files inspected

- `src/data/p1SeedContent.ts`
- `src/data/p1SkillCheckItems.ts`
- `src/data/courseSeedContent.ts`
- `src/data/skillCheckItems.ts`
- `src/tests/courseSeedContent.test.ts`
- `src/tests/skillChecklist.test.ts`
- generated pages under `docs/p1/`
- prior reports:
  - `P1_STUDENT_USE_AUDIT_AND_NEEDS_IMPROVEMENT_LEDGER_2026_06_03.md`
  - `P1_NEEDS_IMPROVEMENT_PASS_001_STUDENT_TRIAL_HARDENING_2026_06_03.md`
  - `P1_STUDENT_TRIAL_PREFLIGHT_REPORT_2026_06_03.md`
  - `P1_STUDENT_TRIAL_OBSERVATION_GUIDE_2026_06_03.md`
  - `P1_SKILL_CHECK_QUALITY_ITERATION_001_QUADRATICS_2026_06_03.md`
  - `P1_SKILL_CHECK_QUALITY_ITERATION_002_FUNCTIONS_2026_06_03.md`
  - `P1_SKILL_CHECK_QUALITY_ITERATION_003_COORDINATE_GEOMETRY_2026_06_03.md`
  - `P1_SKILL_CHECK_QUALITY_ITERATION_004_REMAINING_UNITS_2026_06_03.md`

## 3. Full P1 unit-by-unit readiness table

| Unit | Official syllabus requirements, compressed | Current Field Guide coverage | Current Skill Check coverage | Exam-question behaviours required | Classification |
| --- | --- | --- | --- | --- | --- |
| Quadratics | Completing square, discriminant, equations/inequalities, linear-quadratic simultaneous equations, equations quadratic in a function. | Broad foundation coverage. Completing square appears via graph form but not as strongly as equation transformation. | 15 items. Best current template: roots, inequalities, formula, discriminant, graph features. | Choose method, complete square, solve inequalities, prove intersection/tangency conditions, handle parameters. | Usable but needs stronger exam bridge |
| Functions and Transformations | Domain/range, one-one, inverse, composition, graphical inverse, transformations and combinations. | Covers composition, inverse, translations, reflections, stretches. Domain/range and one-one restrictions are thin. | 15 items. Strong notation drills; weak domain/range and inverse restriction testing. | Determine range/domain, justify inverse existence, transform coordinates/graphs, compose with domain constraints. | Usable but needs stronger exam bridge |
| Coordinate Geometry | Line equations/forms; distance, gradient, midpoint, intersections; circle forms including expanded form; line-circle algebra; tangent-radius geometry; graph intersections as solutions. | Covers gradients, line equation, centre-radius circles, intersections. Missing distance/midpoint as explicit Field Guide formulas; thin expanded circle/completing-square and tangent geometry. | 12 items. Good foundation spread, but mostly one-step and recognition. Missing completing square, distance/midpoint, non-axis line-circle quadratic, tangent/normal chains, discriminant conditions. | Multi-step line-circle questions, chord lengths, tangents, circle centres from expanded equations, set-of-values intersection conditions. | Usable but needs stronger exam bridge; priority warning |
| Circular Measure | Radians/degrees, arc length, sector area, triangle lengths/areas in sector problems. | Covers radians and sector formulae. Compound diagram decomposition is thin. | 6 items. Conversion, arc length, sector area, perimeter setup. | Read diagrams, decide arc/sector/triangle components, exact forms, perimeter and shaded area. | Usable but needs stronger exam bridge |
| Trigonometry | Sine/cos/tan graphs, exact values, inverse trig notation, identities, all solutions in intervals. | Covers exact values, graphs, equations, identities. Scope concern around reciprocal/sec notation because P2 contains deeper reciprocal functions; P1 allows tan identity and sin/cos identities, not broad sec/cosec/cot graph knowledge. | 13 items. Good exact value and interval drills; identity proof/simplification bridge is thin. | Graph periods/amplitudes/shifts, all interval solutions, avoid lost roots, prove/simplify identities. | Usable but needs stronger exam bridge; minor scope concern |
| Binomial Expansion | Positive integer `(a+b)^n`, notation, coefficients; greatest term/properties not required. | Covers expansion and targeted coefficients. | 6 items. Mostly coefficient/term selection. | Select general term, handle signs/scales/substitution, avoid expanding unnecessarily. | Usable but needs stronger exam bridge |
| Series | AP/GP recognition, nth term, finite sum, numbers in AP/GP, multiple progressions, convergence and infinite GP sum. | Covers AP, GP, infinite GP. Thin on "numbers in progression" and mixed progression parameter problems. | 9 items. Good formula drills and one unknown-ratio item. | Set up unknowns, solve AP/GP parameter systems, convergence condition, mixed progressions. | Usable but needs stronger exam bridge |
| Differentiation | Gradient as limiting chord idea, rational powers, chain rule, tangents/normals, increasing/decreasing, rates, stationary points and nature. | Broad and mostly on-syllabus. Informal limiting-chord idea and increasing/decreasing intervals are thin. | 21 items. Strongest broad coverage by volume; still short-answer/MC rather than structured. | Differentiate, form tangent/normal equations, classify stationary points, connected rates, sketch using stationary data. | Usable but needs stronger exam bridge |
| Integration | Reverse differentiation `(ax+b)^n`, constants, definite integrals including simple improper, areas, volumes of revolution. | Covers all listed official areas, including improper and volumes now teacher-guided draft. | 18 items. Setup and evaluation drills; advanced topics fenced. | Choose bounds, area top-minus-bottom, improper limit setup, volume about axes including region not bounded by axis. | Usable but needs stronger exam bridge |

## 4. Coordinate Geometry deep audit

### 4.1 Current coverage matrix

| Coordinate behaviour | Official/source evidence | Field Guide coverage | Skill Check coverage | Verdict |
| --- | --- | --- | --- | --- |
| Equation of line from two points | Syllabus: line equation from sufficient information, e.g. two points. | Mentioned in straight-line subtopic. | No full line equation from two points; only gradient from two points. | Thin |
| Equation from one point and gradient | Syllabus explicit. | Worked example through `(2,5)` gradient `3`. | `straight-line-001`, `straight-line-002`. | Covered foundation |
| Use `y = mx + c` | Syllabus explicit. | Present in formulas/examples. | Several line items use slope-intercept form. | Covered foundation |
| Use `y - y1 = m(x - x1)` | Syllabus explicit. | Present in formula list and method. | Implied in worked routes; no item requires preserving point-gradient form. | Thin |
| Use `ax + by + c = 0` | Syllabus explicit. | Not strongly taught as a target form. | One parallel item starts from `3x - 2y = 8`; no final answer in general form. | Weak |
| Convert between line forms | Required by line-form use in problems. | Thin. | Classification item compares `y=2x+1` and `4x-2y=6`; no structured conversion chain. | Thin |
| Distance formula | Syllabus notes include distances. | Not in header formula; only general "distance" in worked method. | No direct distance item. | Missing |
| Midpoint formula | Syllabus notes include midpoints. | Not explicit in formulas. | No direct midpoint/perpendicular bisector item. | Missing |
| Gradient formula | Syllabus notes include gradients. | Header formula included. | Direct gradient item and relationship items. | Covered foundation |
| Parallel/perpendicular gradients | Syllabus explicit. | Covered. | Three items. | Covered foundation |
| Points of intersection | Syllabus explicit. | Covered generally. | Two line-line items and one axis line-circle item. | Covered foundation, weak exam depth |
| Centre-radius circle form | Syllabus explicit. | Covered. | Centre/radius recognition and equation-from-centre/radius. | Covered foundation |
| Expanded circle form | Syllabus explicit. | Only warned as completing-square mistake; no formula or worked example. | No item. | Missing/weak |
| Completing square for circles | Required by expanded circle form use. | Thin warning only. | No item. | Missing |
| Line-circle intersections | Syllabus explicit. Old papers heavily use substitution. | Mentions simultaneous equations. | One very simple `y=0` with `x^2+y^2=9`. | Weak |
| Tangent perpendicular to radius | Syllabus notes include tangent perpendicular to radius. | Not a worked Coordinate example. | No item. | Missing |
| Angle in semicircle/symmetry | Syllabus examples include both where relevant. | Not covered. | No item. | Missing; support-only may defer |
| Graph intersections as algebraic solutions | Syllabus explicit; old papers use discriminant conditions. | General statement only. | No discriminant/intersection-condition item in Coordinate. | Weak |
| Decide intersects/touches/misses curve | Syllabus example. Old papers include set-of-values conditions. | Not covered in Coordinate. Quadratics has discriminant but not as graph-line condition bridge. | No Coordinate item. | Missing |

### 4.2 Old Paper 1 coordinate evidence

The sidecar routes 41 P1 records to `9709_p1_topic_coordinate_geometry`. Representative local evidence:

- `public/assets/exam-bank-data/p1/11autumn21/questions/q07.png`: circle centre `(5,2)` through a point, then line-circle intersection and exact chord length. Mark scheme credits radius squared, circle equation, substitution of line into circle, quadratic formation, and chord length.
- `public/assets/exam-bank-data/p1/11autumn22/questions/q11.png`: tangents from a point to `x^2 + y^2 = 20`; uses line `y = mx + 10`, substitution into circle, discriminant zero for tangency, tangent points, and angle geometry.
- `public/assets/exam-bank-data/p1/11autumn24/questions/q06.png`: expanded circle equation, completing square/centre extraction, distance between centres, and greatest/least distance between points on two circles.
- `public/assets/exam-bank-data/p1/12autumn22/questions/q01.png`: perpendicular bisector of a segment requires midpoint, gradient, perpendicular gradient, and line equation; then circle centre/radius from two points.
- `public/assets/exam-bank-data/p1/12autumn24/questions/q08.png`: general circle `x^2 + y^2 + px + 2y + q = 0`, normal to tangent at a point, and solving for parameters.
- `public/assets/exam-bank-data/p1/12autumn25/questions/q07.png`: diameter endpoints define centre and radius, then tangent at a point, then intersection of two tangents.

These examples show that the current Coordinate Geometry layer is missing the dominant exam behaviour: a student must chain basic facts into a structured solution, not simply identify one fact.

### 4.3 Missing exam behaviours

1. Complete the square from `x^2 + y^2 + 2gx + 2fy + c = 0`.
2. Extract centre and radius from expanded circle equations.
3. Use distance and midpoint formulae in circle/perpendicular-bisector contexts.
4. Form perpendicular bisectors from two endpoints.
5. Substitute non-axis line equations into circles and solve the resulting quadratic.
6. Use the discriminant to decide tangent/two intersections/no intersections.
7. Use tangent perpendicular to radius to form a tangent equation.
8. Use line forms flexibly, especially final answers in `ax + by + c = 0`.
9. Find chord lengths or triangle areas after line-circle intersections.
10. Use elementary circle geometry when a diagram gives a diameter, semicircle angle, or symmetry.

### 4.4 Weak or shallow current items

- `p1-sc-coordinate-straight-line-003` finds only a gradient from two points. It should be paired with a full line-equation or perpendicular-bisector item.
- `p1-sc-coordinate-circles-001` and `002` read centre/radius from completed-square form, but no item asks students to reach that form from expanded form.
- `p1-sc-coordinate-intersections-003` uses `y=0` with `x^2 + y^2 = 9`. This is valid foundation practice but too far from old-paper line-circle substitutions.
- `p1-sc-coordinate-parallel-perpendicular-001` and `002` are correct drills, but they do not require students to decide why the relationship matters in a line/circle/tangent problem.
- No current item uses a real Paper 1 mark-scheme style sequence such as `centre -> radius gradient -> tangent gradient -> tangent equation`.

### 4.5 Field Guide sections needing stronger worked examples

- **Equation of a straight line:** add one full two-point example ending in both `y = mx + c` and `ax + by + c = 0`.
- **Parallel and perpendicular lines:** add a perpendicular bisector example using midpoint and gradient.
- **Circles:** add one expanded-form example using completing the square to find centre and radius.
- **Circles:** add one diameter-endpoints example using midpoint and distance.
- **Points of intersection:** replace the current line-line-only worked example with a line-circle substitution example that produces a quadratic.
- **Points of intersection:** add one discriminant example for intersects/touches/misses.
- **Tangents:** add a distinct mini-section or worked example: radius gradient, negative reciprocal tangent gradient, line equation.

### 4.6 Skill Checks to replace or restructure

Do not expand the whole Coordinate unit indiscriminately. Replace or add a bounded set:

- Replace one duplicate-style line-line intersection item with a non-axis line-circle intersection item.
- Add one completing-square circle item from expanded form.
- Add one midpoint/distance circle-from-diameter item.
- Add one tangent-at-point item using centre/radius gradient.
- Add one discriminant/tangency-condition item.
- Add one perpendicular-bisector item from two endpoints.

All must remain support-only and deterministic, preferably multiple choice for complex algebraic answers until a written-working workflow exists.

## 5. Field Guide readiness findings

The Field Guide layer is readable and syllabus-shaped, but it is too compressed for independent exam preparation. Most sections follow the pattern: learning goal, key method, one draft worked example, common mistake, takeaway. That is enough for reminding a student of a known method; it is not enough to teach students how to attack structured Paper 1 questions.

Main Field Guide gaps:

- Too few multi-step worked examples.
- Limited "when to choose this method" guidance.
- Limited mark-scheme thinking: no explicit "method mark for substitution", "B mark for centre", "A mark for final equation" style cues.
- Coordinate Geometry lacks distance/midpoint formulas in the visible formula list.
- Coordinate Geometry mentions completing-square sign errors but does not show an expanded-circle worked example.
- Functions lacks enough domain/range/inverse restriction examples.
- Circular Measure lacks enough compound-sector diagram decomposition.
- Trigonometry identities and graph transformations are too short for proof/interval discipline.
- Integration has correct official scope for improper integrals and volumes, but the teacher-guided draft labels should stay until reviewed examples are source-checked.

## 6. Skill Check readiness findings

All 115 current P1 Skill Checks remain draft support-only, which is correct. The tests and previous ledgers confirm they are not mastery/readiness evidence.

The current distribution:

| Unit | Skill Checks | Main shape |
| --- | ---: | --- |
| Quadratics | 15 | Mostly method and foundation/core drills |
| Functions and Transformations | 15 | Notation and transformation recognition |
| Coordinate Geometry | 12 | Foundation facts and recognition |
| Circular Measure | 6 | Formula and setup drills |
| Trigonometry | 13 | Exact value, period, equation, identity checks |
| Binomial Expansion | 6 | Expansion/coefficient drills |
| Series | 9 | Formula drills and one parameter-style GP item |
| Differentiation | 21 | Broad differentiation/tangent/stationary/rates drills |
| Integration | 18 | Antiderivative, definite integral, area, advanced setup |

Readiness gap:

- Most items are one-screen support checks, not structured exam prompts.
- Multiple choice improves renderer safety but can reward recognition and guessing.
- Few items ask students to select a method from a mixed situation.
- Few items require a chain of 3-5 mark-scheme moves.
- Distractors are often common algebra mistakes, but not always real old-paper error modes.
- Mark-scheme style reasoning is represented in worked routes, but not strongly enough in prompts.

## 7. Exam-question alignment findings

Old P1 records show that Paper 1 questions commonly combine topics and reward staged method:

- Coordinate Geometry combines circle equations, line equations, substitution, discriminants, tangents, and geometry.
- Quadratics appears both as a unit and as a tool inside Coordinate Geometry and Functions.
- Functions questions require domain/range restrictions and inverse/composition conditions more than current checks do.
- Circular Measure questions often depend on diagram decomposition with triangles, sectors, and exact values.
- Trigonometry requires all interval solutions and identity manipulation; short exact-value checks are not enough.
- Series questions often set up unknowns from term/sum relationships.
- Differentiation questions reward forming tangent/normal equations, connected rates, stationary-point classification, and sketch interpretation.
- Integration questions require setup discipline: bounds, upper-minus-lower, improper limits, and volume formula choice.

The current Asterion loop is strongest as a pre-exam support layer: it can diagnose whether a student remembers a method. It is not yet a Paper 1 exam-training layer: it does not consistently require method choice, multi-step reasoning, or mark-scheme-style written structure.

## 8. Top Coordinate Geometry risks for colleague assessment

1. The colleague may open Coordinate Geometry and see a polished foundation checklist, not an exam-readiness pathway.
2. The unit currently under-represents expanded circle form, despite it being explicit in the syllabus and frequent in old papers.
3. Distance and midpoint are syllabus-explicit but absent as Skill Checks.
4. Tangent-to-circle work is a major old-paper behaviour and currently missing.
5. The line-circle intersection item is too simple to demonstrate exam depth.
6. There is no discriminant/tangency/intersection-condition check.
7. The Field Guide does not show enough worked examples to bridge from formulas to old-paper solutions.
8. Multiple-choice items may look too easy unless paired with required written working guidance.
9. Topic routing is unreviewed DeepSeek sidecar metadata; a colleague may overestimate its authority if not warned.
10. There is no P1 runtime-safe reviewed question-bank projection, so real exam image practice is not yet a reviewed student flow.

## 9. Recommended Coordinate Geometry Viability Pass 001

### Goal

Make the Coordinate Geometry unit credible as a draft exam-bridge demonstration before colleague assessment, without enabling P1 mastery/readiness evidence and without rewriting the whole course.

### Locked decisions

- Keep all Coordinate Geometry items `draft_review_needed`, `supportOnly: true`, `affectsMastery: false`, `evidenceEnabled: false`.
- Do not change P3 or M1 source files.
- Do not create a reviewed P1 skill map in this pass.
- Do not claim official readiness.
- Use the official syllabus and local old-paper coordinate examples above as source evidence.

### Top 10 Coordinate Geometry changes

1. Add a Field Guide worked example for completing the square: `x^2 + y^2 + 6x - 10y + 18 = 0 -> centre (-3,5), radius 4`.
2. Add a Field Guide worked example for line-circle substitution producing a quadratic.
3. Add a Field Guide worked example for tangent at a point: centre, radius gradient, negative reciprocal, line equation.
4. Add a Field Guide formula line for distance and midpoint.
5. Add one Skill Check for centre/radius from expanded circle form.
6. Add one Skill Check for circle from diameter endpoints using midpoint and radius.
7. Add one Skill Check for perpendicular bisector from two points.
8. Replace or supplement `p1-sc-coordinate-intersections-003` with a non-axis line-circle intersection item.
9. Add one discriminant-based tangent/intersects/misses item.
10. Add one structured "method order" multiple-choice item that asks for the correct mark-scheme sequence for a tangent or line-circle problem.

### Suggested implementation packet

- Files likely affected:
  - `src/data/p1SeedContent.ts`
  - `src/data/p1SkillCheckItems.ts`
  - `src/tests/courseSeedContent.test.ts`
  - `src/tests/skillChecklist.test.ts`
  - generated `docs/p1/` only after static build
- Tests to add/update:
  - Coordinate Geometry item count or coverage expectation.
  - Guardrail test that all new P1 items remain draft/support-only/evidence-disabled.
  - Test for required Coordinate Geometry sub-skills: expanded circle, midpoint/distance, tangent, line-circle intersection.
  - Duplicate ID test remains passing.
- Commands:
  - `npm test`
  - `npm run build`
  - `npm run static:check`

### Acceptance criteria

- A reviewer can see at least one worked route from old-paper-style expanded circle to centre/radius.
- A reviewer can see at least one worked route from line-circle substitution to two intersection points.
- A reviewer can see tangent perpendicular-to-radius logic.
- Students are asked to choose or follow multi-step methods, not only compute one value.
- P1 remains draft/support-only/evidence-disabled.

## 10. Recommended broader P1 improvement roadmap

### Top 10 broader changes

1. Create a P1 syllabus-contract matrix using official 2023-2025 and 2026-2027 syllabus wording, with `covered`, `thin`, `missing`, `scope concern`, and `exam-bridge needed`.
2. Add at least one source-backed worked example per unit that mirrors a real old-paper mark-scheme sequence.
3. Build a reviewed P1 skill map before any mastery/readiness evidence is considered.
4. Add a small reviewed P1 exam-image sampler only after topic routes are manually checked.
5. Strengthen Functions with domain/range, one-one, inverse restriction, and composite domain compatibility.
6. Strengthen Circular Measure with compound sector/triangle diagram decomposition.
7. Strengthen Trigonometry with identity-proof steps and all-solution interval reasoning.
8. Strengthen Series with unknown-parameter AP/GP and mixed progression problems.
9. Strengthen Differentiation with increasing/decreasing intervals, connected rates, and graph-sketch use of stationary points.
10. Keep Integration advanced items fenced until examples are reviewed against the official contract and old-paper mark schemes.

### Fix before colleague assessment

- Coordinate Geometry Viability Pass 001.
- Add a one-paragraph visible reviewer note on the Coordinate Geometry practice page explaining draft/support-only status and the intended written-working expectation.
- Prepare 3-5 local old-paper coordinate examples as reviewer reference cards, using existing image crops.

### Can wait until after student observation

- Whole-course Skill Check expansion.
- Reviewed P1 mastery evidence.
- Runtime-safe P1 question-bank projection.
- Broad renderer changes for written multi-part answers.
- Full P1 reviewed skill map, unless the colleague assessment is explicitly about official readiness.

### Needs source-contract review before implementation

- Any claim that a Skill Check is exam-ready.
- Topic routing from old Paper 1 records into reviewed P1 skills.
- Trigonometry reciprocal identity scope beyond the P1 identities.
- Integration improper/volume examples beyond the currently fenced draft support.
- Any Content Lab publication or mastery use.

### Future reviewed mastery evidence

Only after source-skill and mark-event review:

- Correctly completed structured old-paper attempts with canonical question and mark-scheme image pairs.
- Mark-scheme-aligned method steps for line-circle/tangent questions.
- Written reasoning for discriminant intersection conditions.
- Verified topic labels from a reviewed P1 skill map.

### Should remain support-only

- Current authored Skill Checks.
- Quick recall drills.
- Multiple-choice method-order checks.
- Any items using unreviewed sidecar routing.
- Any teacher-guided Integration advanced placeholders until reviewed.

## 11. Blockers and missing evidence

- No local official Cambridge syllabus PDF is stored in the repo. The audit used official Cambridge URLs and temporary `/tmp` downloads.
- No full old Paper 1 question-paper PDFs or full mark-scheme PDFs were found in the repo.
- The project does have old-paper question and mark-scheme image crops, but they are not the same as full PDFs.
- P1 has 401 catalog/question-bank records with image pairs, but 0 reviewed/runtime-safe P1 records in `asterion_question_bank_v1.json`.
- P1 topic routing exists, but it is DeepSeek sidecar routing, not reviewed skill routing.
- The local P1 content-model PDFs extracted mostly headings, so detailed authored content was audited primarily from `src/data/p1SeedContent.ts` and generated pages.
- The current UI does not require written working for Skill Checks, so multiple-choice correctness can overstate readiness.

## 12. Final decision

**READY_WITH_COORDINATE_WARNINGS**

Coordinate Geometry can be shown to a colleague as a draft viability unit only if the framing is honest: the current layer demonstrates Asterion's support-check concept, not a high-level exam-preparation guarantee. Without Viability Pass 001, the colleague is likely to see a gap between the polished foundation loop and the old-paper behaviours that determine real Paper 1 marks.

The strongest current Coordinate Geometry evidence is that every current subtopic has at least three support checks and the checks avoid partial-answer traps for line equations, centre/radius pairs, and intersection points. The decisive weakness is that the unit does not yet train the old-paper chains: expanded circle to centre/radius, midpoint/distance, perpendicular bisectors, line-circle substitution, tangent-radius gradients, discriminant conditions, and geometry follow-through.

The next implementation pass should be narrow, source-backed, and still support-only.

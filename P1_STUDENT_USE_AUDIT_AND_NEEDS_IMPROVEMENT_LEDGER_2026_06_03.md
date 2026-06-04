# P1 Student-Use Audit and Needs-Improvement Ledger - 2026-06-03

## Overall Verdict

**READY_WITH_WARNINGS**

The current P1 Skill Check set is usable for a first draft student trial next week if it is presented exactly as draft, support-only practice. The set has broad coverage across all 9 P1 units and all 38 current Field Guide subtopics, with 115 draft Skill Checks. The quality-pass baseline removed the worst hidden-code, partial-answer, and artificial answer-shape issues, and the generated static practice pages visibly label the checks as draft support material that does not create marks, mastery, adaptive selection, or exam evidence.

The warnings are substantial. This is not a syllabus-contract reviewed P1 course layer, not a source-reviewed exam layer, and not safe for readiness/mastery evidence. Several units are still short-drill heavy rather than exam-structured. Integration has the largest student-use risk because improper integrals and volumes of revolution remain explicit draft placeholders pending source-contract confirmation. Circular Measure, Trigonometry, Binomial Expansion, Differentiation, and Integration need stronger exam-style structure in the next pass.

One narrow generated-page wording fix was made during this audit: the static Skill Check page boilerplate used a hard-coded "M1 Field Guide path" label on P1 practice pages. `scripts/build-static-site.ts` now renders the current course short name, so regenerated P1 pages say "P1 Field Guide path." No P1 Skill Check item answer, review state, route, or content scope was changed.

## Audit Sources

- `src/data/p1SkillCheckItems.ts`
- `src/data/p1SeedContent.ts`
- `src/data/skillCheckItems.ts`
- `src/tests/skillChecklist.test.ts`
- `src/tests/courseSeedContent.test.ts`
- `P1_SKILL_CHECK_EXPANSION_001_REPORT_2026_06_03.md`
- `P1_SKILL_CHECK_TEMPORARY_CLEANUP_LEDGER_2026_06_03.md`
- `P1_SKILL_CHECK_QUALITY_ITERATION_001_QUADRATICS_2026_06_03.md`
- `P1_SKILL_CHECK_QUALITY_ITERATION_002_FUNCTIONS_2026_06_03.md`
- `P1_SKILL_CHECK_QUALITY_ITERATION_003_COORDINATE_GEOMETRY_2026_06_03.md`
- `P1_SKILL_CHECK_QUALITY_ITERATION_004_REMAINING_UNITS_2026_06_03.md`
- Generated static practice and Field Guide pages under `docs/p1/topics`

## Guardrail Check

Every P1 Skill Check is expected to remain:

- `review.status: 'draft_review_needed'`
- `review.sourceSkillReviewed: false`
- `review.markEventReviewed: false`
- `review.affectsMastery: false`
- `review.supportOnly: true`
- `review.evidenceEnabled: false`

The existing P1 tests enforce these guardrails for all current P1 items. This audit did not enable P1 mastery/readiness evidence and did not convert any item to reviewed status.

## Unit-By-Unit Verdict Table

| Unit | Item count | Readiness status | Biggest strength | Biggest weakness | Recommended next action |
| --- | ---: | --- | --- | --- | --- |
| Quadratics | 15 | Ready for student draft use | Strongest quality template: 3 items per subtopic, full root/interval/graph targets, good multiple-choice distractors. | Still short Skill Checks, not source-reviewed Cambridge structured items. | Use as the model for the first reviewed P1 batch after syllabus-contract review. |
| Functions and Transformations | 15 | Ready for student draft use | Clean coverage of composition order, inverse interpretation, translations, reflections, stretches, and point mappings. | Domain/range restrictions and restricted inverse examples are not meaningfully tested. | Add one bounded domain/range mini-batch after source-contract review. |
| Coordinate Geometry | 12 | Ready for student draft use | Full line equations, centre/radius pairs, and full intersection points avoid partial-answer traps. | No completing-square-from-general-circle item and limited diagram-style interpretation. | Add one source-aligned circle/completing-square item and one richer intersection item later. |
| Circular Measure | 6 | Usable with warnings | Radian conversion, arc length, sector area, and reverse arc formula are clear and renderer-safe. | Field Guide mentions compound circular shapes, but checks stay on simple formula substitution. | Add a small compound sector/triangle setup batch after student trial. |
| Trigonometry | 13 | Usable with warnings | Exact values and complete solution-set multiple choice are usable for first support practice. | Graph and identity items are shallow; one identity uses reciprocal notation that needs source-scope confirmation. | Prioritize full-solution-set reasoning and identity-scope audit. |
| Binomial Expansion | 6 | Usable with warnings | Basic expansions and coefficient-targeting are mathematically clear. | Only two subtopics and mostly coefficient/expansion recognition; little structured term-selection work. | Add one exam-style term-selection/check-sign batch later. |
| Series | 9 | Ready for student draft use | Balanced AP, GP, and infinite GP coverage with correct convergence condition. | Mostly final-answer numeric drills; little unknown-parameter setup. | Add an unknown-parameter AP/GP batch after initial trial. |
| Differentiation | 21 | Usable with warnings | Broadest coverage: gradients, power rule, chain rule, second derivative, tangents/normals, stationary points, rates. | Overbuilt relative to smaller units and some applications do not require units/context despite Field Guide wording. | Tighten rates-of-change wording and add one structured tangent/stationary item later. |
| Integration | 18 | Usable with warnings | Basic integration, constants, definite integrals, and area-between-curves are mostly clear and correct. | Improper integrals and volumes of revolution remain draft placeholders with source-contract risk. | First priority: decide whether placeholder subtopics remain visible for student trial or are fenced in teacher guidance. |

## Needs-Improvement Ledger

| Severity | Unit | Subtopic | Item ID or Field Guide section | Issue | Why it matters | Recommended fix | Timing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| High | Integration | Improper integrals | `p1-sc-integration-improper-001`, `002`, `003`; Field Guide section | Improper integrals are explicitly marked as draft placeholders and need source-contract confirmation. | Students may treat placeholder items as normal P1 expectations, creating false syllabus confidence. | Confirm P1 scope against the final course contract; if retained, rewrite as clearly scaffolded source-aligned items. | Before broad student rollout; can be watched in first small trial with teacher warning. |
| High | Integration | Volumes of revolution | `p1-sc-integration-volumes-001`, `002`, `003`; Field Guide section | Volumes of revolution are explicit draft placeholders and likely need syllabus-scope review before student reliance. | This can over-teach content if it is outside the intended P1 course contract. | Run source-contract check and either remove from visible P1 trial guidance later or rewrite as reviewed support if confirmed. | Before broad student rollout; small trial only with warning. |
| High | All units | All subtopics | Full set | Items are support-only and evidence-disabled but still have "Save attempt" controls in generated pages. | Students may interpret saved attempts as formal progress unless teacher messaging is clear. | Keep evidence disabled; add teacher trial guidance explaining that saved attempts are observational only. | Before student use. |
| Medium | Trigonometry | Trigonometric identities | `p1-sc-trig-identities-003`; Field Guide identities section | Uses `1+tan^2x=sec^2x`; reciprocal identity scope needs final P1 source confirmation. | If reciprocal notation is outside the intended P1 support contract, the item may feel advanced or off-map. | Confirm identity list; replace with sin/cos/tan-only manipulation if needed. | Before second pass, or before trial if teacher wants a stricter P1-only surface. |
| Medium | Trigonometry | Trigonometric equations | `p1-sc-trig-equations-001` to `004` | Complete solution sets are present, but reasoning is mostly multiple choice or one numeric answer. | Students can guess answer sets without practicing quadrant/period reasoning. | Add one structured ordered-reasoning or multi-step item when renderer support allows it. | After student trial. |
| Medium | Trigonometry | Graphs | `p1-sc-trig-graphs-001` to `003`; Field Guide graphs section | Period and amplitude checks are clear but too shallow for graph transformation fluency. | Students may pass the unit without identifying graph shape, intercepts, or transformations. | Add diagram/table-linked or richer description items later. | After student trial. |
| Medium | Circular Measure | Arc length and sector area | `p1-sc-circular-arc-sector-001` to `003`; Field Guide arc-sector section | Skill Checks test direct formula use only; Field Guide and exam style mention compound shapes. | Students may not be prepared for sector plus triangle/perimeter exam tasks. | Add one compound-shape setup item and one perimeter/area distinction item. | After student trial. |
| Medium | Binomial Expansion | Basic and complex expansions | `p1-sc-binomial-basic-001` to `003`, `p1-sc-binomial-complex-001` to `003` | Coverage is correct but compact; coefficient-only items may encourage answer hunting. | Students need more practice choosing a general term and controlling signs. | Add a structured term-selection item and one sign-tracking item. | After student trial. |
| Medium | Differentiation | Rates of change | `p1-sc-diff-rates-001` to `003`; Field Guide rates section | Field Guide says rates need units/context, but current answers are bare numbers. | Students may learn algebra without the interpretation habit needed for applied questions. | Rewrite or supplement with items that ask for velocity/rate wording or units. | After student trial. |
| Medium | Differentiation | Stationary points | `p1-sc-diff-stationary-002` | Asks only for stationary x-values, while the Field Guide stresses coordinates and classification. | This is mathematically legitimate but lower-fidelity than the stated student goal. | Add or replace with a full coordinate-and-nature item in the reviewed pass. | After student trial. |
| Medium | Coordinate Geometry | Circles | Field Guide circles section; current circle items | No item asks students to complete the square from a general circle equation. | Students may not bridge from expanded equations to centre/radius form. | Add one source-aligned completing-square circle item after scope review. | After student trial. |
| Medium | Coordinate Geometry | Intersections | `p1-sc-coordinate-intersections-003` | Line-circle intersection is intentionally very simple (`y=0`). | It verifies substitution but not the quadratic simultaneous-equation route students will meet later. | Add a non-axis line-circle intersection or line-curve intersection in next content pass. | After student trial. |
| Medium | Functions and Transformations | Inverse functions | `p1-sc-functions-inverse-001` to `003`; Field Guide inverse section | No domain/range restriction or many-to-one restriction check. | Students can miss a central inverse-function exam issue. | Add one restriction/domain item only after source-contract review. | After student trial. |
| Medium | Functions and Transformations | Transformations | Transformation subtopics | Items are notation-first and point-mapping-first, not graph/image-first. | Students may know rules but struggle to read transformed graphs. | Add one graph interpretation item when renderer/asset support is available. | After student trial. |
| Medium | Series | AP/GP | `p1-sc-series-ap-*`, `p1-sc-series-gp-*` | Balanced but mostly known-parameter numeric drills. | Exam questions often ask for unknowns from terms/sums, not only direct substitution. | Add one AP unknown-parameter and one GP unknown-parameter item. | After student trial. |
| Low | Quadratics | Formula | `p1-sc-quadratics-formula-*` | Formula checks rely on multiple choice rather than typed substitution or simplification. | Multiple choice is safer for parsing but hides algebra-writing skill. | Add structured source-reviewed formula item later. | After student trial. |
| Low | Quadratics | Graphs | `p1-sc-quadratics-graphs-*` | Graph items are algebraic/feature recognition rather than visual sketch interpretation. | Students may still struggle to connect equations to sketches. | Add a graph-image or sketch-description item if renderer supports it. | After student trial. |
| Low | Circular Measure | Radians | `p1-sc-circular-radians-002` | Numeric answer accepts degree-symbol variants while page also displays a degree suffix. | Minor display/entry ambiguity may confuse some students. | Watch trial entries; standardize degree suffix handling later if needed. | After student trial. |
| Low | All units | Generated Field Guides | Field Guide practice prompt sections | Field Guide prompts are generic, while Skill Checks are now more specific. | Students may not always see a direct bridge from notes to exact prompt shape. | Add one "before Skill Check" mini-example per thinner subtopic later. | After student trial. |
| Low | All units | Full set | Full set | Unit balance is uneven: Differentiation has 21 items and Integration 18, while Circular Measure and Binomial have 6 each. | Larger units may feel like heavier workload even though counts follow subtopic structure. | Use completion expectations by subtopic, not raw unit count, during trial. | Before student use guidance. |

## Top 10 Fixes For The Next Pass

1. Run a source-contract decision on Integration improper integrals and volumes of revolution.
2. Add teacher-facing trial guidance that P1 saved attempts are not mastery, marks, readiness, or reviewed evidence.
3. Audit Trigonometry identity scope, especially reciprocal identities, against the intended P1 contract.
4. Add one structured trigonometric equation item that requires reference angle plus quadrant/period reasoning.
5. Add one Circular Measure compound-shape setup item covering sector plus triangle or sector perimeter.
6. Add one Binomial term-selection item that forces the general-term setup and sign tracking.
7. Add one Differentiation rates-of-change item that requires context/unit interpretation.
8. Add one Coordinate Geometry circle completing-square item if it is source-aligned.
9. Add one Functions inverse domain/range restriction item if source-aligned.
10. Add one Series unknown-parameter item for AP or GP setup.

## Student-Trial Guidance

Use the current P1 layer as guided draft support, not as an independent readiness signal. Teachers or observers should watch for these signals:

- Students thinking "saved attempt" means formal mastery, teacher marking, or exam readiness.
- Students completing multiple-choice items quickly without writing any working.
- Students treating Integration placeholder items as confirmed P1 syllabus expectations.
- Students getting correct trigonometry answer sets by recognition but failing to explain quadrants or periods.
- Students confusing degree/radian conventions in Circular Measure and Trigonometry.
- Students passing direct differentiation/integration drills but failing to form the line, area, or rate setup.
- Students skipping Field Guide reading and using hints as the first teaching source.
- Students leaving exact-answer text boxes blank because they are unsure whether to type fractions, TeX, or decimals.
- Students struggling disproportionately with smaller units because the Field Guide examples are thinner than the Skill Check variants.
- Students assuming draft support-only pages replace canonical exam question images or mark-scheme practice.

Likely teacher-support topics next week:

- Trigonometric equations and quadrant reasoning.
- Circular Measure compound-shape interpretation.
- Differentiation applications, especially tangents/normals, stationary points, and rates.
- Integration scope and placeholder items.
- Binomial coefficient signs and term choice.
- Functions inverse restrictions and transformation point mappings.

## Recommended Next Implementation Pass

### P1 Needs-Improvement Pass 001

**Goal:** Improve student-trial safety and the highest-risk P1 support gaps without expanding the entire set or enabling evidence.

**Bounded scope:**

- Confirm or quarantine Integration improper-integral and volume-of-revolution placeholder items.
- Tighten Trigonometry identity scope.
- Add or revise at most 8 high-leverage Skill Checks across the weakest student-use areas:
  - 1 trigonometric equation reasoning item.
  - 1 Circular Measure compound-shape setup item.
  - 1 Binomial term-selection/sign item.
  - 1 Differentiation rate/context item.
  - 1 Coordinate Geometry circle completing-square item, only if source-aligned.
  - 1 Functions inverse domain/range item, only if source-aligned.
  - 1 Series unknown-parameter item.
  - 1 Integration basic/area item if placeholder items are quarantined rather than retained.

**Non-goals:**

- Do not enable P1 mastery, readiness, rank, adaptive selection, or reviewed status.
- Do not redesign the renderer.
- Do not add backend, authentication, teacher/class flows, or dynamic progress systems.
- Do not touch P3 or M1 source files.
- Do not expand all units broadly.

**Acceptance criteria:**

- P1 items still pass the support-only/evidence-disabled guardrails.
- Any retained Integration advanced placeholder is explicitly justified by source-contract evidence or clearly fenced as teacher-guided draft support.
- No hidden-code answers, artificial coefficient/exponent prompts, or partial-answer prompts are introduced.
- Static P1 practice pages regenerate cleanly.
- `npm test`, `npm run build`, and `npm run static:check` pass.

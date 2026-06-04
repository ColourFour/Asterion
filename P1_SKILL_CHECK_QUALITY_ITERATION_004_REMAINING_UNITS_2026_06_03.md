# P1 Skill Check Quality Iteration 004: Remaining Units Sweep

Date: 2026-06-03

## Scope

This pass audited and improved the remaining P1 Skill Check units that had not already received a focused quality pass:

- Circular Measure
- Trigonometry
- Binomial Expansion
- Series
- Differentiation
- Integration

Quadratics, Functions and Transformations, and Coordinate Geometry were treated as already-passed baselines and were not changed in this sweep.

## Readiness Position

The remaining P1 units are now ready for a student-use audit as draft support material. They are not final syllabus-contract reviewed items and must not be used for mastery or readiness evidence.

All P1 Skill Checks remain:

- `review.status: 'draft_review_needed'`
- `review.sourceSkillReviewed: false`
- `review.markEventReviewed: false`
- `review.affectsMastery: false`
- `review.supportOnly: true`
- `review.evidenceEnabled: false`

## Count Summary

P1 Skill Check count before this sweep: 101

P1 Skill Check count after this sweep: 115

This keeps the full P1 set inside the intended draft-coverage range while raising the remaining units to a more consistent minimum.

## Count By Unit And Subtopic

| Unit | Subtopic | Count |
| --- | --- | ---: |
| Quadratics | Solving by factoring | 3 |
| Quadratics | Solving inequalities | 3 |
| Quadratics | Solving by quadratic formula | 3 |
| Quadratics | Discriminant | 3 |
| Quadratics | Graphs of quadratic functions | 3 |
| Functions and transformations | Composite functions | 3 |
| Functions and transformations | Inverse functions | 3 |
| Functions and transformations | Translations | 3 |
| Functions and transformations | Reflections | 3 |
| Functions and transformations | Stretches | 3 |
| Coordinate geometry | Parallel and perpendicular lines | 3 |
| Coordinate geometry | Equation of a straight line | 3 |
| Coordinate geometry | Circles | 3 |
| Coordinate geometry | Points of intersection | 3 |
| Circular measure | Radians | 3 |
| Circular measure | Arc length and sector area | 3 |
| Trigonometry | Exact values | 3 |
| Trigonometry | Graphs of trigonometric functions | 3 |
| Trigonometry | Trigonometric equations | 4 |
| Trigonometry | Trigonometric identities | 3 |
| Binomial expansion | Binomial expansion | 3 |
| Binomial expansion | More complex expansions | 3 |
| Series | Arithmetic progressions | 3 |
| Series | Geometric progressions | 3 |
| Series | Infinite geometric progressions | 3 |
| Differentiation | Gradient of tangent | 3 |
| Differentiation | Differentiation of polynomials | 3 |
| Differentiation | Chain rule | 3 |
| Differentiation | Second derivative | 3 |
| Differentiation | Equations of tangents and normals | 3 |
| Differentiation | Stationary points | 3 |
| Differentiation | Rates of change | 3 |
| Integration | Basic integration | 3 |
| Integration | Constant of integration | 3 |
| Integration | Definite integrals | 3 |
| Integration | Area bounded between curves | 3 |
| Integration | Improper integrals | 3 |
| Integration | Volumes of revolution | 3 |

## Items Rewritten

The sweep removed several artificial or fragile answer formats from the remaining units. The main rewrites converted partial numeric probes into student-facing multiple-choice items where the mathematical target is a full exact answer, expression, setup, curve equation, or volume.

Rewritten items:

- `p1-sc-circular-radians-001`
- `p1-sc-circular-arc-sector-001`
- `p1-sc-circular-arc-sector-002`
- `p1-sc-binomial-basic-001`
- `p1-sc-diff-polynomials-001`
- `p1-sc-diff-chain-rule-001`
- `p1-sc-diff-chain-rule-002`
- `p1-sc-integration-basic-001`
- `p1-sc-integration-basic-002`
- `p1-sc-integration-constant-001`
- `p1-sc-integration-constant-002`
- `p1-sc-integration-volumes-001`
- `p1-sc-integration-volumes-002`

## Items Added

Fourteen items were added to bring weaker remaining subtopics up to a consistent three-item floor and to add more method variation.

Added items:

- `p1-sc-circular-radians-003`
- `p1-sc-trig-exact-values-003`
- `p1-sc-binomial-basic-003`
- `p1-sc-series-ap-003`
- `p1-sc-series-gp-003`
- `p1-sc-diff-gradient-tangent-003`
- `p1-sc-diff-polynomials-003`
- `p1-sc-diff-second-derivative-003`
- `p1-sc-integration-basic-003`
- `p1-sc-integration-constant-003`
- `p1-sc-integration-definite-003`
- `p1-sc-integration-area-between-003`
- `p1-sc-integration-improper-003`
- `p1-sc-integration-volumes-003`

No items were removed in this sweep.

## Strongest Areas After Sweep

- Differentiation now has consistent three-item coverage across every listed subtopic, including tangent gradients, polynomial differentiation, chain rule, second derivative, tangents and normals, stationary points, and rates of change.
- Integration now has three items per subtopic and avoids the weakest previous partial-answer patterns for basic integration, constants of integration, and volumes of revolution.
- Series now has balanced arithmetic, finite geometric, and infinite geometric progression coverage.
- Circular Measure now uses exact-answer choices for radian conversion and sector/arc calculations instead of coefficient-only responses.

## Remaining Rough Areas

- All items are still authored draft content and have not been source-skill reviewed against official Cambridge 9709 paper evidence.
- Improper integrals and volumes of revolution are intentionally retained because they appear in the uploaded P1 content map, but they remain draft placeholders pending source-contract review.
- Trigonometry has useful short practice coverage, but future review should add more exam-style structure around identities, graph transformations, and multi-solution equation reasoning.
- Binomial coefficient questions are valid for the topic, but later review should add more complete expansion and term-selection variety.
- The current renderer-safe item shapes limit free-form symbolic entry, so multiple choice is used where exact expression parsing would be fragile.

## Risks To Audit Later

- Syllabus-contract risk: draft items may include examples that need tightening after checking the intended P1 source contract and official Cambridge 9709 syllabus wording.
- Student interpretation risk: some concise prompts may need fuller worked solutions or clearer notation after student testing.
- Support-only risk: these items must remain excluded from mastery/readiness evidence until source review and mark-event review are complete.
- Static content drift risk: generated static pages should be regenerated after each P1 data pass so practice pages match source data.

## Recommended Next Cleanup Order

1. Run a whole-P1 student-use audit through the static pages now that every P1 unit has a quality-pass floor.
2. Review Trigonometry next for exam-style multi-step reasoning and identity manipulation.
3. Review Differentiation and Integration together for notation, domain/scope, and application wording.
4. Do a source-contract check on improper integrals and volumes of revolution before building them beyond placeholder draft support.
5. After student-use audit, decide whether P1 is ready for a first source-reviewed Skill Check batch or whether another renderer-support pass is needed first.

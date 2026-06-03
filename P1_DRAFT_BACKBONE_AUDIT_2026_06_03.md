# P1 Draft Backbone Audit - 2026-06-03

Report location note: this report is kept outside `docs/` because `npm run static:check` rejects Markdown files in `docs/`; that directory is generated static-site output only.

## Scope Audited

Audited the new P1 draft backbone added through:

- `src/data/p1SeedContent.ts`
- `src/data/p1SkillCheckItems.ts`
- P1 registration in `src/data/courseSeedContent.ts`
- P1 support-only Skill Check registration and validation in `src/data/skillCheckItems.ts`
- P1 rough aliases in `src/lib/courseExamTraining.ts`
- P1 coverage tests in `src/tests/courseSeedContent.test.ts` and `src/tests/skillChecklist.test.ts`
- regenerated static pages under `docs/p1/` and `docs/static-pages.json`

No structural code fix was needed during this audit.

## Diff Separation

P1-related changes are confined to the P1 seed data, P1 Skill Check data, shared course/Skill Check registration, P1 rough exam-topic aliases, P1 tests, and generated P1 static pages.

No P3-specific content, P3 routing maps, P3 Field Guide data, P3 Skill Check item files, or P3-specific tests showed an intentional diff. The shared `skillCheckItems.ts` file changed only to admit P1 draft support items and validate them under P1-specific support-only rules.

M1 work observed around the previous implementation was treated as separate context and did not drive this P1 audit decision.

## Structural Checks

The implemented P1 backbone has:

- 9 units.
- 38 Field Guide subtopics.
- 38 draft Skill Check items.
- no duplicate P1 topic, slug, Field Guide section, Skill Check item, or P1 skill IDs found by the audit scan.
- no missing or extra Skill Check subtopic coverage.
- generated static pages for dashboard, topic index, each topic overview, each Field Guide page, each practice page, topic Exam Training pages, and course Exam Training.

P1 unit counts:

| Unit | Slug | Subtopics | Skill Checks |
| --- | --- | ---: | ---: |
| Quadratics | `quadratics` | 5 | 5 |
| Functions and Transformations | `functions` | 5 | 5 |
| Coordinate Geometry | `coordinate-geometry` | 4 | 4 |
| Circular Measure | `circular-measure` | 2 | 2 |
| Trigonometry | `trigonometry` | 4 | 4 |
| Binomial Expansion | `binomial-expansion` | 2 | 2 |
| Series | `series` | 3 | 3 |
| Differentiation | `differentiation` | 7 | 7 |
| Integration | `integration` | 6 | 6 |

The route `p1/topics/functions/` is retained for compatibility while displaying the unit title "Functions and Transformations". This is acceptable and avoids breaking the earlier P1 route.

## Source Coverage Check

Text extraction from `content-model/P1/p1-content map.pdf` confirms the source map includes the same 9 topic groups:

- Quadratics
- Functions and transformations
- Coordinate geometry
- Circular measure
- Trigonometry
- Binomial expansion
- Series
- Differentiation
- Integration

The extracted source map and `content-model/P1/integration.pdf` both explicitly list:

- Improper integrals
- Volumes of revolution

Therefore those two Integration subtopics should not be rejected merely for feeling advanced. They are in the intended uploaded source. They should remain clearly draft/support-only until a syllabus-contract review decides final scope and wording.

One source-map quirk: Differentiation appears to repeat "Gradient of tangent" in the extracted text. The implementation follows the task-normalized unique list and does not duplicate that subtopic.

## Render and Static Output Check

Generated P1 pages render as static HTML with `<main>` content. The audit checked:

- `docs/p1/index.html`
- `docs/p1/topics/index.html`
- all 9 P1 topic overview pages
- all 9 P1 Field Guide pages
- all 9 P1 practice pages

Each P1 Field Guide page contains visible section content with the required draft bullets: learning goal, key method, draft worked example, common mistake, and quick takeaway.

Each P1 practice page contains a visible "Draft Skill Checks" section and support-only save controls.

`docs/static-pages.json` declares the expected P1 dashboard, topic, Field Guide, practice, and Exam Training pages.

## Skill Check Contract Status

All 38 P1 Skill Checks are:

- `courseId: 'p1'`
- `paperFamily: 'p1'`
- `regionId: 'p1-draft-skill-check'`
- `review.status: 'draft_review_needed'`
- `review.sourceSkillReviewed: false`
- `review.markEventReviewed: false`
- `review.affectsMastery: false`
- `review.supportOnly: true`
- `review.evidenceEnabled: false`

They pass the shared Skill Check contract validator and deterministic answer validator.

## Skill Check Readiness Classification

Legend:

- Usable temporary support: acceptable as a draft low-stakes prompt while the proper quality pass starts.
- Needs rewrite before student use: should not be the student-facing version for next serious release without prompt rewrite.
- Unsafe/misleading: should be fixed before any student use.
- Replace with exam-style structured item: concept is valid, but Iteration 001 should turn it into a fuller exam-style prompt.

| Item | Classification | Audit note |
| --- | --- | --- |
| `p1-sc-quadratics-factoring-001` | Usable temporary support | Good first root check, but final version should ask for both roots. |
| `p1-sc-quadratics-inequalities-001` | Replace with exam-style structured item | Endpoint-only answer under-tests interval reasoning. |
| `p1-sc-quadratics-formula-001` | Usable temporary support | Clear formula drill; later ask for both roots and exact form. |
| `p1-sc-quadratics-discriminant-001` | Usable temporary support | Good basic discriminant check. |
| `p1-sc-quadratics-graphs-001` | Usable temporary support | Good vertex-form check. |
| `p1-sc-functions-composite-001` | Usable temporary support | Good order-of-composition check. |
| `p1-sc-functions-inverse-001` | Usable temporary support | Good inverse-value check. |
| `p1-sc-functions-translations-001` | Usable temporary support | Acceptable, though it isolates only vertical shift. |
| `p1-sc-functions-reflections-001` | Needs rewrite before student use | Numeric code for axis choice is artificial; use multiple choice or written axis label. |
| `p1-sc-functions-stretches-001` | Usable temporary support | Good reciprocal-scale check. |
| `p1-sc-coordinate-parallel-perpendicular-001` | Usable temporary support | Good negative-reciprocal check. |
| `p1-sc-coordinate-straight-line-001` | Usable temporary support | Good line-equation constant check. |
| `p1-sc-coordinate-circles-001` | Usable temporary support | Good radius-from-equation check. |
| `p1-sc-coordinate-intersections-001` | Replace with exam-style structured item | x-coordinate only is too thin for intersections. |
| `p1-sc-circular-radians-001` | Usable temporary support | Good exact-radian conversion check. |
| `p1-sc-circular-arc-sector-001` | Usable temporary support | Good arc-length formula check. |
| `p1-sc-trig-exact-values-001` | Usable temporary support | Good exact-value recall. |
| `p1-sc-trig-graphs-001` | Usable temporary support | Good period check. |
| `p1-sc-trig-equations-001` | Replace with exam-style structured item | Larger-solution answer checks interval awareness but should ask for complete solution set. |
| `p1-sc-trig-identities-001` | Needs rewrite before student use | "Enter exponent" is artificial; ask for simplified expression via choice/text. |
| `p1-sc-binomial-basic-001` | Usable temporary support | Good coefficient check. |
| `p1-sc-binomial-complex-001` | Usable temporary support | Good sign/coefficient check. |
| `p1-sc-series-ap-001` | Usable temporary support | Good AP term check. |
| `p1-sc-series-gp-001` | Usable temporary support | Good GP term check. |
| `p1-sc-series-infinite-gp-001` | Usable temporary support | Good convergence/formula check, but later add a validity decision. |
| `p1-sc-diff-gradient-tangent-001` | Usable temporary support | Good derivative-as-gradient check. |
| `p1-sc-diff-polynomials-001` | Usable temporary support | Good power-rule check. |
| `p1-sc-diff-chain-rule-001` | Usable temporary support | Good missing-inner-derivative check. |
| `p1-sc-diff-second-derivative-001` | Usable temporary support | Good second-derivative drill. |
| `p1-sc-diff-tangents-normals-001` | Usable temporary support | Good normal-gradient drill. |
| `p1-sc-diff-stationary-001` | Replace with exam-style structured item | x-coordinate only is too thin for stationary point work. |
| `p1-sc-diff-rates-001` | Usable temporary support | Good rate-from-derivative check. |
| `p1-sc-integration-basic-001` | Usable temporary support | Good reverse-power-rule check. |
| `p1-sc-integration-constant-001` | Usable temporary support | Good constant-of-integration check. |
| `p1-sc-integration-definite-001` | Usable temporary support | Good definite-integral check. |
| `p1-sc-integration-area-between-001` | Needs rewrite before student use | "coefficient of first term" is too artificial; ask for setup or area value. |
| `p1-sc-integration-improper-001` | Usable temporary support | Source-backed as draft placeholder; keep clearly marked until scope review. |
| `p1-sc-integration-volumes-001` | Usable temporary support | Source-backed as draft placeholder; keep clearly marked until scope review. |

Unsafe/misleading count: 0.

Needs rewrite before student use: 3.

Should be replaced by exam-style structured item: 4.

Usable as temporary support: 31.

## Readiness Decision

The P1 backbone is structurally ready for a bounded Skill Check quality pass. It is not blocked. The main deferrals are prompt-quality deferrals, not architecture or routing defects:

- Several prompts are atomized numeric probes rather than student-natural Skill Check items.
- Some major skills need complete-answer formats rather than endpoint/coefficient-only answers.
- The advanced Integration entries are source-backed but must remain draft/support-only until syllabus-contract review.

Decision: ready with minor deferrals.

## Recommended P1 Skill Check Iteration 001 Batch

Start with Quadratics. Reasons:

- It is the first P1 unit and likely the first student path.
- It has exactly 5 subtopics, so the full unit fits in a bounded batch.
- The current checks are mostly structurally sound but need better student-facing answer formats.
- Quadratics touches solving, inequalities, discriminant interpretation, and graph reading, making it a good template for later P1 quality passes.

Recommended batch, 5 items:

1. `p1-sc-quadratics-factoring-001`: rewrite to require both roots, accept unordered two-value response.
2. `p1-sc-quadratics-inequalities-001`: replace endpoint-only prompt with full interval solution using multiple choice or two-bound field.
3. `p1-sc-quadratics-formula-001`: rewrite as formula setup plus both roots, with sign-error distractors.
4. `p1-sc-quadratics-discriminant-001`: extend from numeric discriminant to discriminant plus root-count interpretation.
5. `p1-sc-quadratics-graphs-001`: keep vertex-form focus but ask for vertex coordinate and graph-opening direction.

READY_WITH_MINOR_DEFERRALS

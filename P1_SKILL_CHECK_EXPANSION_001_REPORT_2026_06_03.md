# P1 Skill Check Expansion 001 Report - 2026-06-03

## Summary

Expansion 001 grows P1 from 38 draft Skill Check items to 97 draft Skill Check items.

The expansion keeps the existing P1 course shell, Field Guide subtopics, Skill Check renderer, and support-only review state. It is a fast coverage pass for student practice next week, not a reviewed mastery-evidence pass.

## Guardrails

Every P1 Skill Check remains:

- `review.status: 'draft_review_needed'`
- `sourceSkillReviewed: false`
- `markEventReviewed: false`
- `affectsMastery: false`
- `supportOnly: true`
- `evidenceEnabled: false`

The expansion uses existing deterministic renderer shapes only: numeric and multiple choice.

## Total Count

| Course | Skill Check count |
| --- | ---: |
| P1 | 97 |

## Count by Unit and Subtopic

| Unit | Total | Subtopic | Count |
| --- | ---: | --- | ---: |
| Quadratics | 14 | Solving by factoring | 3 |
| Quadratics | 14 | Solving inequalities | 3 |
| Quadratics | 14 | Solving by quadratic formula | 3 |
| Quadratics | 14 | Discriminant | 3 |
| Quadratics | 14 | Graphs of quadratic functions | 2 |
| Functions and Transformations | 14 | Composite functions | 3 |
| Functions and Transformations | 14 | Inverse functions | 3 |
| Functions and Transformations | 14 | Translations | 3 |
| Functions and Transformations | 14 | Reflections | 2 |
| Functions and Transformations | 14 | Stretches | 3 |
| Coordinate Geometry | 10 | Parallel and perpendicular lines | 2 |
| Coordinate Geometry | 10 | Equation of a straight line | 3 |
| Coordinate Geometry | 10 | Circles | 3 |
| Coordinate Geometry | 10 | Points of intersection | 2 |
| Circular Measure | 5 | Radians | 2 |
| Circular Measure | 5 | Arc length and sector area | 3 |
| Trigonometry | 12 | Exact values | 2 |
| Trigonometry | 12 | Graphs of trigonometric functions | 3 |
| Trigonometry | 12 | Trigonometric equations | 4 |
| Trigonometry | 12 | Trigonometric identities | 3 |
| Binomial Expansion | 5 | Binomial expansion | 2 |
| Binomial Expansion | 5 | More complex expansions | 3 |
| Series | 7 | Arithmetic progressions | 2 |
| Series | 7 | Geometric progressions | 2 |
| Series | 7 | Infinite geometric progressions | 3 |
| Differentiation | 18 | Gradient of tangent | 2 |
| Differentiation | 18 | Differentiation of polynomials | 2 |
| Differentiation | 18 | Chain rule | 3 |
| Differentiation | 18 | Second derivative | 2 |
| Differentiation | 18 | Equations of tangents and normals | 3 |
| Differentiation | 18 | Stationary points | 3 |
| Differentiation | 18 | Rates of change | 3 |
| Integration | 12 | Basic integration | 2 |
| Integration | 12 | Constant of integration | 2 |
| Integration | 12 | Definite integrals | 2 |
| Integration | 12 | Area bounded between curves | 2 |
| Integration | 12 | Improper integrals | 2 |
| Integration | 12 | Volumes of revolution | 2 |

## Strongest Temporary Coverage

- Quadratics now has multiple checks across factoring, inequalities, formula use, discriminant interpretation, and graph features.
- Functions and Transformations now has repeated checks on composition order, inverse reversal, and transformation notation.
- Trigonometric equations now has four short checks covering sine, cosine, tangent, intervals, and complete solution sets.
- Differentiation applications now has 18 checks, including tangent gradients, chain rule, tangents/normals, stationary points, and rates of change.
- Coordinate geometry has stronger straight-line and circle coverage with natural multiple-choice distractors.

## Rough Areas

- Improper integrals and volumes of revolution remain draft placeholders because they appear in the uploaded P1 source map but still need source-contract confirmation before heavier build-out.
- Circular measure, binomial expansion, and series are structurally covered but lighter than quadratics, trigonometry, differentiation, and integration.
- Some drill items still use coefficient-style numeric answers where the target is intentionally a coefficient; these should be revisited in the quality pass.
- Most items are short Skill Check prompts, not exam-style structured items with marks and method-credit alignment.

## Risks to Audit Later

- P1 syllabus-contract scope needs formal review before any item can become readiness or mastery evidence.
- Distractors and accepted numeric answer variants need teacher review for ambiguity.
- Exact-value and interval-notation answers should be checked against the final renderer UX before student use at scale.
- Draft placeholder topics could create false confidence if presented without the visible draft/support-only status.
- Static practice pages now contain more draft content, so the next review should prioritize accuracy over further expansion.

## Recommended Cleanup and Review Order

1. Quadratics: convert the strongest 10-12 items into reviewed exam-style structured checks first.
2. Functions and Transformations: audit inverse/domain language and transformation point-mapping wording.
3. Trigonometry: review exact values, graph language, interval conventions, and identity simplification.
4. Differentiation: review stationary-point classification, tangents/normals, and rates-of-change applications.
5. Integration: review definite integrals and area-between-curves before expanding improper integrals or volumes.
6. Coordinate Geometry: check line/circle equation conventions and intersection answer formats.
7. Circular Measure, Binomial Expansion, and Series: add exam-style structured variants after the major topics are stable.

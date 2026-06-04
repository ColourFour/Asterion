# P1 Skill Check Quality Iteration 001 - Quadratics - 2026-06-03

## Summary

This pass audited only the P1 Quadratics Skill Checks. The set moved from 14 draft items to 15 draft items.

All items remain draft, support-only, and evidence-disabled. No P1 mastery or readiness evidence was enabled.

## Guardrails Preserved

- `review.status: 'draft_review_needed'`
- `sourceSkillReviewed: false`
- `markEventReviewed: false`
- `affectsMastery: false`
- `supportOnly: true`
- `evidenceEnabled: false`
- Existing deterministic answer shapes only: numeric and multiple choice.
- No P3 or M1 source files intentionally changed.
- Report kept outside `docs/`.

## Count Before and After

| Scope | Before | After |
| --- | ---: | ---: |
| P1 Quadratics Skill Checks | 14 | 15 |
| Full P1 Skill Checks | 97 | 98 |

## Item Audit

| Item ID | Classification | Notes |
| --- | --- | --- |
| `p1-sc-quadratics-factoring-001` | Minor rewrite | Changed from smaller-root numeric answer to full root-set multiple choice. |
| `p1-sc-quadratics-inequalities-001` | Keep as-is | Already asked for the full interval and had useful distractors. |
| `p1-sc-quadratics-formula-001` | Minor rewrite | Changed from positive-root numeric answer to full root-set multiple choice. |
| `p1-sc-quadratics-discriminant-001` | Keep as-is | Short discriminant calculation with interpretation is acceptable for draft support. |
| `p1-sc-quadratics-graphs-001` | Minor rewrite | Changed from vertex x-coordinate to vertex plus line of symmetry. |
| `p1-sc-quadratics-factoring-002` | Replace | Replaced another full-root drill with a method-recognition item for when factoring is efficient. |
| `p1-sc-quadratics-factoring-003` | Replace | Replaced non-monic single-root drill with a simple rectangle modeling item using a quadratic. |
| `p1-sc-quadratics-inequalities-002` | Keep as-is | Covers outside intervals for a positive product. |
| `p1-sc-quadratics-inequalities-003` | Keep as-is | Covers inclusive endpoints for `<=`. |
| `p1-sc-quadratics-formula-002` | Keep as-is | Good exact-root formula item with simplification distractors. |
| `p1-sc-quadratics-formula-003` | Minor rewrite | Changed from larger-root numeric answer to full root-set multiple choice. |
| `p1-sc-quadratics-discriminant-002` | Keep as-is | Covers parameter condition and distinct-root logic. |
| `p1-sc-quadratics-discriminant-003` | Keep as-is | Covers meaning of `D=0`. |
| `p1-sc-quadratics-graphs-002` | Keep as-is | Covers completed-square vertex and opening direction. |
| `p1-sc-quadratics-graphs-003` | Added | New graph-roots item for x-intercepts from factorised form. |

No Quadratics items were removed.

## Coverage by Subtopic

| Subtopic | Count | Coverage |
| --- | ---: | --- |
| Solving by factoring | 3 | Full roots, factoring-method recognition, simple modeling/application. |
| Solving inequalities | 3 | Between-roots interval, outside-roots interval, inclusive endpoint interval. |
| Solving by quadratic formula | 3 | Full roots, exact surd roots, denominator/sign accuracy. |
| Discriminant | 3 | Numeric discriminant, parameter condition, repeated-root interpretation. |
| Graphs of quadratic functions | 3 | Vertex and line of symmetry, opening direction, x-intercepts/roots. |

## Remaining Weaknesses

- The set is still draft support content, not reviewed Cambridge mark-scheme material.
- Multiple-choice is useful for interval/root-set parsing, but later reviewed items should include structured working and mark-event alignment.
- The modeling item is intentionally simple; it should be replaced or supplemented with a source-aligned exam-style context after syllabus-contract review.
- Graph items now cover key features, but a future pass should add sketch interpretation from an image or table if the renderer supports it cleanly.
- Formula items remain short checks; a reviewed version should test the full substitution line and simplified roots in one structured response.

## Template Decision

Quadratics is now a reasonable quality template for the next P1 unit. The pattern to reuse is:

- Keep every item support-only until source/skill review is complete.
- Prefer full mathematical answers over partial probes.
- Use multiple choice for fragile exact parsing such as intervals, coordinate pairs, root sets, and classifications.
- Keep one method-recognition item, one direct drill item, and one light application or interpretation item where the subtopic supports it.
- Test the unit-level count, subtopic coverage, review flags, and the absence of artificial answer formats.

## Recommended Iteration 002

The next unit should be Functions and Transformations. It is the second P1 unit, currently has 14 draft items, and contains several answer formats that benefit from the same Quadratics template: full transformation descriptions, point mappings, composite order, inverse notation, and domain/range wording.

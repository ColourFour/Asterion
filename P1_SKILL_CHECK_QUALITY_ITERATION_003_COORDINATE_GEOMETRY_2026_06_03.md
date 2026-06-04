# P1 Skill Check Quality Iteration 003 - Coordinate Geometry - 2026-06-03

## Summary

This pass audited only the P1 Coordinate Geometry Skill Checks. The set moved from 10 draft items to 12 draft items.

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
| P1 Coordinate Geometry Skill Checks | 10 | 12 |
| Full P1 Skill Checks | 99 | 101 |

## Item Audit

| Item ID | Classification | Notes |
| --- | --- | --- |
| `p1-sc-coordinate-parallel-perpendicular-001` | Keep as-is | Direct perpendicular-gradient drill remains a valid short target. |
| `p1-sc-coordinate-parallel-perpendicular-002` | Keep as-is | Direct parallel-gradient drill from rearranged line equation remains useful. |
| `p1-sc-coordinate-parallel-perpendicular-003` | Added | New classification item comparing two lines after rearranging into gradient form. |
| `p1-sc-coordinate-straight-line-001` | Minor rewrite | Changed from intercept-only prompt to full line equation multiple choice. |
| `p1-sc-coordinate-straight-line-002` | Keep as-is | Full line equation from gradient and y-intercept. |
| `p1-sc-coordinate-straight-line-003` | Keep as-is | Direct gradient-from-two-points drill remains suitable. |
| `p1-sc-coordinate-circles-001` | Minor rewrite | Changed from radius-only prompt to centre-and-radius multiple choice. |
| `p1-sc-coordinate-circles-002` | Keep as-is | Centre-and-radius recognition with sign/radius distractors. |
| `p1-sc-coordinate-circles-003` | Keep as-is | Circle equation from centre and radius. |
| `p1-sc-coordinate-intersections-001` | Keep as-is | Full line-line intersection point item. |
| `p1-sc-coordinate-intersections-002` | Minor rewrite | Changed from x-coordinate only to full point of intersection. |
| `p1-sc-coordinate-intersections-003` | Added | New simple line-circle intersection item with two points. |

No Coordinate Geometry items were removed.

## Coverage by Subtopic

| Subtopic | Count | Coverage |
| --- | ---: | --- |
| Parallel and perpendicular lines | 3 | Perpendicular gradient, parallel gradient, line relationship classification. |
| Equation of a straight line | 3 | Full line equation, intercept form, gradient from two points. |
| Circles | 3 | Centre/radius recognition, circle equation from centre/radius, sign and radius distractors. |
| Points of intersection | 3 | Line-line full point, second line-line full point, line-circle intersection pair. |

## Remaining Weaknesses

- The set is still draft support content, not reviewed Cambridge mark-scheme material.
- Two gradient items remain numeric because the mathematical target is genuinely a single gradient; later reviewed versions may ask for reasoning steps.
- The line-circle intersection item is intentionally simple. A later exam-style item should include a non-axis line or a quadratic simultaneous-equation step.
- Circle items are notation-driven rather than diagram-driven; future image or diagram support would make this unit stronger.
- No item currently asks students to complete the square from a general circle equation. That should wait for source-contract review and careful scaffolding.

## Template Match

Coordinate Geometry now matches the Quadratics and Functions quality baseline:

- 3 items per subtopic.
- Full mathematical targets where the skill requires full equations, centre-radius pairs, or coordinate points.
- Multiple choice for fragile equation, coordinate-pair, and classification answers.
- Direct drills are retained only where the target is naturally a single value, such as a gradient.
- Unit-specific tests lock the count, subtopic coverage, review flags, supported input shapes, and no partial-answer prompt wording.

## Recommended Iteration 004

The next unit should be Trigonometry. It has high-frequency exam content and several fragile answer formats: exact values, graph period/amplitude, full solution sets, and identity simplification.

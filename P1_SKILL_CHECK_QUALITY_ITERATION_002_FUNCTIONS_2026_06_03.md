# P1 Skill Check Quality Iteration 002 - Functions and Transformations - 2026-06-03

## Summary

This pass audited only the P1 Functions and Transformations Skill Checks. The set moved from 14 draft items to 15 draft items.

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
| P1 Functions and Transformations Skill Checks | 14 | 15 |
| Full P1 Skill Checks | 98 | 99 |

## Item Audit

| Item ID | Classification | Notes |
| --- | --- | --- |
| `p1-sc-functions-composite-001` | Keep as-is | Direct evaluation of `fg(4)` already checks composition order and numeric evaluation cleanly. |
| `p1-sc-functions-composite-002` | Keep as-is | Direct evaluation of `gf(3)` gives a useful contrast with `fg`. |
| `p1-sc-functions-composite-003` | Keep as-is | Forms a symbolic composite with common order distractors. |
| `p1-sc-functions-inverse-001` | Keep as-is | Interprets inverse notation by finding the input that maps to an output. |
| `p1-sc-functions-inverse-002` | Keep as-is | Forms a simple inverse function with useful algebraic distractors. |
| `p1-sc-functions-inverse-003` | Keep as-is | Reinforces inverse-output interpretation without fragile free-text parsing. |
| `p1-sc-functions-translations-001` | Minor rewrite | Changed from vertical-shift numeric answer to full translation multiple choice. |
| `p1-sc-functions-translations-002` | Keep as-is | Full translation description from function notation. |
| `p1-sc-functions-translations-003` | Keep as-is | Renderer-safe point mapping after translation. |
| `p1-sc-functions-reflections-001` | Keep as-is | Already cleaned to full x-axis reflection description. |
| `p1-sc-functions-reflections-002` | Keep as-is | Identifies y-axis reflection from notation. |
| `p1-sc-functions-reflections-003` | Added | New point-mapping item for reflection in the y-axis. |
| `p1-sc-functions-stretches-001` | Minor rewrite | Changed from horizontal scale-factor numeric answer to full transformation multiple choice. |
| `p1-sc-functions-stretches-002` | Keep as-is | Full vertical stretch description. |
| `p1-sc-functions-stretches-003` | Keep as-is | Renderer-safe point mapping after horizontal stretch. |

No Functions items were removed.

## Coverage by Subtopic

| Subtopic | Count | Coverage |
| --- | ---: | --- |
| Composite functions | 3 | `fg` evaluation, `gf` evaluation, symbolic composite formation. |
| Inverse functions | 3 | Inverse notation, forming a linear inverse, reversing an output to find the input. |
| Translations | 3 | Full graph translation, direction/sign convention, point mapping. |
| Reflections | 3 | x-axis reflection, y-axis reflection, point mapping after reflection. |
| Stretches | 3 | Horizontal stretch, vertical stretch, point mapping after horizontal stretch. |

## Remaining Weaknesses

- The set is still draft support content, not reviewed Cambridge mark-scheme material.
- Domain and range restrictions are not yet deeply tested; they should be added only after source-contract review.
- Multiple choice is appropriate for transformation wording and point mapping, but reviewed exam-style items should eventually require written descriptions or structured working.
- Composite and inverse items are linear/quadratic-light examples; later review should add a restricted-domain inverse example if the renderer can support it cleanly.
- Graph transformation items are notation-driven rather than image-driven; future UX support for diagrams could improve this unit.

## Template Match

Functions and Transformations now matches the Quadratics quality baseline:

- 3 items per subtopic.
- Full mathematical targets instead of artificial code answers or partial probes.
- Multiple choice for fragile wording, point mappings, transformation descriptions, and symbolic alternatives.
- A mix of direct drill, method/order checks, and graph/point interpretation.
- Unit-specific tests lock the count, coverage, review flags, supported input shapes, and no-code prompt wording.

## Recommended Iteration 003

The next unit should be Coordinate Geometry. It is the third P1 unit and has several answer shapes that need the same quality treatment: gradients, line equations, circle centre/radius/equation, and full intersection points.

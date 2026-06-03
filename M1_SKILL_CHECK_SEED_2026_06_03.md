# M1 Skill Check Seed Batch - 2026-06-03

## Summary

Generated the first draft M1 Mechanics Skill Check seed batch as a narrow support-only pass. The batch contains 16 deterministic items and is intentionally limited to safer Field Guide areas that already have stable wording and reusable visual templates.

These items are draft/review-needed. They do not create mastery, unlock-system access, adaptive routing, teacher evidence, official readiness, or course completion.

## Questions Added

| ID | Topic | Subtopic | Answer type |
| --- | --- | --- | --- |
| `m1-sc-velocity-displacement-001` | Velocity and Constant Acceleration | Displacement and velocity | numeric |
| `m1-sc-velocity-acceleration-001` | Velocity and Constant Acceleration | Acceleration | numeric |
| `m1-sc-velocity-suvat-001` | Velocity and Constant Acceleration | Equations of constant acceleration | numeric |
| `m1-sc-velocity-vt-graph-area-001` | Velocity and Constant Acceleration | Velocity-time graphs | numeric |
| `m1-sc-general-dsdt-001` | General Motion in a Straight Line | Velocity as derivative of displacement | numeric |
| `m1-sc-general-dvdt-001` | General Motion in a Straight Line | Acceleration as derivative of velocity | numeric |
| `m1-sc-general-integral-v-001` | General Motion in a Straight Line | Displacement as integral of velocity | numeric |
| `m1-sc-general-integral-a-001` | General Motion in a Straight Line | Velocity as integral of acceleration | numeric |
| `m1-sc-momentum-definition-001` | Momentum | Momentum definition | numeric |
| `m1-sc-momentum-conservation-table-001` | Momentum | Collisions and conservation of momentum | two_value |
| `m1-sc-energy-kinetic-001` | Work and Energy | Kinetic energy | numeric |
| `m1-sc-energy-gpe-001` | Work and Energy | Gravitational potential energy | numeric |
| `m1-sc-energy-power-001` | Work and Energy | Power | numeric |
| `m1-sc-energy-conservation-smooth-001` | Work and Energy | Conservation of energy | numeric |
| `m1-sc-force-resultant-001` | Force and Motion | Combinations of forces | numeric |
| `m1-sc-force-resolving-horizontal-001` | Force and Motion | Resolving forces in horizontal and vertical directions | two_value |

## Coverage

- Velocity and constant acceleration: 4 items.
- General motion in a straight line: 4 items.
- Momentum: 2 items.
- Work and energy: 4 items.
- Force and motion: 2 items.

## Answer Types Used

- `numeric`: 14 items.
- `two_value`: 2 items.

No new renderer answer type was added.

## Visual Templates Used

- `m1-template-velocity-time-area-gradient`
- `m1-template-momentum-before-after-table`
- `m1-template-energy-table`
- `m1-template-resolving-triangle`

## Excluded Topics

The batch intentionally excludes complex limiting friction, friction direction reversal, rough slopes, connected particles with pulleys, rods or tow-bars with tension/thrust signs, multi-stage connected-particle systems, work-energy with resistance, uncontrolled angled-force work, and ambiguous normal reaction cases. These topics need stricter diagrams and answer contracts before Skill Check generation.

## Files Changed

- `src/data/m1SkillCheckItems.ts`
- `src/data/skillCheckItems.ts`
- `scripts/build-static-site.ts`
- `src/tests/skillChecklist.test.ts`
- `docs/m1/topics/velocity-and-constant-acceleration/practice/index.html`
- `docs/m1/topics/general-motion-in-a-straight-line/practice/index.html`
- `docs/m1/topics/momentum/practice/index.html`
- `docs/m1/topics/work-and-energy/practice/index.html`
- `docs/m1/topics/force-and-motion/practice/index.html`

## Validation Results

- `npm run build`: passed, generated 172 static HTML pages.
- `npm run static:check`: passed for 172 HTML pages.
- `npm test`: passed, 56 files and 464 tests.
- `git diff --check`: passed.
- Browser inspection over local static server:
  - M1 velocity draft Skill Check page rendered cards, math, SVG, answer contract details, draft/review-needed status, and support-only warning.
  - M1 velocity page had no desktop or mobile page-level horizontal overflow.
  - Existing P3 algebra practice page still rendered known Skill Check content and had no page-level overflow.

## Remaining Risks

- M1 items are not syllabus-contract reviewed.
- Static pages expose answer contracts and local save buttons, but static answer checking remains limited to the existing static practice behavior.
- The new M1 items are deterministic seed content, not exam questions or mark schemes.
- The first batch does not prove visual-heavy Mechanics topics are safe yet.

## Recommended Next Batch

After review, generate a second small batch for controlled force and energy modelling:

- Simple weight and gravity checks.
- A tightly controlled work-done-by-force item where the angle reference is explicit.
- A normal reaction item only for horizontal ground with no additional vertical forces.
- A basic work-energy principle item with no resistance or with a fully explicit signed work table.

Keep friction, rough slopes, pulleys, and connected-particle tension/thrust sign work out of the next batch unless their diagrams and worked answer contracts are reviewed first.

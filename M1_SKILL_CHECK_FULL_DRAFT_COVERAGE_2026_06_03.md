# M1 Skill Check Full Draft Coverage - 2026-06-03

## Summary

Expanded the accepted M1 draft Skill Check seed batch into a full draft coverage suite across every M1 topic and Field Guide subtopic.

This is still draft/review-needed support practice. It is not mastery evidence, unlock evidence, teacher evidence, official readiness evidence, course completion evidence, or exam-bank content.

## Total Item Count

- Before this pass: 16 M1 draft Skill Check items.
- After this pass: 46 M1 draft Skill Check items.
- New items added in this pass: 30.

The total remains inside the requested 45-60 range.

## Item Count By Topic

| Topic | Item count |
| --- | ---: |
| Velocity and Constant Acceleration | 7 |
| Force and Motion | 8 |
| Friction | 6 |
| Connected Particles | 6 |
| General Motion in a Straight Line | 6 |
| Momentum | 6 |
| Work and Energy | 7 |

Every top-level topic has at least 5 items and no topic has more than 12 items.

## Item Count By Subtopic

| Subtopic | Item count |
| --- | ---: |
| `m1-velocity-displacement-velocity` | 1 |
| `m1-velocity-acceleration` | 2 |
| `m1-velocity-equations-constant-acceleration` | 1 |
| `m1-velocity-displacement-time-graph` | 1 |
| `m1-velocity-velocity-time-graphs` | 1 |
| `m1-velocity-graphs-with-discontinuities` | 1 |
| `m1-force-newtons-first-law` | 1 |
| `m1-force-combinations-of-forces` | 1 |
| `m1-force-weight-gravity` | 1 |
| `m1-force-normal-contact` | 1 |
| `m1-force-resolving-horizontal-vertical` | 2 |
| `m1-force-resolving-equilibrium` | 1 |
| `m1-force-resolving-not-equilibrium` | 1 |
| `m1-friction-contact-force` | 3 |
| `m1-friction-limit` | 2 |
| `m1-friction-direction-change` | 1 |
| `m1-connected-newtons-third-law` | 1 |
| `m1-connected-rods` | 2 |
| `m1-connected-strings` | 3 |
| `m1-general-velocity-derivative-displacement` | 2 |
| `m1-general-acceleration-derivative-velocity` | 1 |
| `m1-general-displacement-integral-velocity` | 1 |
| `m1-general-velocity-integral-acceleration` | 2 |
| `m1-momentum-definition` | 2 |
| `m1-momentum-collisions-conservation` | 4 |
| `m1-energy-work-done-by-force` | 1 |
| `m1-energy-kinetic-energy` | 1 |
| `m1-energy-gravitational-potential-energy` | 1 |
| `m1-energy-work-energy-principle` | 1 |
| `m1-energy-conservation` | 1 |
| `m1-energy-power` | 2 |

Every M1 Field Guide subtopic has at least one draft Skill Check item.

## Answer Types Used

| Answer type | Count |
| --- | ---: |
| `numeric` | 37 |
| `multiple_choice` | 7 |
| `two_value` | 2 |

No unsupported answer type was introduced.

## Visual Templates Used

- `m1-template-displacement-time-crossing`
- `m1-template-velocity-time-area-gradient`
- `m1-template-piecewise-discontinuity`
- `m1-template-free-body-diagrams`
- `m1-template-resolving-triangle`
- `m1-template-normal-reaction-cases`
- `m1-template-friction-direction`
- `m1-template-connected-particles`
- `m1-template-calculus-motion-flow`
- `m1-template-momentum-before-after-table`
- `m1-template-work-energy-setup`
- `m1-template-energy-table`
- `m1-template-power-setup`

Visual-dependent generated pages were checked for broken template references.

## High-Risk Items For Human Review

These items are controlled and deterministic, but should be prioritized in the next item-level review because their topic families are easy to overgeneralize:

- `m1-sc-velocity-discontinuity-001`: discontinuity wording and signed jump interpretation.
- `m1-sc-force-normal-horizontal-001`: normal reaction is safe only because no other vertical forces and zero vertical acceleration are explicit.
- `m1-sc-force-resolving-vertical-angle-001`: sine/cosine choice depends on the angle measured from vertical.
- `m1-sc-friction-not-limiting-001`: reinforces $F\leq\mu R$ rather than always $F=\mu R$.
- `m1-sc-friction-direction-reversal-001`: direction-change wording must remain stage-specific.
- `m1-sc-connected-rod-force-001`: rod-force prompt is simple and self-contained, but rod sign conventions need human review before expansion.
- `m1-sc-connected-pulley-common-acceleration-001`: pulley setup is the highest-risk connected-particle item in this pass, though it is single-stage and fully specified.
- `m1-sc-energy-work-done-angle-001`: angled-work item is controlled by an explicit angle to motion.
- `m1-sc-energy-work-energy-principle-001`: work-energy item is smooth/no-resistance and table-backed.

## Excluded Problem Types

Still excluded from this pass:

- Rough-slope friction with competing up/down limiting cases.
- Complex limiting-friction largest/smallest force problems.
- Multi-stage connected-particle systems.
- Rod or tow-bar sign interpretation where the sign of tension/thrust is the main result.
- Changing-constraint pulley problems, strings breaking, or particles reaching pulleys.
- Resistance-heavy work-energy balances.
- Multi-force energy balances with ambiguous work signs.
- Normal reaction problems where $R\neq mg$ unless the setup is explicitly diagrammed and reviewed.
- Coefficient of restitution.
- Any fake exam question or mark scheme.

## Files Changed

- `src/data/m1SkillCheckItems.ts`
- `src/data/skillCheckItems.ts`
- `scripts/build-static-site.ts`
- `src/tests/skillChecklist.test.ts`
- `docs/m1/topics/velocity-and-constant-acceleration/practice/index.html`
- `docs/m1/topics/force-and-motion/practice/index.html`
- `docs/m1/topics/friction/practice/index.html`
- `docs/m1/topics/connected-particles/practice/index.html`
- `docs/m1/topics/general-motion-in-a-straight-line/practice/index.html`
- `docs/m1/topics/momentum/practice/index.html`
- `docs/m1/topics/work-and-energy/practice/index.html`
- `M1_SKILL_CHECK_FULL_DRAFT_COVERAGE_2026_06_03.md`

Existing prior reports remain:

- `M1_SKILL_CHECK_SEED_2026_06_03.md`
- `M1_SKILL_CHECK_REVIEW_001_2026_06_03.md`

## Validation Results

- `npm run build`: passed; generated 172 static HTML pages.
- `npm run static:check`: passed for 172 HTML pages.
- `npm test`: passed; 56 files and 464 tests.
- `git diff --check`: passed.

## Browser Inspection

Inspected generated static pages over a local server for all seven M1 topics:

- Velocity and Constant Acceleration: 7 Skill Check cards, math rendered, graph SVGs rendered, support-only warning visible, no desktop/mobile overflow.
- Force and Motion: 8 Skill Check cards, math rendered, resolving/normal SVGs rendered, support-only warning visible, no desktop/mobile overflow.
- Friction: 6 Skill Check cards, math rendered, friction direction SVGs rendered, support-only warning visible, no desktop/mobile overflow.
- Connected Particles: 6 Skill Check cards, math rendered, connected-particle SVGs rendered, support-only warning visible, no desktop/mobile overflow.
- General Motion in a Straight Line: 6 Skill Check cards, math rendered, calculus-flow SVG rendered, support-only warning visible, no desktop/mobile overflow.
- Momentum: 6 Skill Check cards, math rendered, momentum-table SVGs rendered, support-only warning visible, no desktop/mobile overflow.
- Work and Energy: 7 Skill Check cards, math rendered, work/energy/power SVGs rendered, support-only warning visible, no desktop/mobile overflow.

Also inspected P3 Algebra practice:

- Existing P3 Skill Check content still renders.
- Math renders.
- No page-level overflow was detected.

## Recommended Next Review Pass

The next step should be a full item-level review pass, not another generation pass.

Recommended review work:

- Solve all 46 M1 items independently.
- Check each stored answer, accepted alternate answer, unit, rounding instruction, sign convention, visual-template reference, and worked route.
- Prioritize the high-risk items listed above.
- Confirm the static pages are understandable to students when answers are hidden.
- Decide which items remain draft, need revision, or should be removed before any further M1 generation.

Do not expand M1 Skill Checks again until this 46-item suite has been reviewed.

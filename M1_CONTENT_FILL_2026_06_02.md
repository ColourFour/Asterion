# M1 Content Fill - 2026-06-02

## Source File Used

- `content-model/M1/m1-total.pdf`

The source PDF was used for Blake's Mechanics 1 topic/subtopic structure, worked-example style, diagram cues, and generic prompt style. The requested wording fixes were applied:

- `Displace` -> `Displacement`
- `Word done by force` -> `Work done by force`
- `Conversation` -> `Conservation`

## Files Changed Or Created

- `src/data/m1SeedContent.ts` - new source-filled M1 draft seed content.
- `src/data/courseSeedContent.ts` - added optional seed fields for visual requirements, generic practice prompts, review status, and imported M1 from its own module.
- `src/lib/courseExamTraining.ts` - updated rough M1 topic routing aliases to the new seven-topic structure.
- `scripts/build-static-site.ts` - renders review status, visual requirements, and draft/generated practice prompts on seed topic pages.
- `src/tests/courseSeedContent.test.ts` - locks M1 topic/subtopic coverage and draft/visual scaffold expectations.
- `src/tests/courseExamTraining.test.ts` - updates rough M1 routing helper expectations.
- `src/tests/staticStudyRoutes.test.ts` - updates static route expectations for the new first M1 topic.
- `docs/m1/**` and `docs/static-pages.json` - regenerated static Mechanics pages.

## M1 Topics And Subtopics Filled

1. Velocity and Constant Acceleration
   - Displacement and velocity
   - Acceleration
   - Equations of constant acceleration
   - Displacement-time graph
   - Velocity-time graphs
   - Graphs with discontinuities

2. Force and Motion
   - Newton's first law
   - Combinations of forces
   - Weight and motion due to gravity
   - Normal contact force
   - Resolving forces in horizontal and vertical directions
   - Resolving forces at equilibrium
   - Resolving forces not in equilibrium

3. Friction
   - Friction as contact force
   - Limit of friction
   - Changes of direction with relation to friction

4. Connected Particles
   - Newton's third law
   - Objects connected by rods
   - Objects connected by strings

5. General Motion in a Straight Line
   - Velocity as derivative of displacement
   - Acceleration as derivative of velocity
   - Displacement as integral of velocity
   - Velocity as integral of acceleration

6. Momentum
   - Momentum definition
   - Collisions and conservation of momentum

7. Work and Energy
   - Work done by force
   - Kinetic energy
   - Gravitational potential energy
   - Work energy principle
   - Conservation of energy
   - Power

## Visual Requirements Added

- Displacement-time graphs.
- Velocity-time graphs.
- Staged journey timelines and graph discontinuity notes.
- Force diagrams and free-body diagrams.
- Resolving-force diagrams.
- Friction and slope diagrams.
- Connected-particle diagrams.
- String, rod, and pulley diagrams.
- Before/after momentum tables and collision diagrams.
- Work-energy setup diagrams.
- Energy tables for KE, PE, work terms, and losses.
- Power setup diagrams showing force and velocity direction.

## Draft / Review-Needed Status

All M1 content remains draft/source-filled seed content. It is explicitly marked as needing syllabus-contract review before it is used for Skill Check generation, mastery, adaptive evidence, readiness claims, or official course coverage claims.

The first-pass generic practice prompts are labelled `Draft/generated practice`. They are method and authoring scaffolds only, not reviewed exam questions and not mark schemes.

## Before Skill Check Generation

- Audit each M1 topic/subtopic against the official Cambridge 9709 Mechanics syllabus.
- Review formula scope, wording, and modelling assumptions for each section.
- Replace generic draft prompts with reviewed Skill Check contracts.
- Add or commission the required diagrams before visual-dependent prompts are treated as ready.
- Split broad current catalog routing buckets where possible; current M1 routing aliases are rough and review-needed.
- Confirm no M1 route contributes to mastery, Guardian unlocks, adaptive evidence, teacher evidence, or readiness claims.

## Validation Results

- `npm run build` - passed; generated 172 static HTML pages in `docs/`.
- `npm run static:check` - passed for 172 HTML pages; M1 catalog/local image pair counts reported as 258/258.
- `npm test` - passed; 56 test files and 463 tests.
- `git diff --check` - passed.

## Notes

There were pre-existing uncommitted content-model folder moves before this task began: top-level P3 PDFs were already shown as deleted, while `content-model/M1/` and `content-model/P3/` were untracked. This pass used `content-model/M1/m1-total.pdf` and did not revert those pre-existing workspace changes.

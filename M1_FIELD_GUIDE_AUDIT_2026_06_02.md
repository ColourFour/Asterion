# M1 Field Guide Audit - 2026-06-02

## Audit Scope

Audited:

- `content-model/M1/m1-total.pdf`
- `src/data/m1SeedContent.ts`
- `src/data/courseSeedContent.ts`
- `src/lib/topicStudy.ts`
- `scripts/build-static-site.ts`
- generated pages under `docs/m1/**`
- `M1_CONTENT_FILL_2026_06_02.md`
- relevant M1 route/content tests

This audit is a readiness gate only. No Skill Check questions were generated, and M1 was not promoted into mastery, Guardian, adaptive evidence, teacher evidence, or readiness flows.

## Overall Decision

**Decision: `partial_generation_ready`**

The current M1 Field Guide is strong enough to support a small first-pass draft Skill Check generation batch for calculation-first and text-only subtopics. It is not strong enough for broad Mechanics generation. Visual-heavy areas depend on diagrams, sign conventions, force modelling assumptions, and worked examples that are currently described but not actually present as reusable Field Guide assets or Skill Check templates.

The generated M1 Field Guide pages list required visuals, but the Field Guide and Practice pages do not contain actual diagrams, graph templates, force diagrams, pulley diagrams, momentum tables, or work-energy setup diagrams. The only `<img>` assets found in M1 topic pages are exam-training question and mark-scheme crops, which are not reviewed Skill Check scaffolds.

## Topic Rating Table

Scale: 1-2 unusable, 3-4 scaffold exists but not safe, 5-6 limited seed generation with caveats, 7-8 good first-pass ready, 9-10 polished/review-backed.

| Topic | Coverage completeness | Field Guide clarity | Visual/model support | Practice prompt quality | Skill Check readiness | Student safety/trustworthiness |
|---|---:|---:|---:|---:|---:|---:|
| Velocity and Constant Acceleration | 8 | 7 | 4 | 6 | 6 | 7 |
| Force and Motion | 7 | 6 | 3 | 5 | 4 | 5 |
| Friction | 7 | 6 | 3 | 5 | 3 | 4 |
| Connected Particles | 7 | 6 | 3 | 5 | 3 | 4 |
| General Motion in a Straight Line | 8 | 7 | 5 | 7 | 7 | 7 |
| Momentum | 7 | 7 | 5 | 6 | 6 | 7 |
| Work and Energy | 8 | 7 | 4 | 6 | 5 | 6 |

## Topic Audits

### 1. Velocity and Constant Acceleration

- Subtopic coverage: Complete against the PDF: displacement/velocity, acceleration, suvat, displacement-time graph, velocity-time graph, discontinuities.
- Formula correctness: Core suvat formulae and $s=vt$ are correct. The constant-acceleration condition is explicitly stated.
- Method clarity: Good for staged calculations and sign convention. Strong notes on displacement vs distance and speed vs velocity.
- Worked-example usefulness: Method route exists, but the source worked examples are not embedded or recreated. Graph examples are described rather than shown.
- Visual requirements: Correctly identified, but no actual displacement-time, velocity-time, staged journey, or discontinuity diagrams exist in the Field Guide.
- Practice prompts: Good first-pass prompts for calculation and graph interpretation, but graph prompts need templates before generation.
- Common mistakes: Covers distance/displacement, suvat misuse across stages, direction changes, and graph discontinuities.
- Student usability: Good for calculation-first work; weaker for graph topics because students only see prose.
- Misleading risk: Medium for graph generation without actual axes/templates; low for simple signed-motion calculation.

### 2. Force and Motion

- Subtopic coverage: Complete against the PDF: Newton's first law, force combinations, weight/gravity, normal contact, resolving horizontally/vertically, equilibrium resolving, non-equilibrium resolving.
- Formula correctness: $W=mg$ and resultant-force framing are correct. The component formula note is intentionally conditional because sine/cosine depends on the marked angle.
- Method clarity: Good high-level method: draw forces, choose axes, resolve, use $\sum F=0$ or $\sum F=ma$.
- Worked-example usefulness: Not enough for generation in resolving-heavy subtopics. There are no worked force diagrams.
- Visual requirements: Correctly listed but absent. This is the main blocker.
- Practice prompts: Reasonable, but many prompts require unseen diagrams.
- Common mistakes: Good coverage of resultant force vs individual force, sine/cosine swap, and normal contact assumptions.
- Student usability: Useful as a checklist, but not enough to teach resolving without a diagram.
- Misleading risk: High if resolving or normal-reaction questions are generated without controlled diagrams.

### 3. Friction

- Subtopic coverage: Complete against the PDF: friction as contact force, limit of friction, direction changes.
- Formula correctness: $F \leq \mu R$ and $F_{\max}=\mu R$ are correct and limiting-friction wording is present.
- Method clarity: Good sequence: draw contact, resolve for $R$, decide limiting/non-limiting, resolve along surface.
- Worked-example usefulness: Insufficient. Friction needs worked examples for direction and limiting cases.
- Visual requirements: Correctly listed but absent. Rough surfaces, slopes, contact force, and direction reversal diagrams are missing.
- Practice prompts: Reasonable but too diagram-dependent for broad generation.
- Common mistakes: Good coverage of using $F=\mu R$ too early, friction direction, and wrong normal reaction.
- Student usability: Good warning scaffold, not enough as a generation source for safe independent questions.
- Misleading risk: High without diagrams and worked examples, especially for largest/smallest force cases.

### 4. Connected Particles

- Subtopic coverage: Complete against the PDF: Newton's third law, rods, strings.
- Formula correctness: Correct model notes for separate equations, light inextensible strings, smooth pulleys, and rods carrying tension/thrust.
- Method clarity: Good overview: whole-system sketch, separate free-body diagrams, one equation per body, solve constraints.
- Worked-example usefulness: Insufficient. Connected-particle generation needs at least one worked rod and one worked string/pulley setup.
- Visual requirements: Correctly listed but absent. Rod/string/pulley templates are a hard blocker.
- Practice prompts: Good style, but visual-heavy and assumption-heavy.
- Common mistakes: Good coverage of combined-system misuse, inconsistent acceleration, and rod thrust/tension sign.
- Student usability: Useful as a checklist, but not enough for independent generation except possibly Newton's third law concept checks.
- Misleading risk: High for rods/strings/pulleys without controlled diagrams and assumptions.

### 5. General Motion in a Straight Line

- Subtopic coverage: Complete against the PDF: velocity as derivative of displacement, acceleration as derivative of velocity, displacement as integral of velocity, velocity as integral of acceleration.
- Formula correctness: Correct calculus relationships are listed.
- Method clarity: Good: identify $s(t)$, $v(t)$, or $a(t)$, differentiate/integrate, apply conditions, interpret roots/signs.
- Worked-example usefulness: Adequate for simple seed generation; still lacks full worked examples.
- Visual requirements: Some graph/flow visuals are listed but not essential for basic calculation-first prompts.
- Practice prompts: Strongest of the M1 set for text-only Skill Check generation.
- Common mistakes: Good coverage of suvat misuse, distance vs displacement, and constants of integration.
- Student usability: Good for first-pass draft generation with guardrails.
- Misleading risk: Medium if prompts involve total distance after velocity sign changes; low for direct derivative/integral tasks.

### 6. Momentum

- Subtopic coverage: Complete against the PDF: momentum definition, collisions and conservation of momentum.
- Formula correctness: $p=mv$ and conservation wording are correct. Change-in-momentum copy is understandable but would be clearer as $m(v-u)$ for student-facing generation contracts.
- Method clarity: Good: choose direction, signed velocities, before/after table, conservation equation, interpret negative answers.
- Worked-example usefulness: Adequate for momentum definition; collision work would benefit from a before/after table template.
- Visual requirements: Tables/one-dimensional arrows are listed but absent. These can be text/table templates rather than image assets.
- Practice prompts: Good if generated prompts require a before/after table.
- Common mistakes: Good coverage of all-positive speed misuse, kinetic energy misuse, and coalescence.
- Student usability: Good for signed calculation and simple direct collisions.
- Misleading risk: Medium for collision questions without a required sign convention/table; low for momentum definition.

### 7. Work and Energy

- Subtopic coverage: Complete against the PDF: work done by force, kinetic energy, gravitational potential energy, work-energy principle, conservation of energy, power.
- Formula correctness: Work, KE, PE, work-energy, and power formulae are correct. Scope notes for $P=Fv$ and non-conservative work are present.
- Method clarity: Good high-level route: draw setup, calculate signed work terms, write energy balance, choose power relationship.
- Worked-example usefulness: Mixed. KE, PE, and simple power can generate from prose; work-energy principle and angled work need worked setup examples.
- Visual requirements: Correctly listed but absent. Angled forces, slopes, energy tables, and work-term diagrams are missing.
- Practice prompts: Good, but some prompts are too broad for first-pass generation without templates.
- Common mistakes: Good coverage of force components, normal reaction work, and false conservation claims.
- Student usability: Good for scalar formula checks; weaker for complete energy-balance modelling.
- Misleading risk: Medium-high for work-energy setups without diagrams; low for direct KE/PE/power calculations.

## Subtopic Readiness Table

| Topic | Subtopic | Status | Reason |
|---|---|---|---|
| Velocity and Constant Acceleration | Displacement and velocity | `ready_for_seed_skill_check` | Text-only signed displacement/speed prompts are safe if positive direction and units are stated. |
| Velocity and Constant Acceleration | Acceleration | `ready_for_seed_skill_check` | Direct change-in-velocity calculations are safe with sign convention. |
| Velocity and Constant Acceleration | Equations of constant acceleration | `ready_for_seed_skill_check` | Suvat condition is explicit; safe for single-stage or clearly staged text prompts. |
| Velocity and Constant Acceleration | Displacement-time graph | `needs_visual_before_skill_check` | Requires actual graph axes/templates; prose alone is not enough. |
| Velocity and Constant Acceleration | Velocity-time graphs | `needs_visual_before_skill_check` | Area/gradient questions need graph templates and shaded-area conventions. |
| Velocity and Constant Acceleration | Graphs with discontinuities | `needs_visual_before_skill_check` | Discontinuity interpretation is visual and easy to mislead without examples. |
| Force and Motion | Newton's first law | `ready_after_minor_copy_fix` | Concept checks and one-dimensional resultant-zero prompts are safe; avoid force diagrams until templates exist. |
| Force and Motion | Combinations of forces | `ready_after_minor_copy_fix` | One-dimensional driving/resistance prompts are safe; diagrammatic multi-force prompts are blocked. |
| Force and Motion | Weight and motion due to gravity | `ready_after_minor_copy_fix` | Direct $W=mg$ and simple vertical models are safe with sign convention. |
| Force and Motion | Normal contact force | `needs_visual_before_skill_check` | Normal reaction assumptions are diagram-dependent. |
| Force and Motion | Resolving forces in horizontal and vertical directions | `needs_visual_before_skill_check` | Sine/cosine choice depends on a marked angle diagram. |
| Force and Motion | Resolving forces at equilibrium | `needs_visual_before_skill_check` | Needs controlled equilibrium diagrams. |
| Force and Motion | Resolving forces not in equilibrium | `needs_visual_before_skill_check` | Needs force/slope diagrams and acceleration direction. |
| Friction | Friction as contact force | `needs_visual_before_skill_check` | Contact-force direction and normal/friction components require diagrams. |
| Friction | Limit of friction | `needs_visual_before_skill_check` | Limiting direction and $R$ setup are diagram-heavy. |
| Friction | Changes of direction with relation to friction | `needs_worked_example_before_skill_check` | Needs at least one worked reversal/stage example before safe generation. |
| Connected Particles | Newton's third law | `ready_after_minor_copy_fix` | Concept-only checks can be generated; avoid full connected diagrams. |
| Connected Particles | Objects connected by rods | `needs_visual_before_skill_check` | Rod/tension/thrust setup needs diagrams and model assumptions. |
| Connected Particles | Objects connected by strings | `needs_visual_before_skill_check` | String/pulley acceleration constraints need diagrams/templates. |
| General Motion in a Straight Line | Velocity as derivative of displacement | `ready_for_seed_skill_check` | Direct calculus calculation prompts are safe. |
| General Motion in a Straight Line | Acceleration as derivative of velocity | `ready_for_seed_skill_check` | Direct calculus calculation prompts are safe. |
| General Motion in a Straight Line | Displacement as integral of velocity | `ready_after_minor_copy_fix` | Safe for displacement; distance after sign change needs stricter prompt constraints. |
| General Motion in a Straight Line | Velocity as integral of acceleration | `ready_for_seed_skill_check` | Safe when initial velocity condition is explicit. |
| Momentum | Momentum definition | `ready_for_seed_skill_check` | Direct signed momentum/change-in-momentum prompts are safe. |
| Momentum | Collisions and conservation of momentum | `ready_after_minor_copy_fix` | Safe for simple one-dimensional direct collisions if every prompt requires a signed before/after table. |
| Work and Energy | Work done by force | `needs_visual_before_skill_check` | Angled-force work depends on direction and component diagrams. |
| Work and Energy | Kinetic energy | `ready_for_seed_skill_check` | Direct KE and KE-change calculations are safe. |
| Work and Energy | Gravitational potential energy | `ready_after_minor_copy_fix` | Safe for vertical height-change prompts; avoid ambiguous slope/path prompts. |
| Work and Energy | Work energy principle | `needs_worked_example_before_skill_check` | Energy-balance sign conventions need a worked example/table before generation. |
| Work and Energy | Conservation of energy | `ready_after_minor_copy_fix` | Safe for smooth/no-resistance PE-to-KE prompts only. |
| Work and Energy | Power | `ready_for_seed_skill_check` | Direct $P=W/t$ or aligned $P=Fv$ prompts are safe with scope stated. |

## Safe For First Skill Check Generation

Safe now:

- Velocity and Constant Acceleration
  - Displacement and velocity
  - Acceleration
  - Equations of constant acceleration

- General Motion in a Straight Line
  - Velocity as derivative of displacement
  - Acceleration as derivative of velocity
  - Velocity as integral of acceleration

- Momentum
  - Momentum definition

- Work and Energy
  - Kinetic energy
  - Power

Safe after minor copy/contract constraints:

- Force and Motion
  - Newton's first law
  - Combinations of forces
  - Weight and motion due to gravity

- General Motion in a Straight Line
  - Displacement as integral of velocity, but only for displacement-first prompts unless sign-change distance handling is explicitly scaffolded.

- Momentum
  - Collisions and conservation of momentum, but only with a mandatory signed before/after table contract.

- Work and Energy
  - Gravitational potential energy, but only with vertical height change explicitly given.
  - Conservation of energy, but only smooth/no-resistance PE-to-KE prompts.

## Blocked Topics And Why

Blocked until visual templates exist:

- Displacement-time graph
- Velocity-time graphs
- Graphs with discontinuities
- Normal contact force beyond simplest horizontal cases
- Resolving forces in horizontal and vertical directions
- Resolving forces at equilibrium
- Resolving forces not in equilibrium
- Friction as contact force
- Limit of friction
- Objects connected by rods
- Objects connected by strings
- Work done by force with angled forces

Blocked until worked examples exist:

- Changes of direction with relation to friction
- Work energy principle

Blocked until both visual templates and worked examples exist:

- Broader friction problems involving slopes, limiting cases, or changing direction.
- Connected particles involving strings, pulleys, rods, tow-bars, thrust/tension signs, or changing constraints.
- Full work-energy modelling with resistance, angled forces, slopes, or multiple work terms.

## Missing Visual / Diagram Requirements

Required before broader generation:

- Displacement-time graph templates with labelled axes, slope markers, intercepts, and crossing points.
- Velocity-time graph templates with shaded areas and gradient markers.
- Piecewise/discontinuity graph templates.
- Free-body diagram templates for horizontal surface, slope, vertical motion, and angled pull/push.
- Resolving-force triangle templates with angle reference explicitly marked.
- Normal reaction diagrams for horizontal, inclined, and angled-force cases.
- Friction direction diagrams for impending up/down/left/right motion.
- Connected-particle templates for rods, tow-bars, strings over pulleys, table-and-hanging-mass setups, and slope-connected systems.
- Before/after momentum table template.
- Work-energy setup diagrams showing displacement, force angle, height change, resistance, and normal reaction.
- Energy table template for KE, PE, work by named forces, and losses.
- Power setup template showing force and velocity alignment.

## Missing Worked-Example Requirements

Minimum worked examples before broader generation:

- One displacement-time graph worked example.
- One velocity-time graph area/gradient worked example.
- One discontinuity graph interpretation worked example.
- One resolving-force component worked example with angle reference.
- One equilibrium resolving worked example.
- One non-equilibrium resolving worked example.
- One normal-contact example where $R \ne mg$.
- One limiting-friction slope example.
- One friction direction reversal example.
- One rod/tow-bar tension vs thrust example.
- One string/pulley shared-acceleration example.
- One before/after momentum table example.
- One angled-force work example.
- One work-energy principle example with resistance.
- One conservation-of-energy example with no resistance, clearly contrasted with a non-conservative case.

## Suggested First Skill Check Batch

Suggested batch size: **12 draft Skill Check questions**.

Recommended first batch:

- 2 from Displacement and velocity.
- 2 from Acceleration.
- 2 from Equations of constant acceleration.
- 2 from Velocity as derivative of displacement.
- 1 from Acceleration as derivative of velocity.
- 1 from Velocity as integral of acceleration.
- 1 from Momentum definition.
- 1 from Kinetic energy or Power.

Optional stretch if the generator supports strict prompt contracts:

- 1 simple smooth/no-resistance conservation of energy question.
- 1 simple one-dimensional conservation of momentum question with a required signed before/after table.

Do not include graph, resolving, friction, rod/string/pulley, angled-work, or full work-energy-principle questions in the first batch.

## Suggested Diagram / Template Tasks Before Broader Generation

1. Create reusable static diagram templates for motion graphs, force diagrams, friction/slope diagrams, connected particles, momentum tables, and work-energy setups.
2. Add a small worked-example block type to seed Field Guide sections so each visual-heavy subtopic can show a setup, equation, and interpretation.
3. Define Skill Check generation contracts per safe subtopic, including required prompt fields such as positive direction, units, constant-acceleration interval, and whether speed/distance/displacement is requested.
4. Add tests that prevent generation for any M1 subtopic marked `needs_visual_before_skill_check`, `needs_worked_example_before_skill_check`, `needs_syllabus_review`, or `not_ready`.
5. Add a topic-readiness metadata field rather than relying on this report alone.

## Validation Results

Validation commands were run after creating this audit report:

- `npm run build` - passed; generated 172 static HTML pages in `docs/`.
- `npm run static:check` - passed for 172 HTML pages.
- `npm test` - passed; 56 test files and 463 tests.
- `git diff --check` - passed.

## Final Gate

M1 can start draft Skill Check generation now only as a narrow first pass. The first pass should target calculation-first, text-only subtopics and should not imply reviewed mastery readiness.

Final decision: **`partial_generation_ready`**.

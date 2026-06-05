# P1 Skill Check Structure Design - 2026-06-05

## Purpose

This Phase 2 design turns the P1 Skill Check audit into a student-facing structure. It does not implement UI or content changes yet. The design keeps the cognitive-load redesign intact: students should see a short, focused Skill Check set for the Field Guide skill they just studied, not a large item bank.

## Default Student Flow

Course -> Topic -> Field Guide phase -> Skill Check for that exact skill -> next Field Guide phase or Exam Training.

The default Skill Check set for each Field Guide phase should contain 3 questions:

1. First check: accessible recognition, method choice, or direct recall.
2. Use the method: standard substitution, algebra, graph reading, formula use, or setup.
3. Exam-style twist: slightly more demanding interpretation, parameter, transformation, sign trap, or mixed decision.

Optional sets are allowed, but must be secondary:

- More practice
- Mixed quick check
- Challenge

Student-facing labels must not expose authoring status. Avoid generated practice, seed, draft, mapping, mastery evidence, review required, and data record.

## Structural Contract

Recommended data shape for implementation:

```ts
interface P1SkillCheckGroup {
  groupId: string; // Same as fieldGuideSubtopicId.
  topicId: string;
  label: string;
  purpose: string;
  defaultSet: {
    label: 'Quick check';
    items: [
      { role: 'first_check'; label: string; itemId: string },
      { role: 'use_the_method'; label: string; itemId: string },
      { role: 'exam_style_twist'; label: string; itemId: string },
    ];
  };
  optionalSets?: Array<{
    label: 'More practice' | 'Mixed quick check' | 'Challenge';
    itemIds: string[];
  }>;
  studentFacing: boolean;
}
```

Implementation should derive the visible default from `fieldGuideSubtopicId`, not from the first 3 topic-level items. If the URL hash or Field Guide link targets `p1-quadratics-discriminant`, the student should see the discriminant 3-question set first.

## Route And Rendering Rules

- Field Guide phase links should target `skill-check/index.html#<fieldGuideSubtopicId>`.
- Skill Check page should open the matching group when a valid hash exists.
- If no hash exists, use the first safe Field Guide subtopic for that topic.
- The initial visible set is exactly 3 questions.
- Optional sets are hidden behind secondary controls or below the default set.
- Quarantined groups must not render in the default student path.
- Support-only review metadata must remain internal.

## Student-Facing Label Bank

Use short action labels:

- Spot the method
- Use the formula
- Try the graph
- Check the interval
- Check the signs
- Check the restriction
- Read the notation
- Use the identity
- Set it up
- Finish the method
- Mixed quick check
- Challenge

Avoid:

- generated practice
- seed
- draft
- mapping
- mastery evidence
- review required
- data record
- source-filled
- placeholder

## Default Group Design

| Field Guide subtopic | Student label | First check | Use the method | Exam-style twist | Secondary sets | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `p1-quadratics-factoring` | Spot the factors | `p1-sc-quadratics-factoring-002` | `p1-sc-quadratics-factoring-001` | `p1-sc-quadratics-factoring-003` | None | Default-ready |
| `p1-quadratics-inequalities` | Check the interval | `p1-sc-quadratics-inequalities-001` | `p1-sc-quadratics-inequalities-002` | `p1-sc-quadratics-inequalities-003` | None | Default-ready |
| `p1-quadratics-formula` | Use the formula | `p1-sc-quadratics-formula-001` | `p1-sc-quadratics-formula-003` | `p1-sc-quadratics-formula-002` | None | Default-ready |
| `p1-quadratics-discriminant` | Count the roots | `p1-sc-quadratics-discriminant-003` | `p1-sc-quadratics-discriminant-001` | `p1-sc-quadratics-discriminant-002` | None | Default-ready |
| `p1-quadratics-graphs` | Try the graph | `p1-sc-quadratics-graphs-001` | `p1-sc-quadratics-graphs-002` | `p1-sc-quadratics-graphs-003` | None | Default-ready |
| `p1-functions-transformations-composite-functions` | Read the order | `p1-sc-functions-composite-001` | `p1-sc-functions-composite-002` | `p1-sc-functions-composite-003` | None | Default-ready |
| `p1-functions-transformations-inverse-functions` | Reverse the function | `p1-sc-functions-inverse-001` | `p1-sc-functions-inverse-002` | `p1-sc-functions-inverse-003` | Add later: restricted-domain inverse check | Needs one future item |
| `p1-functions-transformations-translations` | Move the graph | `p1-sc-functions-translations-001` | `p1-sc-functions-translations-002` | `p1-sc-functions-translations-003` | None | Default-ready |
| `p1-functions-transformations-reflections` | Flip the graph | `p1-sc-functions-reflections-001` | `p1-sc-functions-reflections-002` | `p1-sc-functions-reflections-003` | None | Default-ready |
| `p1-functions-transformations-stretches` | Scale the graph | `p1-sc-functions-stretches-001` | `p1-sc-functions-stretches-002` | `p1-sc-functions-stretches-003` | None | Default-ready |
| `p1-coordinate-geometry-parallel-perpendicular` | Check the gradient | `p1-sc-coordinate-parallel-perpendicular-001` | `p1-sc-coordinate-parallel-perpendicular-002` | `p1-sc-coordinate-parallel-perpendicular-003` | Challenge: `p1-sc-coordinate-parallel-perpendicular-004` | Default-ready |
| `p1-coordinate-geometry-straight-line` | Build the line | `p1-sc-coordinate-straight-line-003` | `p1-sc-coordinate-straight-line-001` | `p1-sc-coordinate-straight-line-004` | More practice: `p1-sc-coordinate-straight-line-002` | Default-ready |
| `p1-coordinate-geometry-circles` | Read the circle | `p1-sc-coordinate-circles-001` | `p1-sc-coordinate-circles-003` | `p1-sc-coordinate-circles-004` | More practice: `p1-sc-coordinate-circles-002`; Challenge: `p1-sc-coordinate-circles-005` | Default-ready |
| `p1-coordinate-geometry-intersections` | Find the meeting point | `p1-sc-coordinate-intersections-001` | `p1-sc-coordinate-intersections-003` | `p1-sc-coordinate-intersections-004` | More practice: `p1-sc-coordinate-intersections-002`; Challenge: `p1-sc-coordinate-intersections-005` | Default-ready |
| `p1-circular-measure-radians` | Switch the units | `p1-sc-circular-radians-003` | `p1-sc-circular-radians-001` | `p1-sc-circular-radians-002` | None | Default-ready |
| `p1-circular-measure-arc-sector` | Use the sector formula | `p1-sc-circular-arc-sector-001` | `p1-sc-circular-arc-sector-002` | `p1-sc-circular-arc-sector-003` | Add later: compound sector/triangle area | Needs one future item |
| `p1-trigonometry-exact-values` | Recall the exact value | `p1-sc-trig-exact-values-001` | `p1-sc-trig-exact-values-002` | `p1-sc-trig-exact-values-003` | Add later: exact value inside equation or triangle expression | Needs one future item |
| `p1-trigonometry-graphs` | Read the graph feature | `p1-sc-trig-graphs-003` | `p1-sc-trig-graphs-001` | `p1-sc-trig-graphs-002` | Add later: graph-to-solution interpretation | Needs one future item |
| `p1-trigonometry-equations` | Find all angles | `p1-sc-trig-equations-001` | `p1-sc-trig-equations-003` | `p1-sc-trig-equations-004` | More practice: `p1-sc-trig-equations-002` | Default-ready |
| `p1-trigonometry-identities` | Use the identity | `p1-sc-trig-identities-001` | `p1-sc-trig-identities-002` | `p1-sc-trig-identities-003` | Add later: identity equation with no lost solutions | Needs one future item |
| `p1-binomial-expansion-basic-expansion` | Spot the pattern | `p1-sc-binomial-basic-001` | `p1-sc-binomial-basic-002` | `p1-sc-binomial-basic-003` | None | Default-ready |
| `p1-binomial-expansion-complex-expansions` | Target the term | `p1-sc-binomial-complex-001` | `p1-sc-binomial-complex-002` | `p1-sc-binomial-complex-003` | None | Default-ready |
| `p1-series-arithmetic-progressions` | Use the AP formula | `p1-sc-series-ap-001` | `p1-sc-series-ap-002` | `p1-sc-series-ap-003` | None | Default-ready |
| `p1-series-geometric-progressions` | Use the GP formula | `p1-sc-series-gp-001` | `p1-sc-series-gp-002` | `p1-sc-series-gp-003` | None | Default-ready |
| `p1-series-infinite-geometric-progressions` | Check convergence | `p1-sc-series-infinite-gp-002` | `p1-sc-series-infinite-gp-001` | `p1-sc-series-infinite-gp-003` | None | Default-ready |
| `p1-differentiation-gradient-tangent` | Find the gradient | `p1-sc-diff-gradient-tangent-001` | `p1-sc-diff-gradient-tangent-002` | `p1-sc-diff-gradient-tangent-003` | None | Default-ready |
| `p1-differentiation-polynomials` | Use the power rule | `p1-sc-diff-polynomials-001` | `p1-sc-diff-polynomials-002` | `p1-sc-diff-polynomials-003` | None | Default-ready |
| `p1-differentiation-chain-rule` | Keep the inner factor | `p1-sc-diff-chain-rule-001` | `p1-sc-diff-chain-rule-002` | `p1-sc-diff-chain-rule-003` | None | Default-ready |
| `p1-differentiation-second-derivative` | Differentiate twice | `p1-sc-diff-second-derivative-001` | `p1-sc-diff-second-derivative-003` | `p1-sc-diff-second-derivative-002` | None | Default-ready |
| `p1-differentiation-tangents-normals` | Build the tangent or normal | `p1-sc-diff-tangents-normals-001` | `p1-sc-diff-tangents-normals-002` | `p1-sc-diff-tangents-normals-003` | None | Default-ready |
| `p1-differentiation-stationary-points` | Find the stationary point | `p1-sc-diff-stationary-002` | `p1-sc-diff-stationary-001` | `p1-sc-diff-stationary-003` | None | Default-ready |
| `p1-differentiation-rates-change` | Interpret the rate | `p1-sc-diff-rates-001` | `p1-sc-diff-rates-003` | `p1-sc-diff-rates-002` | None | Default-ready |
| `p1-integration-basic-integration` | Reverse the power rule | `p1-sc-integration-basic-001` | `p1-sc-integration-basic-002` | `p1-sc-integration-basic-003` | None | Default-ready |
| `p1-integration-constant-integration` | Find the constant | `p1-sc-integration-constant-001` | `p1-sc-integration-constant-002` | `p1-sc-integration-constant-003` | None | Default-ready |
| `p1-integration-definite-integrals` | Use the limits | `p1-sc-integration-definite-001` | `p1-sc-integration-definite-002` | `p1-sc-integration-definite-003` | None | Default-ready |
| `p1-integration-area-between-curves` | Set up the area | `p1-sc-integration-area-between-003` | `p1-sc-integration-area-between-001` | `p1-sc-integration-area-between-002` | Add later: split signed-area item | Default-ready |
| `p1-integration-improper-integrals` | N/A | N/A | N/A | N/A | None | Quarantine until P1 course-contract review |
| `p1-integration-volumes-revolution` | N/A | N/A | N/A | N/A | None | Quarantine until P1 course-contract review |

## Optional Secondary Set Rules

Secondary sets should never appear before the 3-question default set.

- More practice: same skill, similar complexity, useful when a student wants one more try.
- Mixed quick check: combines two nearby subskills from the same topic after both Field Guide phases are complete.
- Challenge: one harder method-choice, parameter, interpretation, or exam-style twist.

Recommended display order:

1. Quick check
2. More practice
3. Mixed quick check
4. Challenge

## Quarantine Rules

Quarantined P1 Skill Check groups are not deleted in Phase 2, but they must not be the default student path.

Current quarantined groups:

- `p1-integration-improper-integrals`
- `p1-integration-volumes-revolution`

Reason: the active seed content labels these as teacher-guided draft/course-contract-review material. They also contain source prompts with draft/placeholder language. They can return only after syllabus-contract review confirms they belong in the P1 static course surface and the source copy is rewritten for students.

## Minimal Implementation Plan For Phase 3

1. Add a P1 Skill Check group map, probably in `src/data/p1SkillCheckItems.ts` or a small adjacent `src/data/p1SkillCheckGroups.ts`.
2. Keep group IDs equal to existing `fieldGuideSubtopicId` values.
3. Update `scripts/build-static-site.ts` so P1 Skill Check pages render groups, not `items.slice(0, 3)` at topic level.
4. Add hash-target links from Field Guide actions to `skill-check/index.html#<fieldGuideSubtopicId>`.
5. Render only the selected group's 3 default checks first.
6. Render optional sets below the default group, collapsed or secondary.
7. Exclude quarantined groups from default rendering.
8. Add tests that enforce:
   - every default-ready P1 group has exactly 3 default item IDs,
   - no default P1 group contains quarantined item IDs,
   - student-facing group labels avoid banned terms,
   - P1 Skill Check default page still shows a 3-item first set,
   - support-only metadata remains unchanged.

# Contextual Visual Placement Pass - 2026-06-23

## Files Changed
- `scripts/build-static-site.ts`
- `src/data/learnModeLessons.ts`
- `src/static-study/static-study.css`
- `tests/learnModeLessons.test.ts`
- `tests/staticProduct.test.ts`
- Regenerated `docs/assets/static-study.css`
- Regenerated P3 Learn pages under `docs/p3/topics/*/learn/index.html`

## Current Behavior Found
Learn pages previously rendered Field Guide visuals through a generic supplemental appendix at the bottom of the page. The renderer selected every Field Guide topic in the region with `topic.visuals?.length` and displayed it under `Extra diagram for this unit`.

That behavior was too broad. It attached visuals at the unit/topic Learn-page level, not the active Learn step, so Vectors Step 1 could show line-relationship and point-to-line-distance diagrams even though the step was only about 2D and 3D vector notation.

## New Visual Placement Rule
Learn visuals are now mapped by exact Learn step id through `LEARN_VISUAL_TOPIC_IDS_BY_STEP_ID`.

Each `LearnStep` can carry `visualTopicIds`, and the static renderer places those visuals inside the matching Learn step card after the stem and before the student prompt/check. The old generic supplemental visual appendix is removed from Learn-page output.

## Visuals Remapped
- `algebra_modulus_graph_equations`: `learn-alg-absolute-value-graph`, `learn-alg-absolute-value-equations`, `learn-alg-absolute-value-inequalities`, `learn-alg-absolute-value-graph-intervals`
- `log_graph_inverse`: `learn-log-natural-e-inverse`
- `trig_reciprocal_functions`: `learn-trig-reciprocal-graphs`, `learn-trig-reciprocal-identities-equations`
- `trig_double_angle_formulae`: `learn-trig-identity-full-solve`, `learn-trig-basic-equation-interval`
- `trig_r_form_transformations`: `learn-trig-r-form-transform`
- `p3_diff_stationary_tangent_normal`: `learn-diff-tangent-gradient`, `learn-diff-normal-gradient`, `learn-diff-stationary-condition`, `learn-diff-classify-stationary`
- `integrals_definite_area_bridge`: `learn-int-definite-upper-minus-lower`, `learn-int-area-between-curves`
- `iteration_graph_root_proof`: `learn-iteration-sign-change-bracket`, `learn-iteration-graph-link`
- `modulus-argument`: `learn-complex-modulus`, `learn-complex-argument-quadrant`, `learn-complex-cartesian-to-modarg`, `learn-complex-modarg-to-cartesian`
- `roots`: `learn-complex-roots-arguments`
- `locus`: `learn-complex-modulus-locus`, `learn-complex-argument-locus`
- `vectors_intersect_parallel_skew`: `learn-vectors-line-intersection`, `learn-vectors-skew-check`
- `vectors_point_to_line_distance`: `learn-vectors-foot-of-perpendicular`, `learn-vectors-reflection-in-line`

## Visuals Suppressed Or Left Unmapped
- `derivatives_parametric` remains available in Field Guide metadata but is not rendered in Learn because the current Differentiation Learn sequence has no precise authored parametric-differentiation step.
- `vectors_intersect_parallel_skew` is not rendered for `learn-vectors-2d-3d-notation`, `learn-vectors-direction-from-points`, or other notation-only/vector-basics steps.
- `vectors_point_to_line_distance` is not rendered for `learn-vectors-2d-3d-notation` or unrelated vector-line setup steps.
- Differential Equations has no Field Guide visual mapped into Learn in this pass.

## Routes Manually Checked
- `/p3/topics/vectors/learn`
- Vectors step `learn-vectors-2d-3d-notation`: no `vectors_intersect_parallel_skew` or `vectors_point_to_line_distance`
- Vectors step `learn-vectors-line-intersection`: renders `vectors_intersect_parallel_skew`
- Vectors step `learn-vectors-foot-of-perpendicular`: renders `vectors_point_to_line_distance`
- `/p3/topics/complex-numbers/learn`: renders modulus/argument, roots, and locus visuals only on mapped steps
- `/p3/topics/integration/learn`: renders the area/definite-integral visual only on mapped definite-integral and area-between-curves steps

## Tests Added Or Updated
- Added Vectors data-level regression coverage in `tests/learnModeLessons.test.ts`.
- Updated static Learn visual duplicate coverage to check per step rather than whole page.
- Added static regression that generated Learn pages do not render `Extra diagram for this unit` or `supplemental-visual-section`.
- Added static regression that Vectors Step 1 excludes both Vectors visuals and later relevant Vectors steps render their matching visuals.

## Commands Run
- `npm run build`: passed
- `npm test`: failed once due to Vitest worker JavaScript heap OOM after 18 of 19 files passed
- `NODE_OPTIONS=--max-old-space-size=4096 npm test`: passed, 19 files / 217 tests
- `npm run static:check`: passed
- `git diff --stat`: passed, reported final diff
- `git diff --check`: passed
- Manual DOM inspection for Vectors, Complex Numbers, and Integration Learn pages: passed

## Confirmation
- Diagram artwork was not changed.
- Maths content was not changed.
- Questions were not changed.
- Answers were not changed.
- Checker logic was not changed.
- Progression logic was not changed.

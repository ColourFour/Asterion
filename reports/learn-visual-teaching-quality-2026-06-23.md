# Learn Visual Teaching Quality Pass - 2026-06-23

## Files Changed
- `scripts/generate-p3-field-guide-visuals.mjs`
- `scripts/build-static-site.ts`
- `src/data/fieldGuideTopics.ts`
- `src/static-study/static-study.css`
- `tests/fieldGuideAtomic.test.ts`
- `tests/learnModeLessons.test.ts`
- `tests/staticProduct.test.ts`
- Regenerated `public/assets/p3/visuals/**/*.png`
- Regenerated `docs/assets/p3/visuals/**/*.png`
- Regenerated `docs/assets/static-study.css`
- Regenerated P3 Learn pages under `docs/p3/topics/*/learn/index.html`

## Visual Inventory
| Visual ID | Topic | Mapped Learn step IDs | Rating before | Main issue found | Change made |
|---|---|---|---|---|---|
| `algebra_modulus_graph_equations` | Algebra | `learn-alg-absolute-value-graph`, `learn-alg-absolute-value-equations`, `learn-alg-absolute-value-inequalities`, `learn-alg-absolute-value-graph-intervals` | WEAK | Showed modulus graphs but did not clearly separate equation intersections from inequality interval logic. | Rebuilt as `y=|x-a|` with `y=b`, two intersections, shaded inside interval, and key move note. |
| `log_graph_inverse` | Logarithmic and Exponential Functions | `learn-log-natural-e-inverse` | OK | Had inverse curves but weak domain/range teaching cue. | Rebuilt with `y=e^x`, `y=ln x`, `y=x`, inverse point pair `(0,1)` and `(1,0)`, and `ln x` domain note. |
| `trig_reciprocal_functions` | Trigonometry | `learn-trig-reciprocal-graphs`, `learn-trig-reciprocal-identities-equations` | WEAK | Showed reciprocal behavior but did not warn against inverse-angle confusion. | Rebuilt around `sin x` and `cosec x`, asymptotes at zeros, and reciprocal-not-inverse warning. |
| `trig_double_angle_formulae` | Trigonometry | `learn-trig-identity-full-solve`, `learn-trig-basic-equation-interval` | REMOVE_FROM_LEARN if unchanged | Previous unit-circle/interval visual did not teach double-angle formula choice. | Replaced with formula map and mini example turning `cos 2x` into a quadratic in `sin x`. |
| `trig_r_form_transformations` | Trigonometry | `learn-trig-r-form-transform` | OK | Had amplitude and triangle but the action was too implicit. | Rebuilt with coefficient triangle, `R=sqrt(a^2+b^2)`, `tan alpha=b/a`, phase-shift graph, and max/min cue. |
| `p3_diff_stationary_tangent_normal` | Differentiation | `learn-diff-tangent-gradient`, `learn-diff-normal-gradient`, `learn-diff-stationary-condition`, `learn-diff-classify-stationary` | OK | Useful but needed a clearer derivative-to-line-geometry action. | Rebuilt with tangent, normal, horizontal stationary tangent, and negative-reciprocal note. |
| `integrals_definite_area_bridge` | Integration | `learn-int-definite-upper-minus-lower`, `learn-int-area-between-curves` | OK | Showed area but did not foreground `F(b)-F(a)` and top-minus-bottom enough. | Rebuilt with shaded signed area, `F(b)-F(a)`, area-between-curves inset, and sign warning. |
| `iteration_graph_root_proof` | Numerical Solution of Equations | `learn-iteration-sign-change-bracket`, `learn-iteration-graph-link` | WEAK | Mixed graph intersection/bracket ideas without separating bracketing from iteration. | Rebuilt with x-axis root bracket, opposite signs, continuity note, and separate `x_n -> x_{n+1}` iteration cue. |
| `modulus-argument` | Complex Numbers | `learn-complex-modulus`, `learn-complex-argument-quadrant`, `learn-complex-cartesian-to-modarg`, `learn-complex-modarg-to-cartesian` | OK | Useful but needed stronger quadrant warning and formula cue. | Rebuilt Argand diagram with `|z|`, `arg z`, component triangle, and quadrant warning. |
| `roots` | Complex Numbers | `learn-complex-roots-arguments` | OK | Had equal spacing but did not make the angle step/action prominent enough. | Rebuilt with equal-radius roots, rotation arrows, `2pi/n` angle step, and branch formula cue. |
| `locus` | Complex Numbers | `learn-complex-modulus-locus`, `learn-complex-argument-locus` | WEAK | Combined several locus ideas in one busy region without clearly separating condition types. | Rebuilt as three mini-panels: circle, argument ray, and perpendicular bisector, plus region-shading warning. |
| `vectors_intersect_parallel_skew` | Vectors | `learn-vectors-line-intersection`, `learn-vectors-skew-check` | WEAK | Pictures existed, but the decision process was too implicit. | Rebuilt as three panels with direction-vector and simultaneous-parameter checks. |
| `vectors_point_to_line_distance` | Vectors | `learn-vectors-foot-of-perpendicular`, `learn-vectors-reflection-in-line` | OK | Useful but needed to foreground the equation students calculate. | Rebuilt with `P`, line `r=a+lambda d`, foot `Q`, vector `PQ`, `PQ . d = 0`, and distance `|PQ|`. |

## Visuals Improved
Improved all 13 unique visuals currently mapped into Learn.

Also regenerated `derivatives_parametric` because it is part of the same generated visual asset set, but it remains unmapped from Learn.

## Visuals Suppressed Or Left Unchanged
- No currently Learn-mapped visual was suppressed.
- `derivatives_parametric` remains Field Guide-only and is not rendered in Learn because the current mapped Learn sequence does not include a precise parametric differentiation step.
- Differential Equations still has no Learn-mapped visual.

## Visuals Needing Human Mathematical Review
- No blocking human review item found.
- Recommended non-blocking review: confirm the R-form convention in the visual (`a cos x + b sin x = R cos(x-alpha)`) matches the exact convention desired for the authored Trigonometry step wording. The identity is mathematically consistent as drawn.

## Metadata And Rendering Changes
- Added `title` and optional `instructionalLabels` to `FieldGuideVisual`.
- Rendered visual titles inside `figcaption`.
- Rendered instructional labels in `data-instructional-labels` for lightweight static checks.
- Kept the existing image-first rendering pattern. No external dependency was added.

## Routes Manually Checked
- `/p3/topics/algebra/learn`
- `/p3/topics/trigonometry/learn`
- `/p3/topics/complex-numbers/learn`
- `/p3/topics/integration/learn`
- `/p3/topics/vectors/learn`

Manual checks covered:
- visuals remain on relevant mapped steps only
- old `Extra diagram for this unit` appendix is absent
- visual titles and teaching labels render in Learn page HTML
- regenerated diagram PNGs are readable at 960x540
- the diagrams now show a mathematical action or mistake cue, not just decorative graphs

## Tests Added Or Updated
- `tests/learnModeLessons.test.ts`
  - checks every Learn-mapped visual has title, caption, tested concept, and instructional labels
  - checks key visual labels: `|z|`, `arg z`, `PQ . d = 0`, `F(b)-F(a)`, and `2pi/n` equivalents
- `tests/staticProduct.test.ts`
  - checks generated Learn HTML exposes key visual teaching labels
  - keeps the regression that no generic supplemental visual appendix appears
- `tests/fieldGuideAtomic.test.ts`
  - updated visual fixture for required title metadata
- `src/data/fieldGuideTopics.ts`
  - validation now flags missing titles and empty instructional labels

## Commands Run
- `node scripts/generate-p3-field-guide-visuals.mjs`: passed
- `npm run build`: passed
- `npm test`: failed once from Vitest worker JavaScript heap OOM after 18 of 19 files passed
- `NODE_OPTIONS=--max-old-space-size=4096 npm test`: passed, 19 files / 220 tests
- `npm run static:check`: passed
- `git diff --stat`: passed
- `git diff --check`: passed
- Manual image inspection with `view_image`: passed after fixing R-form, iteration, reciprocal trig, locus, roots, and vector-label readability issues
- Manual DOM inspection for required routes: passed

## Confirmation
- Questions were not changed.
- Accepted answers were not changed.
- Checker logic was not changed.
- Progression logic was not changed.
- Learn placement logic was not changed beyond rendering the new visual metadata.

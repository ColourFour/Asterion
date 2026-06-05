# P1 Skill Check Improvement Pass - 2026-06-05

## 1. Executive Summary

This pass improved the P1 Skill Check branch from a topic-level starter experience into Field Guide-aligned, small, focused Skill Check groups.

The final student path is:

`Course -> Topic -> Field Guide phase -> matching 3-question Skill Check group -> next Field Guide phase or Exam Training`

The default Skill Check experience remains cognitive-load safe. A student sees a focused 3-question set for the selected skill, not a long bank such as "Skill Check 1 of 44". Optional extra practice exists only as secondary sets where the local P1 source data supports it.

The pass also quarantined uncertain Integration material, strengthened worked solutions, added curriculum-safety tests, regenerated the static site, and verified the rendered P1 routes in browser automation.

## 2. Topics Improved

All active P1 topics present in the repo source data were improved:

| Topic slug | Topic title | Syllabus ref in source data | Final active groups |
| --- | --- | --- | ---: |
| `quadratics` | Quadratics | `9709 P1 1.1` | 5 |
| `functions` | Functions and Transformations | `9709 P1 1.2` | 5 |
| `coordinate-geometry` | Coordinate Geometry | `9709 P1 1.3` | 4 |
| `circular-measure` | Circular Measure | `9709 P1 1.4` | 2 |
| `trigonometry` | Trigonometry | `9709 P1 1.5` | 4 |
| `binomial-expansion` | Binomial Expansion | `9709 P1 1.6` | 2 |
| `series` | Series | `9709 P1 1.7` | 3 |
| `differentiation` | Differentiation | `9709 P1 1.8` | 7 |
| `integration` | Integration | `9709 P1 1.9` | 4 |

## 3. Skill Check Groups Added Or Revised

Final active P1 Skill Check groups:

| Topic | Groups |
| --- | --- |
| Quadratics | factoring; inequalities; formula; discriminant; graphs |
| Functions and Transformations | composite functions; inverse functions; translations; reflections; stretches |
| Coordinate Geometry | parallel/perpendicular lines; straight-line equations; circles; intersections |
| Circular Measure | radians; arc length and sector area |
| Trigonometry | exact values; graphs; equations; identities |
| Binomial Expansion | basic expansion; complex/targeted expansions |
| Series | arithmetic progressions; geometric progressions; infinite geometric progressions |
| Differentiation | tangent gradient; polynomials; simple linear-bracket chain rule; second derivative; tangents/normals; stationary points; rates of change |
| Integration | basic integration; constant of integration; definite integrals; area bounded between curves |

Each active group has exactly 3 default questions:

1. First check: accessible recognition or first method choice.
2. Use the method: standard application with substitution, algebra, graph reading, or formula use.
3. Exam-style twist: parameter, interpretation, graph, restriction, or slightly more demanding application where appropriate.

Optional secondary sets remain non-default. Final active count is 108 default questions plus 7 optional questions, for 115 active P1 Skill Check items.

## 4. Coverage Before Vs After

| Area | Before pass | After pass |
| --- | --- | --- |
| Topic inventory | 9 P1 topics present | 9 P1 topics covered |
| Default routing | Topic-level Skill Check starter, usually first 3 items only | Field Guide phase links to exact Skill Check group where safe |
| Default set size | Not reliably tied to the current Field Guide skill | Exactly 3 default items per active P1 group |
| Active groups | Mixed topic/subtopic coverage; Integration included unsafe advanced groups | 36 active Field Guide-aligned groups |
| Active items | 121 authored items observed in the original audit; unsafe Integration items were part of the risk | 115 active items after quarantine; 6 unsafe Integration items hidden |
| Worked answers | Present but generic method cues and some weak final lines | Method-led, concise worked routes with first step, final answer, and common mistake feedback |
| Curriculum safety | Some items cited unreviewed P1 exam-bank references; unsafe Integration scope visible in data | Active items rely on P1 content-map source and active Field Guide sections only |
| Rendered student flow | Field Guide links could land at topic-level Skill Check | P1 Field Guide subtopic CTAs use exact anchors; fallback is plain topic Skill Check page |

## 5. Syllabus And Local Sequencing Status

The local P1 source data remains labelled as draft/source-filled and still needs a formal syllabus-contract review before using it as mastery or readiness evidence.

Resolved by the 2026-06-05 syllabus reconciliation:

| Skill area | Current decision |
| --- | --- |
| Improper integrals | Official P1 content for simple improper integrals, but quarantined from active P1 Skill Checks because no matching local Field Guide phase exists. |
| Volumes of revolution | Official P1 content for volumes about the x-axis or y-axis, but quarantined from active P1 Skill Checks because no matching local Field Guide phase exists. |
| Unreviewed P1 exam-bank records | Not used as authority for active Skill Check metadata because local catalog records are `needs_review` and `student_runtime_safe=false`. |

No deprecated difficulty metadata is used for P1 Skill Check routing or readiness.

## 6. Questions Deliberately Rejected As Out Of Scope

The following authored support items remain hidden from the active P1 Skill Check export:

- `p1-sc-integration-improper-001`
- `p1-sc-integration-improper-002`
- `p1-sc-integration-improper-003`
- `p1-sc-integration-volumes-001`
- `p1-sc-integration-volumes-002`
- `p1-sc-integration-volumes-003`

Reason: the active P1 Field Guide source does not include improper integrals or volumes of revolution. The official syllabus includes them, but default student-facing Skill Checks still require matching local Field Guide support.

Coordinate Geometry items previously carrying unreviewed `exam-bank reference` metadata were not rejected as questions, but their exam-bank source references were removed from active P1 Skill Check authority.

## 7. Field Guide To Skill Check Mappings Added

P1 Field Guide CTAs now use ordinary static links with anchors:

- `../skill-check/#p1-quadratics-factoring`
- `../skill-check/#p1-quadratics-inequalities`
- `../skill-check/#p1-quadratics-formula`
- `../skill-check/#p1-quadratics-discriminant`
- `../skill-check/#p1-quadratics-graphs`
- matching anchors for all other active P1 Field Guide subtopics

CTA text is short and student-facing:

- `Try 3 quick questions`

Fallback behavior:

- If a P1 group is missing, the CTA links to the topic Skill Check page without a hash.
- M1 and S1 seeded pages also fall back to plain topic Skill Check links, avoiding nonexistent subtopic hashes.
- No mapping internals are exposed to students.

## 8. Rendered Routes Checked

Rendered QA used the generated static site served from `docs/` at `http://localhost:4173`.

Checked routes:

- `/p1/`
- `/p1/topics/`
- `/p1/topics/quadratics/field-guide/`
- `/p1/topics/quadratics/skill-check/`
- `/p1/topics/functions/skill-check/`
- `/p1/topics/coordinate-geometry/skill-check/`
- `/p1/topics/circular-measure/skill-check/`
- `/p1/topics/trigonometry/skill-check/`
- `/p1/topics/binomial-expansion/skill-check/`
- `/p1/topics/series/field-guide/`
- `/p1/topics/series/skill-check/`
- `/p1/topics/differentiation/skill-check/`
- `/p1/topics/integration/skill-check/`

Route note: the requested `/p1/topics/functions-transformations/skill-check/` route does not exist in generated `docs/`; the repo route helper and generated path use `/p1/topics/functions/skill-check/`.

Rendered QA checks passed:

- Skill Check pages initialize to focused 3-question sets.
- Default visible state shows one active card from the 3-question set.
- No `Skill Check 1 of 44` dump appeared.
- Worked-solution reveals include expected answer, method cue, first step, common mistake, and worked steps.
- KaTeX notation rendered with no `.katex-error` nodes.
- Field Guide CTAs route to relevant Skill Check anchors.
- No internal audit/source/admin language appeared in checked rendered pages.
- Mobile viewport at `390px` had no horizontal overflow.
- No console errors or browser page errors were detected.

## 9. Screenshots Captured

No screenshots were captured for this Phase 7/8 QA run. Browser QA used DOM, console, viewport, route, and rendered-text assertions through Playwright and `agent-browser`.

## 10. Validation Commands And Results

| Command | Result |
| --- | --- |
| `npm run build` | Passed. Generated 211 static HTML pages in `docs/`. |
| `npm run static:check` | Passed. Static site check and rendered static page check passed for 211 HTML pages. |
| `npm test` | Passed. 56 test files, 476 tests. |
| `git diff --check` | Passed. No whitespace errors. |
| `npm run lint --if-present` | Passed with no output. |
| Browser/Playwright rendered QA | Passed. No failures reported across checked P1 routes. |

## 11. Remaining Next Steps

1. Keep the formal P1 syllabus-contract review separate from mastery/readiness evidence; official inclusion alone is not enough to enable evidence.
2. Restore quarantined Integration improper-integral and volume-of-revolution items only after adding matching local Field Guide support.
3. Add reviewed P1 exam-bank source evidence only after catalog records are reviewed and marked student-runtime safe.
4. Consider adding a generated-route alias or redirect for `/p1/topics/functions-transformations/` only if students or external links are expected to use that slug.
5. Continue topic-by-topic student simulation after the content pass to check cognitive load, wording clarity, and retention across a full P1 study session.

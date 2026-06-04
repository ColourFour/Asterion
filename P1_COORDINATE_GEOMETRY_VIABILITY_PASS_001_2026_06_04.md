# P1 Coordinate Geometry Viability Pass 001 - 2026-06-04

## 1. Audit issues addressed

This pass implemented the highest-priority Coordinate Geometry recommendations from `P1_CURRICULUM_EXAM_READINESS_AUDIT_COORDINATE_PRIORITY_2026_06_04.md`.

Addressed issues:

- Distance and midpoint were missing from the visible Coordinate Geometry formula support.
- The Field Guide did not show enough exam-bridge routes for two-point line equations, perpendicular bisectors, expanded circle equations, line-circle intersections, or tangents.
- Skill Checks were too shallow for old Paper 1 behaviours and mostly tested one-step recognition.
- No current item tested completing the square from expanded circle form.
- No current item tested circle-from-diameter, perpendicular bisector, tangent-radius logic, or discriminant-based intersection/tangency decisions.
- The Coordinate Geometry page needed a compact reviewer note clarifying draft/support-only status and the need for written working.

## 2. Field Guide changes

Updated `src/data/p1SeedContent.ts` for the Coordinate Geometry unit only.

Changes made:

- Added midpoint and distance formulas to the visible formula list.
- Added `ax + by + c = 0` and expanded circle form `x^2 + y^2 + 2gx + 2fy + c = 0`.
- Strengthened the worked method list with:
  - straight line from two points,
  - perpendicular bisector from endpoints,
  - expanded circle completing-square route,
  - line-circle substitution route,
  - tangent-at-point route using radius gradient and negative reciprocal.
- Strengthened subtopic worked examples:
  - `Parallel and perpendicular lines` now includes midpoint plus perpendicular bisector setup.
  - `Equation of a straight line` now includes two-point gradient and conversion to both `y = mx + c` and `ax + by + c = 0`.
  - `Circles` now includes completing the square for `x^2 + y^2 + 6x - 10y + 18 = 0`.
  - `Points of intersection` now includes a non-axis line-circle substitution example.
- Added a compact Coordinate-specific reviewer note through the existing `practiceHook`.

## 3. Skill Check changes

Updated `src/data/p1SkillCheckItems.ts`.

Coordinate Geometry count:

| State | Count |
| --- | ---: |
| Before pass | 12 |
| After pass | 18 |

New/reworked behaviours:

| Behaviour | Item |
| --- | --- |
| Perpendicular bisector from two endpoints | `p1-sc-coordinate-parallel-perpendicular-004` |
| Two-point line equation and final-form conversion | `p1-sc-coordinate-straight-line-004` |
| Circle from diameter endpoints using midpoint and radius squared | reworked `p1-sc-coordinate-circles-003` |
| Expanded circle completing square | `p1-sc-coordinate-circles-004` |
| Tangent at a point using radius gradient | `p1-sc-coordinate-circles-005` |
| Non-axis line-circle intersection | `p1-sc-coordinate-intersections-004` |
| Discriminant/method-order for intersects/touches/misses | `p1-sc-coordinate-intersections-005` |

The final Coordinate Geometry distribution is:

| Subtopic | Count |
| --- | ---: |
| Parallel and perpendicular lines | 4 |
| Equation of a straight line | 4 |
| Circles | 5 |
| Points of intersection | 5 |

All new and reworked items remain deterministic draft support items. P1 review flags remain locked to `draft_review_needed`, `supportOnly: true`, `affectsMastery: false`, and `evidenceEnabled: false`.

## 4. Old-paper behaviours now better represented

This pass does not create a reviewed exam-bank runtime flow. It does, however, make the support layer better resemble local old-paper Coordinate Geometry behaviours found in the audit:

- `public/assets/exam-bank-data/p1/12autumn22/questions/q01.png`: perpendicular bisector and circle from two points.
- `public/assets/exam-bank-data/p1/11autumn24/questions/q06.png`: expanded circle equation, centre/radius extraction, and distance between centres.
- `public/assets/exam-bank-data/p1/12autumn25/questions/q07.png`: diameter endpoints, circle equation, and tangent work.
- `public/assets/exam-bank-data/p1/11autumn21/questions/q07.png`: line-circle substitution and chord/intersection work.
- `public/assets/exam-bank-data/p1/11autumn22/questions/q11.png`: tangent/intersection condition via substitution and discriminant reasoning.
- `public/assets/exam-bank-data/p1/12autumn24/questions/q08.png`: tangent/normal from circle geometry and expanded circle parameters.

## 5. What remains weak

- The items are still multiple-choice or numeric support checks, not full written Paper 1 solutions.
- No item yet asks students to calculate a chord length or triangle area after line-circle intersections.
- Elementary circle geometry such as angle in a semicircle and symmetry is still not directly checked.
- The P1 exam-bank topic routing is still DeepSeek sidecar routing, not reviewed P1 skill routing.
- There is still no P1 reviewed runtime-safe question-bank projection.
- The renderer still does not require written working, so students can guess multiple-choice answers unless guided by a teacher/reviewer.

## 6. Colleague-review clarity

Coordinate Geometry is now clearer for colleague review. The unit no longer looks like only a formula reminder plus shallow checks. A reviewer can now see the intended bridge:

Field Guide method route -> support-only Skill Check -> old Paper 1-style behaviour.

It remains a draft demonstration, not an exam-readiness claim.

## 7. Tests updated

Updated:

- `src/tests/courseSeedContent.test.ts`
- `src/tests/skillChecklist.test.ts`

Test coverage now enforces:

- P1 remains draft/support-only/evidence-disabled.
- Coordinate Geometry has 18 items.
- Coordinate Geometry covers distance/midpoint support, perpendicular bisector, expanded circle/completing square, line-circle intersection, tangent-radius logic, and discriminant/tangency or intersection condition.
- No duplicate IDs through the existing contract validator.
- No unsupported answer shapes through the existing authored item contract validator.
- No hidden-code or artificial partial-answer wording in the Coordinate Geometry checks.

## 8. Recommended next pass

After colleague or student feedback, run a narrow Coordinate Geometry Feedback Pass 001:

1. Watch whether students write the working steps or only choose answer options.
2. Add one chord-length or triangle-area follow-through item if Coordinate Geometry still looks too setup-only.
3. Add one elementary circle geometry check if old-paper review confirms the right level of support.
4. If the colleague wants exam-image readiness, manually review a small set of P1 coordinate old-paper records and create a reviewed reference sampler before any runtime use.
5. Do not enable P1 mastery/readiness until source-skill and mark-event review exists.

# P1 Needs-Improvement Pass 001 Student Trial Hardening - 2026-06-03

## Summary

This pass addressed the highest-leverage issues from `P1_STUDENT_USE_AUDIT_AND_NEEDS_IMPROVEMENT_LEDGER_2026_06_03.md` without expanding the whole P1 course and without changing P1 evidence status.

P1 remains draft support-only content. No P1 Skill Check was converted to reviewed status, readiness evidence, mastery evidence, adaptive evidence, teacher evidence, or final assessment evidence.

Final P1 Skill Check count: **115**.

## Top Audit Issues Addressed

- Strengthened the generated P1 practice-page warning so students see that saved checks are support-only practice interactions, not marks, mastery, readiness, teacher evidence, final assessment evidence, adaptive routing, unlock progress, or course completion.
- Kept Integration improper integrals and volumes of revolution visible, but made the advanced sections and two representative Skill Checks explicitly teacher-guided draft support.
- Reworked thin later-unit items so the draft student trial better tests reasoning and setup rather than only final numeric answers.
- Added tests for support-only flags, supported renderer shapes, no duplicate IDs, course-correct warning text, and the targeted P1 hardening items.

## Items And Field Guide Sections Changed

| Area | ID or section | Change |
| --- | --- | --- |
| Practice pages | `scripts/build-static-site.ts` | Replaced the weaker evidence-disabled note with a stronger student-trial warning and kept course-specific `P1 Field Guide path` wording. |
| Circular Measure | `p1-sc-circular-arc-sector-003` | Replaced a reverse arc-angle numeric drill with a sector perimeter setup item that includes two radii plus arc length. |
| Trigonometry | `p1-sc-trig-equations-004` | Replaced a single-answer tangent equation with a multiple-choice reasoning item requiring reference angle, period, and complete solution set. |
| Binomial Expansion | `p1-sc-binomial-complex-003` | Made the term-selection/index choice explicit by asking for the correct `r` value and general term. |
| Series | `p1-sc-series-gp-003` | Replaced a direct finite-sum drill with a GP unknown-ratio item using first and third terms. |
| Differentiation | `p1-sc-diff-rates-002` | Replaced a bare rate number with an interpretation item requiring "volume per unit increase in radius" meaning. |
| Integration | `p1-sc-integration-area-between-003` | Replaced a too-simple line-line area setup with a line-curve setup requiring top-minus-bottom over intersection limits. |
| Integration | `p1-sc-integration-improper-003` | Made the prompt and support copy teacher-guided draft only, focused on limit setup rather than reviewed assessment evidence. |
| Integration | `p1-sc-integration-volumes-001` | Made the prompt teacher-guided draft only and changed the task from final volume answer to setup-first recognition. |
| Integration Field Guide | `Improper integrals` | Renamed to `Improper integrals (teacher-guided draft)` and clarified that this still needs course-contract review. |
| Integration Field Guide | `Volumes of revolution` | Renamed to `Volumes of revolution (teacher-guided draft)` and clarified setup-only teacher-guided draft status. |

## Deliberately Deferred

- No broad P1 expansion.
- No P1 reviewed/mastery/readiness conversion.
- No renderer redesign.
- No coordinate-geometry completing-square item yet; this should wait for source-contract confirmation.
- No functions inverse domain/range item yet; this should wait for source-contract confirmation and a renderer-safe answer shape.
- No full trigonometry graph/identity exam-style rebuild.
- No removal of Integration advanced topics, because the task required keeping source-backed topics visible.

## Remaining Warnings For Student Trial

- P1 is still draft support-only content and should be introduced that way.
- Integration advanced items remain teacher-guided draft support and should not be framed as reviewed assessment-ready P1 content.
- Multiple-choice items are useful for renderer safety but can still allow guessing without written working.
- Several units still need exam-style structured items after observing how students use the draft layer.
- Saved support-only attempts may still need teacher explanation so students do not interpret them as official progress.

## Classroom Observation Notes

Watch for:

- Students ignoring the support-only warning or treating saved attempts as grades.
- Students choosing multiple-choice answers without writing any working.
- Students needing teacher support on Integration advanced sections despite the teacher-guided draft wording.
- Students solving trig equations by answer recognition rather than reference angle, quadrant, and period reasoning.
- Students confusing sector perimeter with arc length or area.
- Students giving rates as bare numbers without units or "per" interpretation.
- Students struggling to identify upper-minus-lower in area-between-curves setup.
- Students using a GP term formula with the wrong exponent when solving for an unknown ratio.

## Recommended Next Pass After Trial

After observing students, run a short "P1 Trial Feedback Pass 001" that:

- Uses real confusion signals from student work before adding more items.
- Decides whether Integration advanced topics stay visible, get further fenced, or wait for reviewed source-contract evidence.
- Adds only the highest-friction structured items, likely in Trigonometry, Circular Measure, Differentiation rates, and Integration setup.
- Keeps every P1 item draft/support-only/evidence-disabled until source-skill and mark-event review are complete.


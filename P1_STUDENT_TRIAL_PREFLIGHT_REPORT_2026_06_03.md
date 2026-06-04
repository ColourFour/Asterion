# P1 Student Trial Preflight Report - 2026-06-03

## Trial Clearance

**CLEARED_FOR_SMALL_DRAFT_STUDENT_TRIAL_WITH_WARNINGS**

The P1 draft student trial is cleared for a small guided classroom trial. No new blocker was found during this preflight. P1 remains draft support-only content with 115 Skill Checks across 9 units and 38 subtopics.

This clearance is not a reviewed syllabus-contract approval, not mastery/readiness approval, and not final assessment approval.

## Routes Checked

Static route checks covered:

- P1 dashboard: `docs/p1/index.html`
- P1 topics index: `docs/p1/topics/index.html`
- P1 course Exam Training page: `docs/p1/exam-training/index.html`
- Unit overview, Field Guide, practice, and unit Exam Training pages for:
  - Quadratics
  - Functions and Transformations
  - Coordinate Geometry
  - Circular Measure
  - Trigonometry
  - Series
  - Differentiation
  - Integration
  - Binomial Expansion

The generated P1 static tree contains 39 `index.html` pages: the dashboard, topics index, course Exam Training page, and 4 pages for each of the 9 units.

## Warning Copy Check

Every generated P1 unit practice page was checked for the student-trial warning. The warning states that saved checks are support-only practice interactions and do not create:

- mastery evidence
- readiness evidence
- marks
- teacher evidence
- final assessment evidence
- adaptive routing
- unlock progress
- course completion

No generated P1 page matched the checked M1 route wording strings.

## Integration Scope Check

Integration advanced topics remain visible but fenced as teacher-guided draft support:

- Improper integrals are labelled `Improper integrals (teacher-guided draft)`.
- Volumes of revolution are labelled `Volumes of revolution (teacher-guided draft)`.
- The Integration overview, Field Guide, and practice pages state that these areas still need course-contract review before they are treated as assessment-ready.
- Representative Skill Checks use `Teacher-guided draft only` wording and focus on setup rather than reviewed assessment evidence.

## Data Alignment Check

P1 source data still reports 115 `p1-sc-*` Skill Checks. The static P1 pages align to the current generated route set. Existing tests cover P1 support-only flags, duplicate IDs, supported renderer shapes, and warning text.

Expected P1 guardrails remain:

- `review.status: 'draft_review_needed'`
- `review.sourceSkillReviewed: false`
- `review.markEventReviewed: false`
- `review.affectsMastery: false`
- `review.supportOnly: true`
- `review.evidenceEnabled: false`

## Fixes Made During This Preflight

No new code or data fixes were made during this preflight. The earlier Needs-Improvement Pass 001 changes already strengthened the P1 practice warning, fenced Integration advanced topics, and hardened selected weak Skill Checks.

## Remaining Warnings

- P1 is still draft support-only content.
- P1 saved attempts are not marks, mastery, readiness, teacher evidence, final assessment evidence, or course completion.
- Integration improper integrals and volumes of revolution should remain teacher-guided during the trial.
- Later units still need more structured exam-style practice after student observation.
- Multiple-choice items may still allow guessing unless students write working.
- This trial should not be used to claim syllabus completeness or readiness.

## Recommended Next Pass After Observation

Run **P1 Trial Feedback Pass 001** after the classroom trial.

Bounded scope:

- Fix any blocker found in routes, warning copy, answer correctness, unsupported answer shapes, or misleading Integration scope.
- Use observed student confusion to choose at most 6-10 improvements.
- Prioritize Trigonometry reasoning, Circular Measure compound setup, Differentiation rates-of-change interpretation, Integration setup/scope, and any repeated saved-attempt misunderstanding.
- Do not expand the whole course.
- Do not enable mastery, readiness, reviewed status, adaptive evidence, marks, or final assessment evidence.
- Keep P3 and M1 source files untouched.

Acceptance criteria:

- All P1 items remain draft/support-only/evidence-disabled.
- Any changed item is tied to observed trial evidence or a confirmed blocker.
- Static pages regenerate cleanly.
- `npm test`, `npm run build`, and `npm run static:check` pass.

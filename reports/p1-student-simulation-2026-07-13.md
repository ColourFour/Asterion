# P1 student simulation — 2026-07-13

## Scope and launch state

This pass reviews the generated eight-topic P1 surface in `docs/p1/` at desktop and 390 px mobile widths. P1 is still `coming-soon`; the simulations assess the internal course experience, not launch readiness. Exam Training correctly contains no archive questions because 0 of 1,034 records has an Asterion-reviewed runtime-safe promotion.

Browser checks covered light/dark themes, keyboard focus, Starting Check save/resume/reset, Learn activity, primary and distinct-retry Checked Practice evidence, hidden retry state, course-scoped storage, and mobile overflow/touch targets. The pass found and fixed small Starting Check answer targets and a mobile hash overflow on Content QA.

## Persona walkthroughs

### Weak student

- Starting knowledge/confidence: uneven algebra, low confidence.
- Path: P1 dashboard → optional Starting Check → one or two recommended topics → Learn → Checked Practice.
- Motivation spike: the check recommends a small next step without locking the other seven units.
- Frustration/overload: a full topic contains several atomic skills, but each Learn card and check is finite.
- Quit risk: low to medium if the student opens Need to Know before using the recommended action.
- Result: the dashboard keeps one prominent Starting Check action and a direct Quadratics skip.

### Strong student

- Starting knowledge/confidence: high; wants proof of readiness quickly.
- Path: direct Checked Practice fast lane → clean primary submissions → optional Exam Training.
- Motivation spike: direct access avoids mandatory Learn and diagnostic work.
- Frustration/overload: current Exam Training is empty until reviewed archive promotion.
- Quit risk: medium during internal review, which is why P1 remains launch-gated.
- Result: Checked Practice can produce strong local evidence; Learn and Starting Check remain optional.

### Anxious student

- Starting knowledge/confidence: moderate knowledge, high test anxiety.
- Path: reads the non-grade Starting Check explanation → completes part of it → reloads → resumes → chooses a suggested topic.
- Motivation spike: “not a grade,” “never a lock,” and “choose another topic” language.
- Frustration/overload: eight questions are visible on one page.
- Quit risk: low after confirming draft persistence and free topic choice.
- Result: reset and retake work, and the saved report explicitly carries `completionCredit=false`.

### Speedrunner

- Starting knowledge/confidence: high; attempts to gain completion with minimal work.
- Path: bypasses Learn → submits primary guesses → corrects the same item → tries revealed help → uses distinct retry.
- Motivation spike: direct Checked Practice remains available.
- Exploit pressure: repeated same-item corrections, hints, repair, and answer reveal.
- Quit risk: low, but evidence inflation risk would be high without the strong-evidence contract.
- Result: same-item correction is practice only; the first clean submission to a distinct reviewed retry can be strong evidence.

### Disengaged student

- Starting knowledge/confidence: unknown; low willingness to choose.
- Path: dashboard’s single recommended action → Starting Check or Quadratics skip → one finite Learn card.
- Motivation spike: clear unit numbering and visible next action.
- Frustration/overload: direct-route details can expose more choices if expanded.
- Quit risk: medium after the first unit if progress feels abstract.
- Result: activity and Checked Practice progress are visible, while the 1,034-question archive is never presented as workload.

### Completionist

- Starting knowledge/confidence: variable; motivated by finishing every surface.
- Path: all eight Learn paths → all finite Checked Practice skills → Review/export → optional Exam Training.
- Motivation spike: exactly eight ordered units and finite skill counts.
- Frustration/overload: could misread archive totals as required completion.
- Quit risk: low after the explicit statement that Exam Training is optional and the archive is not a checklist.
- Result: course completion depends on the finite core and strong Checked Practice, not page visits or archive volume.

### Confused student

- Starting knowledge/confidence: uncertain about P1 versus P3 and similarly named topics.
- Path: P1 navigation → P1 Trigonometry → Learn/Checked Practice → Review/export.
- Motivation spike: Paper 1 identity appears in headings and P1 navigation.
- Frustration/overload: legacy Field Guide URLs could imply a separate mode.
- Quit risk: low after the bridge explains that Field Guide leads to the same Learn material.
- Result: P1/P3 Trigonometry, Differentiation, and Integration remain separate in storage, attempts, route evidence, recent work, and CSV course fields.

## Remaining launch risks

- All 1,034 archive records still need explicit promote/reject dispositions and fingerprint-matched visual review.
- P1 Exam Training cannot be evaluated for question pacing or mark-scheme cropping until reviewed runtime-safe records exist.
- The equal P1/P3 root chooser is implemented but intentionally inactive until P1 metadata is `ready` and the archive gate reconciles.

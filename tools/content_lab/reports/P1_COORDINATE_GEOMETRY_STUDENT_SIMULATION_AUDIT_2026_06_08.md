# P1 Coordinate Geometry Student Simulation Audit - 2026-06-08

## 1. Executive summary

The generated P1 Coordinate Geometry unit is usable, but it should be accepted only with fixes. The internal generated journey works from the Field Guide overview to subtopic pages, then to the matching Skill Check groups, then to the exam-style direction CTA. Desktop and 390px mobile checks found no app console errors, no KaTeX parse errors, and no page-level horizontal overflow.

The main student-experience weakness is not routing inside the generated nav; it is learning depth. The Field Guide subtopic pages show one example, but the "Try a similar one" prompts are mostly task labels rather than actual questions. The reveal/check panel gives a method and a warning, but not enough concrete working for a weak student to recover. The Skill Check groups are short and navigable, but the global "Next question" button appears before the card, so impatient students can skip without attempting or checking. Several higher-value Coordinate Geometry checks exist, but are hidden behind optional "More practice" or "Challenge" sets.

## 2. Overall verdict: accept / accept with fixes / reject

**Accept with fixes.**

No internal generated-route BLOCKER was found for a student using the visible navigation. However, there are HIGH issues that will cause weak students to stall and strong students to feel under-tested. The requested `/p1/topics/coordinate-geometry/field-guide/intersections/` route is not the generated route; the generated route is `/p1/topics/coordinate-geometry/field-guide/points-of-intersection/`.

## 3. Full journey simulation summary

Landing page:

- The landing page is overview-only and does not duplicate worked-example panels. This matches the intended structure.
- The formula list is useful and readable at 390px, but it is dense for a weak student because all seven formula forms appear before any method selection.
- The subtopic nav is clear and correctly points to four generated lessons.

Subtopic pages:

- Each subtopic page contains a worked example, a "Try a similar one" panel, a reveal/check method, and a CTA to the matching 3-question Skill Check.
- The current route sequence is clear: Parallel/perpendicular lines -> straight lines -> circles -> points of intersection -> Skill Check.
- The pages do not repeat the formula list at the moment of use, so a weak student has to remember or navigate back for gradient, midpoint, distance, point-gradient, and circle forms.
- The "Try a similar one" panel is the largest pedagogical gap. It usually says what kind of task to do, but does not provide actual new numbers or a checkable answer.

Skill Check:

- The page exposes four groups: "Check the gradient", "Build the line", "Read the circle", and "Find the meeting point".
- Each group defaults to three questions and routes from question 3 to the next skill.
- The final group routes to an exam-style direction section with 46 available Coordinate Geometry questions and a working "One exam-style question" CTA.
- The answer reveal gives an answer, a method line, a common mistake, optional working, an inline next action, and an "I tried this" save action.
- The top global "Next question" button is visible before the question card, which makes skipping easier than reflecting.

## 4. Persona-by-persona findings

### Weak student

- HIGH: The Field Guide example is often readable, but the "Try a similar one" prompt is too vague to attempt. "Find a perpendicular bisector from two endpoints" gives no endpoints.
- HIGH: The reveal/check method does not teach enough after a failed try. It gives method language, not a concrete worked solution to the similar question.
- HIGH: Circles and intersections jump quickly into long algebraic expressions. A weak student can copy the example but may not know why completing the square or substitution is the next move.
- MEDIUM: Formulas are shown on the landing page, but not repeated beside the subtopic task where they are needed.
- MEDIUM: Skill Check multiple-choice items are accessible, but a weak student can guess without demonstrating method. The "I tried this" save action does not distinguish real work from reveal-and-click.

### Average student

- HIGH: The examples are concise enough to follow, but too compressed in circles and intersections. Sign errors and substitution mistakes are likely because expansion/collection steps are skipped or summarized.
- MEDIUM: The three-question group structure gives a clear next action. The answer reveal is helpful, but the method line is often generic rather than the exact first calculation.
- MEDIUM: Question 1 in each group is generally accessible. Question 2 usually checks the method. Question 3 is sometimes only a recognition twist, not an exam-style chain.
- MEDIUM: Optional "Challenge" items contain useful exam-bridge skills, but the label does not tell the average student that tangent/discriminant work is important.

### Strong student

- HIGH: Strong students can move fast, but the default groups under-test chained Coordinate Geometry. Perpendicular bisector, tangent-radius logic, and discriminant decisions are not all in the default path.
- MEDIUM: Repeated "Try 3 quick questions" and "Next question" labels are efficient, but the top control feels like a skip button rather than a learning checkpoint.
- MEDIUM: The final "Try exam-style questions" action is useful, but the page scrolls to an exam-direction section rather than navigating directly to a fresh exam question.
- LOW: Strong students may find the Field Guide prose repetitive because every subtopic uses the same one-example/one-try template.

## 5. Route-by-route findings

### `/p1/topics/coordinate-geometry/field-guide/`

- LOW: Landing page is correctly overview-only.
- MEDIUM: Formula support is complete but dense; weak students may not know which formula belongs to which subtopic.
- LOW: Mobile formulas are readable and there is no page-level horizontal overflow at 390px.

### `/p1/topics/coordinate-geometry/field-guide/parallel-perpendicular-lines/`

- HIGH: "Try a similar one" is decorative because it gives no endpoints.
- MEDIUM: The worked example reaches a perpendicular bisector setup, but the method list is only one conceptual sentence.
- MEDIUM: The matching Skill Check default group does not include the perpendicular bisector item; that is hidden as Challenge even though the Field Guide example is a perpendicular bisector.

### `/p1/topics/coordinate-geometry/field-guide/equation-of-a-straight-line/`

- MEDIUM: The worked example is concise and aligned, but it compresses gradient, point-gradient form, and final-form conversion into one sentence.
- HIGH: "Try a similar one" gives no coordinates, so it is not a real attempt prompt.
- MEDIUM: The Skill Check group aligns well, but the answer reveal should show the exact first substitution before the generic method line.

### `/p1/topics/coordinate-geometry/field-guide/circles/`

- HIGH: The worked example is mathematically sound but too dense for a weak student. Completing the square appears as a long inline transformation rather than step-by-step working.
- MEDIUM: The formula `$(x-a)^2+(y-b)^2=r^2$` is not repeated on the page near the example.
- HIGH: Tangent-radius logic exists in the Skill Check data but is hidden in an optional Challenge set, while the unit-level method list names tangents as important.
- MEDIUM: At 390px there is no page-level overflow, but long equations visually crowd the card and should be split into shorter lines.

### `/p1/topics/coordinate-geometry/field-guide/intersections/`

- HIGH: This requested route is not generated. It renders the course chooser/home surface in preview instead of the Coordinate Geometry lesson.
- Note: The generated route is `/p1/topics/coordinate-geometry/field-guide/points-of-intersection/`.

### `/p1/topics/coordinate-geometry/field-guide/points-of-intersection/`

- MEDIUM: The worked example is aligned and uses a real line-circle substitution.
- HIGH: The route skips too much algebra for weak/average students: expansion, factorisation, and substitution back are all compressed.
- MEDIUM: The default Skill Check includes line-line, axis line-circle, and non-axis line-circle intersections, but the discriminant/tangency method is optional.
- LOW: As the final subtopic, it routes directly to Skill Check and does not need a next-subtopic CTA.

### `/p1/topics/coordinate-geometry/skill-check/`

- LOW: The four group labels are understandable.
- HIGH: The global "Next question" button appears before the question card. It is visible enough, but too visible as a skip path.
- MEDIUM: The inline next action appears after answer reveal and routes cleanly from question 3 to the next skill.
- MEDIUM: "More practice" and "Challenge" do not explain what extra Coordinate Geometry skill they unlock.
- LOW: No duplicate worked-example panels were observed.

## 6. Skill Check group-by-group findings

### Check the gradient

- Question 1 accessibility: PASS. Perpendicular gradient from gradient 2 is accessible.
- Question 2 method check: PASS. Parallel gradient from `3x-2y=8` checks rearranging before comparing.
- Question 3 stretch: MEDIUM. Comparing two lines is fair, but it is still recognition after rearranging, not a true exam-style chain.
- HIGH: The perpendicular bisector item is optional, even though the Field Guide worked example is a perpendicular bisector.

### Build the line

- Question 1 accessibility: PASS. Gradient from two points is suitable.
- Question 2 method check: PASS. Point-gradient/intercept substitution is appropriate.
- Question 3 stretch: PASS with caveat. Giving both forms is a fair final check, but answer choices allow recognition rather than written rearrangement.
- MEDIUM: Worked routes are correct but terse; they should expose the substitution and rearrangement more visibly after reveal.

### Read the circle

- Question 1 accessibility: PASS. Centre/radius recognition is an appropriate first question.
- Question 2 method check: PASS. Circle from diameter tests midpoint and radius squared.
- Question 3 stretch: PASS. Completing the square is a fair stretch.
- HIGH: Tangent-at-a-point is optional despite being named in the Field Guide method list and likely important for old Paper 1 behaviour.

### Find the meeting point

- Question 1 accessibility: PASS. Line-line intersection is a reasonable start.
- Question 2 method check: MEDIUM. `y=0` with `x^2+y^2=9` is accessible but quite easy.
- Question 3 stretch: PASS. Non-axis line-circle intersection is aligned and fair.
- HIGH: Discriminant/tangency is optional, while the Field Guide takeaway explicitly mentions `D>0`, `D=0`, and `D<0`.
- MEDIUM: The final route to exam-style direction is useful, but "Try exam-style questions" scrolls rather than navigating directly.

## 7. Highest-priority student blockers

- HIGH: `/field-guide/intersections/` is a dead/misleading deep link for this audit scope. Internal nav uses `points-of-intersection`, but the requested route does not load the intended lesson.
- HIGH: "Try a similar one" is not actually tryable on all Coordinate Geometry subtopics because prompts lack numbers and checkable answers.
- HIGH: Reveal/check panels do not give enough concrete recovery for weak students. They need the first calculation or full worked route for the similar task, not only method language.
- HIGH: The top "Next question" control lets students skip the Skill Check without engaging with the answer/reveal loop.

## 8. Medium-priority clarity/cognitive-load issues

- MEDIUM: Subtopic pages do not repeat the relevant formula at the moment of use.
- MEDIUM: Circles and intersections examples are too compressed for students who make sign or substitution errors.
- MEDIUM: Higher-value Coordinate Geometry checks are hidden behind optional sets with vague labels.
- MEDIUM: The Skill Check answer reveal often surfaces a generic method line before the item-specific first step.
- MEDIUM: The mobile Skill Check screen places controls before the question card, increasing cognitive load.

## 9. Low-priority polish issues

- LOW: Subtopic nav is helpful, but on mobile it creates a tall block before the lesson content.
- LOW: "I tried this" is clear enough, but it sits inside the answer panel and may be confused with progression rather than local save.
- LOW: "More practice" is too vague for optional sets that contain specific skills.
- LOW: The repeated "Try 3 quick questions" copy is efficient but mechanically repetitive across subtopics.

## 10. Questions or worked solutions that should be rewritten

- HIGH: Rewrite all four Field Guide "Try a similar one" prompts with actual numbers and a checkable answer or worked route.
- HIGH: Rewrite the Circles worked example into separate steps: group terms, complete `x`, complete `y`, move constants, read centre/radius.
- HIGH: Rewrite the Points of intersection worked example to show expansion/collection, factorisation, and substitution back.
- MEDIUM: Promote or expose the perpendicular bisector item `p1-sc-coordinate-parallel-perpendicular-004` more directly after the first subtopic.
- MEDIUM: Promote or expose the tangent item `p1-sc-coordinate-circles-005` after the Circles subtopic.
- MEDIUM: Promote or expose the discriminant/tangency item `p1-sc-coordinate-intersections-005` after the Points of intersection subtopic.
- MEDIUM: Rework "Check the gradient" question 3 if the intent is exam-style chaining; the current item is valid but light.

## 11. CTA/navigation issues

- HIGH: Add a redirect/alias or route-helper exception for `/p1/topics/coordinate-geometry/field-guide/intersections/`, or document that only `/points-of-intersection/` is valid.
- HIGH: Change the top Skill Check navigation so the primary action before an answer reveal does not feel like "skip this question". Options: move it below the card, label it "Skip to next question", or make the reveal-panel inline next the primary path.
- MEDIUM: Rename optional sets from generic "More practice"/"Challenge" to skill-specific labels such as "Perpendicular bisector", "Tangent at a point", and "Discriminant check".
- MEDIUM: The final "Try exam-style questions" action is useful, but a direct link to the first Coordinate Geometry exam-training card would be clearer than a scroll to the direction section.

## 12. Mobile issues

- LOW: No page-level horizontal overflow was found at 390px.
- LOW: Landing-page formulas are readable at 390px.
- MEDIUM: Long circle equations visually crowd the worked-example card on mobile even though the page does not overflow.
- MEDIUM: The Skill Check control stack appears above the card on mobile; this makes "Next question" visually dominant before the student has worked.
- LOW: No mobile console errors or KaTeX parse errors were observed.

## 13. Recommended fixes in priority order

1. HIGH: Fix or alias the `/field-guide/intersections/` route if that URL is expected to be shared.
2. HIGH: Make each Coordinate Geometry "Try a similar one" a real problem with numbers and a checkable solution path.
3. HIGH: Split Circles and Points of intersection worked examples into clearer multi-step working.
4. HIGH: Adjust Skill Check navigation so the main "Next question" control does not encourage skipping before reveal/check.
5. MEDIUM: Show the item-specific first step more prominently in answer reveal before the generic method cue.
6. MEDIUM: Rename optional sets and consider promoting perpendicular bisector, tangent, and discriminant checks into the default Coordinate Geometry flow.
7. MEDIUM: Add a compact formula cue to each subtopic page at the moment of use.
8. LOW: Reduce repeated CTA copy where it does not add decision value.

## 14. If fixes were made, list exactly what changed

No fixes were made in this pass. The issues above are audit findings. The most useful fixes would touch shared P1 Field Guide or Skill Check rendering behavior, so they should be handled in a separate implementation pass with explicit scope.

## 15. Validation commands and results

- `npm run dev`: PASS. This ran `npm run build`, generated 247 static HTML pages in `docs/`, and started Vite preview at `http://localhost:4173/`.
- Browser QA desktop default viewport: PASS for target generated routes. No app console errors, no KaTeX parse errors, no page-level horizontal overflow.
- Browser QA 390px mobile: PASS for target generated routes. No app console errors, no KaTeX parse errors, no page-level horizontal overflow.
- Exam Training CTA check: PASS. `/p1/topics/coordinate-geometry/exam-training/` loads with 16 visible exam cards in the one-card flow and no console/KaTeX errors.
- `npm run build`: PASS as part of `npm run dev`; not rerun separately after the report because no app/content fixes were made.
- `npm run static:check`: NOT RUN. No app/content fixes were made.
- `npm test`: NOT RUN. No app/content fixes were made.
- `npm run test:ci`: NOT RUN. No app/content fixes were made.
- `npm run lint --if-present`: NOT RUN. No app/content fixes were made.
- `git diff --check`: PASS. No whitespace errors.

## 16. Fix pass - 2026-06-08

### Fixes implemented

- Added a generated static alias for `/p1/topics/coordinate-geometry/field-guide/intersections/` while preserving canonical `/p1/topics/coordinate-geometry/field-guide/points-of-intersection/`.
- Rewrote the four Coordinate Geometry "Try a similar one" prompts with concrete values, a reveal/check route, and checkable final answers:
  - parallel/perpendicular lines: perpendicular bisector through `A(2,3)` and `B(8,7)`;
  - equation of a straight line: line through `(2,-1)` and `(6,7)`;
  - circles: completing the square for `x^2+y^2-4x+8y+11=0`;
  - points of intersection: intersections of `x^2+y^2=13` and `y=x+1`.
- Split the Coordinate Geometry circles worked example into grouping, completing the square for `x`, completing the square for `y`, moving constants, and reading centre/radius.
- Split the Coordinate Geometry points-of-intersection worked example into substitution, expansion, collection, factorisation, substitution back, and final coordinate pairs.
- Added compact formula cues on Coordinate Geometry subtopic pages only.
- Updated focused Skill Check reveals so the order is answer, item-specific first step, method cue, common mistake, collapsed working, then continuation.
- Changed grouped Skill Check top navigation to secondary "Skip to next question" / "Skip to finish check" wording before answer reveal.
- Kept the post-reveal inline continuation visible; question 3 shows "Next skill" when another Coordinate Geometry group exists.
- Renamed Coordinate Geometry optional sets to skill-specific labels: "Perpendicular bisector", "Extra line practice", "Extra circle practice", "Tangent at a point", "Extra line intersection", and "Discriminant check".
- Exposed high-value optional checks through the existing optional-set control label where cleanly supported, without making them part of the default 3-question flow.

### Issues intentionally deferred

- No direct Exam Training CTA changes were made; the Coordinate Geometry Skill Check exam-style direction was not broken in this pass.
- The perpendicular bisector, tangent-at-a-point, and discriminant/tangency checks remain optional rather than promoted into default groups to keep the default flow at three questions per skill.
- No quarantined Integration material was restored.

### Files changed

- `src/data/courseSeedContent.ts`
- `src/data/p1SeedContent.ts`
- `src/data/p1SkillCheckItems.ts`
- `src/lib/staticStudyRoutes.ts`
- `src/static-study/static-study.css`
- `src/static-study/static-study.js`
- `scripts/build-static-site.ts`
- `src/tests/staticStudyRoutes.test.ts`
- `src/tests/skillChecklist.test.ts`
- `tools/content_lab/reports/P1_COORDINATE_GEOMETRY_STUDENT_SIMULATION_AUDIT_2026_06_08.md`

### Routes checked

- `/p1/topics/coordinate-geometry/field-guide/`
- `/p1/topics/coordinate-geometry/field-guide/parallel-perpendicular-lines/`
- `/p1/topics/coordinate-geometry/field-guide/equation-of-a-straight-line/`
- `/p1/topics/coordinate-geometry/field-guide/circles/`
- `/p1/topics/coordinate-geometry/field-guide/points-of-intersection/`
- `/p1/topics/coordinate-geometry/field-guide/intersections/`
- `/p1/topics/coordinate-geometry/skill-check/`

### Validation results

- `npm test -- staticStudyRoutes skillChecklist`: PASS.
- `npm run build`: PASS. Generated 248 static HTML pages in `docs/`.
- `npm run static:check`: PASS. Static site check passed for 248 HTML pages and rendered static page check passed.
- `npm test`: PASS. 56 files, 477 tests.
- `npm run test:ci`: PASS. 56 files, 477 tests.
- `git diff --check`: PASS.
- `npm run lint --if-present`: PASS.
- Browser QA at desktop `1280x900` and mobile `390x844`: PASS on all target routes. No console errors, no page errors, no KaTeX parse errors, and no page-level horizontal overflow. The `/field-guide/intersections/` alias returned the Points of intersection lesson. Coordinate Geometry Skill Check question 3 showed "Next skill" after reveal and advanced to "Build the line".

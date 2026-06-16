# Fix Plan — Numerical Solution of Equations — Cycle 3

## Highest Priority Problems
- Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.
- Use tighter step titles, exam-transfer copy, or deferred cleanup to show the shortest route through the unit.
- Keep draft/review-only labels visible and avoid using them as mastery proof.
- Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.

## Fixes To Implement Now
- Make the checked Iteration prompt identify the target graph feature
  Status: applied. Applied the exact declared source replacement to 1 occurrence(s).
  File: src/data/iterationLearnSteps.ts
  Risk: Low: copy-only prompt change; options and accepted answers are unchanged.
- Connect numerical solution to the target graph feature
  Status: already-present. The target wording is already present.
  File: src/data/iterationLearnSteps.ts
  Risk: Low: copy-only prompt change; graph-feature answer is unchanged.

## Fixes Deferred
- The first task still feels like a method jump: Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.
- The unit feels long before I know what is essential: Use tighter step titles, exam-transfer copy, or deferred cleanup to show the shortest route through the unit.
- Need-to-Know status mixes ready and draft skills: Keep draft/review-only labels visible and avoid using them as mastery proof.
- Too much of the Skill Check can be answered by recognition: Future cycles should add typed deterministic variants where answer forms are stable.
- Common mistake warnings are sparse: Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.

## Files Changed
- src/data/iterationLearnSteps.ts

## Risk
- Low: copy-only prompt change; options and accepted answers are unchanged.
- Low: copy-only prompt change; graph-feature answer is unchanged.


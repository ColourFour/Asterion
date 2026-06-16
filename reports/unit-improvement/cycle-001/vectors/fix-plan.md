# Fix Plan — Vectors — Cycle 1

## Highest Priority Problems
- Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.
- Do not silently route progress through legacy IDs; schedule a contract-alignment pass.
- Keep draft/review-only labels visible and avoid using them as mastery proof.
- Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.

## Fixes To Implement Now
- Make the vector subtraction direction explicit
  Status: applied. Applied the exact declared source replacement.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: copy-only prompt change; coordinate answer is unchanged.

## Fixes Deferred
- The first task still feels like a method jump: Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.
- Some skill labels do not look connected to the official P3 contract: Do not silently route progress through legacy IDs; schedule a contract-alignment pass.
- Need-to-Know status mixes ready and draft skills: Keep draft/review-only labels visible and avoid using them as mastery proof.
- Too much of the Skill Check can be answered by recognition: Future cycles should add typed deterministic variants where answer forms are stable.
- Common mistake warnings are sparse: Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.

## Files Changed
- src/data/vectorsLearnSteps.ts

## Risk
- Low: copy-only prompt change; coordinate answer is unchanged.


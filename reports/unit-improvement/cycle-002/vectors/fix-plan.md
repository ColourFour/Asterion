# Fix Plan — Vectors — Cycle 2

## Highest Priority Problems
- Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.
- Keep draft/review-only labels visible and avoid using them as mastery proof.
- Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.

## Fixes To Implement Now
- Map vector notation Learn checks to the official geometry contract skill
  Status: already-present. The target wording is already present.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: metadata-only source replacement; deterministic prompts, accepted answers, and checks are unchanged.
- Map vector line-equation Learn checks to the official line contract skill
  Status: already-present. The target wording is already present.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: metadata-only source replacement; deterministic prompts, accepted answers, and checks are unchanged.
- Map vector intersection Learn checks to the official line contract skill
  Status: already-present. The target wording is already present.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: metadata-only source replacement; deterministic prompts, accepted answers, and checks are unchanged.
- Map scalar product Learn checks to the official scalar-product contract skill
  Status: already-present. The target wording is already present.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: metadata-only source replacement; deterministic prompts, accepted answers, and checks are unchanged.
- Map point-to-line Learn checks to the official 3D geometry contract skill
  Status: already-present. The target wording is already present.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: metadata-only source replacement; deterministic prompts, accepted answers, and checks are unchanged.
- Make the vector subtraction direction explicit
  Status: already-present. The target wording is already present.
  File: src/data/vectorsLearnSteps.ts
  Risk: Low: copy-only prompt change; coordinate answer is unchanged.

## Fixes Deferred
- The first task still feels like a method jump: Keep the problem-first setup, but make the first action and the exam reason explicit in the prompt.
- Need-to-Know status mixes ready and draft skills: Keep draft/review-only labels visible and avoid using them as mastery proof.
- Too much of the Skill Check can be answered by recognition: Future cycles should add typed deterministic variants where answer forms are stable.
- Common mistake warnings are sparse: Add targeted common-mistake lines where the mark-scheme trap is obvious and syllabus-safe.

## Files Changed
- None.

## Risk
- Low: metadata-only source replacement; deterministic prompts, accepted answers, and checks are unchanged.
- Low: copy-only prompt change; coordinate answer is unchanged.


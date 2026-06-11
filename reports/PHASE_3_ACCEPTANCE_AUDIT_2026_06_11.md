# Phase 3 Acceptance Audit and Legacy Storage Hardening

Date: 2026-06-11

## Scope

This audit covers the completed Phase 3 P3 Skill Check system after deterministic answer checking, local attempts, mistake tags, repair flow, `/p3/review/`, browser interaction checks, runtime checker parity, and the first full-topic Complex Numbers migration.

No backend, Supabase, auth, teacher dashboard, CSV export, AI grading, exam autograding, or additional Skill Check migration was added in this task.

## Current Deterministic Pass Rule

A P3 Skill Check item passes only when a well-formed local deterministic attempt has:

- `course === "p3"`
- matching `checkId`
- matching `regionId` when read by generated static pages
- `isCorrect === true`
- `revealedAnswer === false`
- `revealedRepairStep === false`

Hint use is recorded as `usedHint`, but hint use does not block a clean correct pass. Revealed answers and repair-step reveals do not count as pass credit, even if a later answer on the already revealed/repaired card is correct.

Topic-level Skill Check pass state requires all generated required check IDs for that topic to have at least one clean passing deterministic attempt. Topics with no checkable IDs do not create pass credit.

## Current Local Storage Key and Attempt Shape

The browser storage key is:

```text
asterion.progress.v1
```

Current deterministic Skill Check attempts are stored under `skillCheckAttempts` with this shape:

```ts
{
  attemptId: string;
  course: "p3";
  topic: string;
  skillId: string;
  checkId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  usedHint: boolean;
  revealedAnswer: boolean;
  revealedRepairStep: boolean;
  mistakeTags: string[];
  timestamp: string;
  regionId?: string;
}
```

`regionId` remains optional in the TypeScript record type for compatibility, but generated P3 Skill Check pages save it and use it when calculating page progress.

## Progress Read Paths Audited

- `src/skill-checks/localAttempts.ts`
  - Loads, saves, filters, and evaluates local Skill Check attempt records.
  - Now normalizes `skillCheckAttempts` and filters malformed records before pass calculations.

- `src/static-study/static-study.js`
  - Student-facing static runtime for `docs/`.
  - Reads `asterion.progress.v1`, updates `[data-progress-skill]`, saves attempts, shows pass feedback, renders `/p3/review/`.
  - Now normalizes `skillCheckAttempts` and rejects malformed records before pass calculations.

- `src/lib/topicStudy.ts`
  - Builds topic progress summaries from stored progress.
  - Now uses the same deterministic pass guard and normalized Skill Check attempts.

- `scripts/build-static-site.ts`
  - Generates P3 Skill Check pages and required check ID lists from deterministically checkable Skill Check data.
  - Does not generate self-reported Skill Check pass buttons.

- `scripts/check-skill-check-interactions.mjs`
  - Browser acceptance check for generated static Skill Check and review pages.
  - Now seeds legacy and malformed localStorage records and verifies they fail closed.

- `tests/staticProduct.test.ts`
  - Confirms legacy self-reported Skill Check controls are absent in source and generated Skill Check pages.

## Legacy and Self-Reported Progress Behavior

Legacy Field Guide progress and exam-training attempts remain separate surfaces. They are not used for P3 Skill Check pass state.

Legacy or self-reported Skill Check-like records under `learningActivityAttempts`, including records with `outcome: "got_it"`, do not count toward Skill Check pass state. The deterministic pass readers only consult valid `skillCheckAttempts`.

Malformed old `skillCheckAttempts` records now fail closed. A record with only `checkId` and `isCorrect: true` is ignored because it does not satisfy the current attempt shape.

Malformed JSON in `asterion.progress.v1` is caught and treated as clean empty progress.

Missing localStorage is treated as clean empty progress.

## Fake-Success Vectors

| Vector | Status | Notes |
| --- | --- | --- |
| `data-save-skill-check` button | Blocked | Absent from static runtime, generator source, and generated P3 Skill Check pages. |
| "I tried this" Skill Check completion copy | Blocked | Absent from generator source and generated P3 Skill Check pages. |
| Legacy `learningActivityAttempts` with `outcome: "got_it"` | Blocked | Ignored by Skill Check pass logic. |
| Malformed `skillCheckAttempts` with `isCorrect: true` only | Blocked | Filtered out by storage normalization and pass guard. |
| Correct answer after answer reveal | Blocked | Attempt remains revealed and does not pass. |
| Correct answer after repair reveal | Blocked | Attempt remains repaired and does not pass. |
| Hint use | Allowed but recorded | Hints do not create pass credit; a later clean correct answer may pass with `usedHint: true`. |
| Uncheckable Skill Check items | Blocked | No required pass IDs are generated for uncheckable items. They render as practice/review only. |
| Browser localStorage tampering with fully valid clean attempt records | Remaining risk | Static-only storage cannot prevent a user from manually creating a valid local record in devtools. Phase 3 blocks accidental/legacy/fake UI success, not malicious local tampering. |

## Hardening Added

- Added `isSkillCheckLocalAttemptRecord` and `normalizeSkillCheckLocalAttempts` in `src/skill-checks/localAttempts.ts`.
- Updated `isPassingSkillCheckAttempt` to require a valid current attempt record before pass.
- Updated TypeScript storage loading and pass-state calculation to filter malformed records.
- Updated `src/lib/topicStudy.ts` to use normalized deterministic attempt records.
- Updated `src/static-study/static-study.js` to normalize browser `skillCheckAttempts` before page progress, summaries, form pass state, and review rendering.
- Extended browser acceptance checks to verify legacy and malformed localStorage records do not mark generated pages passed or crash the page.

## Tests Added or Updated

- Legacy `learningActivityAttempts` records do not mark Skill Checks passed.
- Malformed old `skillCheckAttempts` records are filtered and fail closed.
- Missing localStorage creates an empty Skill Check state.
- Malformed JSON localStorage creates an empty Skill Check state.
- Only clean correct deterministic attempts count as passed.
- Revealed and repaired attempts do not count as passed.
- Generated P3 Skill Check pages do not contain `data-save-skill-check` or `I tried this`.
- Browser acceptance check verifies seeded legacy/malformed records on the real generated Skill Check page.

## Remaining Risks

- A static GitHub Pages product cannot prevent intentional manual localStorage tampering that creates a fully valid clean deterministic attempt. This is a known client-only trust boundary.
- The static runtime checker still mirrors the TypeScript checker rather than importing it directly. Phase 3.7 parity fixtures reduce drift risk but are not exhaustive fuzz coverage.
- Many P3 topics remain not yet migrated to deterministic answer data. They must stay visibly practice-only until migrated.
- Exact-text checks, including some Complex Numbers locus checks, are intentionally deterministic but wording-sensitive.

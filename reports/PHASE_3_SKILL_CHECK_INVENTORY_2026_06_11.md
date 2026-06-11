# Phase 3 Skill Check Inventory and Data Shape Audit

Date: 2026-06-11

## Scope

This audit maps the current P3 Skill Check implementation before behavior changes. No answer checking or product behavior changes are included in this report.

## Current Skill Check Data Files

- `src/data/skillCheckItems.ts`
  - Main authored P3 Skill Check data.
  - Defines `SkillCheckItem`, input types, validation modes, expected answers/options/order, hints, worked routes, and review metadata.
  - Exports `AUTHORED_SKILL_CHECK_ITEMS`, `skillCheckContractForItem`, and query helpers.
  - Despite `validationMode: 'deterministic'` on many items, the current static UI does not use that metadata to grade student responses.

- `src/data/remainingSkillCheckItems.ts`
  - Additional authored Skill Check items generated from structured topic specs.
  - Exports `REMAINING_REGION_SKILL_CHECK_ITEMS`, which is spread into `AUTHORED_SKILL_CHECK_ITEMS`.

- `src/data/quickCheckContracts.ts`
  - Seed contracts for teaching-snippet quick checks.
  - Contains expected answers/options for some quick-check prompts.

- `public/data/generated_practice_bank.json`
  - Guided practice source data rendered into Skill Check pages as `warm_up` activity cards.
  - These cards are saved through the same self-reported Skill Check save path.

- `public/data/teaching_snippets.json`
  - Teaching snippets with quick-check content. Rendered quick checks can be saved as `quick_check` activity attempts.

- Related source-data/context files:
  - `src/data/algebraContent.ts`
  - `src/data/vectorsContent.ts`
  - `src/data/fieldGuideTopics.ts`
  - `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json`

## Current UI and Component Files

- `scripts/build-static-site.ts`
  - This is the primary Skill Check page renderer.
  - `skillCheckPagePath` emits canonical routes at `p3/topics/{topicSlug}/skill-check/index.html`.
  - `renderPracticePage` renders the P3 Skill Check page shell.
  - `renderSkillPracticeGroup` renders section groups.
  - `renderAuthoredPractice` renders authored Skill Check cards and the `I tried this` button.
  - `renderQuickChecks` renders teaching-snippet quick checks and the `Save quick check` button.
  - `renderGeneratedPracticeItem` renders guided practice and the `I tried this` button.
  - `renderSkillCheckAnswerInput` and `renderExpectedAnswerSummary` exist, but the current rendered authored cards mostly use `renderOptions`/field markup and do not wire answer validation.

- `src/static-study/static-study.js`
  - Browser-side enhancement and local progress handling.
  - Handles `[data-save-skill-check]` clicks with `saveSkillCheck`.
  - Enhances Skill Check flow/card display, but does not grade current answer inputs before saving.

- `src/static-study/static-study.css`
  - Static Skill Check styling and enhanced card-flow styles.

- Generated current artifacts:
  - `docs/p3/topics/algebra/skill-check/index.html`
  - `docs/p3/topics/logarithmic-and-exponential-functions/skill-check/index.html`
  - `docs/p3/topics/trigonometry/skill-check/index.html`
  - `docs/p3/topics/differentiation/skill-check/index.html`
  - `docs/p3/topics/integration/skill-check/index.html`
  - `docs/p3/topics/numerical-solution-of-equations/skill-check/index.html`
  - `docs/p3/topics/vectors/skill-check/index.html`
  - `docs/p3/topics/differential-equations/skill-check/index.html`
  - `docs/p3/topics/complex-numbers/skill-check/index.html`
  - `docs/assets/static-study.js`

## Current Progress and Storage Files

- `src/static-study/static-study.js`
  - Stores progress in browser `localStorage` under `asterion.progress.v1`.
  - `emptyProgress()` includes `attempts`, `learningActivityAttempts`, `topicProfiles`, `issueReports`, `regionLearning`, and settings.
  - Skill Check progress count is derived from `learningActivityAttempts` by `regionId`.
  - `saveSkillCheck(button)` creates a record with:
    - `profileId: 'local-static-student'`
    - `activityType` from `data-save-skill-check`
    - `activityId` from `data-activity-id`
    - `learnerResponse: 'Completed on static page'`
    - `outcome: 'got_it'`
    - `confidence: 3`
    - timestamps

- `src/types.ts`
  - Defines `StoredProgress`, `LearningActivityAttempt`, and related academic attempt types.
  - `StoredProgress.learningActivityAttempts` is the typed home for Skill Check-like learning activity attempts.

- `src/lib/topicStudy.ts`
  - Computes topic progress summaries from `StoredProgress.learningActivityAttempts`.
  - Counts Skill Check saves by matching `attempt.regionId`.

- Not present in this snapshot:
  - `src/lib/progressStore.ts` is referenced in agent notes as an ownership boundary, but the file does not exist in the current worktree. Current local progress behavior is embedded in `src/static-study/static-study.js`.

## Current Route and Static Generation Files

- `src/lib/staticStudyRoutes.ts`
  - Declares required static routes for every P3 topic:
    - `field-guide/index.html`
    - `skill-check/index.html`
    - `exam-training/index.html`

- `scripts/build-static-site.ts`
  - Generates the route files under `docs/`.
  - Copies `src/static-study/static-study.js` and CSS to `docs/assets/`.

- `scripts/check-static-site.mjs`
  - Checks required P3 Skill Check output files.
  - Verifies canonical Skill Check links from the P3 topic index.
  - Enforces that P3 topic routes are only `field-guide`, `skill-check`, and `exam-training`.

- `scripts/check-rendered-static-site.mjs`
  - Browser-checks rendered static output.
  - Explicitly checks `p3/topics/algebra/skill-check/index.html`.
  - Verifies the Skill Check starts with a small focused set, has one visible card after JS initialization, includes disclosure/progress controls when needed, and does not render exam cards by default.

## Existing Completion Model

The current model is self-reported local completion, not deterministic graded completion.

- Authored Skill Check cards render answer controls, hints, and worked routes.
- A student can click `I tried this` without selecting or entering an answer.
- Quick checks can be saved through `Save quick check` without answer validation.
- Guided practice cards can be saved through `I tried this`.
- The click handler writes a `learningActivityAttempts` record directly to localStorage.
- Saved records always use `outcome: 'got_it'` and `confidence: 3`.
- Progress displays only saved counts, for example `Skill Check: {count} saved`.

## Weak Points That Allow Fake Success

- `saveSkillCheck` does not read the student's selected option, typed answer, ordered-card state, or two-value fields.
- `saveSkillCheck` does not call `checkQuickCheckAnswer` from `src/lib/quickCheckAnswer.ts`.
- `outcome: 'got_it'` is hard-coded for every saved Skill Check.
- `learnerResponse` is hard-coded as `Completed on static page`.
- A student can reveal hints/answers/worked routes and still save a success-equivalent record.
- Duplicate prevention only checks `activityId`; it prevents repeated saves for the same card but does not prove correctness.
- Topic progress treats any saved learning activity in the region as Skill Check progress.
- The static progress UI uses save count, not correctness, score, or graded attempt state.

## Existing Test Coverage Related to Skill Checks

- `tests/staticProduct.test.ts`
  - Verifies canonical P3 Skill Check routes are declared for every P3 topic.
  - Verifies older/non-canonical P3 topic routes are absent.

- `tests/p3SkillContract.test.ts`
  - Tests P3 skill contract source data and exam ladder behavior.
  - Does not test Skill Check grading or save behavior.

- `scripts/check-static-site.mjs`
  - Verifies generated Skill Check page existence and canonical links.
  - Does not test answer checking or localStorage records.

- `scripts/check-rendered-static-site.mjs`
  - Tests rendered Algebra Skill Check card-flow behavior.
  - Does not test deterministic grading or fake-success prevention.

- No current test was found that verifies:
  - `[data-save-skill-check]` requires an answer.
  - a correct/incorrect Skill Check response is classified.
  - `learningActivityAttempts` stores actual learner responses.
  - localStorage migration tolerates future graded-attempt fields.

## Recommended First Files to Change in Phase 3.1-3.3

### Phase 3.1: Wire deterministic checking without changing routes

- `scripts/build-static-site.ts`
  - Render machine-readable Skill Check contract data or data attributes for each authored item.
  - Ensure every input type has stable names/ids and can be read by client JS.

- `src/static-study/static-study.js`
  - Replace self-report save behavior with answer collection and graded result handling for authored deterministic Skill Checks.
  - Keep static/local-only behavior.

- `src/lib/quickCheckAnswer.ts`
  - Reuse as the deterministic checking core where possible.
  - Add/adjust tests before expanding behavior.

- `src/types.ts`
  - Add explicit graded Skill Check attempt fields if needed, while preserving migration tolerance.

### Phase 3.2: Progress semantics

- `src/lib/topicStudy.ts`
  - Change Skill Check progress summaries from raw saved counts to graded attempt status once graded records exist.

- `src/static-study/static-study.js`
  - Update progress text to distinguish attempted, correct, incorrect, and review-needed states.

### Phase 3.3: Tests and static verification

- Add focused Vitest coverage for `checkQuickCheckAnswer` and any new attempt-shape helpers.
- Add static/client tests for:
  - no answer does not save success,
  - incorrect answer does not become `got_it`,
  - correct answer records the learner response and graded result,
  - legacy `asterion.progress.v1` records still load.
- Extend `scripts/check-rendered-static-site.mjs` only after the graded UX is decided.

## Files That Should Not Be Touched Yet

- P1/M1/S1 seed behavior:
  - `src/data/courseSeedContent.ts` if present in a future snapshot.
  - P1/M1/S1 generated pages except as incidental build outputs.

- Canonical P3 route names:
  - `src/lib/staticStudyRoutes.ts` route slugs should remain stable unless the phase explicitly changes route contracts.

- P3 exam-bank canonical image/data sources:
  - `public/assets/exam-bank-data/asterion_question_bank_v1.json`
  - `public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json`
  - question and mark-scheme image paths under `public/assets/exam-bank-data/`

- Legacy/generated public data unless the phase explicitly audits those sources:
  - `public/data/generated_practice_bank.json`
  - `public/data/teaching_snippets.json`

- Generated `docs/` files should not be hand-edited. They should only change through the existing static build workflow.

## Inventory Summary

- Skill Check data currently lives mainly in `src/data/skillCheckItems.ts`, with additional data from `src/data/remainingSkillCheckItems.ts`, `src/data/quickCheckContracts.ts`, `public/data/generated_practice_bank.json`, and `public/data/teaching_snippets.json`.
- Skill Check pages are generated by `scripts/build-static-site.ts`.
- Skill Check UI behavior and local progress are handled by `src/static-study/static-study.js`.
- Static route declarations live in `src/lib/staticStudyRoutes.ts`.
- Current completion is self-reported and local-only.
- Fake success happens through `[data-save-skill-check]` buttons handled by `saveSkillCheck`, which writes `outcome: 'got_it'` without checking answers.
- Current progress is stored in browser localStorage key `asterion.progress.v1`, under `learningActivityAttempts` for Skill Checks.

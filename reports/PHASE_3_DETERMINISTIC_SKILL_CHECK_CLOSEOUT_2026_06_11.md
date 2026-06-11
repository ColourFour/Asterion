# Phase 3 Deterministic Skill Check Closeout

Date: 2026-06-11

## Acceptance

Phase 3 is accepted as a static-compatible deterministic Skill Check system for the migrated P3 coverage completed so far.

The system is not a full P3 Skill Check content migration. It is an accepted deterministic framework plus three fully migrated topics:

- Algebra
- Logarithmic and Exponential Functions
- Complex Numbers

## What Phase 3 Changed

- Replaced self-reported P3 Skill Check success with submitted-answer checking for checkable items.
- Added a pure TypeScript answer checker and parity coverage for the static browser runtime checker.
- Added machine-checkable answer data fields to Skill Check records.
- Added browser-local attempt records in `localStorage`.
- Added explicit deterministic pass logic.
- Added hint, repair-step, answer-reveal, and mistake-tag state to attempts.
- Added targeted mistake prompts and `/p3/review/` sessions generated from local mistake history.
- Added browser acceptance checks for the real generated static pages.
- Hardened legacy and malformed local progress so it fails closed.
- Fully migrated Algebra, Logarithmic and Exponential Functions, and Complex Numbers.

## Supported Answer Types

The current deterministic checker supports:

- `exact-text`
- `numeric`
- `expression-text`
- `multi-value`
- `coordinate`
- `interval`
- `complex-number`

Unsupported or ambiguous answer forms fail closed. Symbolic equivalence is not inferred.

## Attempt Record Shape

Skill Check attempts are stored as:

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

The optional `regionId` is used by the static page runtime for topic progress grouping.

## LocalStorage Key and Storage Behavior

Browser-local progress uses:

```text
asterion.progress.v1
```

P3 Skill Check attempts live under the `skillCheckAttempts` array in that record. Load paths normalize records before using them. Missing storage, malformed JSON, malformed attempt records, and legacy records are treated as empty or ignored for Skill Check pass state.

Legacy `learningActivityAttempts` remain present in the broader progress shape for older local progress behavior, but they do not grant P3 Skill Check pass credit.

## Deterministic Pass Rule

The Phase 3 pass rule is:

> A topic/region passes only when every required checkable Skill Check item for that region has at least one valid P3 attempt where `isCorrect === true`, `revealedAnswer === false`, and `revealedRepairStep === false`.

Wrong attempts do not pass. Uncheckable items do not create pass credit. A correct retry can pass only if it is clean: no answer reveal and no repair-step reveal.

## Reveal, Repair, Hint, and Mistake Tags

- Revealed answers cannot count as passed.
- Repaired attempts cannot count as passed.
- Hint use is recorded as `usedHint`.
- Hint use does not block a clean correct pass.
- Mistake tags are recorded on attempts and can be patched onto the latest wrong attempt.
- Targeted prompts are selected from controlled mistake tags.

## Review Sessions

The static route `/p3/review/` exists.

Review sessions are generated from browser-local P3 Skill Check attempts. Incorrect, repaired, or revealed attempts with mistake tags appear as review candidates grouped by tag. Clean correct attempts do not appear as mistake-review candidates. The page has a useful empty state linking back to P3 Skill Checks and Need to Know.

## Fake-Success Vectors

| Vector | Status | Notes |
| --- | --- | --- |
| `I tried this` completion on generated P3 Skill Check pages | Blocked | Static product tests assert it is absent from generated Skill Check pages. |
| `data-save-skill-check` fake pass hook | Blocked | Static product tests assert it is absent from generator source, static runtime source, and generated Skill Check pages. |
| Legacy `learningActivityAttempts` with self-reported success | Blocked | Skill Check pass readers only use normalized `skillCheckAttempts`. |
| Malformed `asterion.progress.v1` JSON | Blocked | Load paths return clean empty progress. |
| Malformed or partial Skill Check attempt records | Blocked | Records are filtered before pass-state calculation. |
| Revealed correct answers | Blocked | `revealedAnswer: true` prevents pass. |
| Repaired correct answers | Blocked | `revealedRepairStep: true` prevents pass. |
| Uncheckable items | Blocked | No required pass IDs are generated for uncheckable items. |

No remaining in-product fake-success path was found in the Phase 3 closeout audit.

## Fully Migrated Topics

| Topic | Checkable | Uncheckable | Answer types |
| --- | ---: | ---: | --- |
| Algebra | 21/21 | 0 | `coordinate`, `exact-text`, `expression-text`, `interval`, `multi-value`, `numeric` |
| Logarithmic and Exponential Functions | 18/18 | 0 | `coordinate`, `exact-text`, `expression-text`, `multi-value`, `numeric` |
| Complex Numbers | 12/12 | 0 | `complex-number`, `exact-text`, `expression-text`, `multi-value`, `numeric` |

Total fully migrated checks audited at closeout: 51.

## Remaining Not-Yet-Checkable Topics and Checks

| Topic | Checkable | Not yet checkable |
| --- | ---: | ---: |
| Trigonometry | 0/15 | 15 |
| Differentiation | 0/21 | 21 |
| Integration | 0/24 | 24 |
| Numerical Solution of Equations | 0/12 | 12 |
| Vectors | 0/24 | 24 |
| Differential Equations | 0/12 | 12 |

Overall P3 Skill Check migration status:

- Total authored P3 Skill Checks: 159
- Deterministically checkable: 51
- Not yet checkable: 108
- Unsupported answer-form records: 0

Not-yet-checkable items are explicitly reported as not migrated to Phase 3 machine-checkable answer fields. They are not hidden and do not count as pass requirements.

## Browser Acceptance Coverage

The generated static-page interaction check covers:

- Core Skill Check wrong/correct/reveal/repair flow.
- LocalStorage attempt persistence.
- Legacy and malformed progress fail-closed behavior.
- Full-topic Complex Numbers Skill Check page.
- Full-topic Logarithmic and Exponential Functions Skill Check page.
- Full-topic Algebra Skill Check page.
- `/p3/review/` seeded mistake history and empty state.
- Clean correct attempts excluded from review candidates.

## QA Reporting

The generated P3 Content QA page reports:

- Overall deterministic/checkable count.
- Overall not-yet-checkable count.
- Supported answer types present in migrated data.
- Per-topic checkable and uncheckable counts.
- Unsupported answer reasons when present.

Current generated QA snapshot:

```text
Skill Check grading migration: 51 deterministic; 108 not yet; types: complex-number, coordinate, exact-text, expression-text, interval, multi-value, numeric.
```

## Remaining Unsupported Equivalence Cases

The checker intentionally does not support:

- Symbolic equivalence between algebraically equal expressions.
- Arbitrary rearrangements of partial fractions or polynomial expressions.
- Free-form proof or explanation grading.
- Broad paraphrase matching for exact-text/locus descriptions.
- CAS-style simplification, expansion, factorisation, or identity checking.

These limitations are preferable to fake correctness. Safe deterministic variants can be added topic by topic when they are mathematically exact and test-covered.

## Static-Only Limitation

Because Asterion remains a static GitHub Pages product, users can manually tamper with `localStorage`. Phase 3 blocks accidental and in-product fake success paths, but it cannot provide tamper-proof academic records without a trusted backend.

This is an accepted limitation for the current student-facing static study product.

## Recommended Phase 4 Scope

Recommended framing:

> P3 Skill Check Coverage Expansion: migrate remaining topics one at a time, each followed by full-topic browser acceptance and brittleness audit.

Suggested order:

1. Numerical Solution of Equations, if its current checks are mostly numeric and iteration-table based.
2. Trigonometry only after accepted-form brittleness is scoped carefully.
3. Differentiation, Integration, Vectors, and Differential Equations in smaller reviewed slices where symbolic/proof-heavy items can be marked unsupported rather than falsely checkable.

Phase 4 should preserve the Phase 3 pass rule and continue to document unsupported answer forms honestly.

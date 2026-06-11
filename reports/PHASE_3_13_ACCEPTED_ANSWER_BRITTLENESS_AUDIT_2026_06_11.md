# Phase 3.13 Accepted-Answer Brittleness Audit

Date: 2026-06-11

## Scope

Audited the two fully migrated P3 Skill Check topics:

- Complex Numbers
- Logarithmic and Exponential Functions

Total migrated checks audited: 30

- Complex Numbers: 12 checks
- Logarithmic and Exponential Functions: 18 checks

## Changes Made

Added safe deterministic accepted-answer variants where the existing checker can compare normalized text, numeric tuples, multi-value entries, or complex-number components without symbolic algebra.

Also added narrow checker support for `j` as an imaginary-unit suffix in `complex-number` answers. The normalized result remains `i`, and this is covered by TypeScript and static-runtime parity tests.

## Accepted-Answer Variants Added

Complex Numbers:

- `sc-complex-cartesian-conjugate-foundation-001`: added `3+4j`.
- `sc-complex-modulus-argument-core-001`: added `0.75pi` for `3pi/4`.
- `sc-complex-modulus-argument-challenge-001`: added `sqrt(3)+i` and `sqrt3+j`.
- `sc-complex-locus-foundation-001`: added centered/centred wording and `(2,0)` centre variants.
- `sc-complex-locus-core-001`: added `vertical line x=-1` and `perpendicular bisector x=-1`.
- `sc-complex-locus-challenge-001`: added half-line/ray wording variants including endpoint-exclusion wording.
- `sc-complex-roots-challenge-001`: added `2j, -2j`.

Logarithmic and Exponential Functions:

- `sc-log-graph-foundation-001`: added `32=2^5`.
- `sc-log-natural-foundation-001`: added `ln(7)/2` and `(ln7)/2`.
- `sc-log-natural-core-001`: added `ln(4)/3` and `(ln4)/3`.
- `sc-log-exponential-challenge-001`: added `x<ln(4)/2` and `x<(ln4)/2`.

Total explicit accepted-answer variants added: 22.

## Intentionally Wording-Sensitive Checks

These remain deterministic by design:

- Ordered Log/Exp multi-value checks such as `sc-log-natural-challenge-001`, `sc-log-domain-challenge-001`, `sc-log-linearisation-foundation-001`, and `sc-log-linearisation-challenge-001`. They check a specific sequence of moves, not a free-form explanation.
- Exact-text Log laws and Complex locus checks. Extra safe wordings were added, but the checker still does not infer arbitrary paraphrases.
- Expression-text checks involving logarithms, roots, or arguments. Common exact forms were added, but algebraically equivalent transformations are not inferred.

## Unsupported Equivalence Cases

The following remain unsupported because accepting them fairly would require symbolic equivalence, semantic parsing, or broader mathematical language understanding:

- Algebraic rearrangements such as expanding or simplifying expressions into different but equivalent forms.
- Free-form explanation answers that use correct reasoning but different wording.
- Approximate decimal forms for exact expressions unless the item is numeric and configured with tolerance.
- Locus descriptions that omit key mathematical constraints, such as endpoint exclusion for an argument ray.
- Alternative ordered-step wording outside the configured deterministic labels.

## Remaining Student-Facing Risks

- Students may still enter a mathematically valid paraphrase that is rejected if it is outside the explicit accepted variants.
- Exact-text locus descriptions are improved but still not a substitute for semantic grading.
- Expression-text answers remain normalized-text checks; they do not prove symbolic equivalence.
- The UI should continue showing repair/hint feedback clearly so a rejected but plausible answer can be corrected without awarding fake mastery.

## Verification

The added variants are covered by:

- `tests/answerChecker.test.ts`
- `tests/fixtures/answerCheckerParityFixtures.ts`
- `tests/skillCheckData.test.ts`

Full verification was run after changes.

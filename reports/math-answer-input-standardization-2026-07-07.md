# Math Answer Input Standardization - 2026-07-07

## Current Input Problems Discovered

- Deterministic typed answer inputs were rendered with repeated ad hoc label, hint, placeholder, and input markup across Learn, Checked Practice, Diagnostic, and P1 Review surfaces.
- The existing helper gave a single short line such as `Answer format: type a compact expression using ^ for powers.` but did not show nearby keyboard syntax for logs, trig functions, vectors, intervals, complex numbers, or exact forms.
- The existing answer-format audit found 383 deterministic typed inputs and flagged likely confusion around math keyboard/display notation, multi-value separators, coordinate/vector notation, strict short-text responses, and over-permissive accepted aliases.
- Students could see a placeholder, but not a consistent symbol vocabulary. Examples: `ln()`, `sin^2x`, `sqrt()`, `pi/3`, `(a,b,c)`, `a+bi`, and `-1 < x < 4` were not presented consistently near the field.

## Proposed Input Standard

- Every deterministic text answer now uses one generated static input shell, `.math-answer-input`.
- Each field keeps the existing answer checker contract: `answerType`, accepted answers, tolerance, order-matters flags, and the submitted form field name are unchanged.
- Each field displays:
  - a stable answer-format instruction,
  - keyboard symbol chips,
  - generic examples that do not reveal the current answer,
  - a placeholder,
  - `aria-describedby` linking the input to its guidance.
- Supported guidance kinds are `numeric`, `expression`, `multi-value`, `coordinate-vector`, `complex`, `interval`, `exact-text`, and fallback `text`.

## Components Created

- `src/lib/answerFormatGuidance.ts`
  - Extended `AnswerFormatGuidance` with `kind`, `examples`, `symbols`, and `inputMode`.
  - Kept the old `instruction` and `placeholder` fields for compatibility.
- `scripts/build-static-site.ts`
  - Added `renderMathAnswerInput`, one reusable renderer for deterministic typed math answers.
  - Migrated single-value and two-value text fields through the same renderer.
- `src/static-study/static-study.css`
  - Added `.math-answer-input`, `.math-answer-guidance`, `.math-answer-symbols`, and `.math-answer-examples` styles for desktop, mobile wrapping, and dark mode.

## Question Types Migrated

- Numeric answers: integers, decimals, fractions, radicals, and pi forms.
- Algebraic expressions: powers with `^`, fractions with `/`, `sqrt()`, logs/exponentials, trig functions, differentiation, and integration expressions.
- Coordinates and vectors: comma-separated tuples and angle-bracket tuple examples.
- Multi-part answers: comma-separated lists, including labelled forms such as `x=1, x=2`.
- Intervals: inequality and interval notation.
- Complex numbers: `a+bi` forms.
- Exact-text short answers: still shown as short phrase inputs without answer-specific placeholders.

## Migrated Surfaces

- P3 Learn primary and similar checked forms.
- P3 Checked Practice deterministic forms.
- P3 Diagnostic mark-point fields.
- P1 Review fast questions and mini-check fields.
- Multiple-choice and checkbox forms were intentionally unchanged.

## Before And After Examples

- Before: `Answer format: type a compact expression using ^ for powers.`
  After: same instruction plus symbol chips like `^`, `/`, `ln()`, `log_a()`, `e^()` and generic examples such as `ln(5x)`, `log_a(6)`, `e^(2x)`.
- Before: vectors depended on placeholder text only.
  After: vector fields show `Answer format: column-vector components as (a,b,c), with commas.` plus tuple examples such as `(a,b,c)` and `<a,b,c>`.
- Before: multi-value answers only said to separate with commas.
  After: multi-value fields still require comma-separated answers but also show examples like `a, b` and `x=1, x=2`.
- Before: complex answers had only `a+bi` text.
  After: complex fields show `i`, `+`, `-` symbols and examples like `3+2i`, `-1-sqrt(7)i`, `4i+3`.

## Remaining Unsupported Cases

- Full algebraic equivalence is not inferred by the checker.
- Unicode superscripts such as `x²` are still not accepted unless the accepted-answer data already includes them.
- Non-comma multi-value separators such as spaces, slashes, and newlines remain unsupported unless already accepted.
- Broad free-text mathematical reasoning is not machine-graded.
- `i/j/k` vector notation is not accepted for coordinate/vector answers unless the existing checker already accepts that exact answer form.
- Existing strict text and over-permissive aliases remain data/checker cleanup work, not part of this UI standardization pass.

## Final Summary

- Files changed: `src/lib/answerFormatGuidance.ts`, `scripts/build-static-site.ts`, `src/static-study/static-study.css`, `tests/answerFormatGuidance.test.ts`, `tests/staticProduct.test.ts`, `scripts/check-rendered-static-site.mjs`, `scripts/check-skill-check-interactions.mjs`, and this report.
- New component: static renderer `renderMathAnswerInput`.
- Migration status: deterministic typed inputs migrated across Learn, Checked Practice, Diagnostic, and P1 Review.
- Known limitations: guidance clarifies the existing syntax but does not broaden accepted answer semantics.
- Suggested commit: `feat: standardize math answer input components`

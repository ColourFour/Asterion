# Math Input Editor Iteration

Date: 2026-07-08

## Summary

This pass moves the Asterion static math editor closer to Desmos/Khan-style interaction without adding Desmos, Khan, MathQuill, MathLive, or any new checker dependency.

The editor now uses a lightweight node-and-slot model for student interaction. It still writes the existing checker-compatible answer string into the hidden `submittedAnswer` input.

## Implemented improvements

- Replaced direct string-splice editing with structured text/template nodes.
- Added slot templates for fractions, powers, square roots, brackets, absolute value, logs, trig functions, exponential form, coordinates, and vectors.
- Added active-slot rendering with a visible caret and highlighted empty slots.
- Added Tab, Shift+Tab, ArrowLeft, ArrowRight, Backspace, click-to-slot, and toolbar navigation.
- Reorganized the keypad into Basic, Functions, Relations, Vectors, Greek/Constants, and Edit groups.
- Preserved existing raw answer formats such as `x^2`, `sqrt(3)`, `log(2,8)`, `sin(pi)`, and `(2,3,4)`.
- Kept the hidden raw input, accessible guidance, static-site compatibility, and existing answer-checker semantics.

## Regression coverage added

Rendered static checks now verify:

- Clicking the visible editor opens the keyboard and keeps it open.
- Physical typing `123` submits `123`.
- Fraction slot entry submits `a/b`.
- Power slot entry submits `x^2`.
- Log slot entry submits `log(2,8)`.
- Trig/pi entry submits `sin(pi)`.
- Vector slot entry submits `(2,3,4)`.
- Arrow and Backspace inside a log template submit the expected partial raw value without corrupting the expression.

## Verification

- `npm run build`: passed; generated 57 static HTML pages.
- `npm test`: passed; 20 files / 241 tests.
- `npm run static:check`: passed.
- Manual generated-page browser sweep passed:
  - Algebra: `learn-alg-remainder-theorem-need` -> `x^2`
  - Logs: `learn-log-product-law` -> `log(2,8)`
  - Trigonometry: `learn-trig-pythagorean-rewrite` -> `sin(pi)`
  - Complex Numbers: `learn-complex-multiply-i-squared` -> `3+i`
  - Vectors: `learn-vectors-2d-3d-notation` -> `(2,3,4)`
  - Calculus: `learn-diff-power-negative-fractional` -> `x^2`

## Constraints preserved

- No changes to `src/skill-checks/answerChecker.ts`.
- No accepted-answer broadening.
- No mastery, evidence, hint/reveal, or progression rule changes.
- No external visual math editor dependency.

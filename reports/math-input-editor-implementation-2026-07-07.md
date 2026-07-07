# Math Input Editor Implementation

Date: 2026-07-07

## 1. Current implementation removed/changed

The previous standardization pass added reusable markup, answer-kind detection, visible instructions, symbol chips, examples, and placeholders around normal text fields. That improved consistency, but it still asked students to learn keyboard syntax.

This correction pass changes that behavior:

- Visible syntax examples and symbol-chip guidance are no longer the primary student experience.
- Deterministic typed answer fields now render a hidden raw `submittedAnswer` input plus a client-mounted math editor.
- The raw input keeps the existing form name, answer type, accepted-answer metadata, tolerance metadata, and `aria-describedby` link.
- The guidance text remains present as hidden accessible context and as metadata for checks, but the visible interaction is the structured editor.

Unchanged:

- `src/skill-checks/answerChecker.ts` was not changed.
- The static checker mirror in `src/static-study/static-study.js` was not broadened.
- Existing accepted answers, clean-pass evidence, mastery tracking, hint/reveal behavior, and progression rules remain unchanged.

## 2. New input architecture

The static renderer in `scripts/build-static-site.ts` now emits one reusable answer shell for deterministic text-entry questions:

- `.math-answer-input` wrapper with `data-answer-kind`.
- Hidden accessible `.answer-format-guidance`.
- Hidden raw `<input name="submittedAnswer" data-math-answer-raw>`.
- `.math-editor-mount` placeholder for the runtime editor.

The static runtime in `src/static-study/static-study.js` mounts the editor on page load:

- `.math-editor-display` is the visible answer surface.
- `.math-editor-panel` opens when the display is clicked or focused by keyboard.
- `.math-editor-key` buttons insert structured math snippets into the raw field.
- Template entries keep an explicit editor caret state, with left/right controls for moving through slots such as `log(,)` and `(,,)`.
- Raw field updates dispatch normal `input` events, so existing form submission and checking continue to work.

The editor is kind-aware, using the same reusable renderer for numeric, expression, multi-value, coordinate/vector, complex, interval, and exact-text inputs. It filters toolbar buttons by answer kind rather than creating topic-specific editors.

## 3. Supported mathematical structures

The editor currently supports construction of:

- Fractions using `/`, displayed visually where simple numerator/denominator patterns are detected.
- Exponents using `^`, with square and general power buttons.
- Square roots using `sqrt()`.
- Brackets and absolute value.
- Variables `x`, `y`, `z`.
- Constants `pi`, `i`, `theta`, `infinity`, and `C`.
- Logarithms with `ln()` and `log(,)`.
- Exponential form `e^()`.
- Trig functions `sin`, `cos`, and `tan`.
- Equality and inequality relations.
- Comma-separated multi-value answers.
- Two- and three-component coordinate/vector templates, including angle-bracket vector notation where already accepted.

## 4. Conversion format sent to existing checker

The editor always writes checker-compatible text into the raw `submittedAnswer` input.

Examples:

| Visual entry | Submitted value |
| --- | --- |
| `π/3` | `pi/3` |
| `sqrt(3)/2` | `sqrt(3)/2` |
| `x²` | `x^2` |
| `log` with base `2` and input `8` | `log(2,8)` |
| `sin(π)` | `sin(pi)` |
| `(2,3)` | `(2,3)` |
| `3 + 2i` | `3+2i` if entered without spaces, or existing checker-normalized text if spaces are already tolerated |

Keyboard normalization maps common visual symbols back to the existing checker vocabulary:

- `π` -> `pi`
- `√` -> `sqrt`
- `≤` -> `<=`
- `≥` -> `>=`
- `−` -> `-`

No new answer meanings are accepted by this layer. If a notation was not accepted before, the editor does not silently regrade it as correct.

## 5. Remaining unsupported structures

Remaining limitations are intentionally reported rather than hidden:

- Full algebraic equivalence is still limited to the existing checker.
- Free-text reasoning and broad phrase grading are unchanged.
- Unicode superscripts are visual/editor affordances only; submitted values still use `^`.
- Broad non-comma multi-value separators are not newly accepted.
- General matrix editing is not implemented.
- Rich nested visual editing is limited; nested structures are stored as text snippets in the raw input.
- `i/j/k` vector notation is not newly accepted unless an existing question already accepts it.
- Trig powers such as `sin^2(x)` depend on the existing accepted-answer patterns.
- The editor does not add a CAS or symbolic parser.

## Migration status

Migrated surfaces:

- P3 Learn primary and similar deterministic typed forms.
- P3 Checked Practice deterministic typed forms.
- P3 Diagnostic mark-point typed fields.
- P1 Review fast-question and mini-check typed fields.

Unchanged surfaces:

- Multiple-choice and checkbox forms.
- Existing answer checker behavior.
- Existing local progress, evidence, mastery, hint, reveal, and attempt persistence behavior.

## Manual verification plan

Manual verification covered one representative generated Learn question from each required area:

- Algebra: `learn-alg-remainder-theorem-need`, toolbar entry produced raw `x^2`.
- Logs: `learn-log-product-law`, base-log template plus slot navigation produced raw `log(2,8)`.
- Trigonometry: `learn-trig-pythagorean-rewrite`, trig/bracket/pi keys produced raw `sin(pi)`.
- Complex Numbers: `learn-complex-multiply-i-squared`, complex keys produced raw `3+i`.
- Vectors: `learn-vectors-2d-3d-notation`, vector template plus slot navigation produced raw `(2,3,4)`.
- Calculus: `learn-diff-power-negative-fractional`, power keys produced raw `x^2`.

Final command verification required:

- `npm test`: passed, 20 files / 239 tests.
- `npm run build`: passed, generated 57 static HTML pages.
- `npm run static:check`: passed, including rendered static page checks and P3 Learn / Checked Practice browser interactions.

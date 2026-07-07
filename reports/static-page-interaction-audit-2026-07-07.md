# Static Page Interaction Audit - Button Wiring
Date: 2026-07-07

This report audits generated `docs/` pages for Check and Submit button wiring contracts. It verifies that each interactive form has the expected static handler marker, submit control, input controls, and feedback/status target used by `src/static-study/static-study.js`.

Pages/surfaces audited: 32
Failures: 0

## Summary Table

| Page | Check Button | Submit Button | Correct Response | Incorrect Response | Status |
|---|---|---|---|---|---|
| P3 Diagnostic | n/a | 1 form(s) | All mark points are scored by collectP3DiagnosticEvaluation through checkSubmittedSkillAnswer; report and diagnostic progress record are saved. | Missed mark points reduce section/risk scores; report flags weak areas without awarding false completion. | PASS - Wired |
| P3 Exam Training | n/a | 12 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| P1 Review repair lane | n/a | 5 module form(s) | Fast/mini answers are checked by checkSubmittedSkillAnswer; mini-check success within retry window completes module evidence. | Incorrect fast/mini answers render per-question repair feedback and keep module IN_PROGRESS. | PASS - Wired |
| p3/review | n/a | 12 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| p3/review | n/a | 1 form(s) | Export submit builds local progress CSV/email body from saved progress. | No answer validation; empty progress exports with an explanatory status. | PASS - Wired |
| Algebra Exam Training | n/a | 6 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Algebra Learn | 34 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Algebra Checked Practice | 24 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Complex Numbers Exam Training | n/a | 8 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Complex Numbers Learn | 34 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Complex Numbers Checked Practice | 14 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Differential Equations Exam Training | n/a | 8 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Differential Equations Learn | 24 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Differential Equations Checked Practice | 12 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Differentiation Exam Training | n/a | 8 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Differentiation Learn | 30 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Differentiation Checked Practice | 22 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Integration Exam Training | n/a | 6 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Integration Learn | 28 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Integration Checked Practice | 25 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Logarithmic And Exponential Functions Exam Training | n/a | 6 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Logarithmic And Exponential Functions Learn | 34 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Logarithmic And Exponential Functions Checked Practice | 20 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Numerical Solution Of Equations Exam Training | n/a | 6 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Numerical Solution Of Equations Learn | 24 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Numerical Solution Of Equations Checked Practice | 12 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Trigonometry Exam Training | n/a | 6 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Trigonometry Learn | 28 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Trigonometry Checked Practice | 17 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |
| Vectors Exam Training | n/a | 6 form(s) | Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice. | Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save. | PASS - Wired |
| Vectors Learn | 24 form(s) | n/a | Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence. | Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded. | PASS - Wired |
| Vectors Checked Practice | 25 form(s) | n/a | Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown. | Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded. | PASS - Wired |

## Affected Pages

No affected generated pages were found by the static wiring audit.

## Root Cause Notes

- No broken handler marker, missing submit button, missing answer input, or missing feedback/status target was found in generated `docs/`.
- Check Answer forms use delegated `submit` handling in `src/static-study/static-study.js`: `data-check-learn-answer` routes to `checkLearnAnswer`; `data-check-skill-answer` routes to `checkSkillAnswer`.
- Submit forms use delegated or page setup handling: `data-p3-diagnostic-form`, `data-save-exam-attempt`, `data-p1-repair-module-form`, `data-demo-step-form`, and `data-export-local-progress-form`.

## Verification Notes

- `node scripts/audit-static-page-interactions.mjs`: passed for all generated student-facing Check/Submit surfaces.
- `node scripts/check-skill-check-interactions.mjs`: passed browser interaction checks for Algebra, Logarithms, Trigonometry, Differentiation, Integration, and related Learn/Checked Practice flows.
- Targeted browser spot checks on 2026-07-07: Vectors Learn wrong answer saved Learn activity without completion; Vectors Learn correct answer rendered correct feedback and did not create Skill Check evidence; Vectors Checked Practice explicit wrong answer saved an incorrect attempt without pass; P3 Diagnostic all-correct final submit rendered the report and saved one diagnostic report; Vectors Exam Training submit saved one self-marked attempt after mark-scheme reveal.
- `npm test`, `npm run build`, and `npm run static:check`: passed on 2026-07-07.

## Fix Applied

- No runtime Check/Submit wiring defect was found in the generated student pages.
- Added this static interaction audit and included it in `npm run static:check` so future missing handler markers, submit controls, answer inputs, or feedback/status targets fail CI/local static checks.

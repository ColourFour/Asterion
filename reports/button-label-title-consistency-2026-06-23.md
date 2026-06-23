# Button, Label, Title Consistency Pass — 2026-06-23

## Files changed

- `scripts/build-static-site.ts`
- `src/static-study/static-study.js`
- `scripts/check-static-site.mjs`
- `scripts/check-rendered-static-site.mjs`
- `scripts/check-skill-check-interactions.mjs`
- `tests/staticProduct.test.ts`
- `tests/p3DiagnosticFeedback.test.ts`
- `tests/p3TopicPackRefresh.test.ts`
- Generated static output under `docs/`
- This report

Note: `src/static-study/static-study.css` and `docs/assets/static-study.css` already had local modifications before this pass. This pass did not intentionally edit CSS.

## Routes reviewed

- `/`
- `/about`
- `/p1`
- `/m1`
- `/s1`
- `/p3`
- `/p3/diagnostic`
- `/p3/repair-lane`
- `/p3/topics`
- `/p3/need-to-know`
- `/p3/review`
- `/p3/topics/*/learn`
- `/p3/topics/*/field-guide`
- `/p3/topics/*/skill-check`
- `/p3/topics/*/exam-training`
- `/p3/topics/*/worksheet`

Maintainer-only `/p3/content-qa` was not used for student-facing duplicate/CTA decisions.

## Duplicate same-destination controls found

Found 18 duplicate destination groups during rendered-page inspection, representing 72 redundant visible or prominent route controls.

Main sources:

- Root hero `Start P3` duplicated the P3 course card.
- P3 dashboard action cards and next-step panel duplicated unit/review cards.
- P3 topic overview hero and next-step panel duplicated the first unit card.
- Topic Exam Training pages repeated Learn links on every question card.
- Review Mistakes repeated Learn links for repeated topics in mixed question cards.
- Review page had a second `Back to P3` inside the empty repair panel.

## Duplicate controls fixed

Fixed all 18 duplicate destination groups.

Rendered duplicate scan after changes:

- Duplicate prominent same-destination route sets: 0
- Flagged vague labels in reviewed generated pages: 0

## Labels normalized

- `Open full unit path` -> `Topic Overview`
- `Open review` / `Check review status` -> `Review Mistakes`
- `Go to P3` / `Back to P3 Home` / `Back to P3 topics` -> `Back to P3`
- `Open P1 Repair Lane` / diagnostic dynamic `Open ...` labels -> `Continue`
- `Start Learn` -> `Start` on Learn pages, `Learn` on Field Guide bridge entries
- `Continue to Learn` -> `Continue`
- `Open Exam Training` -> `Exam Training`
- `Return to Learn` / `Review Learn` -> removed where duplicate, or normalized to `Learn`
- `Start topic questions` -> `Start`
- `Check answer` -> `Check Answer`
- `Show hint` -> `Hint`
- `Show answer...` / `Show mark scheme image` -> `Reveal Answer`
- `Try again` -> `Try Again`
- `Next question` / `Previous question` -> `Next Question` / `Previous Question`

## Titles and headings normalized

- P3 landing: `Pure Mathematics 3`
- P3 topics page: `P3 Topic Overview`
- P3 Learn pages: `[Topic Name] — Learn`
- P3 Field Guide bridge pages: `[Topic Name] — Learn`
- P3 Checked Practice bridge pages: `[Topic Name] — Checked Practice`
- P3 Exam Training pages: `[Topic Name] — Exam Training`
- Review page: `Review Mistakes`
- Need-to-know page remained `P3 Need to Know`

## Duplicates intentionally kept

None among visible/prominent student controls. The hidden/collapsed duplicate on the review page was removed rather than documented as kept.

## Commands run

- `npm test` — passed before edits, 212 tests.
- `npm run build` — passed before edits, generated 57 pages.
- `npm run static:check` — passed before edits.
- Rendered HTML control inventory crawler — found duplicate groups before edits; passed after edits with 0 duplicate groups.
- `npm run build` — passed after edits, generated 57 pages.
- `npm test` — passed after edits, 213 tests.
- `npm run static:check` — passed after edits.
- `git diff --stat` — run for review.
- `git diff --check` — run for whitespace validation.

## Scope confirmation

No maths content, questions, answers, checker logic, routing system, mastery/readiness evidence logic, or progression rules were changed.

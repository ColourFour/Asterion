# Live Adversarial Review - 2026-07-06

Live site reviewed: https://colourfour.github.io/Asterion/

Reviewed commits:
- `d317498` - Clarify homework start and export flow
- `f13fdb9` - Move diagnostic actions up on mobile

## Scope

This review targeted the summer-homework entry path and the public static surface after deployment to GitHub Pages. The adversarial lens was: can a first-time student still miss the diagnostic, fail to export progress without a local email client, reach internal QA, hit unfinished worksheet copy, or lose the task behind mobile chrome?

## Result

No blocking issues found in the deployed pages reviewed.

The live site now makes Diagnostic the first-time action on the root page and P3 dashboard, exposes a real CSV download path, links Need to Know from student review/dashboard flows, removes public Content QA, and removes the Integration worksheet empty group messages.

## Live Checks

| Area | Live evidence | Result |
| --- | --- | --- |
| Root first action | `/Asterion/` primary CTA is `Start diagnostic`, href `p3/diagnostic/`; header nav is Home, Diagnostic, P3 Units, Exam Training; no `Start with Learn` CTA found. | Pass |
| Root action cards | Root page renders 4 action cards, with Diagnostic first. | Pass |
| P3 dashboard first action | `/Asterion/p3/` next-step title is `Start diagnostic`, href `diagnostic/`. | Pass |
| Need to Know surfacing | P3 dashboard secondary links include `Need to Know`; review/export hero includes a `Need to Know` button. | Pass |
| CSV export | `/Asterion/p3/review/` renders `Download CSV` and `Open Email`; required profile fields are present. | Pass |
| Internal QA exposure | `/Asterion/p3/content-qa/` returns GitHub Pages 404 and does not contain `Internal Content QA`. | Pass |
| Worksheet empty states | `/Asterion/p3/topics/integration/worksheet/` renders 25 worksheet questions and 0 group-level `No printable Checked Practice items...` messages. | Pass |
| Mobile overflow | Checked root and P3 dashboard at 390x844; no horizontal overflow detected. | Pass |

## Mobile Adversarial Findings

Initial live review after `d317498` found a residual issue: on mobile, the P3 dashboard `Start diagnostic` panel sat below the first viewport because the homework checklist came first. That weakened the phone path even though the header was more compact.

Follow-up commit `f13fdb9` moved the diagnostic actions up on mobile:
- Root mobile `Start diagnostic` button top: about 461px in a 390x844 viewport.
- P3 dashboard mobile next-step panel top: about 404px.
- P3 dashboard mobile `Start diagnostic` button top: about 563px.
- No horizontal overflow on either page.

Residual observation: the P3 dashboard mobile header is still about 138px high because the theme toggle is visible. This is not currently blocking the task, because the diagnostic panel is now visible in the first viewport, but it is worth monitoring if more header controls are added.

## Export Adversarial Notes

The new CSV download path no longer depends on a configured local email client. The form still requires student name, class/group, and teacher email before downloading because those fields become export metadata in the CSV. This is defensible for teacher-submitted homework, but if students are expected to download first and fill metadata later, the requirement would need to be loosened.

The export fallback textarea remains available after generation, so students can still copy CSV if a browser blocks downloads.

## Content QA Risk

The internal QA page is no longer in `docs/static-pages.json` and is not generated into `docs/p3/content-qa/index.html`. The live route returns the default GitHub Pages 404. This removes the public internal H1 exposure. If a custom student-facing 404 is added later, confirm it does not re-link internal maintenance routes.

## Verification Commands

Commands run locally after the final CSS follow-up:

```sh
npm run build
npm test
npm run static:check
```

`npm run static:check` required running Playwright Chromium outside the command sandbox.

## Recommendation

Ship as-is. The only follow-up worth considering is a later mobile refinement to reduce the P3 dashboard header height further, but the shipped flow now meets the homework-start and export requirements.

# P1 Skill Check Cognitive Load Repair - 2026-06-05

## 1. What Made The Previous Page Dense

The previous rendered P1 Skill Check pages were functional, but the first viewport still felt like a control panel:

- The large topic hero, formula panel, and hero actions appeared before the task.
- The group chooser showed every available group as top-level buttons by default.
- The one-card controls still exposed disabled/secondary controls such as previous set, previous, and more practice because the global `.button` display rule overrode `hidden`.
- Each active group repeated "3 quick checks", a group title, and a purpose paragraph above the card.
- Each card carried micro-labels from group metadata, then answer reveal dumped final answer, hint, method cue, first step, common mistake, and full working together.
- On short cards, the Exam-style direction section could enter the first viewport before the student had finished the 3-question task.

Before classification: all checked routes read as C, a dashboard/control panel, even though only one card was technically active.

## 2. What Was Hidden, Collapsed, Or Shortened

- Added a P1-only compact Skill Check hero: topic name plus "Try 3 quick questions."
- Added `body.skill-check-page` so mobile header and Skill Check page spacing can be tightened without changing Exam Training or other course pages.
- Replaced the default full group list with a closed "Change skill" disclosure that shows only the current skill line by default.
- Hid enhanced P1 group headers after JavaScript initializes; the current skill now lives in the compact selector.
- Changed P1 flow labels from "Skill Check 1 of 3" to "Question 1 of 3".
- Reduced visible controls to the current skill selector and one primary next action.
- Changed P1 card label to "Try this".
- Changed answer reveal to show only final answer, one method line, and short "Watch for" feedback first.
- Moved full worked steps behind nested "Show working".
- Moved the save button inside the answer reveal for focused P1 cards.
- Added a simple completion state after question 3 with one primary action.
- Pushed Exam-style direction below the default first viewport; Exam Training itself was not modified.

No new questions or groups were added. Quarantined Integration content was not restored.

## 3. Before Vs After Visible-Page Summary

| State | Before | After |
| --- | --- | --- |
| Default top | Large hero, formula/action links, full group list, control strip | Compact topic intro, current skill selector, one next action |
| Current skill | One item among many group buttons | Single-line current skill with "Change skill" collapsed |
| Active card | One card, but surrounded by navigation furniture | One visually dominant card |
| Answer reveal | Answer, hint, method cue, first step, mistake, and working together | Answer plus one method line first; full working collapsed |
| End of 3 questions | Next group/exam direction competed with nearby page sections | Simple "Done" card with "Next skill" or "Try exam-style questions" |

After classification: all checked routes read as A, one 3-question task.

## 4. Routes Checked

| Route | Desktop after | Mobile 390px after |
| --- | --- | --- |
| `/p1/topics/quadratics/skill-check/` | A | A |
| `/p1/topics/functions/skill-check/` | A | A |
| `/p1/topics/series/skill-check/` | A | A |
| `/p1/topics/differentiation/skill-check/` | A | A |
| `/p1/topics/integration/skill-check/` | A | A |

Browser sweep result for every route and viewport:

- 1 visible Skill Check card.
- 1 visible P1 group.
- Group switcher closed by default.
- Answer reveal closed by default.
- Visible default buttons limited to current skill/change-skill and next question.
- Exam-style direction below first viewport.
- No horizontal overflow.
- No error overlay.

## 5. Mobile Checks

At 390px width, the first viewport now shows the compact header, current skill selector, "Question 1 of 3", "Next question", and the active question card. The card is visible without opening a group list or scrolling through secondary controls.

Captured QA screenshots:

- `tools/content_lab/reports/p1_skill_check_cognitive_load_repair_2026_06_05_assets/after_quadratics_desktop_v3.png`
- `tools/content_lab/reports/p1_skill_check_cognitive_load_repair_2026_06_05_assets/after_quadratics_mobile_v3.png`
- `tools/content_lab/reports/p1_skill_check_cognitive_load_repair_2026_06_05_assets/after_completion_desktop.png`

## 6. Validation Commands

| Command | Result |
| --- | --- |
| `npm run build` | Passed. Generated 211 static HTML pages in `docs/`. |
| `npm run static:check` | Passed. Static and rendered checks passed for 211 HTML pages. |
| `npm test` | Passed. 56 files, 477 tests. |
| `git diff --check` | Passed after report creation. |
| `npm run lint --if-present` | Passed with no output. |

Browser QA also checked one-card default flow, compact group chooser, no large group list visible by default, progressive worked solution reveal, simple final action, no horizontal overflow, and no console/page errors.

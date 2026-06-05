# Field Guide Show-Don't-Tell UI Pass - 2026-06-05

## Summary
- Removed the repeated left-side topic-card graph icon from generated course topic cards.
- Made topic cards use the topic title, syllabus code, short formula motif, subtle card styling, and the existing "Start here" chip.
- Reworked static Field Guide top cards from "Overview" and outcome lists into "What you need to know" and "Worked examples".
- Changed P1 seed Field Guide panels from generic phases into subtopic tabs with worked example, try-similar prompt, reveal/check method, exam tip, and next action.
- Updated P3 Field Guide examples so "Try a similar one" is visible before optional support.
- Made Field Guide to Skill Check CTAs explicit with "Next: Skill Check" and "Opens 3 quick questions on this skill."
- Regenerated `docs/` through the normal static build.

## Files Changed
- `scripts/build-static-site.ts`
- `src/static-study/static-study.css`
- `src/static-study/static-study.js`
- `src/data/p1SeedContent.ts`
- `src/data/p1SkillCheckItems.ts`
- `src/tests/courseSeedContent.test.ts`
- `src/tests/skillChecklist.test.ts`
- Generated `docs/` static output
- Screenshot captures under `tools/content_lab/reports/field_guide_show_dont_tell_screenshots_2026_06_05/`

## Routes Checked
- `/p1/`
- `/p1/topics/`
- `/p1/topics/quadratics/field-guide/`
- `/p1/topics/series/field-guide/`
- `/p1/topics/series/skill-check/`
- `/p1/topics/differentiation/field-guide/`
- `/p1/topics/integration/field-guide/`
- `/p3/topics/algebra/field-guide/`

## Content Gaps / Scope Notes
- P1 remains draft/source-filled seed content until syllabus-contract audit.
- P1 Integration now excludes improper integrals and volumes of revolution from the student Field Guide and Skill Check export because they are outside the intended P1 student-facing scope for this pass.
- M1 and S1 receive the shared template improvements, but their draft seed panels still depend on existing seed section depth.

## Screenshots
Captured 16 Playwright screenshots, desktop and mobile for each checked route:
- `tools/content_lab/reports/field_guide_show_dont_tell_screenshots_2026_06_05/`

## Validation
- `npm run build` - passed, generated 211 static HTML pages.
- `npm run static:check` - passed for 211 HTML pages.
- `npm test` - passed, 56 files / 472 tests.
- `git diff --check` - passed.
- `npm run lint --if-present` - passed; no lint script is present.
- Playwright route check - passed on desktop 1366x900 and mobile 390x844; no console errors, no page-level horizontal overflow, no repeated topic-card icons.

## Remaining Follow-Up
- Complete the syllabus-contract audit for P1/M1/S1 seed topics before treating those pages as final course-contract content.
- Add richer authored worked examples for seed topics where the current source only provides compact scaffold bullets.

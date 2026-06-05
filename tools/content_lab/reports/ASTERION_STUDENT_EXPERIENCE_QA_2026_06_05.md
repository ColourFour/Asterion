# Asterion Student Experience QA - 2026-06-05

## Executive Summary

QA was run against the generated static site in `docs/` using the local preview at `http://127.0.0.1:4173/`. The review focused on the principle: one decision at a time, one dominant action per screen, no content walls, no internal language, no exam-question walls, correct math rendering, mobile usability, and keyboard/accessibility basics.

Overall verdict: **Ship after minor fixes**.

The core student route now works: homepage -> choose course -> choose topic -> Field Guide -> Skill Check -> next Field Guide phase or Exam Training. A student does not need to understand the site architecture to reach a useful learning action. The site feels much closer to "Pick a topic. Start here if unsure." than to a dashboard.

During QA, three small regressions were fixed:

- P3 Skill Check pages no longer show embedded exam question cards.
- Field Guide phases now expose a direct "Try 3 quick questions" action, including exact P3 phase anchors where available.
- Exam Training cards now include a safe "Review Field Guide" recovery link where the related topic route is known.

Remaining issues are mostly cognitive-load polish, not broken flows. The most important remaining issue is that some P3 Skill Check flows still show counters like "Skill Check 1 of 44", which conflicts with the "Try 3 quick questions" promise.

## What Improved

- Homepage clearly asks "Which paper are you studying today?" and presents P1, P3, M1, and S1 as obvious course choices.
- Course pages are topic pickers with short, clickable visual topic cards and a visible "Start here" treatment.
- Field Guide pages show one guided phase at a time with JavaScript active.
- Skill Check pages show one card at a time with clear Previous/Next controls.
- Exam Training shows one exam question at a time; mark schemes are hidden until the student reveals them.
- P1 Series formulas render visually cleanly; no vertical single-character formula fragments were seen in desktop or mobile screenshots.
- Internal wording such as "draft", "syllabus-contract", "audit", "mapping", "record/image availability", and "generated practice" was not visible in generated QA pages.
- Mobile checks across iPhone, tablet, and desktop viewports found no horizontal overflow in the tested paths.

## Remaining Cognitive-Load Problems

1. **P3 Skill Check count is too large.** P3 Algebra shows one visible card, but the control says "Skill Check 1 of 44". For anxious or average students, that reads like a long database rather than "Try 3 quick questions."
2. **P3 Exam Training still has dashboard-like content below the active question.** The first screen is calm, but the full page includes saved-attempt stats and a long topic-progress list. This is below the one-question flow, so it is not blocking, but it still leans operational.
3. **Course topic-card accessible names are long.** Visually, topic cards are clean. In text/accessibility extraction, formulas can be repeated by KaTeX, making the link text verbose.
4. **Homepage keyboard order is sensible but not optimal.** Focus moves through brand and top nav before the four course cards. This is usable, but the primary student choice is not the first interactive stop after the brand.

## Student-Facing Language Issues Found

- No visible internal wording was found in the reviewed generated pages.
- Starter limitations for P1/M1/S1 are phrased calmly: "Starter notes: check your class syllabus or teacher guidance for final coverage."
- "Saved attempts" and "Local progress" are student-understandable, but on Exam Training they still create a light dashboard feel.
- "Skill Check 1 of 44" is the main tone/problem mismatch because it makes a short check feel large.

## Navigation Issues Found

- Primary route works: `/` -> `/p1/` or `/p3/` -> topic -> Field Guide -> Skill Check.
- Course landing pages are topic pickers, not dashboards.
- Field Guide Back/Next controls work.
- Phase tabs support arrow-key navigation and expose active state.
- Exam Training Previous/Next controls work.
- Fixed during QA: Exam Training now has a related Field Guide review link when safe.
- Minor remaining issue: homepage keyboard users hit top nav before course cards.

## Math Rendering Issues Found

- P1 Series visual rendering passed on desktop and mobile.
- Required Series formulae render cleanly:
  - `u_n = a + (n - 1)d`
  - `S_n = n/2 [2a + (n - 1)d]`
  - `S_n = n/2(a + l)`
  - `u_n = ar^(n - 1)`
  - `S_n = a(1 - r^n) / (1 - r), r != 1`
  - `S_infinity = a / (1 - r), |r| < 1`
- No vertical single-character math fragments were visible in screenshots.
- Accessibility/text extraction still sees verbose KaTeX text in some card links; this is an accessible-name follow-up rather than a visual math failure.

## Mobile Issues Found

- No horizontal overflow was found on tested iPhone, tablet, or desktop viewports.
- Header navigation wraps into large touch targets on mobile. It is usable, but takes visual space.
- Topic cards remain usable on mobile.
- Formula chips do not break vertically in the checked P1 Series Field Guide mobile screenshot.
- Guided phase navigation, Skill Check controls, and Exam Training controls are reachable.
- Exam images scale correctly in tested pages.

## Accessibility Issues Found

- Navigation uses semantic links.
- In-page controls use buttons.
- Phase tabs use `role="tab"`, `aria-selected`, and `aria-current`.
- Question flow controls are keyboard-usable buttons.
- Decorative visual treatments are mostly hidden or non-interactive.
- Visible focus states are present.
- Follow-up: reduce long accessible names on topic-card links caused by formula markup inside full-card links.
- Follow-up: consider moving homepage course cards earlier in tab order or adding a skip-to-courses target.

## Student Journey Notes

### A. Low-achieving / Anxious Student

Path: `/` -> P1 -> Start here topic -> Field Guide first phase -> Skill Check -> review after uncertainty.

- The student sees one clear first decision: choose a course.
- P1 defaults to a "Start here" topic, so the student does not need to diagnose their own weakness.
- The Field Guide gives a small win: "Nice. Start with one small idea."
- No exam wall appears before the student has learned something.
- The Skill Check gives a repair path back to the Field Guide.
- Risk: if this student opens a P3 Skill Check later, "1 of 44" could feel overwhelming.

### B. Average Student

Path: `/` -> P3 -> choose a topic -> Field Guide -> Skill Check -> next phase -> topic Exam Training.

- The route is efficient and connected.
- Learn, Skill Check, and Exam Training are visible but not all competing before topic choice.
- Field Guide phase tabs allow jumping without making the first view feel like a wall.
- Exact P3 Skill Check anchors now connect Field Guide phases to the relevant practice section.
- Topic Exam Training is one question at a time and includes a review link.
- Risk: P3 Skill Check section names are useful shortcuts, but the total count still feels too large.

### C. High-achieving / Exam-focused Student

Path: `/` -> P3 -> topic -> skip to Skill Check or Exam Training -> review related Field Guide after a missed question.

- Fast paths exist from topic cards and topic pages.
- Exam Training is efficient: one visible question, hidden mark scheme, Previous/Next controls.
- The new "Review Field Guide" link supports repair after a missed question.
- Filters/topic controls are compact enough, though course-level P3 Exam Training still includes a long topic-progress list below the active question.
- Motivational friction is low; the main friction is still the large Skill Check count.

## Screenshots Captured

Screenshots were generated locally under:

`tools/content_lab/reports/student_experience_qa_2026_06_05_assets/`

- `homepage_desktop.png`
- `homepage_mobile.png`
- `p1_course_desktop.png`
- `p1_course_mobile.png`
- `p1_series_field_guide_desktop.png`
- `p1_series_field_guide_mobile.png`
- `p3_algebra_skill_check.png`
- `p3_exam_training.png`
- `qa_metrics.json`

These are local QA artifacts. They are useful for review evidence but should not be committed if the repo does not normally track screenshot artifacts.

## Bugs or Regressions

Fixed during QA:

- **P3 Skill Check contained exam question cards.** This blurred Skill Check and Exam Training. Fixed in `scripts/build-static-site.ts`.
- **Some Field Guide phases did not end with a direct Skill Check action.** Fixed for seed Field Guides and P3 Field Guides in `scripts/build-static-site.ts`.
- **Exam Training lacked Field Guide review links where safe.** Fixed in `scripts/build-static-site.ts`; minor spacing added in `src/static-study/static-study.css`.

No JavaScript console errors were observed in the browser QA pass.

## Recommended Fixes Ranked by Urgency

1. **Cap or reframe Skill Check sessions to match "Try 3 quick questions".**
   - Problem: "Skill Check 1 of 44" feels like a database.
   - Likely files: `scripts/build-static-site.ts`, `src/lib/skillChecklist.ts`, `src/data/skillCheckItems.ts`, `src/static-study/static-study.js`.
   - Suggested approach: default to a focused 3-card session from the selected Field Guide phase; keep the full section list in a collapsed "More checks" area.

2. **Reduce P3 Exam Training dashboard feel below the active question.**
   - Problem: topic-progress rows make the full page feel operational.
   - Likely files: `scripts/build-static-site.ts`, `src/static-study/static-study.css`.
   - Suggested approach: collapse topic progress behind "Choose a topic question" or move it after a compact topic picker.

3. **Shorten accessible names for visual topic-card links.**
   - Problem: KaTeX content can make link names long and repetitive.
   - Likely files: `scripts/build-static-site.ts`, `src/static-study/static-study.css`.
   - Suggested approach: keep the primary link text concise via `aria-label`, or make only the button/link text the link while keeping formula visuals outside the accessible link name.

4. **Improve homepage keyboard path to course cards.**
   - Problem: keyboard focus traverses top nav before course cards.
   - Likely files: `scripts/build-static-site.ts`, `src/static-study/static-study.css`.
   - Suggested approach: add a visually hidden skip link to the course chooser or simplify duplicate top-nav course links on the homepage.

5. **Tighten mobile header height.**
   - Problem: mobile header is usable but visually bulky.
   - Likely files: `src/static-study/static-study.css`.
   - Suggested approach: use a compact wrapping nav treatment only on small screens.

## Validation Notes

Browser QA covered:

- `/`
- `/p1/`
- `/p3/`
- `/m1/`
- `/s1/`
- `/p1/topics/series/field-guide/`
- `/p1/topics/series/practice/`
- `/p1/topics/series/exam-training/`
- `/p3/topics/algebra/field-guide/`
- `/p3/topics/algebra/practice/`
- `/p3/topics/algebra/exam-training/`
- `/p3/exam-training/`
- One M1 Field Guide
- One S1 Field Guide

Viewport QA covered iPhone-size, tablet-ish, and desktop viewports for homepage, course landing, P1 Series Field Guide, P3 Algebra Skill Check, and P3 Exam Training.

## Suggested Next Codex Implementation Prompt

```text
Task: Asterion 6/5 student experience minor QA fixes only.

Use tools/content_lab/reports/ASTERION_STUDENT_EXPERIENCE_QA_2026_06_05.md as source of truth.

Fix only the top two cognitive-load issues:
1. Make Skill Check sessions feel like "Try 3 quick questions" instead of "1 of 44". Default each Field Guide phase CTA to a focused 3-card Skill Check session or equivalent short visible flow. Keep any larger bank secondary/collapsed.
2. Reduce the dashboard feel below P3 Exam Training. Keep one question dominant, keep mark scheme hidden by default, and make topic selection compact/secondary.

Do not redesign the homepage/course/Field Guide visual system. Do not add new features, backends, auth, mastery mechanics, or generated content systems.

After changes, regenerate docs and run:
npm run build
npm run static:check
npm test
git diff --check
npm run lint --if-present
```


# Asterion Student Experience Full Repass - 2026-06-05

## Result

The corrective pass was implemented against the generated static site and verified in the rendered browser preview. The visible student path now follows:

Homepage -> choose course -> choose topic -> Field Guide -> Skill Check -> Exam Training, one question at a time.

Primary evidence is stored in:

`tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/`

The rendered route evidence JSON is:

`tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/browser-route-evidence.json`

## What Was Visibly Wrong Before This Pass

- The homepage and course pages still felt like structure-heavy study dashboards instead of a short student path.
- Course pages exposed mode choices too early, before the student had chosen a topic.
- Topic pages and course pages were inconsistent across P1, P3, M1, and S1.
- Skill Check pages could expose very large sets as the default experience, including the failing pattern `1 of 44`.
- Field Guide pages still rendered too much stacked content as the normal view instead of one guided phase at a time.
- Exam Training pages could still read as a question wall instead of a one-question flow.
- Student-facing pages contained or risked containing internal wording that did not belong in the learning surface.
- P1 Series formulas needed stronger rendering rules so equations did not fragment on narrow layouts.

## Root Cause

The earlier implementation changed some source surfaces, but the rendered static site was not fully corrected.

- Generated `docs/` output did not consistently reflect the intended redesign until the source generator was fixed and the site was regenerated.
- Multiple route families existed: canonical course-prefixed pages, legacy unprefixed P3 pages, and older `/practice/` routes. Some student-facing links and generated pages still followed older route assumptions.
- P3 and course pages were not enough; P1, M1, and S1 seed-generated pages used separate generator paths and needed the same topic-first treatment.
- Static JS selectors and generated HTML needed to line up. Skill Check chunking and Field Guide phase behavior had to be verified in a browser after JS initialization, not inferred from source.
- Existing static checks validated data and generated files, but did not assert the rendered student experience.

## What Was Fixed

- Homepage rebuilt as a short four-course choice with a student-facing academic visual.
- Course pages rebuilt as topic pickers with a subtle `Start here` cue and quiet course-level Exam Training.
- Topic cards now make the Field Guide the whole-card primary action, with Skill Check and Exam shortcuts demoted.
- Canonical `/skill-check/` routes were added for generated student pages while preserving older `/practice/` output for compatibility.
- Field Guides now render Overview, What you need to be able to do, and one guided study panel.
- Guided phase tabs and Next/Back controls now use selectors matched by `src/static-study/static-study.js`.
- Skill Check pages chunk large sets into small focused sets. P3 Algebra renders `Set 1 of 2 · Skill Check 1 of 3`.
- Skill Check extra questions are reached through `More practice` rather than dumped as the default view.
- Exam Training pages render one question at a time, with mark schemes hidden until reveal.
- Formula CSS and P1 Series source formulas were updated so AP/GP formulas render as readable KaTeX rows with no vertical fragmentation.
- Static checks now scan generated visible body text for forbidden student-facing strings.
- New rendered Playwright checks verify generated pages after JS initializes.

## Screenshot List

- Homepage desktop: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/homepage-desktop.png`
- Homepage mobile: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/homepage-mobile.png`
- P1 course page desktop: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/p1-course-desktop.png`
- P3 course page desktop: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/p3-course-desktop.png`
- P1 Series Field Guide desktop: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/p1-series-field-guide-desktop.png`
- P1 Series Field Guide mobile: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/p1-series-field-guide-mobile.png`
- P3 Algebra Skill Check focused set: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/p3-algebra-skill-check-focused-set.png`
- P3 Exam Training one question: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/p3-exam-training-one-question.png`
- M1 course page desktop: `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/m1-course-desktop.png`

## Browser Route Evidence

Final Phase 4 screenshot capture checked these routes through `http://localhost:4173`:

| Route | Evidence |
| --- | --- |
| `/` desktop | H1 `Which paper are you studying today?`; JS active; CSS loaded; 4 course cards; no horizontal overflow; no forbidden visible text. |
| `/` mobile | H1 `Which paper are you studying today?`; JS active; CSS loaded; 4 course cards; no horizontal overflow. |
| `/p1/` | H1 `P1: Pure Mathematics 1`; 9 topic cards; Start here visible; no mode-heavy nav before topic grid. |
| `/p3/` | H1 `P3: Pure Mathematics 3`; 9 topic cards; Start here visible; no mode-heavy nav before topic grid. |
| `/p1/topics/series/field-guide/` desktop | Guided study exists; 6 phase buttons; exactly 1 visible phase panel; no overflow; P1 Series formulas present. |
| `/p1/topics/series/field-guide/` mobile | Guided study exists; 6 phase buttons; exactly 1 visible phase panel; no overflow. |
| `/p3/topics/algebra/skill-check/` | Counter `Set 1 of 2 · Skill Check 1 of 3`; exactly 1 visible practice card; no `of 44`; no forbidden visible text. |
| `/p3/exam-training/` | Counter `Question 1 of 12`; exactly 1 visible exam card; 0 visible mark schemes; mark scheme details closed. |
| `/m1/` | H1 `M1: Mechanics 1`; 7 topic cards; Start here visible; no mode-heavy nav before topic grid. |

Earlier manual repass also checked:

`/p1/topics/`, `/p3/topics/`, `/p1/topics/series/skill-check/`, `/p3/topics/algebra/field-guide/`, `/p3/topics/algebra/skill-check/`, and topic-level Exam Training routes.

## Automated Checks Added

- `scripts/check-static-site.mjs`
  - Scans generated `docs/` HTML visible body text for forbidden student-facing strings.
  - Keeps existing catalog and local image pair checks.

- `scripts/check-rendered-static-site.mjs`
  - Uses Playwright against generated `docs/` pages.
  - Verifies course landing pages are topic-first.
  - Verifies P1 Series and P3 Algebra Field Guides have guided study and one visible phase after JS initialization.
  - Verifies P3 Algebra Skill Check does not render `1 of 44`, shows a small set, and keeps one visible question card.
  - Verifies P3 Exam Training has a one-question flow and hidden mark scheme.

- `package.json`
  - `npm run static:check` now runs both static HTML checks and rendered Playwright checks.

## Remaining Issues

No blocking student-experience issues remain from this corrective pass.

Known content limitation: P1, M1, and S1 still use starter notes, but the visible copy is student-safe rather than internal review/admin language.

The old `/practice/` generated routes are still present for existing links, but the student-facing canonical path is now `/skill-check/`.

## Commands Run And Results

```bash
npm run build
```

Result: passed. `tsc -b && vite-node scripts/build-static-site.ts`; generated 211 static HTML pages in `docs/`.

```bash
npm run static:check
```

Result: passed. Catalog/image pair checks passed for P1, P3, M1, and S1. Static site check passed for 211 HTML pages. Rendered static page check passed.

```bash
npm test
```

Result: passed. 56 test files, 472 tests.

```bash
curl -sI http://localhost:4173/ | head -n 5
```

Result: preview server responded `HTTP/1.1 200 OK`.

```bash
node <<'NODE'
# Playwright screenshot and DOM-evidence capture against http://localhost:4173
# Captured the nine required screenshots and wrote browser-route-evidence.json.
NODE
```

Result: passed. Screenshots were written to `tools/content_lab/reports/student_experience_full_repass_2026_06_05_assets/`; DOM assertions passed for JS active, CSS loaded, no overflow, topic-first course pages, one visible Field Guide phase, Skill Check small set, and Exam Training one-question flow.

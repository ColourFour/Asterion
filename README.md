# Asterion

Asterion is a static CAIE 9709 study hub. Students first choose a course, then enter that course's study page. The initial course shells are:

- P1: Pure Mathematics 1
- P3: Pure Mathematics 3
- M1: Mechanics 1
- S1: Probability & Statistics 1

P3 is currently the most developed section. It keeps the existing image-first topic pages, Field Guides, Practice Questions, and Exam Training under `/p3/`. P1, M1, and S1 now have rapid draft seed topic pages so the multi-course site is navigable, but those pages are explicitly labelled as starter content that needs syllabus-contract review.

For P3, the question image and mark-scheme image remain the student-facing source of truth. Reviewed topic routing and the P3 skill map are the curriculum authority; OCR text, generated support content, local labels, and legacy labels are support metadata only.

## Current Shape

The production site is a static multi-page website:

```text
docs/index.html
docs/p1/index.html
docs/p1/topics/index.html
docs/p1/topics/quadratics/index.html
docs/p1/topics/quadratics/field-guide/index.html
docs/p1/topics/quadratics/practice/index.html
docs/p1/topics/binomial-expansion/index.html
docs/p3/index.html
docs/p3/topics/index.html
docs/p3/topics/algebra/index.html
docs/p3/topics/algebra/field-guide/index.html
docs/p3/topics/algebra/practice/index.html
docs/p3/topics/logarithms/index.html
docs/p3/topics/trigonometry/index.html
docs/p3/topics/argand/index.html
docs/p3/topics/calculus/index.html
docs/p3/topics/integration/index.html
docs/p3/topics/vectors/index.html
docs/p3/topics/iteration/index.html
docs/p3/topics/differential-equations/index.html
docs/p3/exam-training/index.html
docs/m1/index.html
docs/m1/topics/index.html
docs/m1/topics/forces-equilibrium/index.html
docs/m1/topics/forces-equilibrium/field-guide/index.html
docs/m1/topics/forces-equilibrium/practice/index.html
docs/m1/topics/newtons-laws-constant-acceleration/index.html
docs/m1/topics/newtons-laws-variable-acceleration/index.html
docs/s1/index.html
docs/s1/topics/index.html
docs/s1/topics/data-representation/index.html
docs/s1/topics/data-representation/field-guide/index.html
docs/s1/topics/data-representation/practice/index.html
docs/regions/index.html
docs/topics/algebra/index.html
docs/exam-training/index.html
```

Each P3 topic gets `field-guide/index.html` and `practice/index.html` under `/p3/topics/`. Each seeded P1/M1/S1 topic now gets the same three-page static pattern under its course prefix, plus a course-level `exam-training/index.html` placeholder. The unprefixed `/topics/...`, `/regions/`, and `/exam-training/` pages remain as P3 compatibility URLs, but the primary student flow starts at the course selector and routes courses through `/p1/`, `/p3/`, `/m1/`, and `/s1/`. The build currently writes 130 HTML pages in total.

P1/M1/S1 seed content lives in `src/data/courseSeedContent.ts`. It was drafted from the Cambridge International AS & A Level Mathematics 9709 syllabus headings for a fast audit pass. The [official Cambridge 9709 syllabus](https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf) remains the source of truth; a later syllabus-contract audit must verify topic coverage, wording, formula scope, and exam alignment before treating these pages as final.

Current draft seed topic sets:

- P1: Quadratics; Functions; Coordinate Geometry; Circular Measure; Trigonometry; Sequences and Series; Binomial Expansion; Differentiation; Integration.
- M1: Forces and Equilibrium; Kinematics; Momentum; Newton's Laws with Constant Acceleration; Newton's Laws with Variable Acceleration; Energy, Work and Power.
- S1: Representation of Data; Permutations and Combinations; Probability; Discrete Random Variables; The Normal Distribution.

The site does not require a backend, authentication, Supabase, a React router, an app shell, GitHub Actions deployment, or a GitHub Pages 404 restore script.

## Build

Install dependencies:

```bash
npm ci
```

Build the static site:

```bash
npm run build
```

Check the generated artifact:

```bash
npm run static:check
```

The build command runs TypeScript validation, then `scripts/build-static-site.ts` with `vite-node`. The generator reads the existing topic, Field Guide, generated-practice, teaching-snippet, and question-bank data, copies required static assets, and writes the final GitHub Pages site to `docs/`.

`docs/` is generated output and is committed intentionally because GitHub Pages is configured to deploy directly from the `main` branch `/docs` folder. Do not put source notes, project documentation, scripts, or app source files in `docs/`; source files belong in `src/`, build scripts belong in `scripts/`, and project configuration belongs at the repository root.

For local experiments that need a disposable `dist/` artifact:

```bash
npm run build:dist
```

## Local Preview

After building:

```bash
npm run preview
```

Open the Vite preview URL and test direct URLs such as:

```text
/
/p1/
/p1/topics/
/p1/topics/quadratics/
/p1/topics/binomial-expansion/
/p3/
/p3/topics/
/p3/topics/algebra/
/p3/topics/algebra/field-guide/
/p3/topics/algebra/practice/
/p3/exam-training/
/m1/
/m1/topics/
/m1/topics/forces-equilibrium/
/m1/topics/newtons-laws-variable-acceleration/
/s1/
/s1/topics/
/s1/topics/data-representation/
```

## GitHub Pages

GitHub Pages should deploy directly from the committed generated site in `docs/`. Use these repository settings:

```text
Source: Deploy from a branch
Branch: main
Folder: /docs
```

No GitHub Actions workflow is required to build, upload, or deploy the site. After `npm run build` has regenerated `docs/` and those files are committed, pushing `main` is enough for GitHub Pages to serve the latest static site.

### Base Path

No Vite `base` setting is required for normal GitHub Pages project deployment. Generated links, CSS, JavaScript, fonts, images, and JSON assets use relative paths, so a project URL such as:

```text
https://username.github.io/Asterion/
```

can serve nested pages such as:

```text
https://username.github.io/Asterion/p3/topics/algebra/practice/
```

because the matching `index.html` file exists and asset links resolve relative to that file.

## Local Progress

Progress is browser-local. The static pages use a small script at `docs/assets/static-study.js` to read and write `localStorage` under:

```text
asterion.progress.v1
```

Stored local data covers:

- Field Guide section completion
- focused Practice Questions completion
- self-marked exam question attempts
- Exam Training topic totals

Content is meaningful without JavaScript. JavaScript only enhances local completion buttons, mark saving, progress totals, and status text.

## Source Data

Runtime data lives under:

```text
public/assets/exam-bank-data/
public/data/teaching_snippets.json
public/data/generated_practice_bank.json
```

The exam-bank folder now has two Asterion-facing layers:

- `asterion_exam_bank_catalog_v1.json` is the full all-course catalog exported from Exam Bank for audit and planning. It currently covers P1, P3, M1, and S1 records.
- `asterion_question_bank_v1.json` is the reviewed student-runtime projection. It should contain only catalog records marked `student_runtime_safe=true` and `review_status=reviewed`.

The static generator reuses existing normalizers and selection helpers rather than duplicating routing or image path logic in page templates.

Historical Content Lab planning should not be stored in `docs/`, because that folder is now the committed GitHub Pages artifact.

P1, M1, and S1 draft seed pages are static study notes only. They do not create mastery evidence, attempt records, exam-bank mappings, or adaptive routing. Do not copy the P3 skill map or route evidence into another course as a shortcut; replace the seed notes with reviewed course-specific contracts when that audit is complete.

## Validation

Useful checks for this branch:

```bash
npm run build
npm run static:check
npm test -- src/tests/staticStudyRoutes.test.ts
git diff --check
rg -n "id=\"root\"|src/main\\.tsx|asterion\\.spa\\.redirect|404\\.html" docs
rg -n "\\bXP\\b|\\blevels?\\b|\\bgold\\b|avatars?|ranks?|rewards?|fantasy|world map|academy|teacher dashboard|admin|classroom" docs --glob "*.html"
```

The last two searches should return no matches for the generated student-facing HTML.

## Boundaries

This branch is the static study website branch. Do not add a backend, login flow, classroom dashboard, app-level routing, or dynamic progression mechanics to the production surface. If old implementation files remain in `src/`, they are historical code unless the static generator imports them for data normalization or content selection.

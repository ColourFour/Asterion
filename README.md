# Asterion

Asterion is a static, image-first CAIE 9709 Paper 3 study website. It builds real HTML files for the homepage, topic hubs, Field Guide pages, Practice Questions pages, and Exam Training, so direct refreshes work on GitHub Pages without a client-side router or a 404 fallback script.

The question image and mark-scheme image remain the student-facing source of truth. Reviewed topic routing and the P3 skill map are the curriculum authority; OCR text, generated support content, local labels, and legacy labels are support metadata only.

## Current Shape

The production site is a static multi-page website:

```text
docs/index.html
docs/regions/index.html
docs/topics/algebra/index.html
docs/topics/algebra/field-guide/index.html
docs/topics/algebra/practice/index.html
docs/topics/logarithms/index.html
docs/topics/trigonometry/index.html
docs/topics/argand/index.html
docs/topics/calculus/index.html
docs/topics/integration/index.html
docs/topics/vectors/index.html
docs/topics/iteration/index.html
docs/topics/differential-equations/index.html
docs/exam-training/index.html
```

Each topic also gets `field-guide/index.html` and `practice/index.html`. The build writes 30 HTML pages in total.

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
/regions/
/topics/algebra/
/topics/algebra/field-guide/
/topics/algebra/practice/
/exam-training/
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
https://username.github.io/Asterion/topics/algebra/practice/
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

The static generator reuses existing normalizers and selection helpers rather than duplicating routing or image path logic in page templates.

Historical Content Lab planning should not be stored in `docs/`, because that folder is now the committed GitHub Pages artifact.

## Validation

Useful checks for this branch:

```bash
npm run build
npm run static:check
npm test -- src/tests/staticStudyRoutes.test.ts
git diff --check
rg -n "id=\"root\"|src/main\\.tsx|asterion\\.spa\\.redirect|404\\.html" docs
rg -n "Guardian Challenge|Guardian|\\bXP\\b|\\blevels?\\b|\\bgold\\b|avatars?|ranks?|rewards?|fantasy|world map|academy|teacher dashboard|admin|classroom" docs --glob "*.html"
```

The last two searches should return no matches for the generated student-facing HTML.

## Boundaries

This branch is the static study website branch. Do not add a backend, login flow, classroom dashboard, app-level routing, or game mechanics to the production surface. If old implementation files remain in `src/`, they are historical code unless the static generator imports them for data normalization or content selection.

# Asterion

Asterion is a static, image-first CAIE 9709 Paper 3 study website. It builds real HTML files for the homepage, topic hubs, Field Guide pages, Practice Questions pages, and Exam Training, so direct refreshes work on GitHub Pages without a client-side router or a 404 fallback script.

The question image and mark-scheme image remain the student-facing source of truth. Reviewed topic routing and the P3 skill map are the curriculum authority; OCR text, generated support content, local labels, and legacy labels are support metadata only.

## Current Shape

The production site is a static multi-page website:

```text
dist/index.html
dist/regions/index.html
dist/topics/algebra/index.html
dist/topics/algebra/field-guide/index.html
dist/topics/algebra/practice/index.html
dist/topics/logarithms/index.html
dist/topics/trigonometry/index.html
dist/topics/argand/index.html
dist/topics/calculus/index.html
dist/topics/integration/index.html
dist/topics/vectors/index.html
dist/topics/iteration/index.html
dist/topics/differential-equations/index.html
dist/exam-training/index.html
```

Each topic also gets `field-guide/index.html` and `practice/index.html`. The build writes 30 HTML pages in total.

The site does not require a backend, authentication, Supabase, a React router, an app shell, `/docs` deployment, or a GitHub Pages 404 restore script.

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

The build command runs TypeScript validation, then `scripts/build-static-site.ts` with `vite-node`. The generator reads the existing topic, Field Guide, generated-practice, teaching-snippet, and question-bank data, copies required static assets, and writes the final site to `dist/`.

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

GitHub Pages should deploy from the generated `dist/` artifact. The workflow in `.github/workflows/pages.yml` runs:

```bash
npm ci
npm run build
npm run static:check
```

Then it uploads `dist/` with `actions/upload-pages-artifact` and deploys it with `actions/deploy-pages`.

Set the repository Pages source to GitHub Actions. Do not point Pages at `/docs`.

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

Progress is browser-local. The static pages use a small script at `dist/assets/static-study.js` to read and write `localStorage` under:

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

Historical Content Lab planning remains in `docs/phase-2-content-lab-gold-skill-packs.md`. That roadmap is content tooling context only; it is not a second paper-family expansion plan and does not change the static Paper 3 site surface.

## Validation

Useful checks for this branch:

```bash
npm run build
npm run static:check
npm test -- src/tests/staticStudyRoutes.test.ts
git diff --check
rg -n "id=\"root\"|src/main\\.tsx|asterion\\.spa\\.redirect|404\\.html" dist
rg -n "Guardian Challenge|Guardian|\\bXP\\b|\\blevels?\\b|\\bgold\\b|avatars?|ranks?|rewards?|fantasy|world map|academy|teacher dashboard|admin|classroom" dist --glob "*.html"
```

The last two searches should return no matches for the generated student-facing HTML.

## Boundaries

This branch is the static study website branch. Do not add a backend, login flow, classroom dashboard, app-level routing, or game mechanics to the production surface. If old implementation files remain in `src/`, they are historical code unless the static generator imports them for data normalization or content selection.

# Asterion

Asterion is a static CAIE 9709 Paper 3 study hub for GitHub Pages.

P3 is the product path. P1, M1, and S1 are visible only as support-only course entries and do not expose topic pages, Skill Checks, exam mappings, attempt storage, or progression systems on this branch.

For P3, the question image and mark-scheme image are the student-facing source of truth. Text extraction, labels, and route metadata support display and selection only.

## Install And Build

From a clean clone:

```bash
npm install
npm run build
```

The build verifies/restores the exam-bank runtime assets, type-checks the static source, and regenerates `docs/`.

Optional local checks:

```bash
npm test
npm run static:check
```

There is no `npm run lint` script on this branch.

## Maintainer Checklist

Use this branch as a static GitHub Pages product branch.

```bash
npm install
npm run build
npm test
npm run static:check
```

`npm run build` runs `npm run assets:sync`, TypeScript validation, and the static page generator. The generated GitHub Pages site comes from `docs/`; commit the regenerated `docs/` files with any source change that affects the site.

GitHub Pages should be configured to serve this repository from `/docs` on the target branch. Do not add a separate GitHub Actions Pages build/deploy workflow on this branch.

The large exam-bank image and JSON tree is intentionally ignored at `public/assets/exam-bank-data/`. Asset sync restores it from `asset-manifests/exam-bank-data.json`, which points at the versioned GitHub Release bundle and expected SHA256 values.

If asset sync fails:

```bash
npm run assets:sync
npm run assets:sync -- --force
```

If the network or GitHub release download fails, download the manifest bundle manually and rerun with:

```bash
ASTERION_EXAM_BANK_ASSET_BUNDLE=/path/to/asterion-exam-bank-data-v2026-06-08.tgz npm run assets:sync -- --force
```

If a checksum mismatch is reported, do not bypass it. Delete the bad bundle, confirm the manifest URL and SHA256, then retry.

## GitHub Pages Output

`docs/` is the canonical GitHub Pages output and is committed intentionally.

Do not add a competing GitHub Actions build/deploy workflow for Pages on this branch. Build locally, verify locally, then commit the regenerated `docs/` output with the source changes.

The site does not require a backend, authentication, Supabase, class codes, teacher/admin dashboards, a React app shell, or SPA fallback routing.

## Routes

Canonical P3 topic task routes:

```text
/p3/topics/<topic>/field-guide/
/p3/topics/<topic>/skill-check/
/p3/topics/<topic>/exam-training/
```

Static support route:

```text
/p3/topics/<topic>/worksheet/
```

Worksheet pages are print/PDF views of topic Skill Check items. They do not replace the interactive Skill Check route and do not create pass state.

The supported P3 topic slugs are:

```text
algebra
logarithmic-and-exponential-functions
trigonometry
differentiation
integration
numerical-solution-of-equations
vectors
differential-equations
complex-numbers
```

The build does not generate legacy unprefixed topic pages, `/regions/`, `/p3/regions/`, course-level `/p3/exam-training/`, topic hub pages, or `/practice/` compatibility pages.

## Static Teacher Support

The P3 Review page includes an `Export local progress CSV` action. It reads only `localStorage` data from the current browser and downloads a CSV; there is no account, cloud sync, class roster, or teacher dashboard.

CSV exports include available Skill Check attempts, Exam Training attempts, local learning activity rows, and derived Review candidates. Missing fields are left blank or marked `not_available`.

Printable worksheet pages use browser print / Save as PDF. Print styles hide navigation and buttons, show student/date lines, and leave working space under each question. Answers are not printed on the student worksheet.

## Source Data

Runtime source data lives in:

```text
public/assets/exam-bank-data/
public/data/generated_practice_bank.json
public/data/teaching_snippets.json
```

`public/assets/exam-bank-data/` is large runtime data and remains ignored in git. `npm run assets:sync` verifies the local folder or restores it from the asset manifest.

Application source belongs in `src/`, build scripts belong in `scripts/`, and generated Pages output belongs in `docs/`.

## Static Product Boundaries

Keep the branch boring and reproducible:

- no backend or auth flows
- no Supabase runtime code or dependencies
- no teacher/admin/classroom flows
- no game, lore, avatar, XP, or dynamic progression surface
- no P1/M1/S1 topic-page expansion until separate reviewed course contracts exist
- no duplicate route families unless a future compatibility task explicitly asks for them

Student-facing language should use exam-product terms such as Field Guide, Skill Check, Exam Training, Need to Know, Review, Practice, Self-marked, Ready, In progress, and Needs repair.

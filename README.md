# Asterion

Asterion is a static CAIE 9709 Pure Mathematics study hub for GitHub Pages.

P3 remains the launched product path and the root stays P3-first while P1 is gated. This branch contains the complete eight-topic P1 study surface for internal review, but P1 remains marked `coming-soon` until its 1,034-question archive review is complete. Changing P1 to `ready` activates the equal P1/P3 root chooser. M1 and S1 remain coming-soon placeholders.

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

Static top-level routes:

```text
/
/about/
/p1/
/p1/diagnostic/
/p1/topics/
/p1/exam-training/
/p1/need-to-know/
/p1/review/
/p1/content-qa/
/p3/
/m1/
/s1/
/p3/diagnostic/
/p3/repair-lane/
/p3/topics/
/p3/exam-training/
/p3/need-to-know/
/p3/review/
/p3/content-qa/
```

Canonical P3 topic task routes:

```text
/p3/topics/<topic>/learn/
/p3/topics/<topic>/field-guide/
/p3/topics/<topic>/skill-check/
/p3/topics/<topic>/exam-training/
```

P1 uses the same route shape for its eight official topics:

```text
/p1/topics/<topic>/learn/
/p1/topics/<topic>/field-guide/
/p1/topics/<topic>/skill-check/
/p1/topics/<topic>/exam-training/
/p1/topics/<topic>/worksheet/
```

P1 Exam Training is intentionally empty until a question is explicitly reviewed, marked `student_runtime_safe`, assigned reviewed topic and atomic-skill evidence, and promoted through `scripts/course-topic-packet-review.mjs`. The versioned review projection pins all 1,034 packet records, manifests, source commit, and question/mark-scheme image hashes without treating packet approval as Asterion review.

Static support route:

```text
/p3/topics/<topic>/worksheet/
```

Worksheet pages are print/PDF views of topic Skill Check items. They do not replace the interactive Skill Check route and do not create pass state.

`/p3/topics/<topic>/field-guide/` is a compatibility bridge to the current Learn experience. New student-facing navigation should prefer `/learn/`.

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

The build does not generate legacy unprefixed topic pages, `/regions/`, `/p3/regions/`, topic hub pages, or `/practice/` compatibility pages.

`docs/static-pages.json` is the generated manifest for the current static page contract. As of this update it reports 72 student-runtime questions and 1301 catalog records.

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

Current static-facing source is generated from `scripts/build-static-site.ts`, `src/static-study/static-study.js`, `src/static-study/static-study.css`, and the data/utilities imported by the generator. Static browser progress is stored locally under `asterion.progress.v1`.

## Cleanup Inventory

These pieces are in the repo but do not directly face the generated static pages today. Treat them as cleanup/audit candidates, not deletion instructions:

- `.agent-loop/`, `.agent-runs/`, and `agentic-loop-template/`: agent workflow infrastructure and historical run artifacts.
- `.agents/skills/supabase*`: local agent skills only; not product code and not a Supabase runtime dependency.
- `reports/` and `audit-artifacts/`: dated audits, screenshots, and generated review artifacts. They are historical evidence unless a current task explicitly refreshes them.
- `tools/content_lab/`: internal, local-first content pipeline. Runtime pages consume reviewed JSON outputs in `public/data/`, not the tool scripts or reports directly.
- `content-model/`: source/reference PDFs. They are not copied into the static page route set.
- `src/lib/localExamAttempts.ts`, `src/lib/progressCsvExport.ts`, `src/lib/p3ProgressionPaths.ts`, `src/lib/quickCheckAnswer.ts`, `src/skill-checks/reviewSessions.ts`, and related tests: useful contracts/parity coverage, but the emitted static browser behavior is currently implemented in `src/static-study/static-study.js`.
- `src/data/unitImprovementAgents.ts` and `src/data/unitImprovementReports.ts`: improvement-loop/report data, not student route data.

Before removing any of these, prove the static generator, tests, and `docs/` output no longer depend on them.

## Static Product Boundaries

Keep the branch boring and reproducible:

- no backend or auth flows
- no Supabase runtime code or dependencies
- no teacher/admin/classroom flows
- no game, lore, avatar, XP, or dynamic progression surface
- no M1/S1 topic-page expansion until separate reviewed course contracts exist
- no P1 launch or root-page promotion until all eight course and archive launch gates pass
- no duplicate route families unless a future compatibility task explicitly asks for them

Student-facing language should use exam-product terms such as Field Guide, Skill Check, Exam Training, Need to Know, Review, Practice, Self-marked, Ready, In progress, and Needs repair.

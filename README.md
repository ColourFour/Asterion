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

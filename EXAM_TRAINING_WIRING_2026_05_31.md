# Exam Training Wiring 2026-05-31

## Data Inspected

- `public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json`
- `public/assets/exam-bank-data/asterion_question_bank_v1.json`
- `public/assets/exam-bank-data/question_bank.json`
- `public/assets/exam-bank-data/question_bank.topic_routing.v1.json`
- `public/assets/exam-bank-data/` image directories

## Course Record Counts

| Course | Catalog records | Metadata image pairs | Local image pairs found | Reviewed runtime records |
| --- | ---: | ---: | ---: | ---: |
| P1 | 401 | 401 | 401 | 0 |
| P3 | 396 | 396 | 396 | 57 |
| M1 | 258 | 258 | 258 | 0 |
| S1 | 246 | 246 | 246 | 0 |

Previous count before crop directories were added: P1 `0`, M1 `0`, S1 `0` local image pairs. Current count after adding crop directories: P1 `401`, M1 `258`, S1 `246`.

The newly added crop directories were found at:

- `public/assets/exam-bank-data/p1/`
- `public/assets/exam-bank-data/p4/`
- `public/assets/exam-bank-data/p5/`

These match the catalog path families directly. M1 uses catalog paper family `p4`; S1 uses catalog paper family `p5`. No guessed `m1/` or `s1/` path translation was needed.

## Routes Wired

- Course-level Exam Training pages:
  - `p1/exam-training/index.html`
  - `p3/exam-training/index.html`
  - `m1/exam-training/index.html`
  - `s1/exam-training/index.html`
- Topic-level Exam Training pages:
  - P1: 9 draft seed topic routes
  - P3: 9 reviewed topic routes, plus legacy unprefixed compatibility routes
  - M1: 6 draft seed topic routes
  - S1: 5 draft seed topic routes

Course dashboards, topic cards, seed topic hubs, and seed practice pages now link into these Exam Training routes.

## Current Output

- P3 still uses `asterion_question_bank_v1.json`, the reviewed student-runtime projection, for visible image-first Exam Training cards.
- P3 topic Exam Training pages include real question and mark-scheme image cards.
- P1/M1/S1 use the catalog and topic-routing sidecar for image-first static Exam Training cards, while still carrying review-needed warnings.
- Course-level generated pages now show real image cards for P1, P3, M1, and S1.
- P1 `binomial-expansion` currently has no matching topic-routing records in the sidecar, so its topic-level Exam Training page remains an honest empty state.
- M1 constant-acceleration and variable-acceleration seed topics both map to the current broad `9709_m1_topic_newtons_laws_of_motion` route.

Representative generated page card counts after rebuild:

| Page | Question cards |
| --- | ---: |
| `docs/p1/exam-training/index.html` | 12 |
| `docs/p3/exam-training/index.html` | 12 |
| `docs/m1/exam-training/index.html` | 12 |
| `docs/s1/exam-training/index.html` | 12 |
| `docs/p1/topics/quadratics/exam-training/index.html` | 16 |
| `docs/p3/topics/algebra/exam-training/index.html` | 2 |
| `docs/m1/topics/forces-equilibrium/exam-training/index.html` | 16 |
| `docs/s1/topics/probability/exam-training/index.html` | 16 |

Topic-level generated card counts:

- P1: all seeded topics with route matches show cards except `binomial-expansion`, which has 0 route matches.
- P3: all 9 reviewed topic pages show cards.
- M1: all 6 seeded topic pages show cards.
- S1: all 5 seeded topic pages show cards.

## Path-Resolution Update

No application path-resolution fix was required after the crop directories were added. The existing catalog-based resolver found the new files because their paths match `question_image_path` and `mark_scheme_image_path`.

The static checker was updated to:

- print catalog record and local image-pair counts for P1, P3, M1, and S1;
- fail if a course has local image pairs but its course-level Exam Training page has no generated image cards;
- keep the existing missing-image-reference check so broken `<img>` references are not suppressed.

## Caveats

- P3 remains the reliable, reviewed course.
- P1/M1/S1 routing is rough sidecar routing, not a reviewed syllabus contract.
- Non-P3 routing is not wired into mastery, adaptive selection, unlocks, or official progress evidence.
- Missing or unmatched topic-routing records still produce honest empty states.

## Validation

- `npm run build` passed and generated 168 static HTML pages.
- `npm run static:check` passed, including focused checks for course/topic Exam Training routes, exam-bank image references, P3 question/mark-scheme cards, and per-course local image-pair counts.
- `npm test` passed: 56 test files, 462 tests.
- `git diff --check` passed.

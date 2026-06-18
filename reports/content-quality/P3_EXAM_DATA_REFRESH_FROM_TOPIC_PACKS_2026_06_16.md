# P3 Exam Data Refresh From Topic Packs - 2026-06-16

## Source
- Source repo used: `/Users/sbrooker/repos/exam-bank-pipeline`
- Topic-packet directory used: `/Users/sbrooker/repos/exam-bank-pipeline/output/topic_packets`
- P3 topic-packet files inspected:
  - `p3/algebra/manifest.json` and `topic_packet.pdf`
  - `p3/complex_numbers/manifest.json` and `topic_packet.pdf`
  - `p3/differential_equations/manifest.json` and `topic_packet.pdf`
  - `p3/differentiation/manifest.json` and `topic_packet.pdf`
  - `p3/integration/manifest.json` and `topic_packet.pdf`
  - `p3/logarithmic_and_exponential_functions/manifest.json` and `topic_packet.pdf`
  - `p3/numerical_solution_of_equations/manifest.json` and `topic_packet.pdf`
  - `p3/trigonometry/manifest.json` and `topic_packet.pdf`
  - `p3/vectors/manifest.json` and `topic_packet.pdf`
- P3 packet records inspected: 396 included question records.
- Durable Asterion import artifact: `src/data/p3_exam_training_topic_pack_refresh_2026_06_16.json`
- Converter: `scripts/refresh-p3-exam-training-from-topic-packs.mjs`

## Source Fields Available
Manifest-level fields included schema/version, generated time, paper family, topic id/label, packet mode/level, question/answer counts, included/skipped ids, source image paths, source mark-scheme image paths, warning counts, PDF output metadata, and page layout metadata.

Per included record, the topic packs exposed:
- `question_id`, `source_label`, `paper`, `source_paper_code`, `question_number`, `marks`
- `question_image_paths`, `mark_scheme_image_paths`, `answer_available`
- `warnings`, `review_reasons`, `review_status_marker`, `review_decision_action`
- `reviewed_topic`, `reviewed_subtopic`, `reviewed_skill`
- question/answer page placement estimates

The topic packs did not contain complete question text or mark-scheme text. Asterion cross-referenced the local catalog JSON for metadata and used the canonical question/mark-scheme images as the student-facing source of truth.

## Import Rules Used
Records were promoted only when:
- The packet topic mapped clearly to one Asterion P3 slug.
- The existing topic-routing sidecar agreed with that slug.
- The question crop and mark-scheme crop existed in `public/assets/exam-bank-data`.
- A human visual check found the question and mark-scheme image pair readable enough for student self-marking.
- The record had enough source identity to identify the paper and question.
- The record was useful for a topic-specific Exam Training page.
- No internal QA language was exposed to students.

Promoted records are image-first and use `self_marking_mode: coarse_image_mark_scheme` in import provenance. Mark-scheme OCR was not trusted for new tickable mark points in this pass; imported subpart mark-scheme text is suppressed from automatic tick-box generation until a later mark-point review.

Rejected/deferred records included records with ambiguous or mixed routing, text-only/OCR failures, low-confidence crops requiring upstream review, missing/null route records, and records that were already covered or not clearly better than current visible records.

## Topic Mapping
- `algebra` -> `algebra`
- `integration` -> `integration`
- `numerical_solution_of_equations` -> `numerical-solution-of-equations`
- `vectors` -> `vectors`
- `trigonometry` -> `trigonometry`
- Other topic packs were inspected but not imported because they were already full, not clearly better, or failed the conservative promotion rules.

## Before / After Visible Exam Training Counts
| Topic | Before | After |
| --- | ---: | ---: |
| Algebra | 2 | 6 |
| Logarithmic and Exponential Functions | 6 | 6 |
| Trigonometry | 4 | 6 |
| Differentiation | 8 | 8 |
| Integration | 3 | 6 |
| Numerical Solution of Equations | 3 | 6 |
| Vectors | 3 | 6 |
| Differential Equations | 8 | 8 |
| Complex Numbers | 8 | 8 |

## Records Added
| Topic | Added records |
| --- | --- |
| Algebra | `31summer23_q03`, `32autumn23_q03`, `32spring23_q03`, `32spring24_q01` |
| Integration | `31autumn21_q04`, `32summer21_q04`, `33summer23_q07` |
| Numerical Solution of Equations | `31summer23_q09`, `32spring24_q07`, `33summer23_q05` |
| Vectors | `31summer24_q09`, `32spring24_q09`, `32summer23_q11` |
| Trigonometry | `32spring23_q06`, `32spring24_q08` |

Total net new Exam Training runtime records: 15.

## Records Updated
No pre-existing visible Asterion runtime record was replaced. The overlay applies reviewed topic-pack provenance and routing metadata to the 15 promoted records only.

## Not Promoted / Rejected Or Deferred By Topic
These counts are "not promoted in this pass", not permanent deletion decisions. Many records remain useful upstream candidates after crop/OCR/review repair.

| Packet topic | Inspected | Imported | Not promoted | Main grouped reasons |
| --- | ---: | ---: | ---: | --- |
| Algebra | 55 | 4 | 51 | 48 low question-crop confidence, 46 degraded text, 2 text-only failures, 2 mixed/ambiguous routes |
| Logarithmic and Exponential Functions | 37 | 0 | 37 | 30 low question-crop confidence, 37 degraded text, 2 text-only failures, 2 mixed/ambiguous routes; no clearly better graph/model balance found |
| Trigonometry | 39 | 2 | 37 | 33 low question-crop confidence, 37 degraded text, 2 text-only failures, 2 mixed/ambiguous routes |
| Differentiation | 51 | 0 | 51 | Already full; 37 low question-crop confidence, 51 degraded text, 3 text-only failures, 13 mixed/ambiguous routes |
| Integration | 44 | 3 | 41 | 37 low question-crop confidence, 41 degraded text, 1 text-only failure, 10 mixed/ambiguous routes |
| Numerical Solution of Equations | 36 | 3 | 33 | 25 low question-crop confidence, 33 degraded text, 1 text-only failure, 9 mixed/ambiguous routes |
| Vectors | 37 | 3 | 34 | 30 low question-crop confidence, 34 degraded text, 2 text-only failures, 1 mixed/ambiguous route |
| Differential Equations | 36 | 0 | 36 | Already full; 23 low question-crop confidence, 36 degraded text, 1 text-only failure, 2 mixed/ambiguous routes |
| Complex Numbers | 61 | 0 | 61 | Already full; 44 low question-crop confidence, 61 degraded text, 3 text-only failures, 2 mixed/ambiguous routes |

Representative deferred examples:
- Mixed or ambiguous topic fit: `33summer21_q04`, `33summer21_q08`, `32spring23_q08`, `33autumn24_q06`, `32autumn21_q11`.
- Text/crop repair needed upstream: `32spring21_q06`, `31summer21_q04`, `32spring21_q09`, `32spring21_q03`, `32spring21_q07`.
- Already covered or not clearly better for this pass: full Differentiation, Differential Equations, and Complex Numbers pages.

## Mark-Point vs Coarse Counts After Import
- Imported records: 0 tickable mark-point records, 15 honest coarse/image mark-scheme records.
- Visible Exam Training pages after build: 31 records with tickable mark-point controls, 29 records without tickable mark points.
- Imported records intentionally avoid OCR-derived tick boxes until mark points are reviewed.

## Records Hidden By The Eight-Question Cap
Computed from the same normalized trainable-question filter used by static generation:
- Differentiation: 1 hidden by cap.
- Complex Numbers: 4 hidden by cap.
- All other P3 topic pages: 0 hidden by cap after this refresh.

## Topics Still Below Target
None of the priority targets remain below 6 visible questions:
- Algebra: 6
- Integration: 6
- Numerical Solution of Equations: 6
- Vectors: 6
- Trigonometry: 6

Logarithmic and Exponential Functions stays at 6. No better-balanced graph/model imports were promoted because candidate records still carried degraded text/crop review flags and did not clearly improve the current page.

## Human Review Still Needed
No imported record blocks runtime use. Follow-up review is still useful for:
- upstream crop confidence and OCR repair in `exam-bank-pipeline`;
- reviewed mark-point extraction for the 15 imported records if Asterion wants tickable mark points later;
- mixed-topic packet records where a subpart-level route could be useful but was too ambiguous for a topic-specific page in this pass.

## Verification
Commands run:
- `node scripts/refresh-p3-exam-training-from-topic-packs.mjs`
- `npm run assets:sync`
- `npm test`
- `npm run build`
- `npm run static:check`

Results:
- `npm test`: 13 test files passed, 138 tests passed.
- `npm run build`: passed; generated 55 static HTML pages in `docs/`.
- `npm run static:check`: passed static site, rendered static page, and P3 Learn Mode interaction checks.

Manual browser verification on `http://127.0.0.1:4173/`:
- Opened Algebra, Integration, Numerical Solution of Equations, Vectors, and Trigonometry Exam Training pages.
- Confirmed each page renders 6 unique question ids.
- Confirmed imported first-step support is problem-specific.
- Confirmed no internal QA/source warning language is visible.
- Confirmed visible imported question and mark-scheme images load after reveal.
- Confirmed coarse self-marking is labelled honestly.
- Confirmed an existing tickable mark-point record still shows tick boxes.
- Saved a self-marked attempt and confirmed the visible status says Checked Practice is still required for mastery.

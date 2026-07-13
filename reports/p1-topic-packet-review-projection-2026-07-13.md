# P1 topic-packet review projection

This snapshot inventories the eight Pure Mathematics 1 topic-packet manifests from the sibling `exam-bank-pipeline` repository without modifying that repository or treating packet placement as an Asterion curriculum review.

## Pinned source

- Source repository: `exam-bank-pipeline`
- Source HEAD: `1feccb180fcbb9f16b3e705682e5cc3636e41506`
- Projection: `src/data/p1ExamBankReviewProjection.json`
- Contract wrapper: `src/data/p1ExamBankReviewProjection.ts`
- Tool: `scripts/course-topic-packet-review.mjs`

The projection stores each manifest's schema, generation timestamp, projection fingerprint, SHA-256, normalized record identities, and SHA-256 fingerprints for every listed question and mark-scheme image. Every record begins with Asterion disposition `hold`, review status `pending`, and `student_runtime_safe=false`.

The sibling repository currently has unrelated worktree changes. It is never treated as curriculum or runtime state: the projection pins its HEAD and fingerprints every consumed manifest and image, `verify` rejects drift, and promotion copies only explicitly reviewed records through the versioned overlay.

Post-snapshot verification correctly failed after the ignored source image `pm1/pm1_2018_s18_13_ms_q01_markscheme.png` changed at 12:13 on 2026-07-13. The frozen projection retains SHA-256 `30d57151…`; the later source file has SHA-256 `d405bd64…`. The projection was deliberately not refreshed from that actively changing worktree. Any future refresh must be an explicit new snapshot/version followed by visual review; promotion from this snapshot remains blocked while the drift exists.

## Current inventory

| Syllabus section | Topic | Records | Source packet approved | Source review required |
| --- | --- | ---: | ---: | ---: |
| 1.1 | Quadratics | 69 | 30 | 39 |
| 1.2 | Functions | 139 | 62 | 77 |
| 1.3 | Coordinate geometry | 101 | 41 | 60 |
| 1.4 | Circular measure | 101 | 31 | 70 |
| 1.5 | Trigonometry | 129 | 44 | 85 |
| 1.6 | Series | 208 | 91 | 117 |
| 1.7 | Differentiation | 162 | 60 | 102 |
| 1.8 | Integration | 125 | 51 | 74 |
| **Total** |  | **1,034** | **410** | **624** |

“Source packet approved” is source provenance only. It does not mean Asterion-reviewed or student-runtime-safe. None of the 1,034 records is promoted by this snapshot.

## Review and promotion workflow

Create or refresh a pinned snapshot:

```sh
node scripts/course-topic-packet-review.mjs snapshot \
  --course p1 \
  --source-repo ../exam-bank-pipeline \
  --output src/data/p1ExamBankReviewProjection.json
```

Verify the source repository HEAD, manifest SHA-256 values, fingerprints, identities, and provenance before review or promotion:

```sh
node scripts/course-topic-packet-review.mjs verify \
  --source-repo ../exam-bank-pipeline \
  --projection src/data/p1ExamBankReviewProjection.json
```

After an Asterion reviewer explicitly records `disposition=promote`, `review_status=reviewed`, `student_runtime_safe=true`, a reviewed P1 topic, at least one reviewed skill ID, reviewer, and review timestamp, build a separate overlay:

```sh
node scripts/course-topic-packet-review.mjs promote \
  --source-repo ../exam-bank-pipeline \
  --projection src/data/p1ExamBankReviewProjection.json \
  --catalog public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json \
  --source-bank ../exam-bank-pipeline/output/json/question_bank.json \
  --asset-root public/assets/exam-bank-data \
  --output src/data/p1ExamTrainingPromotionOverlay.json
```

Promotion fails on source HEAD, manifest drift, image fingerprint drift, duplicate question IDs, missing source records, mismatched course identity, absent canonical question/mark-scheme assets, missing reviewed topic, or missing reviewed skill evidence. Difficulty metadata is not a promotion input.

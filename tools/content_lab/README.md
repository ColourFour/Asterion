# Asterion Content Lab

Content Lab is an internal, local-first pipeline for mining curriculum evidence from the existing exam bank. It is not part of the browser runtime and must not mutate `public/data/question_bank.json`.

## Boundary

- Input evidence: `public/data/question_bank.json`
- Generated internal outputs: `tools/content_lab/outputs/`
- Runtime-reviewed content: `public/data/teaching_snippets.json` and `public/data/generated_practice_bank.json`
- Browser runtime: consumes only reviewed static JSON from `public/data/`
- No LLM calls, hosted review UI, generated exam clones, auth, remote storage, or browser-side mining

## Batch 1 Commands

Build deterministic skill-target candidates and a review queue:

```bash
python3 tools/content_lab/scripts/build_skill_targets.py
```

Verify generated outputs and reviewed runtime snippets:

```bash
python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

Both scripts use only the Python standard library.

## Batch 3 Commands

Build deterministic generated warm-up practice:

```bash
python3 tools/content_lab/scripts/build_generated_practice.py \
  --skill-targets tools/content_lab/outputs/skill_targets.json \
  --snippets public/data/teaching_snippets.json \
  --output tools/content_lab/outputs/generated_practice_bank.json \
  --runtime-output public/data/generated_practice_bank.json
```

The generated practice script writes all generated items to `tools/content_lab/outputs/generated_practice_bank.json`, then writes only reviewed/published and verification-passing items to `public/data/generated_practice_bank.json`.

## Source Eligibility

Each source record is classified as one of:

- `auto_eligible`: trusted enough to support internal skill-target extraction
- `review_only`: usable evidence, but risky enough that it should not be auto-used
- `blocked`: not suitable for automatic use

Records are `auto_eligible` only when validation and mapping pass, question text trust is high or medium, mark-scheme text exists, a topic exists, topic confidence is high or medium when present, text-only status is ready or review, and no severe blocking flags are present.

Records are `blocked` when validation or mapping fails, text trust is low or unusable, text-only or visual curation status fails, mark-scheme text is missing, or severe flags indicate math corruption, unreliable text order, incomplete scope, or mark-total mismatch.

Records become `review_only` when they are not blocked but still need human attention, including visual-required records, flattened or degraded math, uncertain topics, or other review-risk flags.

## Outputs

`skill_targets.json` contains generated internal candidates:

- `skill_target_id`
- `paper_family`
- `topic`
- `title`
- `student_goal`
- `micro_skills`
- `source_question_ids`
- `confidence`
- `review_status`

`review_queue.json` contains records that were not auto-eligible, with deterministic reasons.

`content_lab_report.json` summarizes source counts, eligibility counts, skill-target coverage by paper family and topic, review-queue reasons, source topics without skill targets, and skill targets that do not yet have reviewed snippets.

`public/data/teaching_snippets.json` contains only original reviewed teaching content with `review_status` set to `teacher_reviewed` or `published`. It must not contain copied exam questions.

`generated_practice_bank.json` contains original deterministic warm-up items, not exam clones. Runtime items must have `review_status` set to `teacher_reviewed` or `published` and `verification.status` set to `pass`.

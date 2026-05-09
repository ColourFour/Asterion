# Asterion Content Lab

Content Lab is an internal, local-first pipeline for turning exam-bank evidence into reviewed teaching support. It is not part of the browser runtime and must not mutate `public/data/question_bank.json`.

## Boundary

- Input evidence: `public/data/question_bank.json`
- Internal outputs: `tools/content_lab/outputs/`
- Runtime-reviewed content: `public/data/teaching_snippets.json` and `public/data/generated_practice_bank.json`
- Browser runtime: consumes only reviewed static JSON from `public/data/`
- No LLM calls, hosted review UI, generated exam clones, auth, remote storage, or browser-side mining

## Current Commands

Build deterministic skill targets, review queue, and coverage report:

```bash
python3 tools/content_lab/scripts/build_skill_targets.py \
  --input public/data/question_bank.json \
  --output tools/content_lab/outputs/skill_targets.json \
  --review-output tools/content_lab/outputs/review_queue.json
```

Build deterministic generated warm-up practice:

```bash
python3 tools/content_lab/scripts/build_generated_practice.py \
  --skill-targets tools/content_lab/outputs/skill_targets.json \
  --snippets public/data/teaching_snippets.json \
  --output tools/content_lab/outputs/generated_practice_bank.json \
  --runtime-output public/data/generated_practice_bank.json
```

Verify generated outputs and reviewed runtime artifacts:

```bash
python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

All scripts use only the Python standard library.

## Source Eligibility

Each source record is classified as one of:

- `auto_eligible`: trusted enough to support internal skill-target extraction
- `review_only`: usable evidence, but risky enough that it should not be auto-used
- `blocked`: not suitable for automatic use

Records are `auto_eligible` only when validation and mapping pass, question text trust is high or medium, mark-scheme text exists, a topic exists, topic confidence is high or medium when present, text-only status is ready or review, and no severe blocking flags are present.

Records are `blocked` when validation or mapping fails, text trust is low or unusable, text-only or visual curation status fails, mark-scheme text is missing, or severe flags indicate math corruption, unreliable text order, incomplete scope, or mark-total mismatch.

Records become `review_only` when they are not blocked but still need human attention, including visual-required records, flattened or degraded math, uncertain topics, or other review-risk flags.

## Outputs

`skill_targets.json` contains generated internal curriculum targets:

- `skill_target_id`
- `paper_family`
- `topic`
- `title`
- `student_goal`
- `micro_skills`
- `likely_prerequisites`
- `common_misconceptions`
- `assessed_by_source_question_ids`
- `source_mark_scheme_patterns`
- `confidence`
- `review_status`

`review_queue.json` contains records that were not auto-eligible, with deterministic reasons.

`content_lab_report.json` summarizes source counts, eligibility counts, active-region coverage, skill-target coverage by paper family and topic, review-queue reasons, source topics without skill targets, topics with no reviewed snippets, warm-up gaps, Guardian readiness metadata gaps, generator family counts, and verification failure counts.

`public/data/teaching_snippets.json` contains original reviewed teaching content with `review_status` set to `teacher_reviewed` or `published`. It must not contain copied exam questions.

`generated_practice_bank.json` contains original deterministic warm-up items, not exam clones. Runtime items must have `review_status` set to `teacher_reviewed` or `published` and `verification.status` set to `pass`.

## Current Runtime Coverage

- 34 reviewed teaching snippets
- 34 Quick Checks
- 30 reviewed generated warm-ups
- all active P3 regions have reviewed snippet and Quick Check coverage
- generated warm-ups currently cover Algebra Vault, Logarithm Observatory, Trigonometry Spire, and partial-fractions support that also appears in Integral Terraces

Current generator families:

- `logarithms_and_exponentials.log_equation_basic`
- `binomial_expansion.first_terms_and_coefficient`
- `algebra.binomial_validity_range`
- `algebra.modulus_equation_basic`
- `algebra.partial_fractions_distinct_linear`
- `algebra.partial_fractions_repeated_linear`
- `trigonometry.identity_rewrite_basic`
- `trigonometry.double_angle_basic`
- `trigonometry.solve_equation_interval_basic`
- `trigonometry.r_form_basic`

Next useful generator families should target differentiation, integration, vectors, numerical methods, differential equations, and complex numbers, but only when the deterministic generator structure can stay small and verification-gated.

## Review Rules

Runtime-visible teaching snippets must be compact, original, student-friendly, and reviewed. They should support the product flow:

```text
Understand the idea -> try a small check -> practice safely -> face the Guardian
```

Runtime-visible generated practice must:

- have a clear original prompt
- have an exact/simple answer
- include worked-solution steps
- record deterministic parameters
- pass deterministic verification
- link to topic/region metadata
- link to skill targets and snippets where possible

Candidate, blocked, review-only, or failed-verification generated practice must not appear in `public/data/generated_practice_bank.json`.

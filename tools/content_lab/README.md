# Asterion Content Lab

Content Lab is an internal, local-first pipeline for turning exam-bank evidence into reviewed teaching support. It is not part of the browser runtime and must not mutate `public/data/question_bank.json`.

## Boundary

- Input evidence: `public/data/question_bank.json`
- Internal outputs: `tools/content_lab/outputs/`
- Review reports: `tools/content_lab/reports/`
- Runtime-reviewed content: `public/data/teaching_snippets.json` and `public/data/generated_practice_bank.json`
- Browser runtime: consumes only reviewed static JSON from `public/data/`
- No LLM calls, hosted review UI, generated exam clones, auth, remote storage, or browser-side mining

The active release is **Content Lab Worked Examples v1 / Question-to-Lesson Pass**. The teaching/generated-practice schema contract is v2. The worked-example content model is v1. The new fields remain optional in the schema/runtime contract so legacy content loads, but the verifier requires them for the first publishing batch.

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

Build the reviewed P3 skill-map coverage dashboard:

```bash
npm run validate:p3-skill-map
```

Build the deterministic P3 content inventory:

```bash
npm run inventory:p3-content
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

`public/data/teaching_snippets.json` contains original reviewed teaching content with `review_status` set to `teacher_reviewed` or `published`. It must not contain copied exam questions or claim that generated text is official exam wording.

`generated_practice_bank.json` contains original deterministic warm-up items, not exam clones. Runtime items must have `review_status` set to `teacher_reviewed` or `published` and `verification.status` set to `pass`.

`tools/content_lab/skill_maps/caie_9709_p3_skill_map.json` contains the reviewed internal P3 micro-skill map. Its `curriculum_targets` block locks the active primary target to CAIE 9709 Pure Mathematics 3 for 2026-2027, with CAIE 9709 Pure Mathematics 1 recorded only as prerequisite support. `npm run validate:p3-skill-map` writes the deterministic, reviewable report to `tools/content_lab/reports/p3_skill_coverage_report.json`, summarizing snippet, Quick Check, generated warm-up, canonical-question, curriculum-role, prerequisite-reference, and high-evidence weak-support gaps for Content Lab readiness. The report is intentionally kept in version control as a stable review artifact.

`npm run inventory:p3-content` writes `tools/content_lab/reports/p3_content_inventory_report.json`. This report inventories the current P3 learning loop by region and by reviewed skill: Field Guides, snippets, worked examples, Quick Checks, generated warm-ups, canonical P3 question evidence, Guardian candidates, teacher/export curriculum tags, structural reference warnings, and next-step gaps. It differs from the P3 skill-map coverage report by answering "what exists and where does it connect?" rather than only "does each reviewed skill have minimum coverage categories?"

The inventory also reads `tools/content_lab/reviews/p3_app_region_routing_audit.json` when classifying app-region routing mismatches. Corrected audit entries are reported as resolved; audited ambiguous entries remain visible as teacher-review routing items; active mismatches with no audit entry remain structural warnings. App labels and DeepSeek labels are metadata signals only, and do not override the reviewed P3 skill-map region for mastery evidence.

Inventory status labels are conservative:

- `ready`: every required support type is present and safely mapped.
- `partial`: at least one support type exists, but one or more required support types are missing.
- `missing`: no required instructional support type is available.
- `needs_review`: the reviewed skill or mapping is explicitly marked for teacher review.
- `blocked`: the curriculum role or mastery policy prevents the item from being treated as P3 mastery support.

Missing snippets, worked examples, Quick Checks, and warm-ups are ordinary content gaps for later phases. Unknown region IDs, unknown reviewed skill refs, malformed curriculum refs, P1 evidence used as P3 mastery evidence, untrainable canonical mastery evidence, or malformed routing-audit references are structural contract violations and make the inventory command exit nonzero.

P3 skill contract metadata:

- `curriculum_role` classifies the skill as `p3_core`, `bridge`, `p1_prerequisite`, `ambiguous`, or `out_of_scope`.
- `mastery_eligible` says whether canonical P3 exam-question evidence may count toward P3 mastery for that skill.
- `prerequisite_skill_refs` records stable P1 support references such as `algebraic_manipulation` or `differentiation_basics`; these are readiness support, not P3 coverage.
- `prerequisite_notes` gives room for reviewer context without changing the stable references.
- `needs_teacher_review` flags ambiguous or unsafe curriculum cases before they can be treated as trusted.

P3 mastery evidence must come from mastery-eligible P3 contract skills backed by canonical question and mark-scheme image pairs. P1 prerequisite support, Quick Checks, warm-ups, Field Guides, snippets, and worked examples may support readiness, but they do not prove P3 mastery by themselves.

Worked Examples v1 fields:

- worked examples may include `question_type`, `key_method`, `exam_move`, `source_question_ids`, `source_question_asset_ids`, and `source_mark_scheme_asset_ids`
- Quick Checks may include `example_model_id`
- generated warm-ups may include `question_type`, `key_method`, and `exam_move`

The first batch requires those fields for Logarithm Observatory, Algebra Vault, and Trigonometry Spire. Legacy content outside the batch may omit them.

## Current Runtime Coverage

Coverage counts are generated by the verifier output, not maintained by hand:

```bash
python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

As of 2026-05-09:

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
- link to worked examples through `example_model_id` in the first batch
- use valid MathText delimiter syntax with `$...$` and `$$...$$`

Candidate, blocked, review-only, or failed-verification generated practice must not appear in `public/data/generated_practice_bank.json`.

Reviewed means:

- math correctness
- alignment to the canonical mark scheme
- no unsupported exam claims
- valid MathText syntax
- clear learner-facing steps
- correct linkage to snippet, check, warm-up, source-question, and canonical asset IDs

Phase 1 publishing gate:

- only Logarithm Observatory, Algebra Vault, and Trigonometry Spire are enforced
- every method/concept/mistake-repair snippet in those regions needs at least one worked example
- every first-batch worked example needs source traceability to canonical question and mark-scheme assets
- every first-batch Quick Check and warm-up needs a valid `example_model_id`

Phase 2 expands the same rule to every P3 region after Phase 1 passes.

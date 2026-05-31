# Asterion Content Lab

Content Lab is an internal, local-first pipeline for turning exam-bank evidence into reviewed teaching support. It is not part of the browser runtime and must not mutate `public/assets/exam-bank-data/question_bank.json`.

The public site is now a static CAIE 9709 study hub with P1, P3, M1, and S1 course pages. P1, M1, and S1 have rapid draft seed study pages in `src/data/courseSeedContent.ts`, but those pages are static audit scaffolds only. Content Lab remains P3-first because only the reviewed P3 skill map exists today. P1, M1, and S1 content should not be generated or published from this pipeline until reviewed syllabus/topic maps are added for those courses.

## Boundary

- Input evidence: `public/assets/exam-bank-data/question_bank.json`
- Projected app bank: `public/assets/exam-bank-data/asterion_question_bank_v1.json`
- Topic-routing sidecar: `public/assets/exam-bank-data/question_bank.topic_routing.v1.json`
- Candidate inventory: `public/assets/exam-bank-data/asterion_content_lab_candidates_v1.json`
- Internal outputs: `tools/content_lab/outputs/`
- Review reports: `tools/content_lab/reports/`
- Runtime-reviewed content: `public/data/teaching_snippets.json` and `public/data/generated_practice_bank.json`
- Static P3 pages: consume only reviewed static JSON from `public/data/`
- Static P1/M1/S1 seed pages: consume only `src/data/courseSeedContent.ts` and must stay marked as draft starter content
- No LLM calls, hosted review UI, generated exam clones, auth, remote storage, or browser-side mining

The reviewed P3 skill map at `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json` is the curriculum authority. OCR/raw text, AI labels, legacy DeepSeek labels, local labels, and fallback labels are review/display metadata only. Topic-routing records can validate placement only when clean/reviewed. Content Lab candidates remain blocked until reviewed source-skill evidence exists.

The active release is **Content Lab Worked Examples v1 / Question-to-Lesson Pass**. The teaching/generated-practice schema contract is v2. The worked-example content model is v1. The runtime loaders stay backward-compatible, but the verifier now requires canonical source question and mark-scheme asset IDs for every published/runtime P3 worked example.

## Canonical Verification

The all-up Phase 0 verification command is:

```bash
npm run content-lab:verify
```

It runs the P3 skill-map validation, inventory, coverage matrix, region-correction queue, Content Lab output verifier, full Vitest suite, Vite/TypeScript build, and `git diff --check`. See `docs/content-lab-verification.md` for the report-scope and pass/fail contract.

## Current Commands

Build deterministic skill targets, review queue, and coverage report:

```bash
python3 tools/content_lab/scripts/build_skill_targets.py \
  --input public/assets/exam-bank-data/question_bank.json \
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

Build the teacher-facing P3 coverage matrix:

```bash
npm run coverage:p3-matrix
```

Build the deterministic future region-correction queue:

```bash
npm run queue:p3-region-correction
```

Run the focused matrix validation:

```bash
npx vitest run tests/p3CoverageMatrix.test.ts
```

Verify generated outputs and reviewed runtime artifacts only:

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

Fallback-display-only placements, ambiguous routes, review-required routes, hard-failure records, raw fallback/debug records, and candidates without reviewed source-skill evidence must not become generation-ready. Difficulty and difficulty-band fields are deprecated metadata and must not drive readiness, routing, mastery, or generation behavior.

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

`content_lab_report.json` summarizes source counts, eligibility counts, active-region coverage, skill-target coverage by paper family and topic, review-queue reasons, source topics without skill targets, topics with no reviewed snippets, warm-up gaps, Guardian readiness metadata gaps, generator family counts, and verification failure counts. It is an `internal_planning` report. Internal generated-practice candidate counts and public runtime-reviewed counts are reported separately under `internal_generated_practice_summary` and `runtime_generated_practice_summary`.

`public/data/teaching_snippets.json` contains original reviewed teaching content with `review_status` set to `teacher_reviewed` or `published`. It must not contain copied exam questions or claim that generated text is official exam wording.

`generated_practice_bank.json` contains original deterministic warm-up items, not exam clones. Runtime items must have `review_status` set to `teacher_reviewed` or `published` and `verification.status` set to `pass`.

`tools/content_lab/skill_maps/caie_9709_p3_skill_map.json` contains the reviewed internal P3 micro-skill map. Its `curriculum_targets` block locks the active primary target to CAIE 9709 Pure Mathematics 3 for 2026-2027, with CAIE 9709 Pure Mathematics 1 recorded only as prerequisite support. `npm run validate:p3-skill-map` writes the deterministic, reviewable report to `tools/content_lab/reports/p3_skill_coverage_report.json`, summarizing snippet, Quick Check, generated warm-up, canonical-question, curriculum-role, prerequisite-reference, and high-evidence weak-support gaps for Content Lab readiness. The report is intentionally kept in version control as a stable review artifact.

`npm run inventory:p3-content` writes `tools/content_lab/reports/p3_content_inventory_report.json`. This report inventories the current P3 learning loop by region and by reviewed skill: Field Guides, snippets, worked examples, Quick Checks, generated warm-ups, canonical P3 question evidence, Guardian candidates, teacher/export curriculum tags, structural reference warnings, and next-step gaps. It differs from the P3 skill-map coverage report by answering "what exists and where does it connect?" rather than only "does each reviewed skill have minimum coverage categories?"

The inventory also reads `tools/content_lab/reviews/p3_app_region_routing_audit.json` when classifying app-region routing mismatches. Corrected audit entries are reported as resolved; image-reviewed route placements can be accepted with `validated_skill_map_route`, `clean_mastery_evidence`, `mastery_evidence_allowed: true`, `practice_allowed: true`, and `export_allowed: true`; active mismatches with no audit entry remain structural warnings. If audited ambiguous entries exist, they must remain visible as a deferred teacher-review backlog. Deferred entries use `teacher_review_deferred` and `ambiguous_part_level_evidence`, with `mastery_evidence_allowed: false`, `practice_allowed: true`, and `export_allowed: false`. When the deferred backlog is empty, the aggregate deferred policy fields remain `null` and all deferred counts remain `0`. App labels and DeepSeek labels are metadata signals only, and do not override the reviewed P3 skill-map region for mastery evidence.

`asterion_content_lab_candidates_v1.json` is a candidate inventory, not a publishing source. Candidate records can move toward generation only after reviewed `source_skill_ids`/source-skill evidence ties them to the reviewed P3 skill map and canonical question/mark-scheme image evidence. Label confidence, OCR text, raw text, or difficulty metadata is not enough.

`npm run coverage:p3-matrix` writes:

- `tools/content_lab/reports/p3_coverage_matrix.json`
- `tools/content_lab/reports/p3_coverage_matrix.md`

The P3 coverage matrix is the teacher-facing synthesis report for curriculum-alignment planning. It reads the reviewed P3 skill map and the deterministic content inventory, then produces one row per reviewed P3 skill. It differs from the skill coverage report and content inventory in purpose:

- Skill coverage report: contract-level support dashboard for reviewed skills.
- Content inventory report: detailed evidence/support inventory by skill and region.
- Coverage matrix: teacher-readable coverage, risk, and correction-priority view by official syllabus section, app region, and reviewed skill.

Coverage matrix status labels are conservative:

- `ready_for_review`: reviewed P3 core skill with expected teaching support, at least one clean mastery evidence item, and no unresolved blocking issue.
- `missing_support`: clean mastery evidence exists, but expected teaching support is missing, such as snippets, worked examples, Quick Checks, or warm-ups.
- `needs_teacher_review`: clean evidence exists, but deferred ambiguous evidence, inventory review flags, or routing ambiguity still need teacher attention.
- `blocked_for_mastery`: no clean mastery evidence, all available evidence is deferred, or the mastery-safety policy blocks the evidence.
- `partial`: some support and clean evidence exist, but the row is not complete enough for `ready_for_review` and is not better classified by the labels above.

Correction priority labels guide the next region-by-region correction pass:

- `P0_blocked_mastery`: no clean mastery evidence, unsafe evidence, or all evidence deferred.
- `P1_missing_core_support`: missing snippet, worked example, or Quick Check support.
- `P2_missing_practice_support`: missing warm-up support.
- `P3_teacher_review_backlog`: deferred ambiguity remains, but clean evidence and support also exist.
- `P4_polish_or_complete`: mostly complete and safe for teacher review.

Deferred ambiguous evidence remains visible in the matrix and Markdown report when it exists. It is counted separately from clean mastery evidence, remains practice-allowed where structurally valid, and remains blocked from mastery and export claims. The current reviewed matrix has no active deferred evidence cases.

`npm run queue:p3-region-correction` writes:

- `tools/content_lab/reports/p3_region_correction_queue.json`
- `tools/content_lab/reports/p3_region_correction_queue.md`

The region-correction queue is the planning artifact for future content correction. It reads the topic-routing sidecar, reviewed routing audit, content inventory, and coverage matrix, then separates route correction, text review, mark-scheme/subpart review, and support-content gaps. The queue intentionally does not edit source data. It keeps missing P3 routes, review-needed routes, ambiguous multi-topic routes, fallback-display-only placements, deferred evidence cases when present, audited route decisions, and weak or missing skill support visible as separate workstreams.

Matrix validation is intentionally strict about curriculum-contract failures and intentionally tolerant of ordinary support gaps:

- Unknown reviewed skill refs, duplicate or missing skill rows, unknown region IDs, invalid curriculum roles, invalid official syllabus sections, invalid status/priority labels, negative counts, malformed deferred-policy fields, unsafe mastery evidence, P1 prerequisite evidence counted as P3 mastery evidence, and mismatched summaries fail loudly.
- Missing snippets, worked examples, Quick Checks, and warm-ups are reported as support gaps and affect `coverage_status` / `correction_priority` deterministically. They do not make `npm run coverage:p3-matrix` fail unless they also violate the curriculum contract.
- Deferred ambiguous cases must stay represented both in per-skill rows and in the deferred backlog when they exist. They can appear as `practice_allowed_deferred_count`, but cannot become clean mastery evidence or export-allowed evidence. With no deferred cases, the deferred summary policy fields must be `null`.
- P1 prerequisite refs are allowed only as prerequisite metadata. They cannot create P3 matrix rows or count as canonical P3 question evidence.

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

- published/runtime P3 worked examples must include `source_question_ids`, `source_question_asset_ids`, and `source_mark_scheme_asset_ids`
- worked examples may include `question_type`, `key_method`, and `exam_move`
- Quick Checks may include `example_model_id`
- generated warm-ups may include `question_type`, `key_method`, and `exam_move`

The first batch still requires `question_type`, `key_method`, and `exam_move` for Logarithm Observatory, Algebra Vault, and Trigonometry Spire. Source asset traceability is no longer first-batch-only for published P3 examples.

## Current Runtime Coverage

Coverage counts are generated by the verifier output, not maintained by hand:

```bash
python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

As of 2026-05-21:

- 39 reviewed teaching snippets
- 39 Quick Checks
- 84 reviewed generated warm-ups
- 38 generator families
- all 40 reviewed P3 skills have Field Guide, snippet, worked-example, Quick Check, and warm-up support
- all active P3 regions have reviewed snippet, Quick Check, and generated warm-up coverage

Current generator families:

- `algebra.binomial_validity_range`
- `algebra.modulus_equation_basic`
- `algebra.partial_fractions_distinct_linear`
- `algebra.partial_fractions_repeated_linear`
- `algebra.polynomial_remainder_factor_basic`
- `algebra.structure_rearrangement_basic`
- `binomial_expansion.first_terms_and_coefficient`
- `complex_numbers.cartesian_conjugate_basic`
- `complex_numbers.locus_basic`
- `complex_numbers.modulus_argument_basic`
- `complex_numbers.roots_basic`
- `differential_equations.context_model_basic`
- `differential_equations.initial_condition_basic`
- `differential_equations.separation_basic`
- `differentiation.chain_product_basic`
- `differentiation.chain_rule_basic`
- `differentiation.implicit_log_exp_basic`
- `differentiation.product_rule_basic`
- `differentiation.stationary_tangent_normal_basic`
- `integration.definite_area_basic`
- `integration.method_setup_basic`
- `integration.parts_substitution_basic`
- `logarithms_and_exponentials.calculus_context_basic`
- `logarithms_and_exponentials.domain_validation_basic`
- `logarithms_and_exponentials.linearisation_basic`
- `logarithms_and_exponentials.log_equation_basic`
- `numerical_methods.accuracy_rounding_basic`
- `numerical_methods.iteration_formula_basic`
- `numerical_methods.sign_change_iteration_basic`
- `parametric_equations.derivative_ratio_basic`
- `quadratics.discriminant_root_condition_basic`
- `trigonometry.identity_rewrite_basic`
- `trigonometry.double_angle_basic`
- `trigonometry.solve_equation_interval_basic`
- `trigonometry.r_form_basic`
- `vectors.line_intersection_basic`
- `vectors.line_relationship_basic`
- `vectors.line_scalar_product_basic`

The generator script preserves existing reviewed, verification-passing runtime warm-ups that it does not rebuild yet. This prevents default runs from dropping reviewed public-runtime coverage while newer generator families are still being promoted in batches.

Next useful generator work should deepen the one-item preserved runtime families for vectors, numerical methods, differential equations, parametric equations, and complex-number loci/roots only when the deterministic structure can stay small and verification-gated.

## Review Rules

Runtime-visible teaching snippets must be compact, original, student-friendly, and reviewed. They should support the static P3 study flow:

```text
Understand the idea -> try a small check -> practise safely -> self-mark exam images
```

Runtime-visible generated practice must:

- have a clear original prompt
- have an exact/simple answer
- include worked-solution steps
- record deterministic parameters
- pass deterministic verification
- link to topic/region metadata
- link to skill targets and snippets where possible
- link to worked examples through `example_model_id`
- use valid MathText delimiter syntax with `$...$` and `$$...$$`

Candidate, blocked, review-only, or failed-verification generated practice must not appear in `public/data/generated_practice_bank.json`.

Clean P3 mastery evidence is the only evidence that can support mastery-facing claims. Fallback labels, AI/OCR/raw text, Content Lab candidates, generated warm-ups, Quick Checks, snippets, and worked examples may support learning/review, but they must not prove mastery by themselves.

Reviewed means:

- math correctness
- alignment to the canonical mark scheme
- no unsupported exam claims
- valid MathText syntax
- clear learner-facing steps
- correct linkage to snippet, check, warm-up, source-question, and canonical asset IDs

Phase 1 publishing gate:

- Logarithm Observatory, Algebra Vault, and Trigonometry Spire still have extra method metadata enforcement
- every method/concept/mistake-repair snippet in those regions needs at least one worked example
- every published/runtime P3 worked example needs source traceability to canonical question and mark-scheme assets
- every runtime warm-up needs a valid `example_model_id`

Later phases can deepen `question_type`, `key_method`, and `exam_move` requirements across every P3 region without weakening the Phase 0 source-asset rule.

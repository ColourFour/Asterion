# Agent 1 Plan - Skill Check Quality Iteration 002

## Sources Read
- `AGENTS.md`
- `agent_handoffs/skill_check_quality/iteration_001/agent5_review.md`
- `docs/SKILL_CHECK_FULL_AUDIT_2026_05_28.md`
- `docs/SKILL_CHECK_FIRST_SLICE_ALGEBRA_LOGS_2026_05_28.md`
- `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json`
- `tools/content_lab/reports/p3_coverage_matrix.md`
- `tools/content_lab/reports/p3_gold_skill_pack_readiness.md`
- `src/data/fieldGuideTopics.ts`
- `src/data/algebraVaultContent.ts`
- `src/data/logarithmObservatoryContent.ts`
- `src/data/skillCheckItems.ts`
- `src/data/remainingSkillCheckItems.ts`
- `src/lib/skillChecklist.ts`
- `src/lib/skillChecklistProgress.ts`
- `src/lib/quickCheckAnswer.ts`
- `src/components/world/regionHub/SkillCheckItemsPanel.tsx`
- `src/tests/skillChecklist.test.ts`
- `src/tests/quickCheckAnswer.test.ts`
- `public/assets/exam-bank-data/asterion_question_bank_v1.json`
- `public/assets/exam-bank-data/question_bank.json`
- `public/assets/exam-bank-data/question_bank.topic_routing.v1.json`
- `public/assets/exam-bank-data/asterion_content_lab_candidates_v1.json`

## Previous Review Input
- Previous Agent 5 review: Iteration 001 accepted with deferrals.
- Reused deferrals: none; Iteration 002 is scoped to Algebra Vault and Logarithm Observatory per user request.

## Full-Pass Region Findings
- Algebra Vault has 15 authored items across 5 Field Guide topics. Audit found one minor content issue (`sc-alg-binomial-foundation-001`) and one safe interaction conversion candidate (`sc-alg-polynomial-division-foundation-001`).
- Logarithm Observatory has 18 authored items across 6 Field Guide topics. Audit found the remaining safe interaction conversion candidate `sc-log-linearisation-challenge-001`; earlier conversions for `sc-log-laws-core-001` and `sc-log-linearisation-foundation-001` are already present in the active branch.
- Coverage reports identify missing warm-up support for `p3_alg_structure_rearrangement`, `p3_alg_discriminant_root_conditions`, and `p3_log_calculus_contexts`. Those are source-backed future add-item batches, not part of this conversion/correction batch.

## Batch Goal
- Region/topic focus: Algebra Vault and Logarithm Observatory full-pass quality sweep, with implemented changes limited to three source-backed item improvements.
- Student diagnostic outcome: reduce option recognition and make one Algebra binomial foundation item more distinctively P3.
- Why this batch is bounded: exactly three existing item edits, all already identified by audit or Field Guide/source-map evidence.
- Batch category: mixed category 1/2. Correct a minor content-quality issue and convert overly guessable multiple-choice items into stronger existing interaction types.
- Batch size: 3 item-level changes.

## Approved Item Changes
| Item ID | Current issue | Required action | Allowed interaction type | Required answer contract | Source evidence | Acceptance criteria | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sc-alg-binomial-foundation-001` | Audit says this is mathematically fine but tests ordinary positive-integer expansion rather than distinctive P3 generalized-binomial demand. | Change the prompt to ask for the coefficient of `$x$` in `(1-2x)^{-2}`. Preserve item ID, region, topic, skill ID, deterministic validation, and support-only review. Remove stale quick-check contract/source refs that point to the old positive-power prompt. | `numeric` | expected answer `4` or `$4`. | Audit minor issue for this item; Field Guide `algebra_binomial_expansion` uses `(1-2x)^{-2}` and generalized binomial expansion; skill-map `p3_alg_binomial_terms_coefficients`; canonical source question IDs listed for that skill. | Numeric contract accepts `4`; item remains under `p3_alg_binomial_terms_coefficients`; source refs no longer cite the old quick-check contract; `review.affectsMastery` remains false. | Low; simple numeric answer, but Agent 2 must not leave stale source refs. |
| `sc-alg-polynomial-division-foundation-001` | Multiple-choice first quotient term is easy to guess and audit recommends ordered cards. | Convert to ordered cards that ask for the opening long-division moves. Preserve item ID, region, topic, skill ID, deterministic validation, and support-only review. | `ordered_cards` | expected order: `divide-leading`, `multiply-back`, `subtract`, `continue`. | Audit later type `ordered cards`; Field Guide `algebra_polynomial_division`; skill-map `p3_alg_polynomial_remainder_factor`. | Ordered-card contract renders and validates; answer order follows long-division method; no new renderer; `review.affectsMastery` remains false. | Low; existing renderer supports ordered cards. |
| `sc-log-linearisation-challenge-001` | Multiple-choice linearisation answer is guessable; audit recommends ordered cards. | Convert to ordered cards for the concrete linearisation sequence of `y=4e^{2x}`. Preserve item ID, region, topic, skill ID, deterministic validation, and support-only review. | `ordered_cards` | expected order: `take-logs`, `split-product`, `simplify-exponential`, `read-line`. | Audit later type `ordered cards`; Field Guide `log_linearisation`; Logarithm practice alignment; skill-map `p3_log_linearisation`. | Ordered-card contract renders and validates; answer order follows log-linearisation method; no new renderer; `review.affectsMastery` remains false. | Low; mirrors an existing ordered-card pattern in the same topic. |

## Agent 2 Implementation Rule
Agent 2 may not invent a different fix. If the exact action is not implementable with current renderer contracts, Agent 2 must stop and mark the item blocked.

## Explicit Non-Goals
- Do not add new missing-support Skill Check items in this iteration.
- Do not change mastery, rank, Guardian unlock, adaptive selection, exam evidence, localStorage/progress migration, asset paths, UI layout, CSS, or Content Lab files.
- Do not change topic, region, skill mapping, or paper family.
- Do not introduce a new renderer type.
- Do not perform broad topic-count balancing.

## File Ownership For Agent 2
- Allowed production files: `src/data/skillCheckItems.ts`
- Allowed test files: `src/tests/skillChecklist.test.ts`
- Required report file: `agent_handoffs/skill_check_quality/iteration_002/agent2_impl_notes.md`
- Required delta sections: Changed Item IDs, Interaction Type Changes, Mathematical Correctness Findings, Syllabus Alignment Findings, Exam-Bank Alignment Findings, Field Guide / Content-Packet Alignment Findings, Hard Boundary Confirmation.

## Test Expectations For Agent 3
- Review `git diff --name-only`, `git diff --check`, and changed hunks.
- Confirm modified production/test files match ownership.
- Confirm every changed item ID appears in Agent 1's approved table.
- Confirm all Algebra and Logarithm Skill Check item contracts remain valid.
- Run focused Skill Check tests and quickCheckAnswer tests.
- Run lint/typecheck if available and build if feasible.

## Student Simulation Focus For Agent 4
- Simulate only the three changed items for low, average, and high ability personas.
- Judge whether ordered cards and generalized-binomial prompt improve diagnosis without creating excessive friction.

## Adversarial Review Focus For Agent 5
- Confirm the full-pass request did not become broad rewriting.
- Confirm missing warm-up support is explicitly deferred, not silently patched without source review.
- Reject if stale source refs remain, if ordered-card sequences are ambiguous, or if support-only boundaries are violated.

## Delta Sections Initialized
- Iteration ID
- Target Region / Topic / Items
- Changed Item IDs
- Interaction Type Changes
- Topic Question Counts Before / After
- Mathematical Correctness Findings
- Syllabus Alignment Findings
- Exam-Bank Alignment Findings
- Field Guide / Content-Packet Alignment Findings
- Hard Boundary Confirmation

## Stop Conditions
- Stop if any approved change requires a new renderer type.
- Stop if the binomial source refs cannot be made accurate.
- Stop if any ordered-card sequence is ambiguous enough to need teacher review.
- Stop if the batch requires adding missing-support items or changing runtime behavior.

## Final Summary For This Agent
- Agent 1 completed a full-pass review of Algebra Vault and Logarithm Observatory and approved three bounded existing-item improvements: one Algebra binomial content tightening, one Algebra ordered-card conversion, and one Logarithm ordered-card conversion.

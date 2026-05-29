# Agent 1 Plan - Skill Check Quality Iteration 003

## Sources Read

- `AGENTS.md`
- `agent_handoffs/skill_check_quality/iteration_001/agent5_review.md`
- `agent_handoffs/skill_check_quality/iteration_002/agent5_review.md`
- `docs/SKILL_CHECK_FULL_AUDIT_2026_05_28.md`
- `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json`
- `tools/content_lab/reports/p3_coverage_matrix.md`
- `tools/content_lab/reports/p3_gold_skill_pack_readiness.md`
- `src/data/fieldGuideTopics.ts`
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

- Previous Agent 5 review: Iteration 002 accepted with deferrals.
- Reused deferrals: missing Algebra/Log support items remain deferred because this iteration expands the review surface to all regions and selects an interaction-quality batch.

## Full-Pass Region Findings

- Algebra Vault and Logarithm Observatory were changed in Iteration 002; remaining known issues are add-item coverage deferrals.
- Trig, Complex, Vectors, and Numerical Methods still contain audit-backed exact-value multiple-choice items that can use existing numeric contracts.
- Calculus has the prior product-rule major issue already corrected in the active branch.
- Integration by parts has source-gap caveats, so Agent 1 will not alter it without a separate source-audit packet.
- Differential Equations has some concept/branch caveats, but the safest current all-region pass is exact-value conversion rather than broader method rewrites.

## Batch Goal

- Region/topic focus: all-region pass with implementation limited to four non-Algebra/Log exact-value items across Trig Observatory, Complex Harbor, Vector Workshop, and Numerical Mines.
- Student diagnostic outcome: reduce answer-choice recognition for exact computations and require the student to produce the value.
- Why this batch is bounded: four existing item-level changes, no adds/removals, one repeated issue type, all using the existing numeric renderer.
- Batch category: category 2, convert overly guessable multiple-choice items into stronger existing interaction types.
- Batch size: 4 item-level changes.

## Approved Item Changes

| Item ID | Current issue | Required action | Allowed interaction type | Required answer contract | Source evidence | Acceptance criteria | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sc-trig-reciprocal-functions-core-001` | Audit recommends numeric because exact reciprocal-identity value can be guessed from options. | Convert to numeric; preserve item ID, region, topic, skill ID, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | expected answer accepts `5` and `$5`. | Audit later type numeric; Field Guide `trig_reciprocal_functions`; skill-map `p3_trig_reciprocal_double_angle`. | Numeric contract validates `5`; no options/expected option contract remains; `review.affectsMastery` remains false. | Low. |
| `sc-complex-roots-foundation-001` | Audit recommends numeric because root-count recall is weakened by options. | Convert to numeric; preserve item ID, region, topic, skill ID, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | expected answer accepts `3` and `$3`. | Audit later type numeric; Field Guide `roots`; skill-map `p3_complex_roots_powers`. | Numeric contract validates `3`; no options/expected option contract remains; `review.affectsMastery` remains false. | Low. |
| `sc-vectors-angle-between-lines-core-001` | Audit recommends numeric for the angle between perpendicular direction vectors. | Convert to numeric; preserve item ID, region, topic, skill ID, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | expected answer accepts `90`, `$90^\\circ$`, and `90^\\circ`. | Audit later type numeric; Field Guide `vectors_angle_between_lines`; skill-map `p3_vec_scalar_product_angles`. | Numeric contract validates `90`; no options/expected option contract remains; `review.affectsMastery` remains false. | Low; degree-symbol variants must be accepted. |
| `sc-iteration-fixed-point-roots-foundation-001` | Audit recommends numeric because substitution into an iteration formula should be produced, not recognized. | Convert to numeric; preserve item ID, region, topic, skill ID, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | expected answer accepts `3` and `$3`. | Audit later type numeric; Field Guide `iteration_fixed_point_roots`; skill-map `p3_num_iteration_formula`. | Numeric contract validates `3`; no options/expected option contract remains; `review.affectsMastery` remains false. | Low. |

## Agent 2 Implementation Rule

Agent 2 may not invent a different fix. If the exact action is not implementable with current renderer contracts, Agent 2 must stop and mark the item blocked.

## Explicit Non-Goals

- Do not add or remove items.
- Do not change Algebra/Log deferrals from Iteration 002.
- Do not touch calculus, integration, or DE caveat items in this iteration.
- Do not change mastery, rank, Guardian unlock, adaptive selection, exam evidence, localStorage/progress migration, asset paths, UI layout, CSS, or Content Lab files.
- Do not change topic, region, skill mapping, or paper family.
- Do not introduce a new renderer type.

## File Ownership For Agent 2

- Allowed production files: `src/data/remainingSkillCheckItems.ts`
- Allowed test files: `src/tests/skillChecklist.test.ts`
- Required report file: `agent_handoffs/skill_check_quality/iteration_003/agent2_impl_notes.md`
- Required delta sections: Changed Item IDs, Interaction Type Changes, Mathematical Correctness Findings, Syllabus Alignment Findings, Exam-Bank Alignment Findings, Field Guide / Content-Packet Alignment Findings, Hard Boundary Confirmation.

## Test Expectations For Agent 3

- Review `git diff --name-only`, `git diff --check`, and changed hunks.
- Confirm modified production/test files match ownership.
- Confirm every changed item ID appears in Agent 1's approved table.
- Confirm deterministic numeric answer fields match existing renderer contract.
- Confirm all changed items keep valid region/topic/skill IDs.
- Run focused Skill Check tests and quickCheckAnswer tests.
- Run lint/typecheck if available and build if feasible.

## Student Simulation Focus For Agent 4

- Simulate only the four changed items for low, average, and high ability personas.
- Judge whether numeric production improves diagnosis without causing unacceptable friction for exact-value support checks.

## Adversarial Review Focus For Agent 5

- Confirm "all regions" stayed a review surface and did not become broad rewriting.
- Confirm each changed item is exact-value and source-backed.
- Reject if any numeric answer contract is too narrow, any source claim is missing, or any support-only boundary is violated.

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
- Stop if any exact numeric answer cannot be specified confidently.
- Stop if implementing the batch requires touching unapproved files.
- Stop if source evidence cannot be cited from audit, Field Guide, or skill map.

## Final Summary For This Agent

- Agent 1 completed an all-region review and approved a four-item exact-value numeric conversion batch across Trig, Complex, Vectors, and Numerical Methods. Broader coverage and source-gap work remains deferred.

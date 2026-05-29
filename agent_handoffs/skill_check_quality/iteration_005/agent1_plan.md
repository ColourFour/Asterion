# Agent 1 Plan - Skill Check Quality Iteration 005

## Sources Read
- `AGENTS.md`
- `agent_handoffs/skill_check_quality/iteration_004/agent5_review.md`
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
- Previous Agent 5 review: Iteration 004 accepted with deferrals.
- Reused deferrals: one more exact-value conversion pass before the planned audit; source-gap/add-item/branch-caveat work stays deferred.

## Full-Pass Region Findings
- All regions were reviewed as a surface. Agent 1 selected three remaining exact-value items with simple numeric/fraction contracts.
- Algebra/Logs add-item work, integration source-gap work, and DE branch sequencing remain deliberately outside scope.
- Items with symbolic-expression answers were not selected because their answer-normalization risk is higher than simple exact numeric/fraction contracts.

## Batch Goal
- Region/topic focus: all-region pass with implementation limited to Trig Observatory, Complex Harbor, and Vector Workshop.
- Student diagnostic outcome: require direct production of exact values for identity, conjugate, and scalar-product angle checks.
- Why this batch is bounded: three existing item-level changes, one issue type, no adds/removals, all using existing numeric renderer.
- Batch category: category 2, convert overly guessable multiple-choice items into stronger existing interaction types.
- Batch size: 3 item-level changes.

## Approved Item Changes
| Item ID | Current issue | Required action | Allowed interaction type | Required answer contract | Source evidence | Acceptance criteria | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sc-trig-pythagorean-identities-core-001` | Exact acute-angle value can be recognized from options. | Convert to numeric; preserve item ID, mapping, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `4/5`, `\\frac{4}{5}`, `$\\frac45$`, and `$\\frac{4}{5}$`. | Audit general finding that exact-value MC is too guessable; Field Guide `trig_pythagorean_identities`; skill-map `p3_trig_identity_selection`. | Numeric contract validates `4/5`; no MC contract remains; `review.affectsMastery` false. | Low; fraction variants must be accepted. |
| `sc-complex-cartesian-conjugate-challenge-001` | Exact real-part value can be recognized from options. | Convert to numeric; preserve item ID, mapping, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `3` and `$3`. | Audit all Complex items P3-appropriate; Field Guide complex Cartesian/conjugate support; skill-map `p3_complex_cartesian_conjugate`. | Numeric contract validates `3`; no MC contract remains; `review.affectsMastery` false. | Low. |
| `sc-vectors-scalar-product-challenge-001` | Exact scalar-product angle can be recognized from options. | Convert to numeric; preserve item ID, mapping, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `0`, `$0^\\circ$`, and `0^\\circ`. | Audit vector items P3-appropriate; Field Guide `vectors_scalar_product`; skill-map `p3_vec_scalar_product_angles`. | Numeric contract validates `0`; no MC contract remains; `review.affectsMastery` false. | Low; degree notation variants must be accepted. |

## Agent 2 Implementation Rule
Agent 2 may not invent a different fix. If the exact action is not implementable with current renderer contracts, Agent 2 must stop and mark the item blocked.

## Explicit Non-Goals
- Do not add or remove items.
- Do not convert symbolic-expression answers in this pass.
- Do not change Algebra/Log add-item deferrals, integration source-gap items, or DE branch-caveat items.
- Do not change mastery, rank, Guardian unlock, adaptive selection, exam evidence, localStorage/progress migration, asset paths, UI layout, CSS, or Content Lab files.
- Do not change topic, region, skill mapping, or paper family.
- Do not introduce a new renderer type.

## File Ownership For Agent 2
- Allowed production files: `src/data/remainingSkillCheckItems.ts`
- Allowed test files: `src/tests/skillChecklist.test.ts`
- Required report file: `agent_handoffs/skill_check_quality/iteration_005/agent2_impl_notes.md`
- Required delta sections: Changed Item IDs, Interaction Type Changes, Mathematical Correctness Findings, Syllabus Alignment Findings, Exam-Bank Alignment Findings, Field Guide / Content-Packet Alignment Findings, Hard Boundary Confirmation.

## Test Expectations For Agent 3
- Review `git diff --name-only`, `git diff --check`, and changed hunks.
- Confirm modified production/test files match ownership.
- Confirm every changed item ID appears in Agent 1's approved table.
- Confirm deterministic numeric answer fields match existing renderer contract.
- Run focused Skill Check tests and quickCheckAnswer tests.
- Run lint/typecheck if available and build if feasible.

## Student Simulation Focus For Agent 4
- Simulate only the three changed items for low, average, and high ability personas.
- Judge whether numeric/fraction production improves diagnosis without avoidable input friction.

## Adversarial Review Focus For Agent 5
- Confirm all-region review stayed bounded.
- Reject if fraction/degree answer contracts are too narrow, source evidence is missing, or support-only boundaries are violated.

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
- Stop if any exact numeric/fraction answer cannot be specified confidently.
- Stop if implementing the batch requires touching unapproved files.
- Stop if source evidence cannot be cited from audit, Field Guide, or skill map.

## Final Summary For This Agent
- Agent 1 completed an all-region review and approved three exact-value numeric conversions across Trig, Complex, and Vectors.

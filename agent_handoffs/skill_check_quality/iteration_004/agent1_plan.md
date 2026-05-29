# Agent 1 Plan - Skill Check Quality Iteration 004

## Sources Read
- `AGENTS.md`
- `agent_handoffs/skill_check_quality/iteration_003/agent5_review.md`
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
- Previous Agent 5 review: Iteration 003 accepted with deferrals.
- Reused deferrals: continue small all-region exact-value conversions; keep add-item and source-gap packets separate.

## Full-Pass Region Findings
- All regions were reviewed as a surface. The safest next implementation is another exact-value conversion batch in non-Algebra/Log generated Skill Check specs.
- Algebra and Logs still have deferred add-item/source-specific work and are not altered in this iteration.
- Integration by parts and DE branch caveats remain deferred because they need source-gap or wording packets, not a quick numeric conversion.

## Batch Goal
- Region/topic focus: all-region pass with implementation limited to Trig Observatory, Complex Harbor, Vector Workshop, and Numerical Mines.
- Student diagnostic outcome: require direct production of exact computed values instead of option recognition.
- Why this batch is bounded: four existing item-level changes, one issue type, no adds/removals, all using existing numeric renderer.
- Batch category: category 2, convert overly guessable multiple-choice items into stronger existing interaction types.
- Batch size: 4 item-level changes.

## Approved Item Changes
| Item ID | Current issue | Required action | Allowed interaction type | Required answer contract | Source evidence | Acceptance criteria | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sc-trig-addition-formulae-challenge-001` | Exact tangent-addition value can be recognized from options. | Convert to numeric; preserve item ID, mapping, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `7` and `$7`. | Audit general finding that exact-value MC is too guessable; Field Guide `trig_addition_formulae`; skill-map `p3_trig_identity_selection`. | Numeric contract validates `7`; no MC contract remains; `review.affectsMastery` false. | Low. |
| `sc-complex-cartesian-conjugate-core-001` | Exact conjugate-product value can be recognized from options. | Convert to numeric; preserve item ID, mapping, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `5` and `$5`. | Audit all Complex items P3-appropriate; Field Guide complex Cartesian/conjugate support; skill-map `p3_complex_cartesian_conjugate`. | Numeric contract validates `5`; no MC contract remains; `review.affectsMastery` false. | Low. |
| `sc-vectors-angle-between-lines-challenge-001` | Audit recommends numeric and tighter smaller-angle interpretation. Active prompt already asks for the smaller angle. | Convert to numeric; preserve wording, item ID, mapping, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `60`, `$60^\\circ$`, and `60^\\circ`. | Audit later type numeric and minor wording concern; Field Guide `vectors_angle_between_lines`; skill-map `p3_vec_scalar_product_angles`. | Numeric contract validates smaller angle `60`; no MC contract remains; `review.affectsMastery` false. | Low; degree notation variants must be accepted. |
| `sc-iteration-fixed-point-roots-challenge-001` | Audit recommends numeric because iteration rounding should be produced, not selected. | Convert to numeric; preserve item ID, mapping, prompt, hints, worked route, deterministic validation, and support-only review. | `numeric` | Accept `1.732` and `$1.732`; use tolerance `0.0005` for 3 d.p. rounding. | Audit later type numeric; Field Guide `iteration_fixed_point_roots`; skill-map `p3_num_iteration_formula`. | Numeric contract validates `1.732`; no MC contract remains; `review.affectsMastery` false. | Low; tolerance must not accept a different 3 d.p. value. |

## Agent 2 Implementation Rule
Agent 2 may not invent a different fix. If the exact action is not implementable with current renderer contracts, Agent 2 must stop and mark the item blocked.

## Explicit Non-Goals
- Do not add or remove items.
- Do not change Algebra/Log add-item deferrals.
- Do not touch integration by parts source-gap items or DE branch-caveat items.
- Do not change mastery, rank, Guardian unlock, adaptive selection, exam evidence, localStorage/progress migration, asset paths, UI layout, CSS, or Content Lab files.
- Do not change topic, region, skill mapping, or paper family.
- Do not introduce a new renderer type.

## File Ownership For Agent 2
- Allowed production files: `src/data/remainingSkillCheckItems.ts`
- Allowed test files: `src/tests/skillChecklist.test.ts`
- Required report file: `agent_handoffs/skill_check_quality/iteration_004/agent2_impl_notes.md`
- Required delta sections: Changed Item IDs, Interaction Type Changes, Mathematical Correctness Findings, Syllabus Alignment Findings, Exam-Bank Alignment Findings, Field Guide / Content-Packet Alignment Findings, Hard Boundary Confirmation.

## Test Expectations For Agent 3
- Review `git diff --name-only`, `git diff --check`, and changed hunks.
- Confirm modified production/test files match ownership.
- Confirm every changed item ID appears in Agent 1's approved table.
- Confirm deterministic numeric answer fields match existing renderer contract.
- Run focused Skill Check tests and quickCheckAnswer tests.
- Run lint/typecheck if available and build if feasible.

## Student Simulation Focus For Agent 4
- Simulate only the four changed items for low, average, and high ability personas.
- Judge whether numeric production improves diagnosis without causing unacceptable exact-value input friction.

## Adversarial Review Focus For Agent 5
- Confirm all-region review stayed bounded.
- Reject if any exact answer contract is too broad/narrow, source evidence is missing, or support-only boundaries are violated.

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
- Agent 1 completed an all-region review and approved four exact-value numeric conversions across Trig, Complex, Vectors, and Numerical Methods.

# Agent 1 Plan - Skill Check Quality Iteration 001

## Sources Read
- `AGENTS.md`
- `docs/SKILL_CHECK_FULL_AUDIT_2026_05_28.md`
- `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json`
- `tools/content_lab/reports/p3_coverage_matrix.md`
- `tools/content_lab/reports/p3_gold_skill_pack_readiness.md`
- `src/data/fieldGuideTopics.ts`
- `src/data/trigonometrySpireContent.ts`
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
- Previous Agent 5 review: absent
- Reused deferrals: none

## Batch Goal
- Region/topic focus: Trigonometry Spire / R-Form Transformations
- Student diagnostic outcome: require students to produce coefficient-match values and amplitude rather than recognize a multiple-choice option.
- Why this batch is bounded: exactly two existing authored items in one Field Guide topic and one reviewed P3 skill-map row.
- Batch category: 2. Convert overly guessable multiple-choice items into stronger existing interaction types.
- Batch size: 2 item-level changes.

## Approved Item Changes
| Item ID | Current issue | Required action | Allowed interaction type | Required answer contract | Source evidence | Acceptance criteria | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sc-trig-r-form-transformations-core-001` | Multiple-choice answer lets students choose `$\\tan\\alpha=\\frac43$` by option shape without showing the coefficient matching that produces it. | Convert to a two-value coefficient-match item. Prompt must ask for the two values in `$5\\cos(x-\\alpha)=5\\cos x\\cos\\alpha+5\\sin x\\sin\\alpha$`: `$\\cos\\alpha$` and `$\\sin\\alpha$`. Preserve region, topic, skill ID, deterministic validation, support-only review, and item ID. | `two_value` | fields: `cos-alpha` expected `3/5` or `\\frac{3}{5}`; `sin-alpha` expected `4/5` or `\\frac{4}{5}`. Use display prefixes `$\\cos\\alpha=$` and `$\\sin\\alpha=$`. | Audit finding: `sc-trig-r-form-transformations-core-001` later type `two-value`; Field Guide topic `trig_r_form_transformations` says match coefficients after expanding the chosen sine or cosine form; skill-map entry `p3_trig_r_form_compound_angles` includes recognizer signals `R sin`, `R cos`, `phase angle`, `a sin x + b cos x` and common error matching phase angle to wrong trig form. | Contract renders as `two_value`; correct response with `3/5` and `4/5` passes; reversed or wrong values fail; `review.affectsMastery` remains `false`; no Content Lab refs added. | Requires extending the local `ChoiceSpec` helper to emit existing `two_value` fields; if that cannot be done inside `src/data/remainingSkillCheckItems.ts` only, block this item. |
| `sc-trig-r-form-transformations-challenge-001` | Multiple-choice maximum value is guessable from option size and does not require entering the amplitude. | Convert to numeric entry while preserving the prompt, item ID, region, topic, skill ID, deterministic validation, and support-only review. | `numeric` | `expectedAnswer`: `5` or `$5`; no options or expected option IDs in the rendered contract. | Audit finding: `sc-trig-r-form-transformations-challenge-001` later type `numeric`; Field Guide topic `trig_r_form_transformations` says R-form combines sine and cosine into one shifted wave; Trigonometry practice alignment says rewrite as one shifted sine/cosine expression, then use the amplitude; skill-map entry `p3_trig_r_form_compound_angles` supports R-form and phase-angle work. | Contract renders as `single_value`; `5` and `$5` pass through existing numeric normalization; distractor option selection is no longer possible; `review.affectsMastery` remains `false`; no Content Lab refs added. | Low; numeric normalization already supports simple numbers. |

## Agent 2 Implementation Rule
Agent 2 may not invent a different fix. If the exact action is not implementable with current renderer contracts, Agent 2 must stop and mark the item blocked.

## Explicit Non-Goals
- Do not change mastery, rank, Guardian unlock, adaptive selection, exam evidence, progress migration, asset paths, UI layout, CSS, or Content Lab files.
- Do not add or remove Skill Check items.
- Do not change topic, region, skill mapping, or paper family.
- Do not introduce a new renderer type.
- Do not perform broad topic-count balancing.

## File Ownership For Agent 2
- Allowed production files: `src/data/remainingSkillCheckItems.ts`
- Allowed test files: `src/tests/skillChecklist.test.ts`
- Required report file: `agent_handoffs/skill_check_quality/iteration_001/agent2_impl_notes.md`
- Required delta sections: Changed Item IDs, Interaction Type Changes, Mathematical Correctness Findings, Syllabus Alignment Findings, Exam-Bank Alignment Findings, Field Guide / Content-Packet Alignment Findings, Hard Boundary Confirmation.

## Test Expectations For Agent 3
- Review `git diff --name-only`, `git diff --check`, and changed hunks.
- Confirm only Agent 1-approved files and item IDs changed.
- Confirm the two changed items have valid deterministic contracts and existing renderer answer types.
- Run focused Skill Check tests and quickCheckAnswer tests.
- Run lint/typecheck if available and build if feasible.

## Student Simulation Focus For Agent 4
- Simulate whether the two changed R-form items expose coefficient matching and amplitude misconceptions better than multiple choice.
- Check low, average, and high ability personas only for the changed R-form items and immediate topic flow.

## Adversarial Review Focus For Agent 5
- Confirm the batch stayed within one topic cluster and did not become broad test rewriting.
- Confirm support-only behavior and Content Lab isolation stayed intact.
- Reject if the two-value fields are ambiguous, if answer normalization cannot handle intended values, or if the numeric conversion becomes shallow recognition without diagnostic gain.

## Delta Sections Initialized
- Iteration ID
- Target Region / Topic / Items
- Changed Item IDs
- Interaction Type Changes
- Mathematical Correctness Findings
- Syllabus Alignment Findings
- Exam-Bank Alignment Findings
- Field Guide / Content-Packet Alignment Findings
- Hard Boundary Confirmation

## Stop Conditions
- Stop if the helper cannot support `two_value` without changing files outside Agent 2 ownership.
- Stop if renderer contract tests fail for the new item type.
- Stop if any change would affect mastery, rank, Guardian unlock, adaptive selection, exam evidence, UI layout, or Content Lab promotion.
- Stop if source evidence cannot support the R-form coefficient matching.

## Final Summary For This Agent
- Agent 1 approves a two-item R-form conversion batch in Trigonometry Spire. The batch is category 2, uses only existing renderer types, preserves support-only status, and is source-backed by the full audit, Field Guide topic, Trigonometry practice alignment, and reviewed P3 skill map.

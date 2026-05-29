# Skill Check Quality Delta - Iteration ${ITERATION_ID}

## Iteration Variables

- Current iteration: `${ITERATION_ID}`
- Previous iteration: `${PREVIOUS_ITERATION_ID}`, if any
- Handoff directory: `agent_handoffs/skill_check_quality/iteration_${ITERATION_ID}/`

## Shared Delta File Responsibility

The shared delta file is owned by the loop:

- Agent 1 initializes target region, topic, skill IDs, batch reason, and guardrails.
- Agent 2 updates changed/added/removed items, interaction changes, correctness, alignment, and implementation-side hard-boundary facts.
- Agent 3 updates test results and verification-side hard-boundary facts.
- Agent 4 updates student simulation findings and learning-quality count judgment.
- Agent 5 finalizes the decision, accepted deferrals, next-loop seed, and final hard-boundary judgment.

Each agent must update only the sections relevant to its role. Do not erase prior agent entries. If a required section is impossible to complete, write `BLOCKED:` with the reason instead of leaving blanks.

## Iteration ID

- Iteration: `${ITERATION_ID}`
- Date started:
- Agents completed:
- Final decision:

## Loop Sequence Context

- Iteration 001: fix known audit issues and convert the safest high-value multiple-choice items.
- Iteration 002: assign target question counts per topic and add/remove items only where justified.
- Iteration 003: improve exam-bank resemblance and method depth.
- Iteration 004: whole-bank student simulation, motivation, readability, and fatigue pass.
- Iteration 005: pilot-readiness freeze review.

## Target Region / Topic / Items

- Target region:
- Target Field Guide topic(s):
- Target skill-map ID(s):
- Reason this batch was selected:
- Batch category:
- Batch size guardrail:

## Changed Item IDs

| Item ID | Region | Topic | Change summary | Changed fields | Agent 1 approved? |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Added Item IDs

| Item ID | Region | Topic | Diagnostic purpose | Source evidence | Agent 1 approved? |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Removed Item IDs

| Item ID | Region | Topic | Removal reason | Replacement, if any | Agent 1 approved? |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Interaction Type Changes

| Item ID | Before | After | Required answer contract | Why this improves diagnosis | Renderer supported? |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Topic Question Counts Before / After

| Region | Topic | Before | After | Judgment |
| --- | --- | ---: | ---: | --- |
| | | | | |

Target range per topic is 5-15 questions, but this is not a quota. Fewer questions are better when fewer questions diagnose the skill cleanly. More questions are justified only when they add a new misconception, representation, method step, exam-style transfer, or useful interaction type.

## Mathematical Correctness Findings

- Confirmed correct:
- Needs teacher review:
- Ambiguous or incorrect:
- Notes:

## Syllabus Alignment Findings

- CAIE 9709 P3 alignment:
- Approved P3 skill-map alignment:
- Non-P3 risks:
- Collapsed coverage notes:

## Exam-Bank Alignment Findings

- Canonical question/mark-scheme evidence used:
- Exam-style resemblance improved:
- Exam-bank mismatch risks:
- Support-only caveats:

## Field Guide / Content-Packet Alignment Findings

- Field Guide topic alignment:
- Field Guide subtopic alignment:
- Content packet structure preserved:
- Source gaps or caveats:

## Student Simulation Findings

### Low Motivation / Low Ability

- Correct reasoning path:
- Likely wrong answer:
- Why this wrong answer is tempting:
- Misconception exposed:
- Feedback repair quality:
- Guessing risk:
- Exam-image practice readiness:
- Fatigue / quit risk:

### Average Motivation / Average Ability

- Correct reasoning path:
- Likely wrong answer:
- Why this wrong answer is tempting:
- Misconception exposed:
- Feedback repair quality:
- Guessing risk:
- Exam-image practice readiness:
- Fatigue / quit risk:

### High Motivation / High Ability

- Correct reasoning path:
- Likely wrong answer:
- Why this wrong answer is tempting:
- Misconception exposed:
- Feedback repair quality:
- Guessing risk:
- Exam-image practice readiness:
- Fatigue / quit risk:

## Test Results

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --name-only` | | |
| `git diff --check` | | |
| focused Skill Check tests | | |
| quickCheckAnswer tests | | |
| lint/typecheck, if available | | |
| build, if feasible | | |

## Accepted Deferrals

| Deferral | Reason accepted | Target iteration |
| --- | --- | --- |
| | | |

## Next-Loop Seed

- Suggested next iteration:
- Target region/topic:
- Candidate item IDs:
- Why this is the next best batch:
- Risks to carry forward:

## Hard Boundary Confirmation

- Content Lab candidates promoted: no / yes
- Mastery logic altered: no / yes
- Guardian unlocks altered: no / yes
- Rank behavior altered: no / yes
- Exam evidence behavior altered: no / yes
- Skill Check results made mastery evidence: no / yes
- UI redesign included: no / yes
- New renderer type added: no / yes
- Large artifacts committed: no / yes

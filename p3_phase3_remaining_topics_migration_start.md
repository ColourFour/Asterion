# P3 Phase 3 Coverage Expansion — Remaining Topics Start Pack

Date: 2026-06-11

## Current Status Note

This is a historical handoff pack, not the current implementation contract. The current branch has completed the deterministic Skill Check migration: tests now expect 171 authored P3 Skill Check items, 171 deterministically checkable items, and 0 not-yet-checkable or unsupported-answer-form items.

Current static routes also include topic `/learn/` pages, Field Guide bridge pages, Checked Practice pages, Exam Training pages, and printable worksheet pages. Use `README.md`, `AGENTS.md`, `src/lib/staticStudyRoutes.ts`, and `docs/static-pages.json` for the current static-page contract.

## Status

Repo write access was not available in this session: the GitHub connector returned no installed accounts or repositories, and `/mnt/data` has no cloned repo. This pack is therefore a handoff implementation plan, not a committed patch.

## Non-negotiable Phase 3 Invariant

A P3 Skill Check item may count toward pass state only if it has deterministic answer data and the checker can decide correctness without symbolic guesswork. Anything unsupported remains visible as not-yet-checkable and must not grant pass credit.

The existing pass rule stays unchanged:

> A topic/region passes only when every required checkable Skill Check item for that region has at least one valid P3 attempt where `isCorrect === true`, `revealedAnswer === false`, and `revealedRepairStep === false`.

## Recommended Migration Order

1. Numerical Solution of Equations
2. Vectors
3. Trigonometry
4. Differentiation
5. Integration
6. Differential Equations

Reason: the first two have the highest deterministic-checkability potential with the current checker. The last four contain more symbolic-equivalence traps and should be migrated in smaller slices.

## Current Remaining Load From Phase 3 Audit

| Topic | Existing checkable | Not yet checkable | Recommended first-pass target |
| --- | ---: | ---: | ---: |
| Trigonometry | 0 | 15 | 10-12 deterministic, remainder unsupported if general-solution/form ambiguity remains |
| Differentiation | 0 | 21 | 14-17 deterministic, symbolic derivative forms avoided where brittle |
| Integration | 0 | 24 | 15-18 deterministic, indefinite integral equivalence avoided unless canonical |
| Numerical Solution of Equations | 0 | 12 | 12 deterministic |
| Vectors | 0 | 24 | 20-24 deterministic |
| Differential Equations | 0 | 12 | 8-10 deterministic, symbolic solution forms avoided where brittle |

## Answer-Type Discipline

Use only existing supported answer types unless the checker and browser parity tests are extended together:

- `exact-text`
- `numeric`
- `expression-text`
- `multi-value`
- `coordinate`
- `interval`
- `complex-number`

Avoid using `expression-text` for broad algebraic equivalence. Use it only when the prompt imposes a strict canonical form.

## First Commit Scope: Numerical Solution of Equations

Goal: migrate all 12 Numerical Solution checks to deterministic answer data.

Prefer these item shapes:

| Skill target | Prompt pattern | Answer type | Tolerance / exactness |
| --- | --- | --- | --- |
| Sign-change interval | Find an interval `[a,b]` containing a root using sign change. | `interval` | exact endpoints |
| Fixed-point iteration | Compute `x_1`, `x_2`, or `x_3` from a given recurrence. | `numeric` or `multi-value` | usually `1e-3` or stated dp |
| Root approximation | Give root after specified iterations. | `numeric` | match requested dp/sf |
| Newton-Raphson step | Compute next iterate from given formula. | `numeric` | match requested dp/sf |
| Decimal-place validation | Show root rounds to stated value by interval bounds. | `interval` or `multi-value` | exact endpoints or numeric tolerance |
| Rearrangement suitability | Identify valid iteration rearrangement. | `exact-text` | controlled options only |

Do not make proof/explanation prompts checkable unless the expected response is a controlled option, such as `yes`, `no`, `valid`, `not valid`, `A`, `B`, or `C`.

## Numerical Solution Browser Acceptance Checks

Add or extend acceptance coverage to assert:

1. The generated Numerical Solution Skill Check page has no `I tried this` completion path.
2. All 12 migrated checks render a submitted-answer input and a Check answer control.
3. A wrong numeric answer writes a wrong `skillCheckAttempts` record.
4. A correct clean retry passes that check only if no answer or repair step was revealed.
5. A revealed correct answer does not pass.
6. A repaired correct answer does not pass.
7. Malformed local progress does not grant the topic pass state.
8. The P3 Content QA snapshot increases from `51 deterministic; 108 not yet` to `63 deterministic; 96 not yet` if all 12 are migrated.

## Second Commit Scope: Vectors

Vectors can be mostly deterministic if prompts ask for coordinates, scalar values, vector components, angles, and controlled relation labels.

Recommended deterministic forms:

| Skill target | Best answer type |
| --- | --- |
| Vector addition/subtraction/scalar multiple | `multi-value` or `coordinate` |
| Position vectors and points | `coordinate` |
| Magnitude | `numeric` |
| Unit vector components | `multi-value` |
| Dot product | `numeric` |
| Angle between vectors | `numeric` |
| Parallel/perpendicular classification | `exact-text` controlled option |
| Line equation parameter value | `numeric` |
| Intersection parameter(s) | `multi-value` |
| Shortest-distance style scalar result | `numeric` |

Avoid marking full vector-line equations checkable unless the prompt forces one canonical form.

Expected QA if all 24 are migrated after Numerical Solution: `87 deterministic; 72 not yet`.

## Third Commit Scope: Trigonometry

Use deterministic forms only for exact values, restricted-range solution sets, and controlled identities.

Recommended deterministic forms:

| Skill target | Best answer type |
| --- | --- |
| Exact sin/cos/tan values | `exact-text` or `numeric` |
| Restricted interval trig equation roots | `multi-value` |
| Radian/degree conversion | `numeric` |
| Inverse trig principal value | `numeric` |
| Amplitude/period/phase-shift values | `multi-value` |
| Controlled identity selection | `exact-text` |

Keep general solutions unsupported unless the checker gets a new exact trig-solution-set answer type. Do not trust free-form identities.

## Fourth Commit Scope: Differentiation

Prefer numeric derivative evaluations and geometric outputs over free-form derivative expressions.

Recommended deterministic forms:

| Skill target | Best answer type |
| --- | --- |
| Differentiate and evaluate at a point | `numeric` |
| Gradient at a point | `numeric` |
| Tangent/normal gradient | `numeric` |
| Tangent/normal equation in forced form | `expression-text` only if canonical |
| Stationary point coordinates | `coordinate` or `multi-value` |
| Nature of stationary point | `exact-text` controlled option |
| Increasing/decreasing interval | `interval` where exact endpoints are forced |
| Optimization maximum/minimum value | `numeric` |

Avoid broad symbolic derivative checks unless the prompt says exactly what form to enter and tests cover the normalization.

## Fifth Commit Scope: Integration

Prefer definite integrals, area values, and controlled constants over arbitrary antiderivatives.

Recommended deterministic forms:

| Skill target | Best answer type |
| --- | --- |
| Definite integral value | `numeric` or `exact-text` if exact fraction/radical canonical |
| Area under curve | `numeric` |
| Area between curves | `numeric` |
| Constant of integration from condition | `numeric` |
| Reverse-chain coefficient | `numeric` |
| Integration by substitution final value | `numeric` |
| Differential equation intermediate constant | `numeric` |

Indefinite integrals should stay unsupported unless written as a canonical fill-in-the-coefficient task.

## Sixth Commit Scope: Differential Equations

Prefer constants, evaluated solutions, and controlled growth/decay interpretations.

Recommended deterministic forms:

| Skill target | Best answer type |
| --- | --- |
| Separate variables: compute constant from initial condition | `numeric` |
| Evaluate y at a given x after solving | `numeric` |
| Growth/decay parameter | `numeric` |
| Long-term limiting value | `numeric` |
| Controlled interpretation of sign/constant | `exact-text` |
| Particular solution in forced canonical exponential form | `expression-text`, only with strict format |

Do not mark broad free-form differential-equation solutions checkable unless the checker is extended for exact solution families.

## Commit Sequence

Use small commits; do not bundle all remaining topics into one patch.

Suggested sequence:

1. `feat(p3): migrate numerical solution skill checks`
2. `test(p3): add numerical solution skill check acceptance`
3. `feat(p3): migrate vector skill checks`
4. `test(p3): add vector skill check acceptance`
5. Repeat one topic or one symbolic-risk slice at a time.

Each commit must include generated `docs/` output and the QA snapshot update.

## Required Checks Before Merging Each Slice

Run the existing project checks, plus the generated static acceptance check:

```bash
npm run build
# then run the existing unit/static/browser acceptance commands used in the Phase 3 closeout
```

Minimum expected assertions after each topic:

- No `I tried this` on generated P3 Skill Check pages.
- No `data-save-skill-check` fake pass hook in source/runtime/generated pages.
- All migrated checks have supported answer types.
- Unsupported checks remain visible and do not count as pass requirements.
- Revealed/repaired correct attempts do not pass.
- QA counts match migrated data exactly.

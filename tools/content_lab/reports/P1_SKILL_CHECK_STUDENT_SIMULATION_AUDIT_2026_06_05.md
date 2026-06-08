# P1 Skill Check Student Simulation Audit - 2026-06-05

## 1. Executive summary

The current P1 Skill Check groups are broadly useful and cognitive-load safe when students enter from the Field Guide. The one-card flow shows one question at a time, the visible counter stays at `Skill Check 1 of 3`, and the default group format reads as three quick questions rather than a worksheet.

The strongest pattern is the role sequence: first check, use the method, then exam-style twist. That works well for Quadratics, Series, Differentiation, and Integration. Functions is also usable, but notation-heavy groups rely more on hidden hints.

Main remaining risk before the follow-up fix: students who landed directly on a Skill Check route only saw the first group by default, with no visible group chooser. Field Guide subtopic CTAs landed on the expected group, but a strong student who opened `/skill-check/` directly could miss the other groups. After the third question in a group, the next action was also weak.

Small fixes implemented in this pass:

- `scripts/build-static-site.ts`: P1 `Start Skill Checks` hero CTA now targets the first real P1 group id instead of the missing `#skill-checks` anchor.
- `src/data/p1SkillCheckItems.ts`: Differentiation chain-rule group purpose now uses student-facing wording instead of implementation wording.
- `src/static-study/static-study.js` and `src/static-study/static-study.css`: direct P1 Skill Check routes now show a compact group chooser, the final item in a group can continue to the next group, and the last group points students toward the exam-style direction section.
- `src/static-study/static-study.js`: the save message no longer tells students to go to the next question when no next question is available.

No new content was added. Exam Training was not modified. Quarantined Integration material was not restored.

## 2. Persona findings

Weak student:
- The first questions are usually accessible because they ask for recognition or one direct formula step.
- The Field Guide-to-Skill Check path is safe: the subtopic CTA lands on the matching group and avoids making the student choose a method from the whole topic.
- Original risk: direct Skill Check entry could feel arbitrary because only the first group appeared. The follow-up group chooser now exposes the other subtopics.
- Common-mistake feedback is helpful, but it is hidden in the answer/details panel and is not tied to the student's chosen wrong option.

Average student:
- The second question in most groups gives useful method practice and catches typical algebra/notation mistakes.
- Worked routes are short and usually enough for formula substitution errors.
- Risk: some worked routes are compressed to three lines, so an average student who makes an algebra slip may see the answer but not enough intermediate checking.

Strong student:
- The flow is efficient and low-friction. One card at a time is good for quick confirmation.
- Third questions provide mild challenge, especially Quadratics discriminant parameters, Series possible ratios, Differentiation stationary classification, and Integration area setup.
- Risk: several third questions are still core practice rather than stretch. Strong students will want a visible next group or challenge continuation after finishing.

## 3. Topic-by-topic issues

### Quadratics

- First question accessibility: good. The default factoring group starts with method recognition, and the discriminant group starts with a conceptual `D=0` recognition item.
- Second question method practice: good. Inequality intervals, formula denominator handling, and graph opening direction all practise common method moves.
- Third question challenge level: good. Context roots, endpoint inequalities, exact roots, parameter discriminant, and intercept interpretation are mild but meaningful.
- Wording clarity: clear overall.
- Worked solution usefulness: good for quick checks; most routes show the decisive algebra step.
- Notation rendering: KaTeX rendered with no parse errors in browser checks.
- Common mistake feedback: useful and specific.
- Feels like 3 quick questions: yes, only one card visible and each group has three default items.
- Field Guide CTA: subtopic CTAs verified to target `p1-quadratics-*` groups correctly.
- Next action: fixed in follow-up; after question 3, the flow can continue to the next group, and the final group points to exam-style direction.

### Functions

- First question accessibility: mixed. Composite notation starts with `fg(4)`, which is authentic but can be misread as multiplication by weak students.
- Second question method practice: good. The inverse, translation, reflection, and stretch groups practise the intended notation moves.
- Third question challenge level: mild and appropriate: expression formation or point mapping.
- Wording clarity: mostly clear, but composite notation depends on the hidden hint.
- Worked solution usefulness: good, especially for order reversal and point transformations.
- Notation rendering: no parse errors observed.
- Common mistake feedback: good for order, axis, and reciprocal horizontal-scale mistakes.
- Feels like 3 quick questions: yes for each group. The follow-up group chooser makes the other groups discoverable on direct route without requiring a hash link.
- Field Guide CTA: not directly route-sampled in this audit, but hash behavior was verified with a Functions stretch target.
- Next action: fixed in follow-up with direct group navigation and next-group continuation.

### Series

- First question accessibility: good. AP and GP groups start with direct term checks; Infinite GP starts with the convergence condition.
- Second question method practice: good. AP common difference, negative GP ratio, and sum-to-infinity all practise the named method.
- Third question challenge level: good. AP sum and possible GP ratios give a real method change without becoming a worksheet.
- Wording clarity: clear.
- Worked solution usefulness: good, with the `n-1` and ratio-squared traps called out.
- Notation rendering: KaTeX rendered with no parse errors.
- Common mistake feedback: strong for `n` vs `n-1`, common difference vs ratio, and convergence.
- Feels like 3 quick questions: yes.
- Field Guide CTA: subtopic CTAs verified to target `p1-series-*` groups correctly.
- Next action: fixed in follow-up; the group chooser and next-group continuation keep the flow clear.

### Differentiation

- First question accessibility: good for gradient and polynomial groups. Chain rule and stationary points are more method-dependent but still manageable after the Field Guide.
- Second question method practice: good, especially negative substitution, dropping constants, inner factor, normal gradients, and velocity.
- Third question challenge level: good. Negative powers, tangent equations, stationary classification, and derivative interpretation provide mild challenge.
- Wording clarity: improved in this pass for the chain-rule group purpose.
- Worked solution usefulness: generally good, though some derivative chains are compressed.
- Notation rendering: KaTeX rendered with no parse errors.
- Common mistake feedback: useful and closely tied to likely errors.
- Feels like 3 quick questions: yes.
- Field Guide CTA: not route-sampled as a Field Guide page, but direct hash behavior was verified for `p1-differentiation-stationary-points` and `p1-differentiation-chain-rule`.
- Next action: fixed in follow-up; after the third item, students can continue to the next group or exam-style direction.

### Integration

- First question accessibility: good. Basic integration starts with a direct reverse-power-rule multiple-choice item; area starts with setup rather than calculation.
- Second question method practice: good for new power, constants, definite limits, and exact area.
- Third question challenge level: appropriate. Negative powers and area setup are mild challenge without restoring quarantined material.
- Wording clarity: clear.
- Worked solution usefulness: useful and concise.
- Notation rendering: KaTeX rendered with no parse errors.
- Common mistake feedback: good for `+C`, lower/upper limits, symmetry, and upper-minus-lower.
- Feels like 3 quick questions: yes. Improper integrals and volume of revolution remain hidden from visible P1 groups.
- Field Guide CTA: not route-sampled as a Field Guide page, but direct hash behavior was verified for `p1-integration-area-between-curves`.
- Next action: fixed in follow-up; after the third item, students can continue to the next group or exam-style direction.

## 4. Items that should be rewritten

Implemented:
- `p1-differentiation-chain-rule` group purpose was rewritten to: "Differentiate powers of linear expressions by multiplying by the inner derivative."
- Direct-route group discovery was added using existing P1 group labels.
- End-of-group navigation now continues to the next P1 group or the existing exam-style direction section.
- End-of-group save wording was rewritten so it no longer promises a next question when the group is complete.

Recommended but not changed in this pass:
- `p1-sc-functions-composite-001`: consider making the prompt slightly more explicit for weak students, for example by including `fg(4)=f(g(4))` in the visible prompt or label. This is not urgent because the hint and worked route already explain it.

## 5. Groups that feel too easy, too hard, repetitive, or unclear

Too easy:
- Functions exact direct evaluations and basic AP/GP first checks are easy for strong students, but they are appropriate first questions.
- Integration basic and definite-integral first checks are very direct, but useful for weak/average students.

Too hard:
- No checked default group felt too hard after its Field Guide. Quadratics discriminant parameter and Integration negative powers are the highest load, but both are third questions or targeted groups.

Repetitive:
- Functions transformations are intentionally repetitive across translations/reflections/stretches. This is acceptable, but the direct route needs a group chooser so repetition feels optional rather than hidden.

Unclear:
- The direct Skill Check route was unclear before the follow-up fix. It now exposes the available groups.
- The final-card next action was unclear before the follow-up fix. It now leads to the next group or the existing exam-style direction section.

## 6. Navigation/CTA issues

Fixed:
- P1 Skill Check hero CTA previously linked to `#skill-checks`, which did not exist on grouped P1 pages. It now links to the first actual group id, such as `#p1-quadratics-factoring`.
- Direct Skill Check pages now show a compact group chooser built from existing group labels.
- The last question in a P1 group now has a next action: the next group where one exists, otherwise the exam-style direction section.

Verified:
- `/p1/topics/quadratics/field-guide/` active subtopic CTAs link to matching Quadratics groups.
- `/p1/topics/series/field-guide/` active subtopic CTAs link to matching Series groups.
- Hash URLs such as `#p1-series-geometric-progressions`, `#p1-differentiation-stationary-points`, and `#p1-integration-area-between-curves` show the expected group.

Remaining:
- Common-mistake feedback remains inside the answer/details panel rather than being tied to the exact selected wrong option.

## 7. Recommended small fixes

1. Consider surfacing a short "Why this mistake happens" line after answer reveal, using the existing commonMistake field, without adding new questions.
2. Keep the three-question default. Do not expand visible default groups.
3. Keep hidden Integration improper-integral and volume material quarantined.

## 8. Validation commands run

- `npm run build` - passed; generated 211 static HTML pages in `docs/`.
- Browser preview at `http://127.0.0.1:4173/` - checked required routes, hash-targeted groups, visible one-card flow, group chooser, next-group transition, final exam-style direction action, and KaTeX parse-error absence.
- `npm run static:check` - passed; static site and rendered static checks passed.
- `npx vitest run src/tests/staticStudyRoutes.test.ts` - passed.
- `npm test` - passed on follow-up run; previous audit pass had intermittent Python subprocess `ETIMEDOUT` failures in pipeline tests, with different files failing between runs.
- `npx vitest run tests/p3RegionCorrectionQueue.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --no-file-parallelism` - passed.
- `npx vitest run tests/p3GoldSkillPackReadiness.test.ts tests/generatedPracticePipeline.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --no-file-parallelism` - passed.
- `npm run test:ci` - passed; 56 files and 477 tests.
- `git diff --check` - passed.

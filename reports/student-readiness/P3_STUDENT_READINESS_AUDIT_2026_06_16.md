# P3 Student Readiness Audit - 2026-06-16

## Verdict

Overall verdict: MOSTLY_READY
Student readiness: MOSTLY_READY
Trust readiness: READY
Content readiness: USABLE_BUT_ROUGH
Navigation readiness: MOSTLY_READY
Exam readiness: MOSTLY_READY

Audit scope: generated static site in `docs/`, generation/data code in `scripts/build-static-site.ts`, `src/static-study/static-study.js`, `src/lib/localExamAttempts.ts`, `src/skill-checks/localAttempts.ts`, `src/skill-checks/answerChecker.ts`, and existing tests. Browser checks used the local preview server at `http://127.0.0.1:4173/` with desktop 1366px and mobile 390px viewports.

## Executive Summary

A real CAIE 9709 Paper 3 student can open the site, identify it as a P3 path, start Algebra, work through Learn Mode, complete checked similar questions, self-mark exam questions, and see that final mixed review is gated until all units are complete.

The strongest part of the product is trust. Wrong Learn Mode answers fail, clean similar answers save checked evidence, answer/repair reveal does not create a pass, malformed old Skill Check records fail closed, and self-marked exam work does not award mastery by itself.

The weakest part is path naming and page hierarchy. The required `field-guide` and `skill-check` routes are public, but they are now moved notices. The real student work lives in Learn Mode. This is mechanically coherent, but a student following the old mental model of "Field Guide -> Skill Check -> Exam Training" can feel redirected instead of guided.

The second major issue is coverage confidence. All nine P3 topics have Learn Mode and Exam Training, but exam question depth is uneven: Algebra has only 2 topic exam questions; Integration, Numerical Solution, and Vectors have 3 each. Several exam-training records use coarse whole-question self-marking because clean mark points are unavailable.

The third issue is student-visible maintainer language. `/p3/content-qa/` is public and says "Maintainer QA", "proxy checks", "migration", and "partial Phase 3". It is useful internally but should not be promoted as a student route.

## First 60 Seconds

Verdict: MOSTLY_READY

Evidence from `/`, `/p3/`, and `/p3/topics/`:

- The first viewport clearly says `CAIE 9709 P3 Path`.
- The dominant action is `Start Unit 1: Algebra`.
- The page shows a simple loop: Learn, Check, Review.
- The route uses official topic order from Algebra to Complex Numbers.
- The root route is already the P3 path, not a confusing course selector.

Issues:

- The H1 `Try the best example problem first.` is action-oriented, but it does not itself say `CAIE 9709 Paper 3`. The header does, so this is not blocking.
- `Open Exam Review` is a prominent second action even though the student should not use it first. The gate explains this after click, but first-visit priority would be clearer if review felt secondary.
- "Asterion - Learn by doing" is mild product language. It is not damaging, but direct student wording would be better.

## Learning Path Clarity

Target sequence:

1. Learn the topic/subtopic.
2. Pass checked Skill Check evidence.
3. Practice exam questions.
4. Review mistakes.
5. Continue to next topic.
6. Use exam review after all topics are complete.

Observed sequence:

- `/` and `/p3/topics/` communicate Learn -> Check -> Review clearly.
- Topic Learn Mode pages say `Answer first. Hint, explanation, principle, similar check, and exam transfer unlock in order.`
- Topic Exam Training pages say self-marked work is weaker than checked Skill Check evidence and does not award mastery by itself.
- `/p3/review/` is locked by local completion: all Learn Mode steps and all required checked questions are required before mixed review opens.

Contradictions or unclear areas:

- `/p3/topics/{topic}/field-guide/` and `/p3/topics/{topic}/skill-check/` are moved notices. They do not contain the Field Guide or Skill Check experience requested by the older path language.
- Topic Learn Mode pages are doing both Field Guide and Skill Check work, but the top-level navigation still uses `Units` and `Exam Review` only. A student who wants "the Skill Check page" must infer that `Skill Check` means `Learn Mode`.
- `/p3/content-qa/` exposes internal audit language that can undermine student confidence if discovered.

## Topic Readiness Table

| Topic | Classification | Learn / Field Guide | Skill Check | Exam Training | Notes |
|---|---|---:|---:|---:|---|
| Algebra | USABLE_BUT_ROUGH | 11 Learn steps; moved Field Guide notice | 21 required checked passes; 11 clean similar forms | 2 questions; 2 coarse | Good starting path, but exam depth is thin and all topic exam questions are coarse self-marked. |
| Logarithmic and Exponential Functions | READY_FOR_STUDENT_USE | 13 Learn steps; moved Field Guide notice | 18 required checked passes; 13 clean similar forms | 6 questions; 6 coarse | Strong Learn path and enough exam variety; coarse marking limits exam evidence precision. |
| Trigonometry | READY_FOR_STUDENT_USE | 11 Learn steps; moved Field Guide notice | 15 required checked passes; 11 clean similar forms | 4 questions; 2 mark-point, 2 coarse | Usable newly migrated topic; exam set is modest but functional. |
| Differentiation | READY_FOR_STUDENT_USE | 14 Learn steps; moved Field Guide notice | 21 required checked passes; 14 clean similar forms | 8 questions; 4 mark-point, 4 coarse | Strongest combined Learn and exam coverage. |
| Integration | USABLE_BUT_ROUGH | 13 Learn steps; moved Field Guide notice | 24 required checked passes; 13 clean similar forms | 3 questions; 2 mark-point, 1 coarse | Learn coverage is broad, but exam practice is too thin for a major P3 topic. |
| Numerical Solution of Equations | USABLE_BUT_ROUGH | 12 Learn steps; moved Field Guide notice | 12 required checked passes; 12 clean similar forms | 3 questions; 3 mark-point | Mechanically good, but exam breadth is narrow. |
| Vectors | USABLE_BUT_ROUGH | 9 Learn steps; moved Field Guide notice | 24 required checked passes; 9 clean similar forms | 3 questions; 2 mark-point, 1 coarse | Check gate is heavy relative to Learn step count; exam breadth is narrow. |
| Differential Equations | READY_FOR_STUDENT_USE | 12 Learn steps; moved Field Guide notice | 12 required checked passes; 12 clean similar forms | 8 questions; 3 mark-point, 5 coarse | Good path and enough exam volume; coarse marking remains a limitation. |
| Complex Numbers | READY_FOR_STUDENT_USE | 14 Learn steps; moved Field Guide notice | 12 required checked passes; 14 clean similar forms | 8 questions; 2 mark-point, 6 coarse | Good topic journey and exam volume; many coarse self-marked questions. |

## Skill Check Trust

Verdict: READY

Evidence:

- Browser interaction on Algebra Learn Mode:
  - Wrong answer produced `Not yet. The hint is now available, and this attempt has been saved as practice.`
  - A later clean similar answer produced `Correct. Saved as a clean checked answer.`
  - Only the clean similar attempt was saved to `skillCheckAttempts`.
- `src/static-study/static-study.js` only counts passing attempts when `isCorrect` is true and neither answer nor repair was revealed.
- `src/skill-checks/localAttempts.ts` filters malformed records and requires complete P3 attempt shape.
- Existing tests cover wrong answers, revealed answers, repaired answers, retry after wrong answer, malformed legacy records, empty storage, and no configured checkable items.

Risks:

- Existing `tests/localSkillCheckAttempts.test.ts` says hint use does not block a correct unrevealed pass. Learn Mode's current clean-save path blocks hint-used attempts from strong evidence, so the runtime is stricter than that unit-level helper test. This is not a student-facing trust bug, but the test language is easy to misread.
- Learn Mode uses the phrase "clean checked answer" while topic progress says "Checked questions." This is honest but not perfectly self-explanatory for a new student.

## Exam Training Trust

Verdict: MOSTLY_READY

Evidence:

- Exam Training pages repeatedly state: self-marked exam work is useful practice evidence, weaker than checked Skill Check evidence, and does not award mastery by itself.
- Browser interaction on Algebra Exam Training:
  - Saving before mark scheme reveal failed with `Reveal the mark scheme before saving a self-marked attempt.`
  - Saving after mark scheme reveal succeeded as `Low-trust self-marked evidence. Self-marked attempt saved. Skill Check required for mastery.`
  - The saved attempt had `masteryEligible: false` and `masteryGate: skill_check_required`.
- `src/lib/localExamAttempts.ts` and `tests/localExamAttempts.test.ts` preserve the rule that exam practice supports confidence only and cannot create mastery without Skill Check pass.

Risks:

- Coarse self-marking is frequent: Algebra 2/2, Log/Exp 6/6, Complex 6/8, Differential Equations 5/8. Students can still use these questions, but mark precision is weaker.
- The phrase `Low-trust self-marked evidence` is accurate but may sound accusatory after a genuine quick attempt. Consider a softer student label while keeping the same internal flag.
- Question-specific support exists where mark points are available; coarse records use whole-question score only. No generic fake support was found, but the split is uneven.

## Navigation And Layout

Verdict: MOSTLY_READY

What works:

- `/`, `/p3/`, and `/p3/topics/` all resolve to the P3 learning path.
- Every topic has Learn Mode and Exam Training.
- Back-navigation is present: `Back to P3 Path`, `Back: Unit N`, `Back to P3 topics`.
- Exam Training has one-card navigation: `Previous question` and `Next question`.
- Final review has a visible locked gate and per-topic continue links.

Problems:

- Public `field-guide` and `skill-check` routes are redirect-style notices. They are not broken, but they are not the expected pages.
- `Skill Check` buttons on Exam Training go to `../learn/`, which is correct mechanically but semantically surprising.
- Learn Mode pages expose many in-page anchor links in nav on desktop. They are useful, but the first screen can feel busy.
- `/p3/content-qa/` is student-visible and linked from `/p3/need-to-know/`.

## Language Quality

Verdict: MOSTLY_READY

Good language:

- `Start Unit 1: Algebra`
- `Answer first. Hint, explanation, principle, similar check, and exam transfer unlock in order.`
- `Self-marked exam work is useful practice evidence, but it is weaker than checked Skill Check evidence. It does not award mastery by itself.`
- `Finish every P3 unit first.`

Language to revise:

- `Try the best example problem first.` The phrase "best" is vague.
- `Asterion - Learn by doing` is product tone rather than direct study guidance.
- `Content QA`, `Maintainer QA`, `proxy checks`, `migration`, and `partial Phase 3` should not be student-facing.
- `Low-trust self-marked evidence` is technically precise but emotionally rough for honest students.
- `Skill Check has moved` and `Field Guide has moved` are site-maintenance wording, not study wording.

No game/lore wording, XP, rank, avatar, Guardian, teacher/admin flow, or classroom language was found in the inspected P3 student path.

## Mobile / Responsiveness

Verdict: MOSTLY_READY

Checked at 390px width:

- `/`
- `/p3/topics/algebra/learn/`
- `/p3/topics/algebra/exam-training/`
- `/p3/review/`

Results:

- No horizontal overflow detected.
- Buttons remained tappable and did not clip.
- Learn Mode forms remained usable.
- Visible exam question image scaled to mobile width.
- Hidden lazy-loaded cards report zero image width until shown; filesystem references were present, so this was not counted as broken image evidence.

Risks:

- Exam images are readable only by zooming/scrolling mentally; they are scaled down to fit mobile width. This is acceptable for static mobile support but not ideal for detailed mark-scheme reading.
- Long topic names and large KaTeX output make the first viewport dense, especially on Log/Exp and Numerical Solution.

## Progress And LocalStorage Behavior

Verdict: READY

Evidence:

- Progress uses `asterion.progress.v1`.
- Malformed storage returns a clean empty progress object.
- Skill Check attempts are normalized before counting.
- Final review gate reads local Learn Mode completion and required checked passes.
- Exam attempts are saved under `attempts`, Skill Check evidence under `skillCheckAttempts`, and learning attempts under `learningActivityAttempts`.
- Review sessions use tagged incorrect/repaired/revealed Skill Check attempts, not fake exam progress.
- Self-marked exam work updates exam evidence counts but does not set completion or mastery.

Potential confusion:

- After one clean Algebra similar answer, the checked-question progress text was not prominent in the first viewport during the browser check. The data saved correctly, but the student may not immediately see which counter changed.
- Completing Learn Mode requires the similar question for each step. This is academically sound, but the page should keep explaining that completion means similar checked evidence, not just reading the explanation.

## Top 20 Fixes

| Rank | Priority | Route/file area | Student-facing problem | Smallest recommended fix | Type | Complexity |
|---:|---|---|---|---|---|---:|
| 1 | P1 | `/p3/topics/{topic}/field-guide/`, `/p3/topics/{topic}/skill-check/` | Expected pages are moved notices, so students feel redirected. | Replace maintenance wording with a study-oriented module hub, or make old routes deep-link into Learn Mode step/check sections. | UI | 35 |
| 2 | P1 | `/p3/content-qa/`, `/p3/need-to-know/` | Public maintainer QA language can undermine trust. | Remove student-facing links to Content QA or add a maintainer-only warning and noindex-style copy. | UI/content | 20 |
| 3 | P1 | Algebra Exam Training | Only 2 exam questions and both are coarse self-marked. | Add at least 2-4 reviewed Algebra exam questions with usable mark-point splits. | Data | 60 |
| 4 | P1 | Integration Exam Training | Major P3 topic has only 3 topic exam questions. | Add reviewed mapped Integration questions, prioritizing substitution, parts, partial fractions, and definite area. | Data | 65 |
| 5 | P1 | Vectors Exam Training | Vectors has only 3 topic exam questions but 24 required checked passes. | Add more reviewed vector questions or reduce displayed exam-readiness claims. | Data/UI | 60 |
| 6 | P1 | `/`, `/p3/`, `/p3/topics/` | `Open Exam Review` competes with the intended first action. | Keep it visible but label as `Final review - locked until units complete` or demote visual priority. | UI | 15 |
| 7 | P1 | Topic Learn Mode progress headers | Students may not understand completion means similar checked questions. | Add one short line near progress: `A step is complete after the similar checked question passes cleanly.` | Content/UI | 15 |
| 8 | P2 | Exam self-marking status | `Low-trust self-marked evidence` can sound accusatory. | Change display label to `Needs cautious self-review` while preserving internal trust flag. | Content | 10 |
| 9 | P2 | Exam Training coarse records | Whole-question score lacks mark-point guidance. | Add a visible `whole-question score only` explanation before the score input, not just after. | UI/content | 20 |
| 10 | P2 | `/p3/need-to-know/` | `Draft` readiness labels may confuse students. | Add a student explanation: `Draft means tracked by Asterion, not missing from your syllabus.` | Content | 10 |
| 11 | P2 | Home hero | H1 does not explicitly name Paper 3. | Change H1 to include `Paper 3`, e.g. `Start CAIE 9709 P3 with Algebra.` | Content | 10 |
| 12 | P2 | Exam Training `Skill Check` button | Button goes to Learn Mode, not a standalone Skill Check page. | Rename to `Return to Learn Mode checks`. | Content/UI | 10 |
| 13 | P2 | Review page | Mixed review card content is present below the locked gate, including save buttons. | Hide mixed questions until gate opens, or make the locked state visually dominate more strongly. | UI/logic | 30 |
| 14 | P2 | Learn Mode in-page nav | Many anchor links compete with the main stepper. | Collapse step links behind `Jump to step` on small/medium screens. | UI | 30 |
| 15 | P2 | Topic readiness labels | No topic-level warning for thin exam practice. | Add an internal readiness badge or student-safe note when exam set is narrow. | UI/data | 25 |
| 16 | P2 | Review mistake page behavior | Review depends on students selecting mistake tags. | Prompt for a mistake tag more strongly after incorrect/repaired attempts. | UI/logic | 25 |
| 17 | P3 | Mobile exam images | Images fit but are small for detailed reading. | Add `Open image full size` links for question and mark-scheme images. | UI | 20 |
| 18 | P3 | CSV/export area | Local progress language may be too administrative for students. | Keep export but move below main student actions. | UI | 15 |
| 19 | P3 | Topic moved notices | `Why this changed` is maintenance framing. | Replace with `Where to study now`. | Content | 5 |
| 20 | P3 | Home copy | `best example problem` is vague. | Rename to `Start with a short Algebra example`. | Content | 5 |

## Hide / Keep / Promote Recommendations

Hide for students for now:

- `/p3/content-qa/` as a linked student route.
- Maintainer wording and migration status language.

Keep:

- `/`, `/p3/`, `/p3/topics/` as the main P3 path.
- Learn Mode as the combined instruction plus checked-evidence surface.
- Exam Training as self-marked practice evidence.
- Final `/p3/review/` gate.
- LocalStorage fail-closed progress behavior.

Promote:

- The Learn Mode clean similar-question pass rule.
- The final review gate as an honest readiness target.
- Topics with stronger exam volume: Differentiation, Differential Equations, Complex Numbers, Logarithmic and Exponential Functions.

Do not promote yet:

- Algebra, Integration, Vectors, and Numerical Solution as fully exam-ready without adding more topic exam questions or wording them as starter exam sets.

## Suggested Next Implementation Pass

1. Reframe `field-guide` and `skill-check` moved routes into student-oriented transition pages or deep links.
2. Remove public student links to Content QA.
3. Add exam question coverage for Algebra, Integration, Vectors, and Numerical Solution.
4. Rename Exam Training's `Skill Check` button to `Return to Learn Mode checks`.
5. Adjust first-screen hierarchy so `Start Unit 1: Algebra` is the sole dominant next action.
6. Add one explicit completion sentence on Learn Mode pages: clean similar checked answers complete steps and count toward final review.
7. Soften student-facing self-mark trust wording while retaining strict internal evidence semantics.

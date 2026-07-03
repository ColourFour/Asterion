# Static Webpage Persona Audit - 2026-07-03

## Scope

This audit reviews the current generated static Asterion site in `docs/` as a student-facing CAIE 9709 P3 product. The site is effectively a focused P3 study path, with P1/M1/S1 pages present but locked as support-only future routes.

Audited surfaces:

- Root landing page
- P3 dashboard
- P3 diagnostic gate
- P1 review / foundation repair lane
- P3 topic overview
- P3 Learn, Field Guide redirect, Checked Practice, Exam Training, and worksheet route pattern
- Export / final review page
- Need to Know checklist
- Internal Content QA page
- Locked P1, M1, and S1 course pages

Primary perspectives requested:

1. Unmotivated student being forced to complete this for summer homework
2. Motivated student being forced to complete this for summer homework
3. Student with extremely poor English ability, primary Chinese speaker, trying to learn P3
4. Teacher who is not the original author, given the page to help students

## Method

I inspected the current working tree without modifying app code. There were pre-existing uncommitted changes in:

- `src/static-study/static-study.js`
- `docs/assets/static-study.js`
- `tests/staticProduct.test.ts`

I served the generated `docs/` site locally and inspected rendered desktop and mobile pages with headless Chromium. I also reviewed relevant source/data/test files and existing internal audit reports.

Commands/checks used:

- Local static server from `docs/` on `127.0.0.1:4174`
- Rendered-page text extraction across key page types
- Desktop and mobile screenshot pass at 1365x900 and 390x844
- Direct browser checks of Learn Mode next-step locking across all nine P3 topics
- `npm run static:check`

`npm run static:check` result:

- Static file/image portion passed: 58 HTML pages, 396 P3 catalog records, 396 local image pairs.
- Rendered product check failed: multiple P3 Learn Mode pages no longer lock the next step until the current step is completed.
- Direct browser verification confirmed the `Next step` button is enabled while the current Learn step still says `Not completed` on all nine sampled P3 Learn pages.

## Executive Verdict

Asterion is visually polished, static-friendly, and academically serious. It has a strong core identity: P3 students learn a topic, pass checked practice, then use image-first exam questions and export local progress. The product is much stronger than a normal static worksheet site because it separates checked evidence from self-marked exam work and keeps canonical exam images visible.

The main weakness is not content ambition. The weakness is role clarity.

The current site tries to serve four modes at once:

- Student onboarding
- Homework compliance
- P3 learning
- Teacher-facing progress/export/admin confidence

Those modes are all useful, but they are not always separated cleanly. The result is that a motivated student can work productively, while an unmotivated student sees shortcuts, a weak-English student faces too much dense English, and a new teacher needs more explicit assignment guidance.

The highest-risk issue is the Learn Mode progression bug. The page copy promises a controlled try-first learning loop, but the current rendered app allows moving to the next step before completion. That directly affects mastery accuracy, especially for forced homework use.

## Cross-Persona Findings

### What Works Well

- The homepage is visually strong and immediately says P3.
- The P3 dashboard is structured and credible.
- The site avoids fake AI marking, fake mastery, avatars, XP, and teacher/classroom systems.
- Exam Training uses real question and mark-scheme images, which is the right trust anchor.
- Self-marked exam work is repeatedly described as weaker than checked practice.
- The export page clearly says progress is local to the browser.
- Mobile layout does not horizontally overflow in sampled pages.
- Contrast appears to have been recently repaired; the current light-mode surfaces are readable.

### What Hurts Multiple Personas

- New users are pushed from `/p3/` toward `Start Algebra Checked Practice`, while the homepage says `Start with Learn`. This creates a mismatch between learning-first and compliance-first behavior.
- The sticky/mobile header consumes a lot of first-screen height. On mobile, students see navigation before the task.
- The final review page is titled `Export Progress`, but also contains final mixed review and mistake repair. That is too much conceptual load for one page title.
- Field Guide routes are now redirect-style notices. They are not broken, but they feel like maintenance pages rather than study pages.
- `Need to Know` and `Content QA` contain status/coverage language that is useful to maintainers but confusing to students.
- The site has no low-English mode, Chinese glosses, vocabulary list, or icon-first instruction layer.
- Teacher assignment flow is implicit. A new teacher is not told exactly what to assign, what counts, what students submit, or how to interpret the CSV.

## Persona 1: Unmotivated Student Forced To Complete Summer Homework

### Likely Student State

This student wants the fastest route to "done." They are not trying to optimize learning. They will look for:

- The shortest path
- What the teacher can see
- Whether they can click through
- Whether self-marking can be gamed
- Whether the site blocks them or merely advises them

### First Impression

The homepage is visually appealing, but a forced student may treat it as a splash screen. The button `Start with Learn` is clear, but the next P3 dashboard recommends `Start Algebra Checked Practice`. That student will likely skip Learn because the dashboard says Learn is optional and "does not block this route."

The unmotivated path is probably:

1. Open site.
2. Click P3 Units or Start with Learn.
3. Notice Checked Practice is the visible evidence route.
4. Try to answer or reveal hints/answers.
5. Look for Export Progress.
6. Submit whatever local CSV can be generated.

### Friction And Exploit Risks

The biggest exploit risk is the current Learn Mode step lock failure. If `Next step` is enabled while a step is not complete, a student can rapidly move through Learn without doing the intended interaction. Even if checked practice still gates stronger evidence, the product no longer matches its stated learning loop.

Exam Training is safer because it requires mark-scheme reveal before saving, and it labels self-marking as weaker evidence. However, forced students can still self-award marks unless the teacher treats exam self-marks as practice evidence only.

The export system is local-browser based. A student can use another device, clear storage, or submit a thin CSV. The page is honest about this, but an unmotivated student will notice that this is not a server-verified assignment.

### What Helps This Persona

- Clear checked-practice pass counts.
- Hints/revealed answers do not count as clean passes.
- Final review is locked until local unit evidence exists.
- CSV export creates some accountability.

### What Fails This Persona

- The Learn route can currently be advanced without completion.
- The dashboard normalizes skipping Learn.
- There is no "minimum summer homework checklist" visible on the first screen.
- The page does not make the teacher-visible submission expectation concrete enough.

### Suggestions

Priority changes:

1. Fix Learn Mode locking immediately. `Next step` should be disabled until the current step has a clean completion or a deliberate "skip as incomplete" state that does not count.
2. Add a `Summer homework minimum` panel on `/p3/` with exact required actions, for example: diagnostic, Unit 1-9 checked practice, export CSV.
3. Make `Export Progress` show a simple completion summary before the form: completed units, checked passes, repaired attempts, self-marked exam attempts.
4. Keep self-marked exam work clearly weaker than checked practice. Do not let self-marked exam attempts satisfy required completion.
5. Add a teacher-verifiable "submission checklist" to the export page so students know what will be inspected.

Secondary changes:

- Rename the P3 dashboard primary action for new students to `Start Algebra Learn` unless prior progress shows they are ready for checked practice.
- Add "This page saves only this browser" near the start of the student path, not only at export time.

## Persona 2: Motivated Student Forced To Complete Summer Homework

### Likely Student State

This student wants to learn efficiently and satisfy the assignment. They may already know some P3, and they will appreciate:

- Clear topic order
- Real exam questions
- Fast routing to weak areas
- Honest evidence labels
- Ability to export progress

### First Impression

This student will likely trust the site. The visual polish, official topic names, mathematical notation, and exam images all signal seriousness. The P3 topic order is clear. The diagnostic gate is valuable, and Learn Mode has a good educational model: try first, hint, explanation, similar question, exam transfer.

The motivated path is probably:

1. Take diagnostic if unsure.
2. Start Algebra.
3. Use Learn when needed.
4. Complete Checked Practice for evidence.
5. Try Exam Training questions.
6. Export progress.
7. Return for final review after all units.

### What Helps This Persona

- The system distinguishes learning support from evidence.
- Checked Practice has deterministic answer checking.
- Exam Training uses real CAIE-style image crops and mark schemes.
- Topic routes are ordered and consistent.
- The `Need to Know` checklist can be useful as a syllabus tracker.
- Final review lock gives a long-term target.

### What Fails This Persona

- The route hierarchy is inconsistent: homepage says Learn first; P3 dashboard says Checked Practice first.
- Field Guide pages feel like redirects rather than useful learning resources.
- Some exam-training topics have uneven question depth, based on prior internal reports.
- `Low-trust self-marked evidence` style language can feel accusatory to honest students.
- The export/review page mixes administrative submission with final study.

### Suggestions

Priority changes:

1. Make the default new-student route learning-first: `Diagnostic -> Learn -> Checked Practice -> Exam Training`.
2. Preserve a fast lane for confident students, but label it as such: `Already confident? Try Checked Practice`.
3. Replace Field Guide redirect pages with topic hubs that show the actual path and link directly to Learn, Checked Practice, and Exam Training.
4. Add topic-level "what to do next" summaries after each checked pass: continue subtopic, try exam question, or move to next topic.
5. Separate `Export Progress` from `Final Review` in page title and layout. They can remain one static page, but the visible sections should be clearly distinct.

Secondary changes:

- Show "how much remains" in time terms as well as counts: roughly 10-20 minutes, 3 checks, 1 exam question.
- Add full-size image links for exam questions and mark schemes, especially for mobile.

## Persona 3: Primary Chinese Speaker With Extremely Poor English Trying To Learn P3

### Likely Student State

This student may understand mathematical symbols better than the English instructions. They need:

- Short sentence instructions
- Stable repeated vocabulary
- Visual examples
- Bilingual labels or glossary support
- Fewer abstract evidence/status phrases
- Clear answer format examples

### First Impression

The student will recognize P3 topics and formulas, but much of the navigation depends on English. Phrases like `Checked Practice`, `evidence`, `repair`, `self-marked`, `diagnostic gate`, `route`, `local browser progress`, `weaker evidence`, and `deterministic pass/fail` are difficult even for intermediate English learners.

The math itself may be accessible, but the study system language is not.

### Likely Confusion Points

- `Learn is optional support` may be read as "I do not need this."
- `Checked Practice` may not clearly mean "system can check my answer."
- `Repair` may not clearly mean "fix mistake and practise again."
- `Reveal Answer` may not clearly explain that revealing prevents a clean pass.
- `Export Progress` may not clearly mean "send teacher your work record."
- The diagnostic page says "No hints, no teaching, no adaptive branching." This is precise English, but hard to parse.
- Long topic names such as `Logarithmic and Exponential Functions` and `Numerical Solution of Equations` create visual and language load.

### What Helps This Persona

- Mathematical notation is visible and central.
- The homepage has three simple conceptual cards: Learn, Practice, Apply.
- Learn Mode breaks content into steps.
- Answer format prompts exist.
- Visual exam images are preserved.

### What Fails This Persona

- There is no Chinese support layer.
- Instruction text is often abstract and administrative.
- The most important consequences are in English prose, not icons or simple warnings.
- Mobile first screens are navigation-heavy, delaying the actual learning task.
- The site does not provide vocabulary help for command words or common P3 terms.

### Suggestions

Priority changes:

1. Add a `中文辅助 / Chinese support` toggle or static glossary page. This does not need to translate the whole course at first.
2. Add bilingual micro-labels for core actions:
   - Learn / 学习
   - Checked Practice / 自动检查练习
   - Exam Training / 真题训练
   - Hint / 提示
   - Reveal Answer / 显示答案
   - Export Progress / 导出学习记录
3. Add a P3 vocabulary glossary with English, Chinese, formula/example, and a short meaning:
   - remainder, factor, modulus, domain, range, derivative, integral, argument, vector, iteration, mark scheme.
4. Rewrite key instructions in controlled English: short sentences, one action per sentence.
5. Use icons or status symbols for clean pass, hint used, answer revealed, saved, not saved.

Secondary changes:

- Add answer format examples beside every input, not only descriptions. Example: `type x^2-4, not x²-4`.
- Add "teacher submission" bilingual note on the export page.
- Provide a `language help` link in the sticky header or first P3 panel.
- Keep Chinese support advisory only. Do not replace canonical CAIE question images or mark schemes.

## Persona 4: Teacher Who Is Not The Author

### Likely Teacher State

This teacher wants to know:

- What this site covers
- What is safe to assign
- What counts as completion
- How students submit work
- Whether the data is trustworthy
- Whether this is official, AI-generated, or teacher-authored
- How to explain it to students

### First Impression

The site looks credible, but a new teacher will need more orientation. The teacher can infer that it is a P3 study product, but the distinction between Learn, Checked Practice, Exam Training, final review, local progress, and self-marked evidence is spread across multiple pages.

The teacher path is probably:

1. Open homepage.
2. Click P3 Units or Exam Training.
3. Look for assignment instructions.
4. Click Export Progress.
5. Wonder what the CSV means and what evidence is reliable.
6. Possibly discover Content QA and see internal maintenance language.

### What Helps This Persona

- The static architecture is simple and deployable.
- P1/M1/S1 are clearly locked.
- P3 has nine official topic units.
- CSV export exists and names local browser limitations.
- Self-marked exam evidence is not treated as mastery.
- Internal QA page exposes useful coverage information if the teacher is technically inclined.

### What Fails This Persona

- There is no teacher start page.
- There is no ready-made assignment brief.
- CSV interpretation is not explained in teacher language.
- The teacher may not know which activities are required versus optional.
- Content QA is public and uses maintainer wording that can reduce confidence.
- The site title/nav do not distinguish student pages from teacher/maintenance pages.

### Suggestions

Priority changes:

1. Add a static `Teacher Guide` page.
2. Include an assignment recipe:
   - "For summer homework, assign: diagnostic + all P3 Checked Practice + export CSV by date."
   - "Optional extension: Exam Training self-marked attempts."
3. Add a CSV interpretation guide:
   - Clean checked pass = strongest local evidence.
   - Hint/reveal/repair = useful practice, not pass evidence.
   - Self-marked exam = practice evidence only.
   - Local browser storage means no central account verification.
4. Add a short teacher-facing coverage statement for P3 only, without exposing maintainer migration language.
5. Hide or de-emphasize `/p3/content-qa/` from student navigation. Keep it accessible only as a maintainer route or clearly label it for internal use.

Secondary changes:

- Provide a copy-paste message teachers can send to students.
- Provide expected completion time ranges by unit.
- Provide troubleshooting instructions: changed device, cleared browser storage, cannot open email client, CSV too long.

## Page-Level Notes

### Homepage

Strengths:

- Strong visual identity.
- Simple Learn / Practice / Apply model.
- Clear P3 signal.
- Good first impression for motivated students.

Issues:

- It is no longer a true course selector despite course-aware architecture.
- It does not explain summer homework expectations.
- On mobile, the header and hero occupy the entire first screen before any detailed task guidance.

Recommendation:

- Keep the visual style, but add a small "For summer homework" route or note.

### P3 Dashboard

Strengths:

- Clear P3 identity.
- Shows next action and all units.
- Local progress language is honest.

Issues:

- New user default is `Start Algebra Checked Practice`.
- Copy says Learn is optional and does not block the route, which may encourage skipping learning.

Recommendation:

- Default new students to Learn or Diagnostic. Keep Checked Practice as the evidence route after the student opts into fast lane.

### Diagnostic

Strengths:

- Good concept: fixed starting-point check.
- No fake adaptive teaching during the diagnostic.
- Locks question flow visually.

Issues:

- Language is dense for weak-English students.
- 45-60 minutes may be intimidating for forced/unmotivated students.

Recommendation:

- Add "Do this when your teacher asks, or if you are unsure where to start" and a short "what happens after" explanation.

### P1 Review / Repair Lane

Strengths:

- Useful bridge for weak prerequisite fluency.
- Short modules and fast checks are sensible.

Issues:

- "Repair" language can feel punitive or unclear.
- Lock language should be precise about static-site limitations.

Recommendation:

- Rename student-facing concept to `Foundation Review`; keep repair terminology internal.

### Learn Mode

Strengths:

- Good instructional design: try first, hint, explanation, similar question, transfer.
- Step counts are visible.
- Input answer formats exist.

Critical issue:

- Current rendered site allows `Next step` before current step completion.

Recommendation:

- Fix progression lock first. Then add a clear incomplete-skip state if skipping is intentionally allowed.

### Checked Practice

Strengths:

- Best evidence surface.
- Hints/reveals do not count as clean passes.
- Subtopic switching is available.

Issues:

- Some pages are dense.
- `Pass to continue` controls can be confusing if the student has not interacted yet.

Recommendation:

- Keep it strict, but add a one-line explanation of evidence states near the first check.

### Exam Training

Strengths:

- Real exam image first.
- Mark-scheme reveal and self-marking are separated.
- It states self-marking is weaker than checked evidence.

Issues:

- Mobile reading of question and mark-scheme images is constrained.
- Self-marking language can be emotionally rough.

Recommendation:

- Add full-size image links and soften student labels while preserving internal trust flags.

### Export / Final Review

Strengths:

- Honest local-storage explanation.
- Useful for summer homework submission.
- Final review gate communicates unfinished units.

Issues:

- The page has too many jobs.
- Teacher workflow is not explained enough.
- Mixed review content appears on the same page as export, creating conceptual load.

Recommendation:

- Split the visible hierarchy into `Submit Progress` and `Final Review`, even if they remain one static route.

### Need To Know

Strengths:

- Useful syllabus/skill coverage idea.

Issues:

- Too dense for students.
- Status labels can be misread as personal readiness.

Recommendation:

- Make it a simple checklist by default; hide coverage/status details behind "Teacher details" or "More detail."

### Content QA

Strengths:

- Useful maintainer page.

Issues:

- Student-visible internal language can reduce trust.

Recommendation:

- Keep it out of normal student paths.

## Priority Fix List

### P0: Fix Before Assigning Broadly

1. Restore Learn Mode progression lock.
2. Add explicit summer homework completion criteria.
3. Clarify that Checked Practice is required evidence and Exam Training is weaker self-marked practice.
4. Make export summary teacher-readable before CSV generation.

### P1: Improve Student Motivation And Completion Quality

1. Route new students to Diagnostic or Learn before Checked Practice.
2. Add a fast lane for confident students without making it the default.
3. Replace Field Guide redirect pages with useful topic hub pages.
4. Separate Export Progress and Final Review visually.
5. Add full-size exam image links.

### P2: Improve Access For Weak-English / Chinese-Speaking Students

1. Add bilingual labels for the core navigation/actions.
2. Add a P3 English-Chinese glossary.
3. Rewrite key instructions in shorter controlled English.
4. Add icons/status chips for pass, incomplete, hint used, answer revealed, saved.
5. Provide answer-format examples beside inputs.

### P3: Improve Teacher Adoption

1. Add a static Teacher Guide.
2. Add assignment templates.
3. Add CSV interpretation guide.
4. Hide maintainer QA from student routes.
5. Add troubleshooting notes for browser-local progress.

## Recommended Teacher-Facing Assignment Wording

Suggested static copy:

> Complete the P3 Diagnostic if you are unsure where to begin. Then complete Checked Practice for each P3 unit. Learn pages are there to help you prepare, and Exam Training is optional extension practice unless your teacher assigns it. At the end, export your local progress CSV and send it to your teacher.

Suggested evidence explanation:

> A clean checked pass is the strongest local evidence. Hints, revealed answers, and repair attempts are useful learning records but do not count as clean passes. Self-marked exam questions are practice evidence only.

## Final Assessment By Persona

| Persona | Current Fit | Main Risk | Best Improvement |
|---|---|---|---|
| Unmotivated forced student | Mixed | Can skip Learn flow; may seek fastest CSV | Fix locks and show exact homework checklist |
| Motivated forced student | Strong but uneven | Route mismatch and uneven exam depth | Make path learning-first and show next best action |
| Very poor English, Chinese speaker | Weak to moderate | System language is too abstract | Add bilingual labels/glossary and controlled English |
| New teacher | Moderate | Assignment/evidence model is implicit | Add Teacher Guide and CSV interpretation |

## Bottom Line

Asterion is close to being a credible static P3 summer homework product, especially for motivated students and teachers who already understand its evidence model. The product should not be broadly assigned until the Learn Mode lock regression is fixed, because the current behavior contradicts the intended learning loop.

After that, the biggest gains will come from clearer assignment framing, bilingual support for essential actions, and a teacher guide that explains what counts as trustworthy evidence.

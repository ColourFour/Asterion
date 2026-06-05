# Asterion Student Experience Redesign Plan

Date: 2026-06-04

Scope: planning-only audit and redesign plan for the static Asterion Study Hub student experience. No implementation is included in this pass.

Primary source files and generated pages reviewed:

- `README.md`
- `AGENTS.md`
- `tools/content_lab/reports/STATIC_STUDY_COGNITIVE_LOAD_PASS_2026_05_31.md`
- `tools/content_lab/reports/P3_STATIC_STUDY_CONTENT_AUDIT_2026_05_31.md`
- `scripts/build-static-site.ts`
- `src/lib/staticStudyRoutes.ts`
- `src/data/courses.ts`
- `src/data/courseSeedContent.ts`
- `src/static-study/static-study.js`
- `src/static-study/static-study.css`
- generated pages under `docs/index.html`, `docs/p1/`, `docs/p3/`, `docs/m1/`, `docs/s1/`, `docs/topics/`, and `docs/exam-training/`

This report is stored under `tools/content_lab/reports/` instead of `docs/` because `README.md` says `docs/` is committed generated GitHub Pages output and should not hold source planning notes.

## Source-Of-Truth Comparison

The closest existing cognitive-load source of truth is `tools/content_lab/reports/STATIC_STUDY_COGNITIVE_LOAD_PASS_2026_05_31.md`. It identified these overload risks:

- Field Guide sections gave worked examples, method tables, guided tries, worked routes, and takeaways at nearly equal weight.
- Practice pages placed progress and section navigation before students reached a question.
- Exam Training had explanatory mode content before students reached mixed Paper 3 questions.
- Field Guide pages still contained many sections because the static site kept full topic guides on one page.
- Exam Training still used existing question selection behavior.

Current generated pages partially follow that report: Field Guide support details are often collapsed, progress/jump details are sometimes inside disclosure blocks, and Practice card stacks are enhanced to one visible card at a time when JavaScript runs. However, the core product-flow issue remains. The student still sees too many parallel routes and too many stacked learning objects: course nav, topic nav, Field Guide links, Practice links, Exam Training links, progress summaries, availability summaries, long Field Guide sections, practice groups, and exam question grids.

The previous pass reduced visual clutter. It did not fully redesign the journey around "one decision at a time."

## 1. Executive Summary

The current Asterion student experience is structurally coherent for an engineer or content auditor, but too demanding for a 15-18 year old student trying to revise maths. The site exposes its structure too early: courses, topics, Field Guides, Practice Questions, Exam Training, topic overviews, progress, compatibility routes, and exam images all appear as separate things the student must understand. That creates decision load before the student has had a first win.

This is not a cosmetic polish problem. It is a product-flow problem. The current pages often ask the student to choose between multiple valid learning modes before they know what each mode means. A low-achieving student sees a test-shaped environment too soon. An average student can find useful material, but must keep rebuilding the path in their head. A high-achieving student can move quickly, but even they have to scan through too much repeated navigation and too many question cards.

Risk by student type:

- Low-achieving or anxious students may interpret the page as another overwhelming textbook or test. The long stacked Field Guide and exam grids increase quit risk.
- Average students may lose momentum because Field Guide, Skill Check, Practice, and Exam Training feel adjacent rather than sequential.
- High-achieving students may tolerate the clutter, but the lack of focused shortcuts and one-question exam flow makes serious revision less efficient.

The redesigned flow should feel like a calm study coach:

1. Pick the paper.
2. Pick one topic.
3. Get a short positive transition.
4. See one Field Guide phase.
5. Do one small action.
6. Try a matching Skill Check.
7. Continue or review.
8. Move to one exam question only when ready.

Highest-priority fixes:

1. Make the homepage only a four-course choice.
2. Make each course landing page a topic picker, not a multi-mode dashboard.
3. Add a clear "Start here" topic treatment.
4. Add a positive topic-chosen transition.
5. Convert Field Guide pages from long stacks into one visible phase at a time.
6. Connect each Field Guide phase directly to the matching Skill Check.
7. Rename and shape Practice around focused Skill Checks.
8. Convert Exam Training to one question at a time.
9. Remove internal/admin/project language from student surfaces.
10. Simplify top navigation and hide advanced paths until useful.

## 2. Core UX Principles For Asterion

Every student-facing page should follow these principles:

- One decision at a time.
- One main action per screen.
- Never show internal project/admin language to students.
- Never show walls of stacked boxes.
- Prefer guided steps over document dumps.
- Give students a visible win early.
- Keep topic choice obvious.
- Keep next steps obvious.
- Ask for student action roughly every 2-4 minutes.
- Practice should follow directly from learning.
- Exam Training should be one question at a time.
- Navigation should work even if the student is tired, anxious, or weak at maths.
- Students should not need to understand the app structure to use the app.
- Make the default path gentle, but preserve fast routes for confident students.
- Use progress as orientation, not pressure.
- Use exam images as the source of truth, but never dump a wall of them.
- Keep static GitHub Pages compatibility; do not solve UX with backend state or complex routing.
- For P1, M1, and S1, keep the required visible starter-content limitation, but phrase it as student-safe "starter notes" or "check with your teacher" copy instead of internal audit language.

## 3. Three Student-Perspective Passes

### A. Low-Achieving / Anxious Student

Assumptions:

- They may already believe they are bad at maths.
- They are easily overwhelmed by too many choices.
- They may not know what topic they should study.
- They may abandon the page if it looks like a textbook or a test.
- They need encouragement, clear instructions, tiny wins, and low-risk first actions.

Homepage experience:

- Current: Mostly good because four course cards are visible, but top nav repeats the same choices and the hero copy still explains the product instead of immediately asking for one action.
- Pain point: The student sees "CAIE 9709 Study Hub", "Courses", four nav items, "Available courses", and four cards. It is not terrible, but still more explanatory than necessary.
- Recommendation: Make the homepage feel like "Which paper today?" with four large buttons/cards and no other study-mode options.

Course selection:

- Current: The course card works, but the course landing page immediately shows top nav, course hero, action nav, topic grid, Field Guide, Practice, and Exam Training choices.
- Pain point: The student has just made one decision and is immediately asked to understand three study modes.
- Recommendation: After course selection, show only course welcome and topic cards. If a default topic is known, mark it "Start here."

Topic selection:

- Current: P3 course topic cards link directly to Field Guide, which is a good default, but the topic index and topic hub also expose several alternate routes.
- Pain point: The student may not know whether to choose topic overview, Field Guide, Practice, or Exam Training.
- Recommendation: Make each topic card one primary click. The card should enter a topic-start screen or the first Field Guide phase, not a decision hub.

First Field Guide interaction:

- Current: P3 Field Guide shows all sections in a long stack. P1 topic overview uses a guided six-phase panel, but P1 Field Guide still shows a long stack.
- Pain point: A low-confidence student sees "Section 1 of 7" and then many examples and optional details. The page looks like a document.
- Recommendation: Show one phase only. The first phase should be small, friendly, and clearly completable.

After a small explanation:

- Current: P3 section footer says "Next section" or "Go to Practice Questions"; completion is "Mark this section complete."
- Pain point: "Mark complete" is administrative and can feel like schoolwork tracking, not learning.
- Recommendation: Use "I get this" or "Try 3 quick checks" after a phase. Completion should create a tiny visible success state.

Skill Check nudge:

- Current: Skill Check items exist inside Practice pages, but the Field Guide does not link each subtopic to the exact matching check.
- Pain point: "Practice Questions" sounds broad. The student may feel sent away.
- Recommendation: After each subtopic: "Try 3 quick questions on this." Link directly to the matching card stack.

Failure or wrong answers:

- Current: Most static Skill Checks reveal answer/route but do not judge correctness; exam attempts ask for self-marking and reflection.
- Pain point: Revealing an answer can become passive or discouraging.
- Recommendation: Wrong/uncertain handling should say "Review the first step" or "Go back to the example," not "failed." The student should choose "Show hint", "Try again", or "Review this step."

Exam Training introduction:

- Current: Exam Training shows multiple exam question cards immediately.
- Pain point: This looks like a paper dump and can scare off weak students.
- Recommendation: Introduce Exam Training as "One exam-style question." Show one question, optional hint, mark scheme reveal, and a clear review path.

Missing supports:

- A "not sure where to start?" topic recommendation.
- Tiny first action before a full explanation.
- Direct Field Guide to Skill Check links.
- A non-threatening review loop after errors.
- One-question exam mode.

Recommended onboarding path:

1. Pick course.
2. See "Start here" topic.
3. Click topic.
4. See "You're in. We'll take this one step at a time."
5. Read one short Field Guide phase.
6. Press "I get this" or "Show me a hint."
7. Try three matching checks.
8. See "Good, one method locked in."

Recommended navigation model:

- Keep top nav minimal: Asterion Study, Courses, current course.
- On course pages, show topic cards only.
- Inside topic, show a small step indicator: Learn -> Check -> Exam.
- Always provide "Back to topics."

Recommended copy tone:

- Calm, plain, and specific.
- "Try this one first."
- "Use the hint if you need it."
- "Wrong answers are useful here; they show what to review."

Recommended success moments:

- "One idea done."
- "You can now spot the method."
- "That is enough to try the Skill Check."
- "You finished 3 quick checks."

Things we must not show this student:

- "draft", "syllabus-contract", "mastery evidence", "generated practice", "mapping", raw route labels, compatibility routes, Guardian language, admin dashboards, walls of exam questions, and long explanations before action.
- P1/M1/S1 starter-content limits still need to be visible, but should use calm student-safe wording rather than internal project terms.

### B. Average Student

Assumptions:

- They know which paper they study.
- They may know some topics but not all.
- They want to revise efficiently.
- They need structure but do not want to be babied.
- They benefit from clear topic cards, quick Field Guide explanations, Skill Checks, and exam-style practice.

Speed to useful study:

- Current: They can reach a useful P3 Field Guide in two clicks from homepage, which is good.
- Problem: Along the way, the site exposes extra routes and repeated choices. The topic hub adds another decision layer if they land there.
- Recommendation: Preserve the two-click path, but make it course -> topic -> first Field Guide phase by default.

Next step clarity:

- Current: Topic pages show Learn/Practice/Revise, but Field Guide and Practice are still separate destinations rather than a connected loop.
- Recommendation: Every page should have one highlighted next action. Secondary actions should be visually quiet.

Field Guide, Practice, and Exam Training connection:

- Current: Connected by links, not by learning sequence.
- Recommendation: Each Field Guide subtopic should declare its matching Skill Check. Each Skill Check completion should offer "Next Field Guide phase" or "One exam question on this."

Topic cards and progress:

- Current: Course topic cards are visual and clickable. P3 topic index cards include several buttons each, which creates scanning load.
- Recommendation: Course landing cards should be the main topic picker. Topic index/hub cards should have one primary click and small status labels: Recommended, Started, Completed.

Momentum:

- Current: Momentum is interrupted by broad pages and grids.
- Recommendation: Use a short stepper: Phase 1 -> Skill Check -> Phase 2 -> Skill Check -> Exam readiness.

Recommended default flow:

1. Course landing topic card.
2. Topic micro-win.
3. Guided Field Guide phase.
4. Three-question Skill Check.
5. Next Field Guide phase.
6. Topic summary.
7. One-topic Exam Training.

Recommended topic page layout:

- Hero: topic name, one sentence, "Start Field Guide."
- Status strip: Not started / in progress / ready for exam.
- Main content: first recommended step.
- Secondary: skip to Skill Check, skip to Exam Training.

Recommended Field Guide flow:

- One phase visible.
- Phase title, purpose, one worked example, optional support.
- Primary CTA: "Try Skill Check" or "Next phase."
- Secondary: "Back to topics", "Skip to practice."

Recommended Skill Check flow:

- One focused skill.
- Three questions maximum for default set.
- One visible question at a time.
- Hint/reveal available.
- Save completion or "Done" after set.

Recommended Exam Training flow:

- Topic-first by default.
- One question visible.
- Mark scheme hidden until reveal.
- Self-mark/reflection if saving is allowed.
- "Review Field Guide section" if the student struggled.

Recommended progress feedback:

- Small and local: "2 of 5 phases done", "3 quick checks done."
- Avoid large dashboards before the student studies.

Recommended attention hooks:

- After explanation: "Pick the method."
- After example: "Try one."
- After Skill Check: "Ready for the next idea?"
- After topic: "One exam-style question?"

### C. High-Achieving / Exam-Focused Student

Assumptions:

- They may already know the content.
- They want speed, precision, and exam readiness.
- They may want to jump directly to weak areas.
- They do not want excessive motivational friction.
- They still benefit from good navigation and one-question-at-a-time exam practice.

Specific topic access:

- Current: Top nav and topic pages allow fast movement, but duplicated compatibility routes and multi-button cards increase scanning.
- Recommendation: Add a clear fast path on topic cards: "Already confident? Skill Check" and "Exam Training" as quiet secondary links.

Skipping Field Guide:

- Current: P3 topic hub and topic index offer Practice and Exam Training links. Course landing topic cards default to Field Guide.
- Recommendation: Keep skip routes, but make them secondary so they do not distract weaker students.

Exam training efficiency:

- Current: Exam grids provide volume, but not focus. Mixed selection uses first-N logic and shows many cards.
- Recommendation: One-question interface with quick next/previous, topic/subskill filters, and mark count. Advanced students can move quickly without loading a wall.

Challenge:

- Current: Challenge-level Skill Checks exist in data, but student flow does not foreground a challenge mode.
- Recommendation: Add optional "Challenge set" only after default Skill Check or as a secondary fast path. Do not use deprecated difficulty metadata for routing.

Progress and mastery signals:

- Current: Local progress counts are useful but can appear before action.
- Recommendation: Keep compact local progress in topic headers and exam summaries, not as a dashboard wall.

Recommended fast path:

1. Course.
2. Topic.
3. Skip to Skill Check or Exam Training.
4. Work one question.
5. If wrong, jump to exact Field Guide phase.
6. Continue next question.

Recommended shortcuts:

- "Skip to Skill Check."
- "One exam question now."
- "Review only this method."
- "Next question."
- "Filter by topic."

Recommended challenge mode behavior:

- Optional and quiet.
- Uses reviewed skill/check metadata only.
- Does not gate progress or inflate mastery.
- Uses production answers where possible, not recognition-only multiple choice.

Recommended exam question flow:

- One question visible.
- Metadata visible: topic, paper/session, marks.
- Mark scheme hidden.
- After reveal, self-mark or continue.
- Review link to exact Field Guide phase.

Recommended review-after-error flow:

- "Review the method behind this question."
- "Try one quick check before another exam question."
- "Continue anyway" available for confident students.

Engagement without overwhelming everyone:

- Offer advanced controls in a collapsed "Change focus" or small filter row.
- Keep the default surface calm.

## 4. Current Flow Map

| Page/route | Student goal | Current decisions | Primary action clarity | Cognitive load | Remove/hide/merge/delay | Suggested next action |
| --- | --- | --- | --- | --- | --- | --- |
| Homepage `docs/index.html` | Choose paper | Course card, top nav course links, read hero, inspect visual | Mostly clear | Hero explanation and repeated nav add mild load | Hide nonessential nav emphasis; make four choices dominant | Choose course |
| Course landing `/{course}/` | Pick topic | Topics, Field Guide, Practice, Exam Training, top nav | Mixed; "Topics" and "Field Guide" both appear primary | Too many modes immediately after course choice | Remove course action nav or demote it; keep topic cards | Pick a topic |
| P3 topic index `/p3/topics/` | Pick P3 topic or mode | Start Algebra, choose another topic, Exam Training, each card has four links | Not clear; cards have multiple actions | Wall of topic cards and mode links | Make each topic card one primary action; keep secondary links quiet | Open recommended topic |
| Topic hub `/p3/topics/algebra/` | Start learning topic | Field Guide, Practice, Exam Training, progress, availability, entry cards | Field Guide is primary but repeated with alternatives | Duplicates choices and summaries before action | Merge topic hub into topic start; hide availability | Start first Field Guide phase |
| P1/M1/S1 topic overview | Learn topic | Overview, formulae, goals, guided phases, Practice, Exam Training | Guided phases are promising | Still starts with overview/formula cards before guided action | Make guided phase first; move formulae into optional support | Start phase 1 |
| Field Guide `/field-guide/` | Learn method | Start first section, Practice, section list, mark all, complete section, optional support | Primary action exists but content stack dominates | Long document page, many sections visible | One visible phase at a time; collapse section list by default | Complete current phase or Skill Check |
| Practice `/practice/` | Try focused checks | Start first question, jump exam questions, review guide, section list, many groups | One-card JS helps but page still broad | Practice and exam images share a page; many sections | Make Skill Check page focused; move exam images to Exam Training | Try 3 quick questions |
| Topic Exam Training `/topics/.../exam-training/` | Do exam practice for topic | Start topic questions, Practice, Back to topics, grid of questions | Start is clear, but grid dominates | Multiple exam cards at once | One question at a time | Attempt one question |
| Course Exam Training `/{course}/exam-training/` | Mixed exam practice | Back to topics, start mixed, topic routes, question grid | Mixed; page is a dashboard and question wall | Question availability counts and many cards | Make topic/filters first, then one question | Start one mixed question |
| Compatibility routes `/topics/...`, `/regions/`, `/exam-training/` | Legacy access | Same as P3 pages but with legacy paths | Can confuse if discovered | Exposes implementation history | Keep for redirects/compatibility only; remove from normal nav | Route to canonical P3 path |
| Historical React routes/components | Not production static flow | Dashboard, Guardian, class, avatar, auth | Out of scope | Legacy product language risk if revived | Do not expand unless explicitly revived | Keep static study focus |

## 5. Proposed Future Flow

### Homepage

Student sees four course choices only:

- Pure Mathematics 1
- Pure Mathematics 3
- Mechanics 1
- Probability & Statistics 1

The page should not ask the student to understand Field Guide, Skill Check, Exam Training, progress, or course status. The top nav should not compete with the four course choices.

### Course Landing

Student sees:

- A welcoming course hero.
- "Start here" guidance.
- Topic cards.
- A subtle glow or "Start here" treatment for the first recommended topic.

The page should not show:

- A wall of options.
- Internal draft/audit text. For P1/M1/S1, replace this with a short student-safe starter-content label where needed.
- Separate Field Guide/Practice/Exam Training nav as equal actions.

### Topic Selection

Each topic card should be visual and clickable. Each card should include:

- Topic name.
- Small syllabus code only if helpful.
- Tiny visual, equation, graph, or diagram.
- Clear state: Recommended, Started, Completed.

The whole card should start the recommended topic path. Secondary links for high-achieving students can appear as small text or in a compact menu.

### Topic Chosen Micro-Win

After topic click, show a small positive transition before content:

- "Good choice. Series is one of the quickest topics to level up."
- "You're in. We'll take this one step at a time."
- "Nice. This topic is mostly pattern spotting."

This should be specific, short, and not fake. It should not become a large motivational page.

### Field Guide

The Field Guide should be guided, not dumped:

- One phase visible at a time.
- Clear highlighted primary CTA.
- Short enough for a few minutes.
- Optional support hidden until requested.
- A student action every 2-4 minutes.

Possible actions:

- Answer a tiny check.
- Reveal a hint.
- Choose AP vs GP.
- Pick a formula.
- Press "I get this."
- Open matching Skill Check.
- Continue to next phase.

### Skill Check

After a Field Guide subtopic:

- Suggest the matching Skill Check.
- Link directly to the exact subtopic just learned.
- Phrase it as "Try 3 quick questions on this."

Practice should be:

- One skill or subtopic at a time.
- Short question sets.
- Clear feedback.
- Easy return to Field Guide.

### Exam Training

Exam Training must be one question at a time:

- Question image.
- Optional hint or "first step" nudge.
- Answer input or self-mark/reveal flow.
- Mark scheme / worked solution reveal.
- Next question.
- Related Field Guide section.

No exam question walls.

## 6. Overarching Goals, Subgoals, And Paths

### Goal 1: Make The First Decision Effortless

Why it matters: The first screen determines whether students feel oriented or overloaded.

Subgoals:

- Homepage only requires course choice.
- Course cards are short and clickable.
- No long syllabus paragraphs.
- No internal language.
- Student immediately knows what to press.

Path:

- Update `renderCourseSelectorPage` in `scripts/build-static-site.ts`.
- Simplify homepage hero copy and section heading.
- Keep four `COURSES`-driven cards from `src/data/courses.ts`.
- Reduce top nav prominence on homepage.

Pages affected: `docs/index.html` after regeneration.

Components/files likely affected: `scripts/build-static-site.ts`, `src/static-study/static-study.css`, `src/data/courses.ts` only if copy changes.

Risks:

- Do not hard-code course cards outside centralized course data.
- Do not remove accessibility labels.

Acceptance criteria:

- First viewport clearly contains four course choices.
- No Field Guide, Practice, Exam Training, draft, audit, or progress language appears on homepage.
- Student can identify the next click in under 5 seconds.

### Goal 2: Make Topic Selection Obvious And Motivating

Why it matters: Topic choice is the second decision. It must not turn into mode choice.

Subgoals:

- Course landing page shows topic cards.
- First recommended topic has subtle glow or "Start here."
- Topic cards are visual.
- Topic cards do not overload the student.
- Progress states are visible but not noisy.

Path:

- Simplify `renderCourseDashboardPage`.
- Remove or demote `renderCourseActionNav`.
- Add recommended/start state to the first topic card.
- Ensure P3 and seeded courses share the same card model.

Pages affected: `/{course}/`.

Components/files likely affected: `scripts/build-static-site.ts`, `src/static-study/static-study.css`, `src/data/courses.ts`, `src/data/courseSeedContent.ts`.

Risks:

- Do not hide topic access.
- Do not use deprecated difficulty as recommendation logic.

Acceptance criteria:

- Course landing asks only "which topic?"
- One recommended topic is obvious.
- Field Guide/Practice/Exam Training are not equal top-level choices before topic selection.

### Goal 3: Give The Student An Early Win

Why it matters: A small win reduces anxiety and creates momentum before harder maths.

Subgoals:

- After course/topic selection, show a positive transition.
- First Field Guide step feels achievable.
- Avoid making the student feel tested immediately.
- Use short confidence-building copy.

Path:

- Add a topic-start/micro-win block to topic entry pages or Field Guide first phase.
- Use deterministic copy based on topic metadata, not fake adaptive claims.
- Keep it small enough not to become an extra page.

Pages affected: topic hub/start pages and Field Guide first phase.

Components/files likely affected: `scripts/build-static-site.ts`, topic metadata files.

Risks:

- Avoid fake praise.
- Avoid claims about ease that are false for weaker students.

Acceptance criteria:

- Topic click leads to a clear positive confirmation.
- First action is reading or interacting with one small idea, not scanning a whole topic.

### Goal 4: Turn Field Guide Into A Guided Path

Why it matters: Current Field Guides still behave like document dumps.

Subgoals:

- One phase visible at a time.
- Clear "Next" action.
- Short explanations.
- Tiny interactions every few minutes.
- Direct links from each subtopic to relevant Skill Check.
- Clear return path from Skill Check to Field Guide.

Path:

- Reuse or extend the `data-guided-study` pattern in `src/static-study/static-study.js`.
- Apply it to P3 `renderFieldGuidePage` and seeded `renderSeedFieldGuidePage`.
- Keep no-JS fallback meaningful by stacking content only when JavaScript is unavailable.
- Add per-phase CTA metadata for Skill Check links.

Pages affected: all `/field-guide/` pages.

Components/files likely affected: `scripts/build-static-site.ts`, `src/static-study/static-study.js`, `src/static-study/static-study.css`, `src/data/fieldGuideTopics.ts`, `src/data/courseSeedContent.ts`.

Risks:

- Do not bury all content for no-JS users.
- Do not break anchor links from existing pages.
- Do not turn every phase into a decorative card wall.

Acceptance criteria:

- With JavaScript, only one Field Guide phase is visible.
- Each phase has one primary CTA.
- There is a direct Skill Check link where matching data exists.

### Goal 5: Make Skill Check The Natural Next Step

Why it matters: Practice should feel like applying the thing just learned, not finding another page.

Subgoals:

- Skill Check follows Field Guide subtopics.
- Questions are grouped by exact skill.
- Student gets feedback quickly.
- Wrong answers suggest review, not failure.
- Skill Check completion gives a visible reward/progress signal.

Path:

- Rename student-facing "Practice Questions" to "Skill Check" where the content is authored/focused checks.
- Keep "Practice" only as broader label if needed.
- Add direct anchors from Field Guide phase to matching practice group.
- Limit default set to 3 visible questions.
- Keep optional extra/guided/generated practice behind "More practice."

Pages affected: `/practice/` pages and Field Guide phase footers.

Components/files likely affected: `scripts/build-static-site.ts`, `src/static-study/static-study.js`, `src/static-study/static-study.css`, `src/data/skillCheckItems.ts`, `src/lib/skillChecklist.ts`.

Risks:

- Generated content must remain reviewed/support-only according to existing boundaries.
- Skill Checks must not become mastery evidence.

Acceptance criteria:

- A student can go from a Field Guide phase to exact matching Skill Check in one click.
- Skill Check shows one item at a time.
- Completion offers review or next phase.

### Goal 6: Make Exam Training Focused And Calm

Why it matters: Exam Training currently exposes question walls, which is the exact experience anxious students avoid.

Subgoals:

- One exam question at a time.
- No exam question walls.
- Mark scheme and worked solution are available after attempt/reveal.
- Related Field Guide links are available.
- Student can continue, review, or stop cleanly.

Path:

- Extend `setupPracticeStacks` or create a similar `setupExamQuestionFlow` for `.exam-question-grid`.
- Render exam questions as a one-question stack with controls.
- Add topic/subtopic and related Field Guide link per card.
- For no-JS fallback, keep cards readable but do not put mixed guidance above the first question.

Pages affected: course Exam Training and topic Exam Training pages.

Components/files likely affected: `scripts/build-static-site.ts`, `src/static-study/static-study.js`, `src/static-study/static-study.css`, `src/lib/courseExamTraining.ts`, `src/lib/questionTraining.ts`.

Risks:

- Do not remove canonical question and mark-scheme image pairs.
- Do not rely on unreviewed routing for mastery.
- Do not use deprecated difficulty.

Acceptance criteria:

- With JavaScript, only one exam question is visible.
- Controls show "Question 1 of N", Previous, Next.
- Each card has a review link when a safe mapping exists.

### Goal 7: Keep Attention Without Overwhelming

Why it matters: Students need regular actions, but not gimmicks.

Subgoals:

- Every 2-4 minutes, ask for an action.
- Use progress, glow, cards, small wins, and active prompts.
- Avoid gimmicks that distract from maths.
- Keep fun elements on onboarding and encouragement moments, not every serious learning interaction.

Path:

- Add phase-level CTAs and tiny checks.
- Add compact progress indicators.
- Keep visual treatments subtle.

Pages affected: all student-facing study pages.

Components/files likely affected: `scripts/build-static-site.ts`, `src/static-study/static-study.js`, `src/static-study/static-study.css`.

Risks:

- Do not revive Guardian/avatar/RPG systems.
- Do not create fake progress.

Acceptance criteria:

- Each learning phase ends with a clear action.
- Students are never asked to read a long uninterrupted document before acting.

## 7. Navigation Model

Top nav:

- Default: Asterion Study logo/home, Courses, current course.
- On a course page: show current course only as context, not four competing course links.
- On topic pages: show Back to topics and current topic stepper.
- Hide legacy compatibility routes from normal nav.
- Do not show Exam Training as a global top-nav item until inside a selected course.

Course nav:

- Course landing is topic selection.
- No separate Field Guide/Practice/Exam Training nav before topic choice.
- Course Exam Training can appear as secondary after topics or in a compact "Exam ready?" band.

Topic nav:

- Topic page uses Learn -> Skill Check -> Exam as a simple stepper.
- One primary CTA at a time.
- Secondary fast paths are available but quiet.

Field Guide phase nav:

- Show current phase count.
- Show Back, Next, Skill Check.
- Optional phase list hidden in a disclosure or compact menu.

Practice navigation:

- One question visible.
- Previous/Next controls.
- Link back to the exact Field Guide phase.
- After set: continue Field Guide, more checks, or one exam question.

Exam Training navigation:

- One question visible.
- Previous/Next controls.
- Topic/filter controls collapsed or compact.
- Related Field Guide link on each question.

Breadcrumbs:

- Use simple text links: Courses -> P3 -> Algebra.
- Always include "Back to topics."

CTA placement:

- Primary CTA in hero or active phase footer.
- Secondary CTAs below or in a small quiet row.
- Never place three equal buttons above the first learning action.

Hidden until needed:

- Progress details.
- Full section list.
- Extra practice.
- Mixed exam filters.
- Mark scheme.
- Compatibility route labels.

## 8. Page-By-Page Redesign Plan

### Homepage

Purpose: Choose course.

Primary action: Pick P1, P3, M1, or S1.

Secondary actions: None beyond basic navigation/home.

Remove:

- Long product explanation.
- Study-mode references.
- Any status/draft wording.

Keep:

- Four course cards from centralized course data.
- Accessible card labels.

Add:

- Short prompt: "Which paper are you studying today?"
- Four large obvious course choices.

Empty/loading/error states:

- Static page should not need loading state.
- If course metadata missing, build should fail rather than render partial navigation.

Student considerations:

- Low-achieving: no syllabus paragraphs or exam imagery that feels threatening.
- Average: paper choice obvious.
- High-achieving: can click immediately.

### Course Landing Page

Purpose: Choose topic.

Primary action: Pick one topic.

Secondary actions: Course-level Exam Training, quiet and delayed.

Remove:

- Equal Field Guide/Practice/Exam Training action nav.
- Course coverage summaries and internal status labels.

Keep:

- Course identity.
- Topic card grid.
- Course metadata from `src/data/courses.ts`.
- Required P1/M1/S1 starter-content notices, phrased without "draft", "audit", or "syllabus-contract."

Add:

- "Start here" topic treatment.
- Topic progress state.
- Optional "Already revising? Go to Exam Training" link below topics.

Empty/loading/error states:

- "Topic pages are being prepared" only when no topics exist.

Student considerations:

- Low-achieving: recommended topic reduces uncertainty.
- Average: clear topic grid.
- High-achieving: secondary skip to Exam Training remains available.

### Topic Card Grid

Purpose: Make topic selection fast and motivating.

Primary action: Open topic path.

Secondary actions: Small "Skill Check" or "Exam" shortcut only if space allows.

Remove:

- Four equal buttons inside each P3 topic card.
- Long descriptions.

Keep:

- Topic name.
- Tiny visual/formula.
- Syllabus code if helpful.

Add:

- Status chip: Start here, Started, Done.
- Whole-card click.

Empty/loading/error states:

- If no topics, show one calm message and no fake cards.

Student considerations:

- Low-achieving: one click per card.
- Average: scannable names.
- High-achieving: shortcut menu.

### Field Guide Topic Page

Purpose: Teach one subtopic at a time.

Primary action: Complete current phase or open matching Skill Check.

Secondary actions: Back to topics, skip to Skill Check, phase list.

Remove:

- Full visible stack of all Field Guide sections.
- "Mark all sections complete" as a prominent student action.
- Administrative completion language.

Keep:

- Worked examples.
- Optional support details.
- No-JS readable fallback.

Add:

- One active phase.
- Phase progress.
- Tiny interaction/check.
- Direct Skill Check CTA.

Empty/loading/error states:

- If no Field Guide topics, show "This guide is being prepared. Start with Skill Check or return to topics."

Student considerations:

- Low-achieving: first phase must feel achievable.
- Average: clear phase flow.
- High-achieving: skip controls.

### Skill Check / Practice Page

Purpose: Apply exactly the skill just learned.

Primary action: Try current question.

Secondary actions: Hint, reveal route, review Field Guide, next question.

Remove:

- Mixed exam questions from Skill Check default surface.
- Long section nav before first question.
- Broad "Practice Questions" naming when content is Skill Check.

Keep:

- Existing authored Skill Check items.
- One-card JS pattern.
- Hints/worked routes.

Add:

- "3 quick questions" framing.
- Exact subtopic anchor targets.
- Completion message.
- Return-to-Field-Guide CTA.

Empty/loading/error states:

- If no checks exist, offer "Review Field Guide" and "Try one exam question" only if safe.

Student considerations:

- Low-achieving: wrong answer is a review cue.
- Average: quick focused set.
- High-achieving: challenge/more practice secondary.

### Exam Training Page

Purpose: Practise exam questions calmly.

Primary action: Attempt one question.

Secondary actions: Hint/first step, reveal mark scheme, self-mark, next question, review Field Guide.

Remove:

- Exam question grids/walls.
- Question availability counts as the main first-viewport content.
- Topic dashboard before first question.

Keep:

- Canonical question image and mark-scheme image.
- Self-marking where safe.
- Topic/paper/marks metadata.

Add:

- One-question flow.
- Related Field Guide link.
- "Stop here" or "Back to topics" after a saved attempt.

Empty/loading/error states:

- If no image pair exists, explain simply: "No exam image is available for this topic yet."
- Avoid "records", "routing", or "local image files missing" in student-facing copy.

Student considerations:

- Low-achieving: exam mode introduced as one question, not a paper dump.
- Average: steady revision loop.
- High-achieving: next question and filter controls are fast.

### Progress / Completion States

Purpose: Orient and reward without pressure.

Primary action: Continue next step.

Secondary actions: Review previous step.

Remove:

- Progress dashboards before study action.
- Progress copy that sounds like grading or mastery evidence.

Keep:

- LocalStorage progress in `src/static-study/static-study.js`.
- Browser-local language.

Add:

- Small phase completion state.
- "One idea done" copy.
- Topic card Started/Done state.

Empty/loading/error states:

- If localStorage unavailable, content remains usable and progress text becomes informational.

Student considerations:

- Low-achieving: progress shows effort, not failure.
- Average: progress supports momentum.
- High-achieving: progress is compact.

## 9. Microcopy Plan

Tone:

- Clear.
- Encouraging.
- Not childish.
- Not fake.
- Not corporate.
- Not teacher-scolding.
- Suitable for 15-18 year olds.

Avoid:

- "draft"
- "syllabus-contract"
- "generated practice"
- "mastery evidence"
- "mapping"
- raw internal labels
- huge explanations before action

Examples:

Course selection:

- "Which paper are you studying today?"
- "Choose your paper."

Recommended first topic:

- "Start here"
- "Good first topic"
- "Recommended first"

Topic chosen confirmation:

- "You're in. We'll take this one step at a time."
- "Good choice. This topic gets easier once you spot the pattern."
- "Nice. Start with one small idea."

Field Guide next step:

- "Read this example, then try one check."
- "Got the idea? Try 3 quick questions."
- "Next: spot the method."

Skill Check suggestion:

- "Try 3 quick questions on this."
- "Lock this in before the next section."
- "One short check now."

Wrong answer feedback:

- "Not quite. Review the first step and try again."
- "This usually means the method choice needs another look."
- "Use the hint. The mistake is fixable."

Correct answer feedback:

- "Good. That method is working."
- "Nice. You can move on."
- "One idea done."

Exam Training intro:

- "One exam-style question."
- "Work on paper first. Reveal the mark scheme when ready."
- "Try this calmly; it is just one question."

Review suggestion:

- "Review the Field Guide section behind this question."
- "Go back to the example, then try another."
- "This question uses the same move from the last section."

## 10. Attention And Engagement Plan

| Prompt | Where it appears | Action | Why it reduces cognitive load | Avoiding annoyance for high achievers |
| --- | --- | --- | --- | --- |
| "Try this one." | After a short example | Opens tiny check | Converts reading into action | High achievers can answer quickly or skip |
| "Pick the correct formula." | Formula-heavy phases | Select formula | Narrows focus to one decision | Keep as optional quick check |
| "Before you continue, check this." | End of Field Guide phase | Tiny self-check | Prevents passive scrolling | Let users continue |
| "Want to lock this in with 3 quick questions?" | After subtopic | Open Skill Check | Connects learning to practice | Secondary "Skip" link |
| "You just finished the idea. Skill Check?" | Phase completion | Skill Check CTA | Makes next action obvious | High achievers can jump to exam |
| "One exam-style question?" | After Skill Check set | Start exam question | Exam practice becomes small | Advanced users can use filters |
| "Review the first step?" | After wrong/uncertain answer | Open relevant Field Guide section | Frames errors as repair | High achievers can continue |
| "Next idea?" | After Skill Check completion | Next Field Guide phase | Maintains flow | No forced delay |

Engagement should come from visible progress and purposeful action, not from decorative gamification.

## 11. Information Architecture Cleanup

Current confusing IA:

- Duplicate P3 paths: `/p3/topics/...` and `/topics/...`.
- Regions compatibility pages exist even though current student model is course/topic.
- Course landing pages act like both topic pickers and study-mode dashboards.
- Topic hubs repeat Field Guide/Practice/Exam Training decisions already shown elsewhere.
- Practice and Skill Check are mixed in naming and behavior.
- Practice pages include exam questions, blurring Skill Check versus Exam Training.
- Exam Training is sometimes global, sometimes course-level, sometimes topic-level.
- Some generated student text can still expose record/image availability concepts.
- Historical React app files contain Guardian, avatar, class, teacher, and dashboard concepts that must not drift back into static student pages.

Simplest IA:

```text
/
  p1/
    topics/{topic}/
      field-guide/
      skill-check/
      exam-training/
    exam-training/
  p3/
    topics/{topic}/
      field-guide/
      skill-check/
      exam-training/
    exam-training/
  m1/
    topics/{topic}/
      field-guide/
      skill-check/
      exam-training/
    exam-training/
  s1/
    topics/{topic}/
      field-guide/
      skill-check/
      exam-training/
    exam-training/
```

Normal student route:

```text
Course -> Topic -> Field Guide phase -> Skill Check -> next phase -> Exam Training
```

Compatibility routes can remain generated for old links, but they should not appear in normal navigation.

## 12. Implementation Roadmap

### Phase 1: Remove Student-Facing Clutter And Fix Core Navigation

Files/components likely involved:

- `scripts/build-static-site.ts`
- `src/static-study/static-study.css`
- `src/lib/staticStudyRoutes.ts`
- `scripts/check-static-site.mjs`

Risks:

- Breaking required static routes.
- Removing links needed for accessibility or no-JS fallback.

Dependencies:

- None.

Acceptance criteria:

- Top nav is simpler.
- Course pages no longer show Field Guide/Practice/Exam Training as equal pre-topic choices.
- Compatibility routes still build but are hidden from normal student path.

Manual test plan:

- Open `/`, `/p1/`, `/p3/`, `/m1/`, `/s1/`.
- Confirm next click is obvious.
- Check mobile header does not wrap into clutter.

### Phase 2: Redesign Homepage And Course Landing Into Course -> Topic Flow

Files/components likely involved:

- `renderCourseSelectorPage`
- `renderCourseDashboardPage`
- `renderCourseCard`
- topic card CSS in `src/static-study/static-study.css`

Risks:

- Topic cards become too visually dense.
- Recommended state accidentally uses unsupported/difficulty metadata.

Dependencies:

- Phase 1 nav simplification.

Acceptance criteria:

- Homepage only requires course choice.
- Course landing only requires topic choice.
- First recommended topic is visible.
- P1/M1/S1 starter-content status remains visible in student-safe language where required by project boundaries.

Manual test plan:

- Click each course from homepage.
- Confirm topic grid appears without internal language.
- Verify keyboard focus order.

### Phase 3: Redesign Field Guide Into Guided Phases

Files/components likely involved:

- `renderFieldGuidePage`
- `renderSeedFieldGuidePage`
- `renderFieldGuideTopic`
- `src/static-study/static-study.js`
- `src/static-study/static-study.css`

Risks:

- No-JS users lose access if content is hidden by default.
- Anchor links break.
- Long math content overflows in one-phase panel.

Dependencies:

- Existing `data-guided-study` pattern.

Acceptance criteria:

- One phase visible with JavaScript.
- No-JS fallback remains readable.
- Each phase has a clear primary CTA.

Manual test plan:

- Open P3 Algebra Field Guide, P1 Quadratics Field Guide, M1 and S1 Field Guides.
- Test Next/Back.
- Test anchors.
- Test mobile.

### Phase 4: Connect Field Guide Subtopics To Skill Checks

Files/components likely involved:

- `renderPracticePage`
- `renderSeedPracticePage`
- `renderSkillPracticeGroup`
- `renderSeedDraftSkillChecks`
- `src/lib/skillChecklist.ts`
- `src/data/skillCheckItems.ts`

Risks:

- Some topics have no exact Skill Check mapping.
- Generated/guided practice may be mistaken for reviewed exam evidence.

Dependencies:

- Phase 3 phase IDs and anchors.

Acceptance criteria:

- Field Guide phase can link to matching Skill Check when available.
- Missing checks show calm fallback.
- Skill Check remains support-only and does not create mastery evidence.

Manual test plan:

- From first P3 Algebra phase, open matching Skill Check.
- Complete/save a check.
- Return to Field Guide.
- Repeat for seeded P1 topic.

### Phase 5: Redesign Exam Training Into One-Question-At-A-Time Flow

Files/components likely involved:

- `renderExamQuestionCard`
- `renderExamTrainingPage`
- `renderTopicExamTrainingPage`
- `renderSeedExamTrainingPage`
- `renderSeedTopicExamTrainingPage`
- `src/static-study/static-study.js`
- `src/static-study/static-study.css`

Risks:

- Canonical image cards must remain accessible.
- Self-mark form must still save correctly for P3 reviewed routes.
- P1/M1/S1 must not imply reviewed mastery.

Dependencies:

- Related Field Guide link mapping where safe.

Acceptance criteria:

- Only one exam question visible with JavaScript.
- Mark scheme remains hidden until reveal.
- Related Field Guide review link appears when safe.

Manual test plan:

- Open `/p3/exam-training/`.
- Navigate questions.
- Reveal mark scheme.
- Save a P3 attempt.
- Open `/p1/exam-training/` and confirm no reviewed-progress claim.

### Phase 6: Add Progress, Wins, And Attention Hooks

Files/components likely involved:

- `src/static-study/static-study.js`
- `src/static-study/static-study.css`
- `scripts/build-static-site.ts`

Risks:

- Fake progress.
- Gamification creep.
- Too many prompts annoying advanced students.

Dependencies:

- Phases and one-question flows.

Acceptance criteria:

- Small win appears after topic start and phase/check completion.
- Topic cards can show started/completed state without becoming dashboards.
- Prompts appear every 2-4 minutes of expected learning flow.

Manual test plan:

- Complete a Field Guide phase.
- Complete a Skill Check.
- Return to course topic grid.
- Confirm state updates and copy remains calm.

## 13. Non-Goals

This planning pass must not do the following:

- No code implementation.
- No curriculum rewrite.
- No new mastery system unless already planned later.
- No new dependencies unless later justified.
- No gamification that distracts from learning.
- No student-facing internal project language.
- No walls of content.
- No exam question walls.
- No backend, authentication, Supabase, teacher/class flows, or dynamic game systems on the static production surface.
- No expansion of legacy Guardian/avatar/RPG/rank systems.
- No use of deprecated difficulty metadata for routing, selection, readiness, or progress.
- No promotion of generated/support content into canonical curriculum authority.

## 14. Final Output Requirements

### Top 10 Highest-Impact Changes Ranked By Urgency

1. Convert Exam Training from question grids to one-question-at-a-time flow.
2. Convert Field Guides from long stacks to one visible phase at a time.
3. Remove equal Field Guide/Practice/Exam Training action nav from course landing pages.
4. Make course landing pages topic-first with "Start here" treatment.
5. Add direct Field Guide phase -> Skill Check links.
6. Rename student-facing focused Practice to Skill Check where appropriate.
7. Add topic-chosen micro-win before first learning phase.
8. Simplify top nav and hide compatibility/legacy routes from normal student flow.
9. Move progress/availability/details behind calm, compact UI.
10. Replace internal/technical empty-state copy with student-safe language.

### Recommended First Implementation Prompt For Next Codex Pass

Implement Phase 1 and Phase 2 only. Do not change curriculum content or exam-bank data. In `scripts/build-static-site.ts` and `src/static-study/static-study.css`, simplify the static student flow so the homepage is only a four-course choice and each course landing page is only a topic picker with one subtle "Start here" topic treatment. Remove or demote the course-level Field Guide/Practice/Exam Training action nav so students are not asked to choose a study mode before choosing a topic. Keep course metadata centralized in `src/data/courses.ts`, preserve all generated static routes, keep compatibility routes generated but out of normal navigation, and avoid student-facing internal language. After implementation, run `npm test`, `npm run build`, `npm run static:check`, and manually verify `/`, `/p1/`, `/p3/`, `/m1/`, `/s1/`, and mobile layout.

### Cognitive-Load Review Checklist For Future UI Work

- Does this screen ask for only one main decision?
- Is there exactly one visually dominant primary action?
- Can a tired/anxious student tell what to press in under 5 seconds?
- Is internal language hidden from students?
- Are Field Guide, Skill Check, and Exam Training connected as a sequence?
- Is the current page avoiding walls of stacked cards?
- Is exam practice one question at a time?
- Does the page ask for action after a short learning interval?
- Is progress orienting rather than pressuring?
- Can a high-achieving student skip ahead without adding clutter for everyone else?
- Does no-JS fallback remain meaningful?
- Are image paths, course data, and topic routing still handled by existing centralized helpers?
- Are P1/M1/S1 starter-content limitations visible in student-safe language while internal draft/audit wording stays out of student copy?
- Is no deprecated difficulty metadata used for routing or readiness?
- Are Guardian/avatar/RPG/classroom concepts absent from static student pages?

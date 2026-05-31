# Course Area Review - P1/P3/M1/S1 Static Study Hub

Date: 2026-05-31

Scope: static multi-course CAIE 9709 study hub covering P1, P3, M1, and S1.

Primary reference: Cambridge International AS & A Level Mathematics 9709 2026-2027 syllabus PDF: https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf

Local evidence inspected:

- `src/data/courses.ts`
- `src/data/courseSeedContent.ts`
- `src/lib/staticStudyRoutes.ts`
- `src/lib/topicStudy.ts`
- `src/lib/examTrainingDashboard.ts`
- `scripts/build-static-site.ts`
- `scripts/check-static-site.mjs`
- `docs/static-pages.json`
- representative generated pages under `docs/p1`, `docs/p3`, `docs/m1`, and `docs/s1`
- P3 coverage/readiness reports under `tools/content_lab/reports/`
- P3 runtime assets under `public/assets/exam-bank-data/`

## Executive Summary

P3 is clearly the strongest course area. It has a complete static topic structure, real Field Guide pages, a large focused practice surface, and image-first exam questions with mark-scheme images. It is not polished, but it is the only course currently suitable for a limited student pilot with explicit caveats.

P1 is the strongest of the new draft-seed courses. Its topic scaffold broadly matches the official P1 shape and the static pages are navigable and readable. It is still not student-ready as exam preparation because it has no reviewed exam-bank mapping, no marked practice, and only short self-check placeholders.

M1 is the weakest and the most dangerous to show students without cleanup. It has useful headings, but mechanics is diagram/model-assumption heavy, and the current pages are mostly prose without actual force diagrams, motion graphs, worked modelling chains, or source-backed exam examples.

S1 is structurally tidy but low-trust as a student resource because statistics needs data tables, diagrams, calculator/table routes, and precise interpretation wording. The scaffold is useful for internal audit, but it should not be treated as reliable exam prep yet.

Overall: the build-first direction is sound. The current system gives a scoreboard. The next passes should raise the lowest-scoring categories instead of adding bulk blindly.

## Static Output Snapshot

Generated from `npm run build` on 2026-05-31.

| Course | Generated course pages | Topic hubs | Field Guide pages | Field Guide sections | Practice pages | Practice cards/prompts | Exam Training | Canonical exam images |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| P1 | yes | 9 | 9 | 18 | 9 | 27 self-check cards | placeholder | no |
| P3 | yes | 9 | 9 | 53 | 9 | 305 practice cards | real P3 static page | yes |
| M1 | yes | 6 | 6 | 12 | 6 | 18 self-check cards | placeholder | no |
| S1 | yes | 5 | 5 | 10 | 5 | 15 self-check cards | placeholder | no |

P3 static manifest count: 57 trainable P3 questions. P3 generated topic practice pages currently display 45 exam-question cards across topic pages, plus 12 mixed exam-training cards.

## Validation Run

| Command/check | Result | Notes |
| --- | --- | --- |
| `npm run build` | passed | Generated 130 static HTML pages in `docs/`. This is also the static generation command. |
| `npm run static:check` | passed | Static site check passed for 130 HTML pages in `docs/`. |
| `npm test` | passed | 55 test files, 459 tests passed. |
| Static image reference existence check | passed | 228 generated image references, 0 missing files. |
| Representative Playwright file check | passed with caveat | No console errors or horizontal overflow on sampled desktop/mobile pages. Lazy-loaded image natural widths are not reliable under `file://`, so file existence was checked separately. |

No validation command failed.

## Critical Trust Warnings

- P1, M1, and S1 are draft seed content only. They are useful for navigation and audit, not for confident student exam preparation.
- P1/M1/S1 currently have no reviewed runtime question-bank mapping, no canonical question/mark-scheme image pairs, no marks workflow, and no mastery eligibility.
- P3 is the only course where image-first exam practice is meaningfully wired.
- P3 still has remaining evidence/readiness issues: the local coverage matrix reports 40 reviewed P3 skills, with 36 `ready_for_review`, 3 `missing_support`, and 1 `blocked_for_mastery`.
- P3 Exam Training currently samples a small visible subset of questions. It should not be treated as a balanced full-paper trainer yet.
- Content generated or mechanically seeded for P1/M1/S1 should remain visibly labelled as draft until a syllabus-contract audit verifies wording, examples, formula scope, and exam alignment.

## P1 - Pure Mathematics 1

### Rating Table

| Category | Rating | Reason |
| --- | ---: | --- |
| Syllabus alignment | 6 | Topic headings broadly match P1: quadratics, functions, coordinate geometry, circular measure, trigonometry, series/binomial, differentiation, integration. Needs line-by-line syllabus-contract audit. |
| Coverage completeness | 4 | All main areas have pages, but coverage is shallow and mostly introductory. |
| Field Guide usefulness | 4 | Each topic has two short Field Guide sections. Useful as a checklist, not enough as a teaching resource. |
| Practice readiness | 3 | Three self-check prompts per topic exist, but no reviewed question sets, marks, or source-backed exam examples. |
| Exam Training readiness | 2 | Placeholder direction page only. No P1 exam-bank mapping or image-first practice. |
| Student navigation clarity | 7 | Course dashboard, topic index, topic pages, Field Guide, Practice, and Exam Training placeholder are clear. Draft warnings are visible. |
| UI/readability | 7 | Static layout is consistent, responsive, and readable in sampled pages. |
| Content trustworthiness | 4 | Content looks plausible and on-topic, but it is draft generated/seeded content without official-syllabus audit or source-backed examples. |
| Overall pilot readiness | 4 | Good internal scaffold. Not ready for an external student pilot except as clearly labelled draft notes. |

### Current Strengths

- P1 has the broadest draft-seed scaffold of the non-P3 courses: 9 topic hubs, 9 Field Guides, 9 practice placeholders, and 27 self-check cards.
- The topic split is student-friendly. Separating Binomial Expansion from Sequences and Series is sensible even if both share the local `9709 P1 1.6` seed reference.
- Draft warnings are visible and repeated.
- The page structure follows the P3 learning path without claiming P3-level readiness.
- Navigation is clean from course dashboard to topic index to topic-specific pages.

### Major Weaknesses

Structural problems:

- P1 has no reviewed course skill map equivalent to the P3 skill map.
- There is no clean distinction yet between official syllabus subpoints, teaching micro-skills, and practice groups.
- Exam Training is only a placeholder.

Content problems:

- The Field Guides are too short for real learning. Two sections per topic cannot cover common CAIE variants.
- Practice prompts are self-check questions, not reviewed practice items.
- There are no worked solutions on the practice pages beyond "what to show in your working" routes.
- No source-backed exam examples or mark-scheme move notes are visible.

UI/usability problems:

- The UI says "Practice placeholder", which is honest, but repeated placeholder language can make the area feel unfinished rather than audit-ready.
- There are no topic confidence indicators beyond static labels.

### Missing Content

- Reviewed syllabus-contract table for every P1 subpoint.
- Field Guide pages for deeper subskills inside functions, coordinate geometry, circular measure, trig equations, differentiation applications, and integration applications.
- 5-8 reviewed foundation practice questions per topic.
- Worked examples and answer keys for each practice item.
- P1 exam-question image mapping and mark-scheme image mapping.
- Exam Training sampler by topic and marks.

### Risky or Low-Confidence Content

- Function transformations and inverse-domain wording need audit for CAIE phrasing.
- Trigonometry needs careful handling of degrees/radians, exact values, graph transformations, and interval conventions.
- Differentiation and integration need formula-scope audit so P1 does not accidentally import P3 methods.
- Series/binomial split is useful, but the syllabus reference and wording should be verified against the official P1 contract.

### Fastest Improvements That Would Raise the Score

- Add a P1 syllabus-contract matrix with one row per official subpoint and a status: `covered`, `thin`, `missing`, `review-needed`.
- Add 5-8 reviewed foundation practice questions with answers for Quadratics, Functions, Trigonometry, Differentiation, and Integration first.
- Replace generic self-check prompts with syllabus-specific worked examples.
- Add "review-needed" tags to any P1 page whose formula scope may accidentally drift into P3.
- Add one source-backed exam bridge example per topic.

### Medium-Term Improvements

- Build a P1 reviewed skill map using the same authority pattern as P3.
- Add topic-level practice sets with marks and mark-scheme moves.
- Add P1 exam-bank image pairs to the runtime-safe projection when reviewed.
- Add a P1 Exam Training page with a balanced topic sampler.
- Add focused tests to ensure P1 stays out of mastery/adaptive/P3-only flows until reviewed.

### Suggested Next Pass

P1 should get the first non-P3 content-quality pass. It is closest to a useful student scaffold and would improve quickly with a syllabus-contract audit plus a small reviewed practice batch.

## P3 - Pure Mathematics 3

### Rating Table

| Category | Rating | Reason |
| --- | ---: | --- |
| Syllabus alignment | 8 | All nine P3 areas are present and backed by the reviewed P3 skill map. Some support/evidence gaps remain. |
| Coverage completeness | 7 | Strongest course. 53 Field Guide sections, 305 practice cards, image-first exam questions. Still uneven by skill and source-backed depth. |
| Field Guide usefulness | 7 | Real, topic-specific guides with worked examples and guided tries. Needs more exam bridge examples and mark-scheme moves. |
| Practice readiness | 7 | Focused practice and official image-first exam cards exist. Some groups remain drill-like and not all skills are equally resilient. |
| Exam Training readiness | 6 | Real P3 Exam Training exists, but visible mixed sampler is small and not yet a balanced paper/topic trainer. |
| Student navigation clarity | 8 | Course dashboard, topic index, Field Guide, Practice, and Exam Training are clear. Legacy region compatibility labels are a mild confusion risk. |
| UI/readability | 7 | Static pages are readable and responsive in sampled checks. Large practice pages can become dense. |
| Content trustworthiness | 7 | Highest trust because canonical question/mark-scheme images are the source of truth. Still has local support and mastery-readiness caveats. |
| Overall pilot readiness | 7 | Good enough for a limited P3 student pilot if caveats are explicit and support gaps are not hidden. |

### Current Strengths

- P3 has the only mature course area: topic hubs, Field Guides, Practice Questions, and Exam Training all exist.
- Static pages are image-first for exam questions and preserve canonical question/mark-scheme image pairs.
- The reviewed P3 skill map is treated as curriculum authority.
- The generated static site avoids retired game/reward language in the main study surface.
- Practice is much deeper than the seed courses: 305 generated/static practice cards across P3 topic pages.
- Local progress saving is static and browser-local, which matches the GitHub Pages constraint.

### Major Weaknesses

Structural problems:

- Exam Training uses a small static visible subset rather than a clearly balanced topic/subskill sampler.
- Legacy "Regions" compatibility routes still exist. They work, but the label can confuse a standard academic study hub.
- P3 route/evidence/readiness reports are stronger than the student-facing explanation of those limits.

Content problems:

- Coverage matrix still reports 3 `missing_support` skills: `p3_alg_discriminant_root_conditions`, `p3_alg_structure_rearrangement`, and `p3_log_calculus_contexts`.
- Coverage matrix still reports 1 `blocked_for_mastery` skill: `p3_alg_partial_fraction_form`.
- Many skills are warning-only rather than "gold" ready because source-backed worked examples and mark-scheme move notes are sparse.
- Some topic pages have many practice cards, but the path from warm-up to exam bridge is not always explicit.

UI/usability problems:

- Long practice pages can be overwhelming.
- Question cards show official images, but students need more visible guidance on how to self-mark responsibly.
- "Core / Weak / Stretch" modes in the React dashboard are clearer than the static page's simple mixed list; the static output should not imply adaptive precision.

### Missing Content

- Balanced static Exam Training sampler across all nine P3 topic areas.
- More source-backed exam bridge examples per official subskill.
- Mark-scheme move notes for skills that currently have sparse source-backed examples.
- Student-facing caveat explaining that saved marks are self-marked and not official mastery.
- Stronger remediation path from low marks to specific Field Guide sections.

### Risky or Low-Confidence Content

- Any P3 mastery claim remains risky until the blocked and missing-support rows are closed.
- Practice selection should not use deprecated difficulty metadata.
- Local/AI/legacy labels are useful diagnostics only; they should not become route authority.
- Content Lab candidates remain blocked until reviewed source-skill evidence exists.

### Fastest Improvements That Would Raise the Score

- Close the three `missing_support` rows with reviewed deterministic warm-ups.
- Resolve the `p3_alg_partial_fraction_form` mastery blocker or keep it explicitly mastery-ineligible.
- Replace first-N question display with a deterministic balanced sampler.
- Add a "what earns marks" note to each P3 practice/exam card group.
- Add a static route/image smoke check that scrolls or path-checks lazy images.

### Medium-Term Improvements

- Add source-backed worked examples for every P3 skill, not just generic generated examples.
- Add topic/subskill filters to static Exam Training.
- Add "review Field Guide before this question" links per exam question.
- Add static data-health summary visible only to maintainers, not students.
- Continue separating display labels from clean route authority.

### Suggested Next Pass

P3 should get a readiness pass, not a bulk content pass: close the known support/mastery gaps, improve Exam Training sampling, and add source-backed mark-scheme notes.

## M1 - Mechanics 1

### Rating Table

| Category | Rating | Reason |
| --- | ---: | --- |
| Syllabus alignment | 5 | Main headings are plausible: forces/equilibrium, kinematics, momentum, Newton's laws, energy/work/power. Variable acceleration needs scope audit. |
| Coverage completeness | 3 | Only 6 topic hubs, 12 short Field Guide sections, and 18 self-check prompts. No diagrams or reviewed exam examples. |
| Field Guide usefulness | 3 | Text gives a first route, but mechanics needs diagrams, modelling assumptions, and worked chains. |
| Practice readiness | 2 | Self-check placeholders only. No force diagrams, graph reading tasks, or marked worked solutions. |
| Exam Training readiness | 1 | Placeholder only. No M1 exam-bank mapping. |
| Student navigation clarity | 7 | Static route structure is clear and draft labels are visible. |
| UI/readability | 7 | Layout is consistent and readable, but subject-specific visuals are missing. |
| Content trustworthiness | 3 | Mechanics wording is high-risk without reviewed diagrams and model assumptions. |
| Overall pilot readiness | 3 | Useful internal scaffold. Not student-ready. Most dangerous course to show without cleanup. |

### Current Strengths

- The scaffold covers the main M1 teaching areas students would expect.
- It separates constant-acceleration Newton's laws from variable-acceleration/calculus-style setup, which may be pedagogically useful after scope audit.
- The pages repeatedly warn that content is draft seed.
- The Field Guide pages emphasize diagrams, axes, signs, and resultant force in prose.

### Major Weaknesses

Structural problems:

- No M1-specific skill map or official subskill contract.
- No diagram asset pipeline for force diagrams, motion graphs, connected particles, collisions, slopes, or energy setups.
- No reviewed exam-bank mapping.

Content problems:

- Mechanics is underrepresented by text-only bullets.
- Free-body diagrams are described but not shown.
- Motion graphs are named but not rendered.
- Momentum and impulse need signed worked examples, not only self-check prompts.
- Energy/work/power needs model diagrams and resistance/slope cases.
- Variable-acceleration content may be over-scoped or misplaced unless verified against the current M1 syllabus wording.

UI/usability problems:

- The same P3-style card pattern works structurally, but M1 needs visual working space.
- Practice pages do not provide the visual stimulus students need to practise mechanics.

### Missing Content

- Official M1 syllabus-contract matrix.
- Diagram-first Field Guide pages for forces, connected particles, slopes, collisions, motion graphs, and energy.
- 5-8 reviewed foundation practice questions per topic with diagrams and worked solutions.
- Clear model-assumption notes: particle, smooth/rough surface, inextensible string, light string, constant acceleration, resistance.
- Exam-bank image pairs and mark-scheme mapping.

### Risky or Low-Confidence Content

- Variable acceleration under Newton's laws needs careful scope check.
- Connected-particle and force-resolution language can mislead if diagrams are absent.
- Momentum content needs exact direction/sign convention worked examples.
- Energy and power content needs distinction between instantaneous power, average power, work, and force direction.

### Fastest Improvements That Would Raise the Score

- Add static diagrams for the two Field Guide sections in Forces and Equilibrium.
- Add one worked force-resolution example with a complete free-body diagram.
- Add one velocity-time graph example under Kinematics.
- Add 5 short signed-momentum practice questions with worked solutions.
- Flag variable-acceleration content as review-needed until the M1 contract confirms scope.

### Medium-Term Improvements

- Build an M1 skill map and route all M1 content through it.
- Add a diagram authoring pattern for mechanics pages.
- Add official question/mark-scheme image mapping once reviewed.
- Add M1 Exam Training as topic-filtered image practice, not generated prose.
- Add tests that M1 draft pages stay out of P3 mastery/progress logic.

### Suggested Next Pass

M1 should not receive bulk prose. It needs a diagram/model pass first, then reviewed practice. A text-only expansion would raise apparent coverage while leaving the core learning problem unsolved.

## S1 - Probability & Statistics 1

### Rating Table

| Category | Rating | Reason |
| --- | ---: | --- |
| Syllabus alignment | 5 | The five main S1 areas are represented: data, counting, probability, discrete random variables, normal distribution. Needs detailed audit. |
| Coverage completeness | 3 | Main headings exist, but each topic has only two Field Guide sections and three self-check prompts. |
| Field Guide usefulness | 3 | Helpful starter notes, but statistics needs tables, diagrams, distributions, and interpretation examples. |
| Practice readiness | 2 | Self-check prompts only. No data tables, diagrams, calculator/table route, or marked solutions. |
| Exam Training readiness | 1 | Placeholder only. No S1 exam-bank mapping. |
| Student navigation clarity | 7 | Course and topic routes are clear. Draft status is visible. |
| UI/readability | 7 | Consistent and responsive. Lacks subject-specific tables/visuals. |
| Content trustworthiness | 3 | Probability/statistics wording is precise and easy to get subtly wrong. Current seed content is not reviewed. |
| Overall pilot readiness | 3 | Internal scaffold only. Not ready for student exam prep. |

### Current Strengths

- The scaffold cleanly covers the expected S1 top-level areas.
- Probability and discrete-random-variable pages name important concepts: conditional probability, independence, expectation, variance, binomial model.
- Normal distribution page correctly emphasizes standardisation and variance vs standard deviation.
- Draft warnings are visible and honest.

### Major Weaknesses

Structural problems:

- No S1 skill map or reviewed syllabus contract.
- No table/diagram rendering pattern for statistics questions.
- No reviewed exam-bank mapping.

Content problems:

- Data representation needs actual tables, histograms, box plots, cumulative frequency, coding examples, and interpretation tasks.
- Probability needs Venn/tree/table diagrams, not only rules.
- Counting needs restricted-arrangement casework examples.
- Discrete random variables need full distribution tables and binomial probability calculations.
- Normal distribution needs calculator/table-compatible routes and sketch-first examples.

UI/usability problems:

- The generic Field Guide layout is readable but not enough for statistical displays.
- Practice pages do not let students interact with tables, distributions, or diagrams.

### Missing Content

- Official S1 syllabus-contract matrix.
- Data-table and diagram components for static pages.
- 5-8 reviewed foundation practice questions per topic.
- Worked solutions that include interpretation sentences.
- Exam-bank image pairs and topic routing.
- Normal distribution examples with clear tail/area diagrams.

### Risky or Low-Confidence Content

- Conditional probability and independence wording needs audit.
- Histogram frequency density wording needs exact worked examples.
- Normal distribution inverse-tail instructions need calculator/table route precision.
- Binomial model assumptions must be stated exactly and not overused.

### Fastest Improvements That Would Raise the Score

- Add one real data table and one histogram/cumulative-frequency example to Representation of Data.
- Add one Venn diagram and one tree diagram example to Probability.
- Add one full distribution-table worked example to Discrete Random Variables.
- Add one standardisation and one inverse-normal worked example with shaded sketches.
- Add review-needed flags for any interpretation sentence until checked by a teacher/content reviewer.

### Medium-Term Improvements

- Build an S1 skill map and tie each Field Guide section to official subpoints.
- Add static table/diagram rendering helpers.
- Add source-backed practice batches.
- Add S1 Exam Training once question and mark-scheme images are reviewed.
- Add tests that statistical formula wording and notation stay within S1 scope.

### Suggested Next Pass

S1 needs a data/diagram pass before bulk prose. Without tables, diagrams, and worked interpretations, the scaffold looks complete but does not train the actual exam behaviours.

## Cross-Course Comparison

| Question | Current answer | Reason |
| --- | --- | --- |
| Strongest course | P3 | Only course with mature Field Guides, practice cards, image-first exam questions, mark-scheme images, and reviewed skill-map authority. |
| Weakest course | M1 | Text-only mechanics scaffold is not enough for a diagram/model-heavy course, and variable-acceleration scope needs audit. |
| Most pilot-ready | P3 | Ready for limited P3 pilot with explicit caveats around self-marking, sampler balance, and support gaps. |
| Most dangerous without cleanup | M1 | Mechanics can mislead quickly without diagrams, force models, sign conventions, and reviewed worked solutions. |
| Best non-P3 scaffold | P1 | Broadest and most naturally aligned seed course; likely fastest to raise from draft to usable internal pilot. |
| Most deceptively complete | S1 | Top-level topics are all present, but the missing tables/diagrams/calculator routes make the actual learning surface thin. |
| Best structure to reuse | P3 structure | Reuse the P3 Learn -> Practice -> Exam Training flow, but do not copy P3-specific exam language into P1/M1/S1. |
| Biggest shared weakness | Practice/exam readiness | P1/M1/S1 have placeholders only; P3 has real practice but still needs balanced sampling and more mark-scheme guidance. |

## Structural Problems Across Courses

- Only P3 has a reviewed curriculum authority layer.
- P1/M1/S1 course metadata is centralized, which is good, but their academic contracts are not yet equivalent to P3.
- Static routes exist for all courses, but P1/M1/S1 are route-complete rather than learning-complete.
- Exam Training exists as a route everywhere, but only P3 has real exam practice.
- P3 legacy compatibility routes (`regions/`, `topics/`) are useful technically but can muddy the academic course model.

## Content Problems Across Courses

- P1/M1/S1 content is plausible but unreviewed.
- P1/M1/S1 lack source-backed worked examples and mark-scheme move notes.
- M1 and S1 need subject-specific visual/data artifacts before more prose.
- P3 has strong content volume but still needs source-backed depth for warning-only skills.
- No non-P3 course should make mastery, readiness, or exam-alignment claims yet.

## UI and Usability Problems Across Courses

- Navigation is generally clear and consistent.
- Draft warnings are visible, which is important.
- The same static card design works across all courses, but M1 and S1 need more specialized layouts for diagrams, tables, and graph/data displays.
- Long P3 practice pages may overload students unless grouped by clear skill progression.
- Static Exam Training should expose topic/subskill filtering or balanced sampling to make revision choices more transparent.

## Prioritized Improvement List

### P0 - Protect Trust

1. Keep P1/M1/S1 draft labels visible until each course has a reviewed syllabus contract.
2. Do not wire P1/M1/S1 into mastery, adaptive selection, Content Lab publishing, or exam readiness.
3. Close or explicitly quarantine P3 readiness gaps: `p3_alg_discriminant_root_conditions`, `p3_alg_structure_rearrangement`, `p3_log_calculus_contexts`, and the `p3_alg_partial_fraction_form` mastery blocker.
4. Add a static generated-page check for missing image files and representative mobile/desktop overflow.

### P1 - Raise Real Learning Value

1. Create P1 syllabus-contract coverage matrix.
2. Add reviewed practice batches for Quadratics, Functions, Trigonometry, Differentiation, and Integration.
3. Add source-backed exam bridge examples and mark-scheme move notes.
4. Audit formula scope to keep P1 from importing P3 methods.

### P2 - Build Non-P3 Subject Fit

1. Add M1 diagram assets and worked diagram-first examples.
2. Add S1 table/diagram/statistical-display assets and examples.
3. Replace generic self-check prompts with reviewed worked examples and answer keys.
4. Add source-backed practice sets before exam-bank mapping.

### P3 - Improve Pilot Quality

1. Replace first-N question sampling with balanced topic/subskill sampling.
2. Add student-facing self-marking guidance to exam cards.
3. Add "review this Field Guide first" links from exam questions.
4. Increase source-backed worked-example coverage for warning-only skills.

## Best 3-5 Next Tasks

1. Create syllabus-contract matrices for P1, M1, and S1 with `covered`, `thin`, `missing`, and `review-needed` statuses.
2. Close the current P3 support/mastery gaps and regenerate P3 coverage/readiness reports.
3. Upgrade P1 first: add reviewed worked examples and 5-8 foundation practice items for the highest-use topics.
4. Add M1 and S1 subject-specific visual/data templates before adding more text content.
5. Implement a balanced static P3 Exam Training sampler and a static image/path smoke check.

## Current Honest State

P1: good route scaffold, plausible first-pass notes, not exam-ready.

P3: strongest and pilot-ready with caveats, but not polished or fully balanced.

M1: rough route scaffold, needs diagram/model audit before student use.

S1: tidy route scaffold, needs data/table/diagram and interpretation audit before student use.

Strongest course: P3.

Course needing the most work: M1.

Biggest risks:

- Students mistaking draft P1/M1/S1 pages for reviewed exam preparation.
- Mechanics content becoming misleading without diagrams and model assumptions.
- Statistics content becoming misleading through imprecise wording or missing diagrams.
- P3 appearing more mastery-ready than the support/evidence reports justify.
- Bulk content additions raising page count without raising trust.

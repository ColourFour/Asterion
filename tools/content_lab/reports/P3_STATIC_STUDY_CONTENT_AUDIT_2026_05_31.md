# CAIE 9709 Pure Mathematics 3 Static Study Content Audit

Date: 2026-05-31

Scope: static study-site content for CAIE 9709 Pure Mathematics 3, including homepage topic structure, topic hubs, Field Guide pages, Skill Practice pages, Exam Training, generated static pages, and data/scripts that feed those pages.

Curriculum source of truth: official Cambridge International AS & A Level Mathematics 9709 2026-2027 syllabus, Paper 3 Pure Mathematics 3, plus the reviewed local P3 skill map that explicitly cites that syllabus. Official syllabus URL used: https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf

No student-facing content was rewritten in this pass. No game mechanics or reward framing are recommended.

## 1. Executive Summary

The static site now has the right high-level academic structure for a P3 study site: all nine Pure Mathematics 3 topic areas are present, each topic has a hub, a Field Guide, Skill Practice, and links into Exam Training. The generated static site contains 30 HTML pages and 396 normalized P3 trainable exam questions.

The main issue is not topic presence. The issue is exam-readiness depth. Most Field Guide sections give one concise explanation, one worked example, and one guided try. That is helpful as an entry point, but it is too thin to prepare students for multi-step CAIE P3 questions unless each topic gains a small number of source-backed exam-bridge examples and clearer mark-scheme moves.

Highest-priority finding: the Integration Field Guide contains an incorrect partial-fractions identity:

`(3x+1)/((x-1)(x+2)) = 1/(x-1) + 2/(x+2)`

The right side simplifies to `3x/((x-1)(x+2))`, not `(3x+1)/((x-1)(x+2))`. This should be fixed before further student use of that page.

Second-priority findings are missing or weak exam-facing coverage: inverse-tangent differentiation in Calculus, a visible stationary/tangent/normal Field Guide path, Algebra discriminant/root-condition support, stronger Complex loci/roots work, and a balanced Exam Training sampler instead of first-N question selection.

## 2. Overall Judgment

Overall judgment: structurally sound, curriculum-aware, but not yet sufficiently exam-facing.

Strengths:

- The homepage and topic hubs cover the nine requested P3 topic areas.
- The local reviewed P3 skill map covers 40 reviewed P3 skills across the official syllabus sections.
- Field Guide and Skill Practice are aligned through shared topic/group identifiers.
- Generated static pages remove the prior reward/game framing from the main study flow.
- Exam question practice remains image-first, using canonical question and mark-scheme image pairs.

Weaknesses:

- Field Guide depth is mostly "method introduction" rather than "exam preparation".
- Practice Questions are often atomic, repetitive, and answer-reveal based, with limited mark allocation guidance.
- Exam Training has a topic dashboard but the mixed question list is not balanced by topic or subskill.
- Several official P3 subskills exist in the reviewed skill map but are weakly exposed to students.
- One mathematical error in Integration must be fixed.
- A legacy "Regions" compatibility page and nav label remain visible; this is less severe than game framing, but it is not ideal for a standard academic study site.

## 3. Files and Artifacts Inspected

Primary static site generation:

- `scripts/build-static-site.ts`
- `src/lib/staticStudyRoutes.ts`
- `src/lib/topicStudy.ts`
- `src/lib/examTrainingDashboard.ts`
- `src/lib/questionTraining.ts`
- `docs/index.html`
- `docs/exam-training/index.html`
- `docs/static-pages.json`

Field Guide and topic content:

- `src/data/fieldGuideTopics.ts`
- `src/data/algebraVaultContent.ts`
- `src/data/logarithmObservatoryContent.ts`
- `src/data/trigonometrySpireContent.ts`
- `src/data/calculusCliffsContent.ts`
- `src/data/integralTerracesContent.ts`
- `src/data/vectorsGateContent.ts`
- `src/data/iterationForgeContent.ts`
- `src/data/differentialShrineContent.ts`

Curriculum and coverage contracts:

- `src/lib/p3SkillContract.ts`
- `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json`
- `tools/content_lab/scripts/p3_skill_contract.py`
- `tools/content_lab/reports/p3_coverage_matrix.md`
- `tools/content_lab/reports/p3_gold_skill_pack_readiness.md`
- `tools/content_lab/reports/p3_content_inventory_report.json`

Generated and canonical practice data:

- `public/data/generated_practice_bank.json`
- `public/data/teaching_snippets.json`
- `public/assets/exam-bank-data/asterion_question_bank_v1.json`
- `public/assets/exam-bank-data/question_bank.topic_routing.v1.json`

## 4. Topic-by-Topic Audit Table

| Topic | Official P3 subskills checked | Current content observed | Judgment | Biggest improvement |
| --- | --- | --- | --- | --- |
| Algebra | Structure before expansion, polynomial division, remainder/factor theorem, binomial expansion and validity, partial fractions, modulus cases, discriminant/root conditions | 5 Field Guide sections; 44 generated practice items; 48 trainable P3 exam questions | Core areas are present, but discriminant/root conditions and structure-first warm-up are weak; examples need more exam bridging | Add explicit discriminant/root-condition and structure-first student-facing support, then add source-backed exam bridge examples |
| Logarithms | Form conversion, log laws/equations, exponential equations, domain validation, linearisation, log/exponential calculus contexts | 6 Field Guide sections; 36 generated practice items; 33 trainable P3 exam questions | Good introductory coverage; calculus-context support is weak in warm-up/practice | Add reviewed log/exponential calculus-context warm-ups and exam bridge tasks |
| Trigonometry | Identity selection, equation intervals, quadrant solutions, R-form, reciprocal/double-angle work | 5 Field Guide sections; 30 generated practice items; 34 trainable P3 exam questions | Broadly aligned and mostly accurate; needs stronger multi-step exam sequencing | Add mixed identity/equation examples with interval restrictions and mark-scheme move notes |
| Complex Numbers / Argand Diagrams | Cartesian/conjugate forms, modulus-argument form, Argand loci/regions, roots/powers | 4 Field Guide sections; 24 generated practice items; 54 trainable P3 exam questions | Correct topic headings, but roots and loci are too thin for P3 exam demand | Add full roots/powers examples and Argand region/inequality examples |
| Calculus | Method selection, chain/product/quotient, stationary/tangent/normal, implicit/log/exp, parametric gradients, inverse tangent derivative support | 6 Field Guide sections; 36 generated practice items; 38 trainable P3 exam questions | Product/quotient/implicit/parametric coverage is good; inverse-tangent derivative and visible stationary/tangent/normal pathway are weak | Add inverse-tangent derivative support and a dedicated stationary/tangent/normal Field Guide bridge |
| Integration | Method choice, parts/substitution, partial fractions, definite/improper/area, standard forms including arctan | 7 Field Guide sections; 49 generated practice items; 48 trainable P3 exam questions | Broad coverage, but one partial-fractions identity is mathematically wrong; definite/area bridge is too thin | Fix the partial-fractions identity first, then add definite/area/improper exam bridge examples |
| Vectors | Line equations/intersections, scalar product/angles, 3D geometry modelling | 8 Field Guide sections; 35 generated practice items; 32 trainable P3 exam questions | Accurate basics, but overfragmented into support skills; P3 questions usually combine several vector moves | Reframe around three official exam clusters and add composite 3D modelling examples |
| Numerical Methods / Iteration | Sign-change/graph evidence, iteration formula use, convergence and accuracy/rounding | 4 Field Guide sections; 29 generated practice items; 24 trainable P3 exam questions | Good alignment for entry-level support; needs fuller exam cycle examples | Add one complete exam-style iteration sequence with bracket, iteration, convergence, and final accuracy justification |
| Differential Equations | Separation, initial conditions, forming contextual models | 4 Field Guide sections; 34 generated practice items; 32 trainable P3 exam questions | Good basic progression; modelling examples need more interpretation and constants/domain discussion | Add source-backed modelling examples with interpretation of constants and restrictions |

## 5. Missing or Weak P3 Coverage

P0:

- Integration partial fractions contains an incorrect algebraic identity in the worked example.

P1:

- Calculus does not expose inverse-tangent differentiation as a clear student-facing derivative skill, even though inverse tangent appears as support in Integration.
- Calculus practice contains stationary/tangent/normal generated items, but the Field Guide does not present a dedicated student-facing path for that common P3 demand.
- Algebra discriminant/root-condition support is weak and marked as missing warm-up support in the coverage matrix.
- Algebra structure-first manipulation is present in the skill map but marked as missing warm-up support.
- Logarithmic/exponential calculus contexts are marked as missing warm-up support.
- Complex Numbers has too little student-facing work on full roots/powers and Argand regions/inequalities.
- Integration has broad method coverage but weak visible support for definite/improper/area exam-style application.
- Exam Training does not yet reinforce the same official subskill structure as the Field Guide and Skill Practice.

P2:

- Vectors are overfragmented into many support sections instead of being organized around the three official exam clusters.
- The homepage topic cards do not show official P3 subskill checklists or coverage confidence.
- The visible "Regions" nav and compatibility page are legacy labels that can confuse an academic site, even though the generated content itself is mostly academic.

## 6. Field Guide Improvement Recommendations

Field Guide pages should remain concise, but each P3 topic needs a stronger bridge from explanation to exam use.

Recommended pattern per subskill:

1. First-step recognition: what tells the student which method is needed.
2. Worked method example: one clean calculation.
3. Exam bridge: a short source-backed example showing how the same method appears inside a multi-part P3 question.
4. Mark-scheme move: what earns the method mark or accuracy mark.
5. Misconception repair: one common trap and how to avoid it.

Priority Field Guide fixes:

- Fix the incorrect Integration partial-fractions identity.
- Add inverse-tangent derivative support to Calculus.
- Add a visible stationary/tangent/normal Calculus section or exam bridge.
- Add Algebra discriminant/root-condition and structure-first bridges.
- Strengthen Complex roots and Argand loci/regions.
- Add Integration definite/area/improper bridge examples.
- Add topic-level official subskill checklists so students can see exactly what P3 syllabus area each page covers.

## 7. Practice Questions Improvement Recommendations

The current Skill Practice bank has useful volume, but it leans toward isolated drills. The next content pass should improve alignment before adding more quantity.

Recommendations:

- Add reviewed deterministic warm-ups for the three known support gaps: Algebra discriminant/root conditions, Algebra structure rearrangement, and Logarithmic/exponential calculus contexts.
- Create small exam-style mini-sets for each topic: 2-3 linked parts with marks and mark-scheme moves.
- Keep generated content behind the reviewed pipeline; do not promote unreviewed generated questions into student-facing pages.
- Label each practice group as warm-up, method practice, or exam bridge.
- Add explicit "what to check in your answer" guidance for static answer-reveal questions.
- Use official skill IDs consistently so Practice Questions, Field Guide, and Exam Training remain aligned.

## 8. Exam Training Improvement Recommendations

Exam Training is academically framed and uses canonical image assets, but its question organization is not yet strong enough.

Evidence:

- Topic practice pages select trainable questions using `.slice(0, 8)`.
- Exam Training mixed practice selects `.slice(0, 12)`.
- Mode cards are explanatory text; they do not yet drive differentiated question sets.

Recommendations:

- Replace first-N selection with a deterministic balanced sampler across the nine P3 topic areas.
- Add topic and subskill filters aligned to the reviewed P3 skill map.
- Show each question's topic, subskill, paper/session, marks, and mark-scheme image availability.
- Add a "Field Guide before this question" link for each exam question.
- Keep the static answer-reveal/save flow, but make the self-marking rubric clearer.
- Avoid any reward framing; the dashboard should remain a study planning and exam practice surface.

## 9. Three-Student Usability Findings

| Student profile | Where content helps | Where they may get stuck | Too thin, dense, or abstract | Useful improvement without game mechanics |
| --- | --- | --- | --- | --- |
| Low motivation / low ability | Short Field Guide sections lower the starting barrier; topic hubs provide a simple Learn, Practice, Revise path | One worked example may not be enough before an exam image; answer reveal can become passive reading | Exam Training jumps too quickly from method notes to full P3 questions | Add "first step" prompts, one prerequisite recap, and one exam-bridge worked example per weak subskill |
| Average motivation / average ability | Topic structure is clear; Skill Practice generally follows Field Guide sections | They may not know which official subskill they are weak in or which practice set to choose next | Practice feels like separate drills rather than a progression toward exam questions | Add subskill checklists, mark-scheme move notes, and balanced mixed sets |
| High motivation / high ability | Broad topic coverage and exam images give enough material to revise independently | They will outgrow single-example Field Guide pages quickly | Complex, vectors, and integration are too thin on multi-step exam composition | Add source-backed multi-part exam mini-sets and filters by subskill/marks/paper |

## 10. Prioritized Improvement Backlog

### Recommendation 1

- Priority: P0
- Area: Field Guide / Integration
- Problem: The Integration partial-fractions worked example contains an incorrect identity.
- Evidence from current content: `src/data/fieldGuideTopics.ts` uses `Given (3x+1)/((x-1)(x+2)) = 1/(x-1) + 2/(x+2)`. The right side simplifies to `3x/((x-1)(x+2))`.
- P3 exam relevance: Partial fractions followed by integration is a standard P3 demand; a wrong decomposition teaches an invalid exam move.
- Recommended fix: Either change the numerator to `3x`, or change the coefficients to match `3x+1`; then regenerate the static site and add a focused content assertion for this example.
- Risk if ignored: Students may copy an incorrect decomposition method and lose method/accuracy marks.
- Suggested files/data to edit: `src/data/fieldGuideTopics.ts`, generated `docs/topics/integration/field-guide/index.html`, optional focused test near Field Guide content generation.

### Recommendation 2

- Priority: P0
- Area: Field Guide / Calculus
- Problem: Inverse-tangent differentiation is not clearly exposed in Calculus.
- Evidence from current content: Calculus Field Guide sections cover exponential/log derivatives, product rule, quotient rule, trig derivatives, implicit differentiation, and parametric differentiation. `tan^{-1}` appears in Integration as support, not as a Calculus derivative topic.
- P3 exam relevance: Students need to recognize and differentiate inverse tangent forms when they appear in P3 differentiation contexts.
- Recommended fix: Add a concise, source-backed Calculus bridge for derivative of `tan^{-1}x` and scaled forms where appropriate. Do not add unsupported inverse-trig material beyond the official P3 requirement.
- Risk if ignored: Students may meet an official derivative form in exam practice without prior Field Guide preparation.
- Suggested files/data to edit: `src/data/fieldGuideTopics.ts`, `src/data/calculusCliffsContent.ts`, reviewed practice/source files that feed `public/data/generated_practice_bank.json`.

### Recommendation 3

- Priority: P1
- Area: Field Guide / Calculus
- Problem: Stationary points, tangents, and normals are present in practice data but not clearly sequenced as a Field Guide pathway.
- Evidence from current content: `src/data/calculusCliffsContent.ts` includes generated stationary/tangent/normal practice IDs, and the coverage matrix includes `p3_diff_stationary_tangent_normal`, but the visible Calculus Field Guide sections do not make this a dedicated route.
- P3 exam relevance: Stationary points, tangents, and normals are recurring P3 differentiation applications.
- Recommended fix: Add a Field Guide exam-bridge section showing derivative, substitution, gradient interpretation, tangent/normal equation, and stationary condition.
- Risk if ignored: Practice feels disconnected from teaching, especially for students who know rules but fail applications.
- Suggested files/data to edit: `src/data/fieldGuideTopics.ts`, `src/data/calculusCliffsContent.ts`, relevant Field Guide route tests if re-enabled.

### Recommendation 4

- Priority: P1
- Area: Practice Questions / Algebra
- Problem: Discriminant/root-condition and structure-first support is weak.
- Evidence from current content: `tools/content_lab/reports/p3_coverage_matrix.md` marks `p3_alg_discriminant_root_conditions` and `p3_alg_structure_rearrangement` as missing warm-up support; Algebra content maps many drills but not a clear student-facing progression for these weak spots.
- P3 exam relevance: Root conditions, tangency/discriminant arguments, and structure-aware algebra are common enabling moves in P3 questions.
- Recommended fix: Add reviewed deterministic warm-ups and one exam-bridge item for each skill, with explicit restrictions and mark-scheme evidence.
- Risk if ignored: Students may over-expand, mishandle conditions, or fail to justify root/tangent claims.
- Suggested files/data to edit: `src/data/algebraVaultContent.ts`, `src/data/fieldGuideTopics.ts`, reviewed generated-practice source files, `tools/content_lab/reports/p3_coverage_matrix.md` after regeneration.

### Recommendation 5

- Priority: P1
- Area: Practice Questions / Logarithms
- Problem: Logarithmic/exponential calculus-context support is missing warm-up coverage.
- Evidence from current content: `tools/content_lab/reports/p3_coverage_matrix.md` marks `p3_log_calculus_contexts` as missing warm-up support.
- P3 exam relevance: P3 questions often mix logarithmic/exponential forms with differentiation or integration.
- Recommended fix: Add reviewed warm-ups that connect log/exponential laws to calculus contexts, then add one mixed exam-style bridge.
- Risk if ignored: Students may learn log laws in isolation and fail to transfer them to calculus questions.
- Suggested files/data to edit: `src/data/logarithmObservatoryContent.ts`, `src/data/fieldGuideTopics.ts`, generated-practice source files.

### Recommendation 6

- Priority: P1
- Area: Field Guide / Complex Numbers
- Problem: Roots/powers and Argand loci/regions are too thin for full P3 demand.
- Evidence from current content: The Complex Field Guide has four sections, but the roots example emphasizes arguments and the locus example is a simple circle; trainable exam count is high at 54.
- P3 exam relevance: P3 complex questions commonly require full modulus-argument conversion, roots, powers, and sketching or interpreting loci/regions.
- Recommended fix: Add source-backed examples for full root values, powers using modulus-argument form, perpendicular bisector/half-plane loci, and inequality regions.
- Risk if ignored: Students may recognize definitions but fail the sketching and multi-step algebra required in exams.
- Suggested files/data to edit: `src/data/fieldGuideTopics.ts`, `src/data/trigonometrySpireContent.ts` only if shared trig prerequisites are referenced, complex topic content source files.

### Recommendation 7

- Priority: P1
- Area: Field Guide / Integration
- Problem: Definite/improper/area application is not visible enough, and source-backed worked examples are sparse.
- Evidence from current content: `tools/content_lab/reports/p3_gold_skill_pack_readiness.md` flags source-backed worked examples as sparse for most skills; Integration has method sections but no dedicated definite/improper/area Field Guide bridge.
- P3 exam relevance: P3 integration marks often depend on applying the method inside bounds, area, or interpretation rather than just finding an antiderivative.
- Recommended fix: Add one source-backed definite integral example, one area-between-curves or area-under-curve bridge, and one improper/limit-style bridge only if supported by official P3 scope and canonical evidence.
- Risk if ignored: Students may integrate correctly but lose marks on limits, area setup, or interpretation.
- Suggested files/data to edit: `src/data/fieldGuideTopics.ts`, `src/data/integralTerracesContent.ts`, reviewed source-backed example data.

### Recommendation 8

- Priority: P1
- Area: Exam Training
- Problem: Exam Training question organization is not balanced by topic or subskill.
- Evidence from current content: `scripts/build-static-site.ts` selects topic practice questions with `.slice(0, 8)` and mixed Exam Training questions with `.slice(0, 12)`.
- P3 exam relevance: P3 revision needs distributed exposure across all syllabus areas, not whichever clean questions appear first in the normalized bank.
- Recommended fix: Replace first-N selection with deterministic balanced sampling by topic and, where possible, reviewed skill ID. Add filters for topic, subskill, paper/session, and marks.
- Risk if ignored: Students may over-practice early-bank topics and under-practice weaker or later syllabus areas.
- Suggested files/data to edit: `scripts/build-static-site.ts`, `src/lib/questionTraining.ts`, `src/lib/examTrainingDashboard.ts`, relevant static route tests.

### Recommendation 9

- Priority: P1
- Area: Practice Questions
- Problem: Skill Practice is mostly answer-reveal and atomic drill; it does not consistently show exam mark logic.
- Evidence from current content: Static renderer provides hidden answer/details blocks and save buttons, but the practice flow does not require mark allocation, first-step diagnosis, or method-mark reflection.
- P3 exam relevance: CAIE P3 rewards method marks and structured working, not only final answers.
- Recommended fix: Add mark-scheme move notes and "self-mark this line" prompts to selected exam-bridge practice items.
- Risk if ignored: Students may think recognition is enough and fail to show examinable working.
- Suggested files/data to edit: `public/data/generated_practice_bank.json` source pipeline, `src/data/*Content.ts` alignment files, `scripts/build-static-site.ts` rendering of practice items.

### Recommendation 10

- Priority: P2
- Area: Site-wide / Homepage
- Problem: The visible "Regions" compatibility page and nav label are legacy site structure, not standard academic wording.
- Evidence from current content: `src/lib/staticStudyRoutes.ts` includes `regions/index.html` with label `Regions`; `docs/index.html` links to `Regions`; `scripts/build-static-site.ts` renders a compatibility page.
- P3 exam relevance: Not a curriculum error, but it may distract from the academic study flow and confuse students looking for topics.
- Recommended fix: Keep the route for compatibility if needed, but remove it from primary nav or relabel it as a topic index.
- Risk if ignored: The site continues to carry legacy language that weakens the static academic positioning.
- Suggested files/data to edit: `src/lib/staticStudyRoutes.ts`, `scripts/build-static-site.ts`, generated docs after rebuild.

### Recommendation 11

- Priority: P2
- Area: Site-wide / Field Guide
- Problem: Topic pages do not expose official P3 subskill coverage to students.
- Evidence from current content: Homepage cards and topic hubs show broad descriptions and counts, while official skill IDs and coverage status live in internal maps/reports.
- P3 exam relevance: Students need to know which syllabus skill they are studying and what remains uncovered.
- Recommended fix: Add a compact official-subskill checklist per topic, generated from the reviewed skill map and mapped to Field Guide/Practice/Exam Training availability.
- Risk if ignored: Students may complete a topic page without knowing whether they have covered the official exam demand.
- Suggested files/data to edit: `src/lib/topicStudy.ts`, `src/lib/staticStudyRoutes.ts`, `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json` read-only as source.

### Recommendation 12

- Priority: P2
- Area: Field Guide / Vectors
- Problem: Vector support is overfragmented into eight small sections, while official P3 vector demand is better represented by three clusters.
- Evidence from current content: Vectors has sections for notation, magnitude, geometric operations, line equation, intersections/skew, scalar product, angle, and distance; the reviewed skill map groups P3 vector demand into line equations/intersections, scalar product/angles, and 3D geometry modelling.
- P3 exam relevance: P3 vector questions usually combine component work, line equations, scalar product, and geometry interpretation.
- Recommended fix: Keep support sections available, but present the main student route as the three official clusters with composite examples.
- Risk if ignored: Students may complete basics but still be unprepared for full vector modelling questions.
- Suggested files/data to edit: `src/data/fieldGuideTopics.ts`, `src/data/vectorsGateContent.ts`, topic hub rendering if cluster summaries are added.

## 11. Recommended Next Implementation Batch

Keep the first batch small and safe:

1. Fix the Integration partial-fractions identity and regenerate the static site.
2. Add a focused content assertion or snapshot check so this exact error cannot return.
3. Add Calculus inverse-tangent derivative support using official syllabus and reviewed source-backed evidence only.
4. Add a dedicated stationary/tangent/normal Calculus Field Guide bridge and connect the existing practice IDs to it.
5. Replace Exam Training first-N mixed selection with a deterministic balanced sampler across the nine P3 topics.

Defer broader rewrites until after this batch. Do not add new reward systems, avatars, badges, fantasy challenges, or unreviewed generated curriculum.

## 12. Validation Notes

Validation run during this audit:

- `npm run build` passed and generated 30 static HTML pages in `docs/`.
- `npm run static:check` passed for 30 HTML pages.
- Focused active tests passed:
  - `tests/p3CoverageMatrix.test.ts`
  - `tests/p3ContentInventory.test.ts`
  - `src/tests/staticStudyRoutes.test.ts`
  - `src/tests/regionFieldGuidesScope.test.ts`

Validation caveat:

- `src/tests/fieldGuideRoute.test.tsx`, `src/tests/fieldGuidePanel.test.tsx`, and `src/tests/examTrainingDashboard*.test.*` are present but excluded by `vitest.config.ts` under `retiredStaticStudySuites`, so direct targeted runs did not execute those files.

Repository caveat:

- The requested example path was under `docs/`, but `docs/` is validated as generated-only static output and `npm run static:check` rejects Markdown files there. This report is therefore stored under `tools/content_lab/reports/`, alongside the existing P3 coverage and readiness reports.

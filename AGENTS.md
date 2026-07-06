# Asterion Agent Notes

## Project Purpose
Asterion is a static CAIE 9709 study hub generated into `docs/` for GitHub Pages. P3 is the active product path and the root page is P3-first. P1, M1, and S1 exist only as coming-soon course entries in the static selector; they do not expose topic pages, Skill Checks, exam mappings, attempt storage, or progression systems on this branch.

P3 currently exposes a diagnostic gate, P1 Review repair lane, topic Learn pages, Field Guide compatibility pages, Checked Practice/Skill Check pages, topic Exam Training, printable worksheets, Need to Know, Review/export, and an internal Content QA page.

## Architecture Principles
- Keep the site GitHub Pages compatible. Do not add a backend, authentication, Supabase, AI marking, teacher/class flows, or dynamic game systems to the static production surface.
- Course metadata belongs in centralized course data, currently `src/data/courses.ts`. Do not hard-code course cards or course slugs in multiple components.
- P1, M1, and S1 must remain coming-soon only until a separate syllabus-contract audit verifies coverage, wording, formula scope, exam alignment, and static route scope against the official Cambridge 9709 syllabus.
- For P3, the question image and mark-scheme image are the student-facing source of truth. Text extraction, OCR/raw text, AI labels, legacy DeepSeek labels, and fallback labels are metadata/display support only.
- The reviewed P3 skill map is the current P3 curriculum authority. Topic-routing records can validate placement only when clean/reviewed; fallback labels are display-only.
- Difficulty is deprecated metadata and must not drive routing, selection, mastery, generation eligibility, or warm-up readiness.
- Do not hard-code image path logic in components. Use `src/lib/resolveAssetPath.ts`.
- Do not hard-code topic, course, or region matching in components. Use `src/data/courses.ts`, `src/lib/worldMap.ts`, and related helpers.
- Preserve local question-bank labels and legacy DeepSeek labels internally as metadata only. Local/AI labels must remain available for diagnostics and display, but clean topic routing and reviewed course skill maps are the only safe curriculum route authority.
- Treat malformed or missing legacy enrichment as expected data, not an exception path.
- Static browser behavior and localStorage access currently live in `src/static-study/static-study.js`; keep `asterion.progress.v1` migration tolerance intact.
- Avoid expanding legacy RPG/avatar, Guardian, XP, rank, teacher, classroom, or dynamic mastery systems unless a future task explicitly revives them.
- Keep academic attempt records clean. Optional course/topic/region context is allowed, but do not bury academic fields inside presentation state.
- Prefer small, understandable modules and pure utilities with focused Vitest coverage.

## Agent Operating Model
Asterion uses a parallel-specialist agent workflow, optimized first for mastery accuracy. Agents may work in parallel for planning, review, design, and testing, but implementation work must have explicit file/module ownership before edits begin.

`AGENTS.md` is the operational source of truth for agent behavior. `README.md` is the human-facing project and setup overview.

### Workflow Gates
1. **Feature Brief**: Creative Director defines the student goal, success criteria, scope, non-goals, educational risks, and anti-scope-creep boundaries.
2. **Systems + UX Pass**: Study Systems and UX/UI separately propose structure and interface behavior. They must call out tradeoffs before implementation.
3. **Adversarial + Student Simulation Pass**: Adversarial Review and Student Simulation identify exploit paths, boredom risks, grind loops, confusion points, and likely quit points.
4. **Implementation Packet**: Frontend Implementation receives a decision-complete spec with file ownership, data flow, edge cases, and test expectations.
5. **QA Gate**: QA/Test verifies utilities, components, localStorage behavior, progression integrity, image/data health, and exports.
6. **Final Review**: Adversarial Review confirms there is no hidden mastery inflation, guessing reward, random gating, or MVP scope creep.

### Agent Roles
- **Creative Director Agent** owns feature scope, educational goals, progression philosophy, retention goals, style constraints, anti-scope-creep rules, and acceptance criteria.
- **Study Systems Agent** owns course structure, study-step pacing, static progression surfaces, learning-loop proposals, and challenge structures. This agent must not alter canonical marks, question correctness, mark schemes, academic attempt semantics, or use deprecated difficulty metadata as a behavior gate.
- **Content Agent** owns course/topic outlines, hints, tutorials, explanatory text, metadata-support proposals, and generated-content drafts. Generated content must remain advisory and must not replace canonical CAIE question images or mark-scheme images.
- **UX/UI Agent** owns layout consistency, student readability, friction reduction, onboarding, accessibility, responsive behavior, and manual UX verification scenarios.
- **Frontend Implementation Agent** owns React/Vite implementation after the implementation packet is locked. This agent follows existing component and utility boundaries rather than inventing new architecture by default.
- **QA/Test Agent** owns Vitest coverage, regression checks, schema/data-health checks, save/load verification, export checks, and progression integrity tests.
- **Adversarial Review Agent** owns exploit review, boredom review, grind-loop detection, confusing-incentive detection, retention-risk review, and final anti-scope-creep review.
- **Student Simulation Agent** owns persona walkthroughs for weak, strong, anxious, speedrunner, disengaged, completionist, and confused students, then reports where motivation rises, cognitive overload appears, frustration occurs, or a student would quit.

### Ownership Boundaries
- Static page generation lives in `scripts/build-static-site.ts`; generated Pages output lives in `docs/` and must not be hand-edited.
- Static browser interaction and local progress behavior live in `src/static-study/static-study.js`.
- Academic data shapes and attempt records live in `src/types.ts`, `src/skill-checks/localAttempts.ts`, and the static browser progress shape in `src/static-study/static-study.js`.
- Course metadata lives in `src/data/courses.ts`.
- P3 diagnostic source data lives in `src/data/p3DiagnosticGate.ts`; diagnostic scoring helper tests use `src/lib/p3DiagnosticGate.ts`.
- P1 Review repair-lane source data lives in `src/data/p1RepairLane.ts`; helper tests use `src/lib/p1RepairLane.ts`.
- Deterministic Skill Check data lives in `src/data/skillCheckItems.ts` and `src/data/remainingSkillCheckItems.ts`; answer checking lives in `src/skill-checks/answerChecker.ts` and static browser parity code.
- Topic, label, paper-family, and region routing live in `src/lib/worldMap.ts` and related progress helpers.
- Public image URL and asset-path behavior lives in `src/lib/resolveAssetPath.ts`.
- Static renderers consume normalized question objects, resolved public URLs, and derived progress. Do not duplicate normalization, image path, region matching, mastery, or enrichment merge logic inside page markup.
- Legacy RPG/avatar progression must not be expanded for the static study hub. Do not store fake progress or bury academic fields inside presentation state.

### Non-Static-Facing Cleanup Candidates
These are repo contents that do not directly face the generated static pages today. Do not remove them casually; first prove imports, tests, and generated output are unaffected.

- `.agent-loop/`, `.agent-runs/`, and `agentic-loop-template/`: agent workflow infrastructure and run artifacts.
- `.agents/skills/supabase*`: local agent skills only, not product runtime code.
- `reports/` and `audit-artifacts/`: dated historical audits and screenshots unless explicitly refreshed.
- `tools/content_lab/`: internal pipeline; static pages consume reviewed runtime JSON in `public/data/`.
- `content-model/`: reference/source PDFs, not static routes.
- `src/lib/localExamAttempts.ts`, `src/lib/progressCsvExport.ts`, `src/lib/p3ProgressionPaths.ts`, `src/lib/quickCheckAnswer.ts`, and `src/skill-checks/reviewSessions.ts`: tested helper/parity/planning code that is not directly imported by the static generator.
- `src/data/unitImprovementAgents.ts` and `src/data/unitImprovementReports.ts`: improvement-loop report data, not student route data.

### Handoff Templates
Use these templates when splitting work across agents. Keep outputs concise, decision-complete, and tied to the existing codebase.

#### Feature Brief
- Student outcome:
- Target audience/persona:
- Scope:
- Non-goals:
- Educational success criteria:
- Retention goal, if any:
- Risks to mastery accuracy:
- Acceptance criteria:

#### Study Systems Proposal
- Structure/mechanic:
- Academic signal used:
- Study result:
- Anti-grind protection:
- Anti-guessing protection:
- Files likely affected:
- Tests required:

#### UX Review
- Primary student path:
- Friction points removed:
- Readability/accessibility requirements:
- Mobile behavior:
- Empty/error states:
- Manual verification steps:

#### Implementation Packet
- Goal:
- Locked decisions:
- File/module ownership:
- Data flow:
- Edge cases:
- Out of scope:
- Tests to add/update:
- Commands to run:

#### QA Checklist
- Unit/regression tests:
- Progression integrity checks:
- Save/load checks:
- Data health checks:
- Export checks:
- Manual app flow checks:
- Remaining risks:

#### Adversarial Review
- Exploit paths:
- Guessing incentives:
- Grind or farming loops:
- Confusing incentives:
- Boredom/retention risks:
- Scope-creep violations:
- Required fixes before merge:

#### Student Simulation Report
- Persona:
- Starting knowledge/confidence:
- Path through the app:
- Motivation spikes:
- Frustration or overload points:
- Quit risk:
- Recommended change:

## Data Assumptions
- Current exam-bank files live under `public/assets/exam-bank-data/`:
  - `asterion_exam_bank_catalog_v1.json`
  - `asterion_question_bank_v1.json`
  - `question_bank.json`
  - `question_bank.topic_routing.v1.json`
  - `asterion_content_lab_candidates_v1.json`
- `asterion_exam_bank_catalog_v1.json` is the full all-course Asterion-side catalog. It is the audit source for P1, P3, M1, and S1 exam-bank coverage.
- `asterion_question_bank_v1.json` is the reviewed student-runtime projection. It must remain a subset of catalog records where `student_runtime_safe=true` and `review_status=reviewed`.
- Legacy `public/data/question_bank*.json` files must not ship. If legacy migration/reference is needed, recover those files from git history or keep them outside `public/`.
- Question and mark-scheme crops currently live under `public/assets/exam-bank-data/{paper-family}/{paper}/questions/q##.png` and `public/assets/exam-bank-data/{paper-family}/{paper}/mark_scheme/q##.png`. Legacy `public/assets/{paper}/...` and `public/assets/questions/{paper-family}/...` layouts are resolver fallbacks only.
- JSON image paths may be strings or arrays.
- Marks, deprecated difficulty metadata, subtopic, and enrichment fields may be absent.
- Region display matching must tolerate snake case, title case, legacy DeepSeek labels, local labels, and missing fields, but fallback labels are display-only.
- Content Lab candidates are blocked until reviewed source-skill evidence exists.
- Mastery must consume only clean P3 evidence from mastery-eligible reviewed P3 skills backed by canonical question and mark-scheme image pairs.
- P1/M1/S1 topic seed pages are not present in the current static route set. Do not reintroduce them until reviewed course contracts exist.

## Before Finalizing Changes
- Run `npm test`.
- Run `npm run build` for TypeScript and Vite validation when app code changes.
- Check that components still use normalized question objects and resolved public URLs.
- Check that region practice still uses the existing image-first practice loop.
- For progression changes, add focused Vitest coverage for weak-area routing, recent-question avoidance, mastery inflation risks, and localStorage migration tolerance.
- For data or content changes, check malformed/missing legacy enrichment, local label preservation, P3 route evidence, reviewed skill-map alignment, and centralized question/mark-scheme image path resolution.
- For UX changes, manually verify the P3-first home page, P1/M1/S1 coming-soon course pages, P3 dashboard, diagnostic, repair lane, topic Learn, Field Guide bridge, Checked Practice, Exam Training, worksheet, Review/export, mark-scheme reveal, attempt save where still present, and mobile layout.

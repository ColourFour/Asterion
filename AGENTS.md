# Asterion Agent Notes

## Project Purpose
Asterion is a local-first, image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The MVP targets Paper 3-style practice through the P3 Astral Academy world map, with architecture that can later support P1, Mechanics, and Statistics.

## Architecture Principles
- Keep the app GitHub Pages compatible. Do not add a backend, authentication, Supabase, or AI marking in the MVP.
- Each paper family will eventually become its own world map. P3 Astral Academy is the first world.
- Do not build a full game engine yet. Avoid tile walking, collision, sprite movement, inventory complexity, or engine dependencies unless explicitly requested.
- The question image and mark-scheme image are the student-facing source of truth. Text extraction, OCR/raw text, AI labels, legacy DeepSeek labels, and fallback labels are metadata/display support only.
- The reviewed P3 skill map is the curriculum authority. Topic-routing records can validate placement only when clean/reviewed; fallback labels are display-only.
- Difficulty is deprecated metadata and must not drive routing, selection, mastery, Guardian access, generation eligibility, or warm-up readiness.
- Do not hard-code image path logic in components. Use `src/lib/resolveAssetPath.ts`.
- Do not hard-code topic or region matching in components. Use `src/lib/worldMap.ts` and related progress helpers.
- Preserve local question-bank labels and legacy DeepSeek labels internally as metadata only. Local/AI labels must remain available for diagnostics and display, but clean topic routing and the reviewed P3 skill map are the only safe curriculum route authority.
- Treat malformed or missing legacy enrichment as expected data, not an exception path.
- Keep localStorage access isolated in `src/lib/progressStore.ts` so academic data can migrate to Supabase later.
- Keep RPG/avatar progression separate from academic attempts, and derive RPG state from real academic progress rather than fake progress.
- Keep academic attempt records clean for future Supabase migration. Optional world/region context is allowed, but do not bury academic fields inside RPG state.
- Prefer small, understandable modules and pure utilities with focused Vitest coverage.

## Agent Operating Model
Asterion uses a parallel-specialist agent workflow, optimized first for mastery accuracy. Agents may work in parallel for planning, review, design, and testing, but implementation work must have explicit file/module ownership before edits begin.

`AGENTS.md` is the operational source of truth for agent behavior. `README.md` is the human-facing project and setup overview.

### Workflow Gates
1. **Feature Brief**: Creative Director defines the student goal, success criteria, scope, non-goals, educational risks, and anti-scope-creep boundaries.
2. **Systems + UX Pass**: Gameplay Systems and UX/UI separately propose mechanics and interface behavior. They must call out tradeoffs before implementation.
3. **Adversarial + Student Simulation Pass**: Adversarial Review and Student Simulation identify exploit paths, boredom risks, grind loops, confusion points, and likely quit points.
4. **Implementation Packet**: Frontend Implementation receives a decision-complete spec with file ownership, data flow, edge cases, and test expectations.
5. **QA Gate**: QA/Test verifies utilities, components, localStorage behavior, progression integrity, image/data health, and exports.
6. **Final Review**: Adversarial Review confirms there is no hidden mastery inflation, guessing reward, random gating, or MVP scope creep.

### Agent Roles
- **Creative Director Agent** owns feature scope, educational goals, progression philosophy, retention goals, style constraints, anti-scope-creep rules, and acceptance criteria.
- **Gameplay Systems Agent** owns XP, levels, ranks, cosmetic rewards, unlock pacing, learning-step pacing, mastery loops, stamina/energy proposals, and challenge structures. This agent must not alter canonical marks, question correctness, mark schemes, academic attempt semantics, or use deprecated difficulty metadata as a behavior gate.
- **Content Agent** owns quests, dialogue, lore, hints, tutorials, NPC text, item descriptions, metadata-support proposals, and generated-content drafts. Generated content must remain advisory and must not replace canonical CAIE question images or mark-scheme images.
- **UX/UI Agent** owns layout consistency, student readability, friction reduction, onboarding, accessibility, responsive behavior, and manual UX verification scenarios.
- **Frontend Implementation Agent** owns React/Vite implementation after the implementation packet is locked. This agent follows existing component and utility boundaries rather than inventing new architecture by default.
- **QA/Test Agent** owns Vitest coverage, regression checks, schema/data-health checks, save/load verification, export checks, and progression integrity tests.
- **Adversarial Review Agent** owns exploit review, boredom review, grind-loop detection, confusing-incentive detection, retention-risk review, and final anti-scope-creep review.
- **Student Simulation Agent** owns persona walkthroughs for weak, strong, anxious, speedrunner, disengaged, completionist, and confused students, then reports where motivation rises, cognitive overload appears, frustration occurs, or a student would quit.

### Ownership Boundaries
- Academic data shapes and attempt records live in `src/types.ts` and `src/lib/progressStore.ts`.
- Mastery and rank calculations live in `src/lib/mastery.ts` and `src/lib/regionProgress.ts`.
- Adaptive question selection lives in `src/lib/adaptiveEngine.ts`.
- Topic, label, paper-family, and region routing live in `src/lib/worldMap.ts` and related progress helpers.
- Public image URL and asset-path behavior lives in `src/lib/resolveAssetPath.ts`.
- Components consume normalized question objects, resolved public URLs, and derived progress. Components must not duplicate normalization, image path, region matching, mastery, or enrichment merge logic.
- RPG/avatar progression must be derived from academic progress. Do not store fake progress or bury academic fields inside RPG state.

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

#### Gameplay Proposal
- Mechanic:
- Academic signal used:
- Reward/progression result:
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
  - `asterion_question_bank_v1.json`
  - `question_bank.json`
  - `question_bank.topic_routing.v1.json`
  - `asterion_content_lab_candidates_v1.json`
- Legacy `public/data/question_bank*.json` files must not ship. If legacy migration/reference is needed, recover those files from git history or keep them outside `public/`.
- Question and mark-scheme crops currently live under `public/assets/exam-bank-data/{paper-family}/{paper}/questions/q##.png` and `public/assets/exam-bank-data/{paper-family}/{paper}/mark_scheme/q##.png`. Legacy `public/assets/{paper}/...` and `public/assets/questions/{paper-family}/...` layouts are resolver fallbacks only.
- JSON image paths may be strings or arrays.
- Marks, deprecated difficulty metadata, subtopic, and enrichment fields may be absent.
- Region display matching must tolerate snake case, title case, legacy DeepSeek labels, local labels, and missing fields, but fallback labels are display-only.
- Content Lab candidates are blocked until reviewed source-skill evidence exists.
- Mastery must consume only clean P3 evidence from mastery-eligible reviewed P3 skills backed by canonical question and mark-scheme image pairs.

## Before Finalizing Changes
- Run `npm test`.
- Run `npm run build` for TypeScript and Vite validation when app code changes.
- Check that components still use normalized question objects and resolved public URLs.
- Check that region practice still uses the existing image-first practice loop.
- For progression changes, add focused Vitest coverage for rank thresholds, weak-area routing, recent-question avoidance, mastery inflation risks, and localStorage migration tolerance.
- For data or content changes, check malformed/missing legacy enrichment, local label preservation, P3 route evidence, reviewed skill-map alignment, and centralized question/mark-scheme image path resolution.
- For UX changes, manually verify onboarding, world map, region practice, mark-scheme reveal, attempt save, teacher export, and mobile layout.

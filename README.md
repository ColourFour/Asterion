# Asterion

Asterion is an image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The current MVP focuses on **Classroom practice mode** for the Paper 3 Astral Academy: a Pure Mathematics 3 world map with region learning, canonical question-image practice, reviewed Field Guide support, merged Skill Practice support, image-first Exam Training, and evidence-gated Guardian checks.

The question image and mark-scheme image are the student-facing source of truth. For P3 curriculum behavior, the reviewed P3 skill map is the authority. OCR/raw text, AI labels, legacy DeepSeek labels, and fallback labels are advisory metadata only; they must not be treated as curriculum truth.

## Current Status

Asterion is in active MVP development. The current product surface is a static-hosting-compatible **Classroom practice mode** for P3 Astral Academy. Student onboarding, class claiming, world map navigation, region hubs, Field Guides, Skill Practice, image-first Exam Training, Guardian checks, avatar progress, and Class Hall all run from committed assets plus browser-local progress storage.

The strongest current areas are the image-first practice loop, normalized question-bank loading, reviewed P3 region learning flow, local progress adapter, Content Lab verification, avatar reward catalog, route-level bundle splitting, and the dashboard service boundary. Current validation reports show 396 P3 questions, 385 practice-eligible P3 records, 126 mastery/Guardian-eligible P3 records, 40 reviewed P3 skills ready for region learning, 40 reviewed teaching snippets, 40 Quick Checks, 84 reviewed generated warm-ups, and 38 generator families.

The Field Guide / Skill Practice shell is stabilized enough to hand off to Exam Training work. The main next student-facing blocker is Exam Training clarity: question rationale, mastery target/evidence messaging, and post-attempt next steps. Guardian Challenge also needs later presentation and reward polish. The `33autumn25` P3 paper is no longer quarantined; its canonical question and mark-scheme image links are covered by asset integrity tests.

Supabase Phase 1 is schema, seed, verification, read-only dashboard adapter work, and optional roster-claim RPC plumbing. It is explicitly not hosted progress sync, not learner-response storage, and not the academic source of truth. A browser "Connected" diagnostic only proves the optional health RPC is reachable with browser-safe config.

## Documentation Map

- [Docs Index](docs/README.md): current docs organization and where new docs should go.
- [Current State](docs/CURRENT_STATE.md): current handoff state before Exam Training work.
- [Architecture](docs/architecture/ARCHITECTURE.md): current app shape, data flow, dependencies, extension points, and risks.
- [Backend Contract](docs/architecture/backend-contract.md): boundaries for hosted classroom data and future storage.
- [Supabase Phase 1](docs/classroom/supabase-phase-1.md): classroom schema, RLS, seed data, verification commands, diagnostic RPC, and opt-in read-only/claim plumbing. Supabase is not hosted progress sync or production classroom authority yet.
- [Hosted Supabase Setup](docs/classroom/supabase-hosted-setup.md): SQL Editor execution order and Vite/Vercel browser-safe env mapping.
- [Teacher Dashboard V1](docs/classroom/teacher-dashboard-v1.md): current gated dashboard scope, mock/read-only boundaries, and export contract.
- [Admin Teacher Roster V1](docs/classroom/admin-teacher-roster-v1.md): admin roster and class-region access direction.
- [Roadmap](docs/ROADMAP.md): product direction and longer-term boundaries.
- [Project Review](docs/audits/PROJECT_REVIEW.md): dated review summary, strengths, weak spots, changes made, and remaining priorities.
- [Deployment Readiness](docs/launch/deployment-readiness.md): static deployment target, route behavior, payload findings, repo-cleanliness rules, and CSS split plan.
- [Live Classroom Pilot Final Audit](docs/classroom/LIVE_CLASSROOM_PILOT_FINAL_AUDIT_2026_05_21.md): current live-classroom readiness verdict, launch checklist, and rollback conditions.
- [Docs Review](docs/audits/DOCS_REVIEW_2026_05_21.md): active documentation inventory, archived categories, and deletion candidates.
- [Region Learning Loop Roadmap](docs/student-loop/region-learning-loop-roadmap.md): detailed learning-loop state and guardrails.
- [P3 Curriculum Alignment Roadmap](docs/curriculum/P3_CURRICULUM_ALIGNMENT_ROADMAP.md): CAIE 9709 P3 alignment plan with P1 prerequisite boundaries, coverage audit phases, and mastery-evidence rules.
- [Content Lab Architecture](docs/content/content-lab-architecture.md): repo-local teaching-content pipeline.
- [Phase 2 Content Lab Gold Skill Packs](docs/content/phase-2-content-lab-gold-skill-packs.md): P3-only Gold Skill Pack Depth Pass for real-student readiness.
- [Cleanup Archive](docs/archive/cleanup-2026-05-19/README.md): historical May 2026 snapshots and superseded planning notes retained for continuity.
- [Docs Review Archive](docs/archive/docs-review-2026-05-21/README.md): dated audits, reports, handoffs, smoke artifacts, and superseded review notes moved out of the active docs root.

## Core Principles

Asterion is an educational mastery system first and a game second.

The system must preserve:
- image-first academic fidelity
- curriculum alignment
- meaningful mastery progression
- transparent performance reporting
- low-friction student interaction
- deterministic educational behavior

The system must avoid:
- grind-heavy progression
- deceptive reward systems
- random progression gating
- synthetic/generated math replacing canonical questions
- hidden mastery calculations
- mechanics that reward guessing over reflection

Question images and mark-scheme images are the canonical academic source of truth.

AI-generated explanations, hints, labels, enrichment, or adaptive routing are advisory systems only and must never silently overwrite canonical academic content.

## P3 Astral Academy

After onboarding, students enter **P3 Astral Academy**, the first paper-family world map.

The current model is:

```text
Paper family -> world map
Major topic  -> region
Subtopic     -> station/building/quest line
Attempt      -> work action
Marks        -> XP/progress/restoration
Mastery      -> region restoration and checkmarks
Local attempt -> academic record
```

This is intentionally a polished map dashboard, not a full tile-based game. There is no walking, collision, inventory system, or game engine.

Current P3 regions:

- Algebra Vault
- Logarithm Observatory
- Trigonometry Spire
- Argand Atrium
- Calculus Cliffs
- Integral Terraces
- Vectors Gate
- Iteration Forge
- Differential Shrine

All nine P3 regions are active when matching trainable questions exist. The map remains a polished academic dashboard, not a tile-walking game.

## Region Learning Loop

**Region Learning Loop v1** turns each P3 region into a small academy journey instead of only a clickable topic island.

The current student-facing loop is:

```text
Field Guide -> Skill Practice -> Exam Training -> Guardian Challenge
```

- Field Guide: reviewed compact teaching snippets with student goals, explanations, prerequisites, micro-steps, common mistakes, and Guardian readiness notes.
- Skill Practice: one merged support mode that reads as Start simple, Build the method, then Ready for exam practice. Internal `quick_check` and `warm_up` activity records remain preserved.
- Exam Training: canonical image-first practice using question and mark-scheme images as the student-facing source of truth.
- Guardian Challenge: an evidence-gated mastery check selected from clean, mastery-eligible P3 canonical questions in the same region.

Field Guide completion and guardian clear state are stored locally through the progress adapter. Field Guide completion does not award mastery, XP, avatar rewards, or restored-region state by itself. Region clearing and reward placeholders require saved attempts, marks, mark-scheme availability, and guardian evidence.

The current implementation exposes the region hub for all active P3 regions. Every active region has reviewed Field Guide content and Skill Practice support. Legacy `quick-check` and `warm-up` route aliases remain compatibility-only aliases into Skill Practice.

Class Hall / Academy Commons v0.1 is a local-only avatar showcase for the current demo build. It is separate from Content Lab Worked Examples v1 and does not affect teaching-content publishing gates, mastery, or academic attempt records.

See `docs/student-loop/region-learning-loop-roadmap.md` for current state and remaining roadmap.

## Content Lab

Content Lab is a repo-local pipeline under `tools/content_lab`. It turns exam-bank evidence into reviewed teaching support without moving generation logic into React.

The current release track is **Content Lab Worked Examples v1 / Question-to-Lesson Pass**. The teaching/generated-practice schema contract is v2, while the worked-example content model is v1. The v2 fields are optional in the schema/runtime contract so legacy content still loads, but they are required by the Phase 1 publishing verifier for Logarithm Observatory, Algebra Vault, and Trigonometry Spire.

Canonical exam question images and mark-scheme images remain the source of truth. Generated lessons, generated practice, OCR/raw text, AI labels, and extracted question text are support material only and must not be treated as official exam wording or curriculum authority.

The current exam-bank data files live under `public/assets/exam-bank-data`:

```text
public/assets/exam-bank-data/asterion_question_bank_v1.json
public/assets/exam-bank-data/question_bank.json
public/assets/exam-bank-data/question_bank.topic_routing.v1.json
public/assets/exam-bank-data/asterion_content_lab_candidates_v1.json
```

Content Lab candidates remain blocked from generation or runtime publishing until they have reviewed source-skill evidence tied to the reviewed P3 skill map and canonical question/mark-scheme image evidence.

Runtime consumes only static reviewed JSON from:

```text
public/data/teaching_snippets.json
public/data/generated_practice_bank.json
```

The browser filters again at load time:

- teaching snippets must be `teacher_reviewed` or `published`
- generated practice must be `teacher_reviewed` or `published`
- generated practice must have `verification.status === "pass"`

Internal pipeline outputs live under:

```text
tools/content_lab/outputs/skill_targets.json
tools/content_lab/outputs/review_queue.json
tools/content_lab/outputs/generated_practice_bank.json
tools/content_lab/outputs/content_lab_report.json
```

Coverage counts are generated by the verifier output rather than maintained by hand:

```bash
python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

As of the 2026-05-19 verification pass, runtime Content Lab coverage is 40 reviewed teaching snippets, 40 Quick Checks, 84 reviewed generated warm-ups, and 38 generator families. All 40 reviewed P3 skills have Field Guide, snippet, worked-example, Quick Check, warm-up, canonical-question, and Guardian-candidate support. The coverage matrix currently reports 40 ready rows, 0 teacher-review rows, 0 deferred evidence cases, and 0 mastery-blocked rows. The verifier is the source of truth for current counts.

P3 curriculum contract and inventory reports are generated separately:

```bash
npm run validate:p3-skill-map
npm run inventory:p3-content
npm run coverage:p3-matrix
npm run report:p3-gold-skill-packs
```

`validate:p3-skill-map` checks the reviewed CAIE 9709 P3 skill contract and writes the coverage report. `inventory:p3-content` writes `tools/content_lab/reports/p3_content_inventory_report.json`, which inventories Field Guides, snippets, worked examples, Quick Checks, warm-ups, canonical P3 question evidence, Guardian candidates, teacher/export tags, and routing-audit status by region and reviewed skill. `coverage:p3-matrix` writes the teacher-facing JSON and Markdown coverage matrix, including clean mastery evidence, deferred ambiguous evidence when present, support gaps, and correction priorities. `report:p3-gold-skill-packs` writes the Phase 2A MVP-gold readiness report and separates blockers from warnings without generating new content. Missing instructional support is reported as a gap; unsafe P3 mastery evidence fails the command. Image-reviewed app-route mismatches can be accepted only with `validated_skill_map_route`, `clean_mastery_evidence`, and explicit mastery/practice/export allow flags. Mixed-topic or part-level ambiguous P3 routing cases must be deferred when they cannot be resolved: they remain visible and practice-allowed where image evidence is structurally valid, but are blocked from mastery evidence and export.

Run the pipeline with:

```bash
python3 tools/content_lab/scripts/build_skill_targets.py \
  --input public/assets/exam-bank-data/question_bank.json \
  --output tools/content_lab/outputs/skill_targets.json \
  --review-output tools/content_lab/outputs/review_queue.json

python3 tools/content_lab/scripts/build_generated_practice.py \
  --skill-targets tools/content_lab/outputs/skill_targets.json \
  --snippets public/data/teaching_snippets.json \
  --output tools/content_lab/outputs/generated_practice_bank.json \
  --runtime-output public/data/generated_practice_bank.json

python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

`public/assets/exam-bank-data/question_bank.json` must remain unchanged by Content Lab work. Legacy `public/data/question_bank*.json` files are not the active exam-bank runtime truth and must not be treated as curriculum authority.

Phase 1 enforcement is intentionally narrow: every method, concept, and mistake-repair snippet in Logarithm Observatory, Algebra Vault, and Trigonometry Spire must have at least one reviewed, traceable worked example, and first-batch Quick Checks and warm-ups must resolve their `example_model_id` links. [Phase 2](docs/content/phase-2-content-lab-gold-skill-packs.md) expands the same rule to all P3 regions only after the first batch passes.

## System Boundaries

Gameplay systems may:
- influence presentation
- influence progression pacing
- influence cosmetic rewards
- influence region unlock flow

Gameplay systems must not:
- alter question correctness
- alter canonical marks
- alter mark schemes
- replace academic content
- inflate mastery scores
- bypass weak-area review requirements

Adaptive systems may recommend question selection but must remain explainable and deterministic by default.

React components must not contain:
- path normalization logic
- topic normalization logic
- region mapping logic
- mastery calculation logic
- enrichment merge logic

All normalization and routing behavior belongs in centralized utility modules.

## Mastery Philosophy

Asterion rewards:

- repeated exposure to weak areas
- consistency over time
- subtopic coverage
- accurate self-reporting
- reflection after reveal

Asterion does not reward:

- rapid guessing
- brute-force repetition
- avoiding difficult topics
- farming easy questions
- inflated streak behavior

Mastery should represent demonstrated stability, not temporary success.

## World Structure

The hierarchy is fixed:

Paper Family -> World
Major Topic -> Region
Subtopic -> Station / Quest Line
Question -> Encounter
Attempt -> Trial
Review Session -> Restoration Pass
All future worlds should preserve this hierarchy unless a major architecture migration is approved.

## Asset Philosophy

Asterion uses stylized, readable, low-complexity educational RPG visuals.

Priority order:
1. readability
2. consistency
3. fast asset iteration
4. thematic cohesion
5. visual polish

Assets should:
- work at small sizes
- preserve silhouette clarity
- avoid visual clutter
- support rapid region expansion
- remain reproducible through prompt/version metadata

Generated assets are considered production inputs and should be versioned and attributable.

## Local Setup

```bash
npm install
npm run dev
```

Build and test:

```bash
npm test
npm run build
```

P3 data validation and UI asset generation:

```bash
npm run data:p3
npm run assets:ui
```

`npm run data:p3` validates the current projected bank, raw evidence bank, routing sidecar, and Content Lab candidate file, then prints normalized P3 data-health diagnostics. Current exam-bank runtime data lives under `public/assets/exam-bank-data`.

## Data Files

The current exam-bank files live under `public/assets/exam-bank-data`:

```text
public/assets/exam-bank-data/asterion_question_bank_v1.json
public/assets/exam-bank-data/question_bank.json
public/assets/exam-bank-data/question_bank.topic_routing.v1.json
public/assets/exam-bank-data/asterion_content_lab_candidates_v1.json
```

`asterion_question_bank_v1.json` is the default projected bank for the app. `question_bank.json` is the extraction-style raw bank used for debug/fallback and Content Lab evidence. `question_bank.topic_routing.v1.json` is the topic-routing sidecar. `asterion_content_lab_candidates_v1.json` is a blocked review inventory until candidate records have reviewed source-skill evidence.

The raw bank can use the extraction schema with root fields such as `schema_name`, `schema_version`, `record_count`, and a `questions` array. Asterion reads records with fields including `question_id`, `paper`, `paper_family`, `question_number`, `topic`, `notes.subtopic`, `question_solution_marks`, `question_image_path`, `mark_scheme_image_path`, `question_image_paths`, and `mark_scheme_image_paths`.

The projected bank may carry OCR/raw text, legacy DeepSeek fields, local labels, difficulty labels, and fallback labels. These fields are preserved for display, review, diagnostics, and teacher context only. Missing, malformed, or error enrichment is expected data, not an exception path.

Legacy public-data question-bank bundles must not be restored under `public/data`:

```text
public/data/question_bank.p3.json
public/data/question_bank.deepseek.p3.json
public/data/question_bank.json
public/data/question_bank.deepseek.full.json
```

These are no longer active runtime truth and should not ship to production. If a legacy migration task needs them, recover them from git history or stage them outside `public/` so Vite does not copy them into `dist/`.

Runtime teaching support files:

```text
public/data/teaching_snippets.json
public/data/generated_practice_bank.json
```

These files are static reviewed artifacts. React does not mine the exam bank, build skill targets, or generate practice in the browser.

Difficulty fields are deprecated metadata. They may remain on legacy question, attempt, snippet, or generated-practice records, but must not drive routing, adaptive selection, mastery, Guardian eligibility, generation eligibility, or warm-up readiness.

## Image Path Resolution

Bank records may contain paths such as:

```text
p3/15autumn25/questions/q01.png
p3/15autumn25/mark_scheme/q01.png
```

Asterion resolves those to public URLs:

```text
/assets/exam-bank-data/p3/15autumn25/questions/q01.png
/assets/exam-bank-data/p3/15autumn25/mark_scheme/q01.png
```

This logic lives in `src/lib/resolveAssetPath.ts`. Components should use normalized question objects and must not duplicate path-resolution rules.

Current deployed canonical question and mark-scheme image crops use the grouped exam-bank asset layout:

```text
public/assets/exam-bank-data/<paper-family>/<paper>/questions/q##.png
public/assets/exam-bank-data/<paper-family>/<paper>/mark_scheme/q##.png
```

For example:

```text
public/assets/exam-bank-data/p3/32spring21/questions/q01.png
public/assets/exam-bank-data/p3/32spring21/mark_scheme/q01.png
```

Supported source path variants include:

```text
p3/15autumn25/questions/q01.png
/p3/15autumn25/questions/q01.png
assets/15autumn25/questions/q01.png
assets/questions/p3/15autumn25/questions/q01.png
/assets/questions/p3/15autumn25/questions/q01.png
public/assets/questions/p3/15autumn25/questions/q01.png
```

The resolver tries the grouped exam-bank layout first, then compatibility layouts:

```text
/assets/exam-bank-data/p3/15autumn25/questions/q01.png
/assets/15autumn25/questions/q01.png
/assets/questions/p3/15autumn25/questions/q01.png
/assets/questions/15autumn25/questions/q01.png
```

Legacy `public/assets/<paper>/...`, `public/assets/questions/p3/<paper>/...`, and `public/assets/questions/<paper>/...` layouts are compatibility fallbacks only. New local data should use the grouped layout under `public/assets/exam-bank-data/<paper-family>/<paper>/...`.

## Static Data Caching

`src/lib/loadQuestionBank.ts` uses `cache: 'no-store'` outside production so local data edits are visible during development and tests. Production/static builds use the browser default cache behavior for committed JSON files. If data changes without a filename change, redeploy the static site and clear any CDN cache according to the host's normal invalidation rules.

The P3 flow fetches current exam-bank data from:

```text
public/assets/exam-bank-data/asterion_question_bank_v1.json
public/assets/exam-bank-data/question_bank.json                    # raw fallback/debug
public/assets/exam-bank-data/question_bank.topic_routing.v1.json
```

The projected bank is the normal app source. Raw-bank fallback/debug records are marked unsafe for mastery, Guardian checks, and Content Lab generation even if they have clean route metadata. This keeps the static student app GitHub Pages compatible without treating old `public/data/question_bank*.json` files as active runtime truth. A guard test prevents those legacy bundles from being reintroduced under `public/data`.

## UI Asset Optimization

Project-owned UI/world art sources live outside the production payload:

```text
assets-source/ui/astral/
assets-source/ui/astral/regions/
```

The app uses generated right-sized variants under:

```text
public/assets/ui/astral/optimized/
public/assets/ui/astral/optimized/regions/
```

Regenerate variants with:

```bash
npm run assets:ui
```

The optimizer uses macOS `sips` and intentionally avoids adding heavy image dependencies. It does not touch canonical CAIE question or mark-scheme images. If replacing UI art, commit the source PNG and regenerate the optimized variants before checking first-load size.

`public/assets/ui/` is production payload. Keep only runtime-ready files there. Generated drafts, oversized originals, alternates, and source exports belong under `assets-source/ui/` until reviewed and optimized. A guard test prevents non-optimized Astral source PNGs from returning to `public/assets/ui/astral/`.

## Region Art Assets

RegionHub artwork follows the same source/runtime split:

```text
assets-source/region-art/                         # source originals and regenerated exports
public/assets/region-art/optimized/               # runtime variants copied into dist
```

Regenerate runtime region variants with:

```bash
npm run assets:region
```

RegionHub reads paths from `src/lib/regionAssets.ts`; components should not hard-code `public/assets/region-art` paths. Do not delete canonical question or mark-scheme images under `public/assets/exam-bank-data/` when working on region art.

## Region Matching

Question topics and subtopics are routed in `src/lib/worldMap.ts` and related helpers. Clean topic-routing records from `public/assets/exam-bank-data/question_bank.topic_routing.v1.json` can validate P3 placement only when they are reviewed/clean and map to a reviewed P3 region. Missing-route, review-only, ambiguous, prerequisite-only, hard-failure, and fallback-label cases are not clean mastery evidence.

Fallback matching is forgiving across title case, snake case, legacy local labels, and legacy AI labels. It is display-only. It can help a student see a plausible region, but it must not authorize mastery, Guardian evidence, teacher export claims, or Content Lab generation. Examples:

```text
partial_fractions       -> Algebra Vault
binomial expansion      -> Algebra Vault
logarithmic functions   -> Logarithm Observatory
trig identities         -> Trigonometry Spire
modulus and argument    -> Argand Atrium
```

Keep path, topic, and region matching centralized in utility modules rather than in React components. Future agents must not treat OCR text, raw extracted text, AI labels, or fallback labels as curriculum authority.

## Real Data Integration Checklist

1. Put the current exam-bank JSON files under `public/assets/exam-bank-data/`:

```text
public/assets/exam-bank-data/asterion_question_bank_v1.json
public/assets/exam-bank-data/question_bank.json
public/assets/exam-bank-data/question_bank.topic_routing.v1.json
public/assets/exam-bank-data/asterion_content_lab_candidates_v1.json
```

2. Put P3 image folders under the grouped exam-bank asset layout:

```text
public/assets/exam-bank-data/p3/<paper>/questions/q##.png
public/assets/exam-bank-data/p3/<paper>/mark_scheme/q##.png
```

Legacy option A, old public asset root layout:

```text
public/assets/<paper>/questions/q##.png
public/assets/<paper>/mark_scheme/q##.png
```

Legacy option B, family folder included:

```text
public/assets/questions/p3/<paper>/questions/q##.png
public/assets/questions/p3/<paper>/mark_scheme/q##.png
```

Legacy option C, paper-only folder:

```text
public/assets/questions/<paper>/questions/q##.png
public/assets/questions/<paper>/mark_scheme/q##.png
```

For JSON paths like `p3/15autumn25/questions/q01.png`, Asterion tries `/assets/exam-bank-data/p3/15autumn25/questions/q01.png` first, then the legacy fallback layouts.

3. Validate that `tools/content_lab/skill_maps/caie_9709_p3_skill_map.json` is the reviewed P3 curriculum authority:

```bash
npm run validate:p3-skill-map
npm run inventory:p3-content
npm run coverage:p3-matrix
npm run report:p3-gold-skill-packs
```

4. Keep topic-routing records clean/reviewed before treating placement as validated. Fallback label placements are display-only.
5. Run `npm run assets:ui` after changing project-owned UI art.
6. Start the app with `npm run dev`.
7. During a local diagnostic pass, use the data-health utilities/tests rather than the removed student topbar Teacher/Export entry.
8. Check:
   - main JSON file loaded
   - main content source
   - main schema and record count
   - total questions loaded
   - total P3 questions loaded
   - trainable P3 question count
   - P3 blocked-from-practice count
   - P3 questions with question image metadata
   - P3 questions with mark-scheme image metadata
   - P3 asset availability check
   - trainable P3 questions by region
   - unmatched P3 examples
   - raw image path examples
   - candidate image URL examples
   - missing image metadata examples
   - topic-routing file loaded
   - topic-routing record and mapped counts

Common path problems:

- Duplicated paper family folder, such as `/assets/questions/p3/p3/...`.
- Image paths pointing to `questions/` but files placed under `question/`.
- Mark schemes using `mark_scheme/` in JSON but a different folder name on disk.
- An empty projected bank; Data Health will show the fallback source. Raw fallback is display/practice limited and blocked from mastery, Guardian, and Content Lab generation.

## MVP Features

- Class-claimed student profile with real name, class/group, teacher name, and avatar name, persisted through the progress storage adapter.
- P3 Astral Academy world map with region cards, restoration ranks, active/dormant states, and region-filtered practice.
- P3-focused student modes: World Map, Region Hub, Training Grounds, Region Guardian, Review Weak Areas, Profile, and Class Hall.
- Teacher/admin dashboard routes render only when `VITE_ASTERION_DASHBOARD_DEMO=enabled` for mock demo mode, `VITE_ASTERION_DASHBOARD_DATA_SOURCE=supabase` for the read-only Supabase adapter, or `VITE_ASTERION_APP_PROFILE=classroom-pilot` for the hosted classroom pilot profile.
- Region Learning Loop with Field Guide snippets, Quick Checks, generated warm-up practice, Guardian readiness, and evidence-gated Guardian challenges.
- Normalization layer that merges the projected/raw bank and topic-routing sidecar without crashing on malformed legacy enrichment.
- Question and mark-scheme image rendering for single paths or arrays.
- Required exact marks and mistake type after mark scheme reveal.
- Rule-based adaptive next-question selection.
- Region restoration derived from attempts, marks, recent accuracy, subtopics touched, and clean P3 evidence.
- Local topic mastery, ranks, checkmarks, XP, and placeholder avatar gear derived from progress.
- Quiet per-question issue reporting.
- Teacher-readable export utilities still exist outside the student task flow, and the old student topbar Teacher/Export entry is no longer exposed. Dashboard CSV exports are only as authoritative as the configured dashboard data source.
- Versioned localStorage persistence for profile, attempts, issue reports, avatar, and settings behind the progress storage adapter. Topic progress, region progress, XP, ranks, and avatar unlocks are derived from saved attempts rather than stored as source truth.

## Runtime Profiles

The default named profile is `student-pilot`. It is the normal browser-local P3 student build: static-hosting compatible, no Supabase requirement, no hosted progress sync expectation, no AI marking, no production teacher/admin authority, and no dashboard demo routes in the student experience.

```bash
npm run dev:student-pilot
npm run build:student-pilot
```

These commands load `.env.student-pilot`, which sets `VITE_ASTERION_APP_PROFILE=student-pilot`. When that profile is active, conflicting hosted/dashboard env values are ignored for the runtime student app: progress remains local, student class claiming remains mock/local, dashboard data remains mock, and `#/teacher` / `#/admin` stay disabled. Generic dashboard aliases such as `#/dashboard` and `/dashboard` are quarantined and are not review-build entry points. Supabase URL/key values may exist for other local tests, but they are not required by the student pilot profile and do not enable hosted learner progress.

The hosted classroom pilot profile is `classroom-pilot`. It requires browser-safe Supabase config, forces Supabase roster claims, forces Supabase dashboard data, opens the teacher/admin route shells, and marks bounded progress snapshot sync as enabled for the profile. It does not expose teacher/admin tools in the normal student topbar, does not create a browser self-promotion path, and does not make local browser progress teacher-visible authority.

```bash
npm run dev:classroom-pilot
npm run build:classroom-pilot
```

Use `.env.classroom-pilot.example` or Vercel environment variables as the template for hosted pilot config. The real app owner must sign into Supabase once, then run `supabase/sql/005_live_pilot_bootstrap_template.sql` from the Supabase SQL Editor to create the live organization and active owner admin role. Do not run the demo seed in the live pilot project.

For pilot staff access, create admin/teacher Auth accounts manually in Supabase with a unique temporary password or invite/reset flow, then add the matching hosted Asterion role. Supabase Auth login by itself is not dashboard authorization. Teachers should change temporary passwords after first login, and no temporary passwords should be stored in the app.

For pilot student access, do not create or expose a student email/password or magic-link sign-in flow. Students open `/#/student`, enter the class code and exact roster name from the teacher, and the app silently starts a Supabase anonymous session before claiming or resuming the existing roster slot. Enable Supabase Anonymous Sign-Ins in the project. Class code plus exact roster name is the student classroom credential for this pilot; keep roster names private enough for classroom use, and use teacher reset/change controls if a roster slot is claimed by the wrong browser.

Hosted role hierarchy:

- `admin` is the top classroom operations role. Admin can use admin tools, teacher tools, and the student-side preview flow.
- `teacher` is below admin. Teacher can use teacher tools and the student-side preview flow, but cannot access admin tools.
- `student` can use only student-side learning surfaces and remains class/region locked according to teacher settings.
- Signed-in users with no active hosted role cannot access teacher/admin dashboards and do not receive staff preview bypass.
- Teacher/Admin login buttons are navigation intent only. RoleGate, Supabase `user_roles`, RPC checks, and RLS remain the authorization boundary.

Teachers and admins can preview the student side with all canonical P3 regions unlocked. Staff preview does not require claiming a roster slot, does not require class-region access rows, and does not count as student progress or create teacher-visible student dashboard records.

## Progress Storage

Browser-local progress storage is the active default. The app uses a progress adapter boundary so a future hosted implementation can be added without moving academic correctness, mastery, routing, or reward logic into React components.

Current behavior:

- `VITE_ASTERION_APP_PROFILE=student-pilot` selects the supervised student pilot profile. Omitted profile values use `student-pilot` unless non-pilot dashboard/Supabase/storage flags are explicitly set for a local custom test build.
- `VITE_ASTERION_APP_PROFILE=classroom-pilot` selects the hosted Vercel + Supabase classroom pilot profile. Missing Supabase URL/key values are reported clearly, and mock dashboard/claim sources are not fallback authority.
- `VITE_ASTERION_STORAGE_MODE` defaults to `local`.
- `VITE_ASTERION_STORAGE_MODE=hosted` is recognized but not implemented; the app stays on browser-local progress storage and shows a notice.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` support the optional health check, read-only Supabase dashboard adapter, and Supabase roster-claim source when those modes are explicitly selected or when `classroom-pilot` is active. They do not enable learner-response writes.
- `VITE_ASSET_BASE_URL` is a documented future hosted-asset input only.
- `VITE_ASTERION_DASHBOARD_DEMO=enabled` exposes private mock teacher/admin dashboard routes for intentional demos only.
- `VITE_ASTERION_DASHBOARD_DATA_SOURCE=mock|supabase` defaults to mock; invalid values fall back to mock.
- `VITE_ASTERION_STUDENT_CLAIM_SOURCE=mock|supabase` defaults to mock; invalid values fall back to mock.
- Supabase service-role keys must never be exposed to the Vite client.

See `docs/classroom/supabase-hosted-setup.md` for the active hosted-dashboard setup path. `docs/classroom/hosted-storage-design.md` remains the hosted storage design draft, and `docs/classroom/sql/hosted-storage-draft.sql` remains a non-wired schema sketch.

## GitHub Pages Deployment

The Vite config uses `base: './'`, so the static build is suitable for GitHub Pages project hosting.

```bash
npm run build
```

Publish the `dist/` folder through your preferred GitHub Pages workflow. The JSON files and image assets must be committed under `public/` before building, or copied into the deployed static output.

Student routes are hash-compatible for GitHub Pages. Teacher/admin dashboard routes are hash-compatible gated routes (`#/teacher`, `#/teacher/classes/<class-id>`, and `#/admin`) but are disabled unless `VITE_ASTERION_DASHBOARD_DEMO=enabled`, `VITE_ASTERION_DASHBOARD_DATA_SOURCE=supabase`, or `VITE_ASTERION_APP_PROFILE=classroom-pilot`. Direct `/teacher` and `/admin` paths are retained only for hosts that provide an SPA fallback and follow the same gate. Generic dashboard aliases (`#/dashboard`, `/dashboard`, and nested dashboard paths) always show the disabled-dashboard quarantine state so they cannot be mistaken for a production classroom dashboard.

See `docs/launch/deployment-readiness.md` for current payload findings, route expectations, repo-cleanliness rules, and the planned CSS split boundaries.

## Current Limitations

- Hosted classroom identity and read-only dashboard setup are present only when the Supabase-backed classroom pilot profile is configured.
- No raw learner-response writes or full cross-device attempt recovery.
- Bounded hosted progress snapshot sync is profile-enabled for classroom pilot readiness, but browser insert/read wiring is still a follow-up phase.
- Supabase diagnostic "Connected" state is not backend readiness.
- Teacher/admin dashboard data can come from mock demo data or the read-only Supabase adapter, but roster actions, dashboard exports, and region toggles are not production authority without a reviewed auth/session and write policy.
- No AI marking.
- No browser-side answer input or automatic grading for Quick Checks or generated warm-ups.
- No automated browser smoke test for the full student flow; the latest browser smoke was manual/agent-browser based against the Vite dev server.
- No production-build browser smoke pass yet.
- Adaptive selection is intentionally simple and rule-based.
- Generated warm-up coverage is intentionally still being expanded through reviewed deterministic families.
- P3 `33autumn25` records are trainable again after canonical question and mark-scheme image restoration.
- Phone-width image readability needs work. One smoke-tested canonical question crop loaded correctly but displayed too short to read comfortably on a 390 px mobile viewport.
- Static payload is still large because canonical exam-bank images and JSON ship with the static app.
- `src/styles.css`, `src/App.tsx`, `TeacherDashboard`, and `dashboardMockService` remain large enough to need deliberate follow-up refactors.
- Mastered region rank is reserved for a later mixed review/mastery trial loop.

## Student Release Roadmap

This roadmap is ordered for getting Asterion safely in front of students without weakening mastery evidence or over-promising hosted classroom behavior.

### 1. Pilot Readiness Gate

Goal: make the current local/static P3 loop safe for a small supervised student pilot.

- Add a phone-friendly canonical image reader for question and mark-scheme crops. The minimum acceptable version is a full-screen or high-resolution zoom path that preserves the original image as the source of truth.
- Keep `33autumn25` trainable only while canonical question and mark-scheme image integrity continues to pass.
- Decide the pilot browser support target. At minimum, verify desktop Chrome/Edge plus one common phone-width viewport.
- Keep dashboard routes disabled in the normal student build unless an intentional demo or read-only Supabase test build is being reviewed.
- Write a short teacher/student operating note: browser-local progress, no cross-device sync, how to reset local progress, how issue reports work, and what data is not stored remotely.
- Run the release command gate:

```bash
npm test
npm run verify:content-lab
npm run data:p3
npm run validate:p3-skill-map
npm run inventory:p3-content
npm run coverage:p3-matrix
npm run report:p3-gold-skill-packs
npm run build
```

Manual pilot checks:

- onboarding and class-code claim
- world map and every active region hub
- Field Guide, Quick Check, warm-up, Training Grounds, Guardian locked/unlocked states
- question image and mark-scheme image readability on desktop and phone width
- attempt save, reload persistence, profile/avatar progress, Class Hall
- disabled dashboard routes in the normal student build

### 2. Supervised Student Pilot

Goal: prove the P3 learning loop with a small class before adding hosted progress.

- Use one or two teacher-controlled groups and a known class-code roster.
- Start with 2-3 target regions, then widen only after students complete the loop without confusion.
- Track issue reports, unreadable images, route confusion, Guardian confusion, and places where students guess or rush mark entry.
- Review local export/dashboard demo data only as pilot-support evidence, not as an official gradebook.
- Do not add AI marking, generated exam wording, random rewards, stamina, or broader paper worlds during the pilot.

Exit criteria:

- students can complete the intended region loop without teacher rescue
- no critical image-readability blockers remain
- saved attempts and Guardian evidence survive reloads
- no observed reward path inflates mastery through guessing or Field Guide completion alone

### 3. Teacher Visibility Beta

Goal: make teacher-facing progress useful without making it production authority too early.

- Decide whether the beta uses mock dashboard demos, read-only Supabase dashboard rows, or exported local evidence.
- If Supabase is used, require reviewed auth/session behavior, RLS verification, route access policy, and clear "read-only beta" labeling.
- Add teacher-facing Guardian/evidence fields only after the pilot identifies useful columns.
- Define privacy, export, delete, and retention expectations before syncing any learner responses.

### 4. Hosted Classroom Release

Goal: add durable classroom behavior only after the local P3 loop is proven.

- Implement hosted progress behind `src/lib/progressStore.ts` and the progress adapter boundary.
- Keep academic attempt fields clean and migratable; do not bury academic data inside RPG/avatar state.
- Add local-to-hosted migration UX, conflict handling, export/delete policy, and live RLS verification.
- Keep canonical question and mark-scheme assets as the student-facing source of truth.

### 5. Curriculum Expansion

Goal: expand only after P3 is reliable with real students.

- Add mixed-review and Mastered-region loops for P3 first.
- Add more deterministic warm-up families where they improve readiness without replacing exam images.
- Add P1, Mechanics, and Statistics worlds only after P3 routing, mastery, teacher reporting, and support workflows are stable.

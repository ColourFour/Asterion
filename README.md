# Asterion

Asterion is an image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The current MVP focuses on **Classroom practice mode** for the Paper 3 Astral Academy: a Pure Mathematics 3 world map with region learning, canonical question-image practice, reviewed Field Guide support, Quick Checks, deterministic warm-up practice, and evidence-gated Guardian checks.

The question image and mark-scheme image are the student-facing source of truth. For P3 curriculum behavior, the reviewed P3 skill map is the authority. OCR/raw text, AI labels, legacy DeepSeek labels, and fallback labels are advisory metadata only; they must not be treated as curriculum truth.

## Current Status

Asterion is in active MVP development. The student app remains static-hosting compatible: practice, attempts, Guardian checks, avatar progress, and classroom practice flow run from committed assets, browser-local progress storage, and the configured class-claim/region-access source. Keep the P3 Astral Academy loop legible and evidence-gated before adding broader worlds or production hosted progress sync.

The strongest current areas are the image-first practice loop, normalized question-bank loading, region learning flow, local progress adapter, Content Lab verification, avatar reward catalog, and mock dashboard service boundary. The main open gaps are static payload size, large UI/CSS/controller files, remaining part-level teacher review for mixed-topic evidence, the quarantined `33autumn25` mark-scheme gap, lack of full browser/mobile smoke automation, and the absence of a production classroom backend.

Supabase Phase 1 is schema, seed, verification, and limited browser-safe infrastructure. The app can use Supabase for a read-only dashboard adapter and roster-claim RPC only when explicitly configured; it still does not use Supabase for hosted progress sync, academic source-of-truth behavior, or learner-response writes. A browser "Connected" diagnostic only proves the optional health RPC is reachable with browser-safe config.

## Documentation Map

- [Architecture](docs/ARCHITECTURE.md): current app shape, data flow, dependencies, extension points, and risks.
- [Supabase Phase 1](docs/supabase-phase-1.md): classroom schema, RLS, seed data, verification commands, and diagnostic RPC. The Vite app is not wired to Supabase for classroom behavior.
- [Hosted Supabase Setup](docs/supabase-hosted-setup.md): SQL Editor execution order and Vite/Vercel browser-safe env mapping.
- [Roadmap](docs/ROADMAP.md): near-term, medium-term, and long-term direction.
- [Project Review](docs/PROJECT_REVIEW.md): current review summary, strengths, weak spots, changes made, and remaining priorities.
- [File Audit](docs/FILE_AUDIT.md): graded review of tracked source, config, docs, tests, data, and grouped assets.
- [Deployment Readiness](docs/deployment-readiness.md): static deployment target, route behavior, payload findings, repo-cleanliness rules, and CSS split plan.
- [Region Learning Loop Roadmap](docs/region-learning-loop-roadmap.md): detailed learning-loop state and guardrails.
- [P3 Curriculum Alignment Roadmap](docs/P3_CURRICULUM_ALIGNMENT_ROADMAP.md): CAIE 9709 P3 alignment plan with P1 prerequisite boundaries, coverage audit phases, and mastery-evidence rules.
- [Content Lab Architecture](docs/content-lab-architecture.md): repo-local teaching-content pipeline.
- [Cleanup Archive](docs/archive/cleanup-2026-05-19/README.md): historical May 2026 snapshots and superseded planning notes retained for continuity.

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

The intended loop is:

```text
Understand the idea -> try a small check -> practice safely -> face the Guardian
```

- Field Guide: reviewed compact teaching snippets with student goals, explanations, prerequisites, micro-steps, common mistakes, and Guardian readiness notes.
- Quick Checks: one-micro-skill checks with clear answer and short explanation.
- Warm-up Practice: deterministic generated practice from reviewed repo-side generators. These are small original supports, not exam clones.
- Training Grounds: the current image-first practice flow, labeled as warm-up, core practice, weak-area review, or challenge with a short local explanation.
- Region Guardian: an evidence-gated mastery check selected from clean, mastery-eligible P3 canonical questions in the same region.

Field Guide completion and guardian clear state are stored locally through the progress adapter. Field Guide completion does not award mastery, XP, avatar rewards, or restored-region state by itself. Region clearing and reward placeholders require saved attempts, marks, mark-scheme availability, and guardian evidence.

The current implementation exposes the region hub for all active P3 regions. Every active region has reviewed Field Guide content and at least one Quick Check. Generated warm-up practice currently covers Algebra Vault, Logarithm Observatory, Trigonometry Spire, and partial-fractions support that also appears in Integral Terraces.

Class Hall / Academy Commons v0.1 is a local-only avatar showcase for the current demo build. It is separate from Content Lab Worked Examples v1 and does not affect teaching-content publishing gates, mastery, or academic attempt records.

See `docs/region-learning-loop-roadmap.md` for current state and remaining roadmap.

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

As of 2026-05-16, runtime Content Lab coverage is 40 reviewed teaching snippets, 40 Quick Checks, 84 reviewed generated warm-ups, and 38 generator families. All 40 reviewed P3 skills have Field Guide, snippet, worked-example, Quick Check, warm-up, canonical-question, and Guardian-candidate support. The coverage matrix currently reports 40 ready rows, 0 teacher-review rows, 0 deferred evidence cases, and 0 mastery-blocked rows. The verifier is the source of truth for current counts.

P3 curriculum contract and inventory reports are generated separately:

```bash
npm run validate:p3-skill-map
npm run inventory:p3-content
npm run coverage:p3-matrix
```

`validate:p3-skill-map` checks the reviewed CAIE 9709 P3 skill contract and writes the coverage report. `inventory:p3-content` writes `tools/content_lab/reports/p3_content_inventory_report.json`, which inventories Field Guides, snippets, worked examples, Quick Checks, warm-ups, canonical P3 question evidence, Guardian candidates, teacher/export tags, and routing-audit status by region and reviewed skill. `coverage:p3-matrix` writes the teacher-facing JSON and Markdown coverage matrix, including clean mastery evidence, deferred ambiguous evidence when present, support gaps, and correction priorities. Missing instructional support is reported as a gap; unsafe P3 mastery evidence fails the command. Image-reviewed app-route mismatches can be accepted only with `validated_skill_map_route`, `clean_mastery_evidence`, and explicit mastery/practice/export allow flags. Mixed-topic or part-level ambiguous P3 routing cases must be deferred when they cannot be resolved: they remain visible and practice-allowed where image evidence is structurally valid, but are blocked from mastery evidence and export.

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

Phase 1 enforcement is intentionally narrow: every method, concept, and mistake-repair snippet in Logarithm Observatory, Algebra Vault, and Trigonometry Spire must have at least one reviewed, traceable worked example, and first-batch Quick Checks and warm-ups must resolve their `example_model_id` links. Phase 2 expands the same rule to all P3 regions only after the first batch passes.

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
- Teacher/admin dashboard routes render only when `VITE_ASTERION_DASHBOARD_DEMO=enabled` for mock demo mode or `VITE_ASTERION_DASHBOARD_DATA_SOURCE=supabase` for the read-only Supabase adapter; neither mode is production authority by itself.
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

## Progress Storage

Browser-local progress storage is the active default. The app uses a progress adapter boundary so a future hosted implementation can be added without moving academic correctness, mastery, routing, or reward logic into React components.

Current behavior:

- `VITE_ASTERION_STORAGE_MODE` defaults to `local`.
- `VITE_ASTERION_STORAGE_MODE=hosted` is recognized but not implemented; the app stays on browser-local progress storage and shows a notice.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` support the optional health check, read-only Supabase dashboard adapter, and Supabase roster-claim source when those modes are explicitly selected. They do not enable hosted progress sync or learner-response writes.
- `VITE_ASSET_BASE_URL` is a documented future hosted-asset input only.
- `VITE_ASTERION_DASHBOARD_DEMO=enabled` exposes private mock teacher/admin dashboard routes for intentional demos only.
- `VITE_ASTERION_DASHBOARD_DATA_SOURCE=mock|supabase` defaults to mock; invalid values fall back to mock.
- `VITE_ASTERION_STUDENT_CLAIM_SOURCE=mock|supabase` defaults to mock; invalid values fall back to mock.
- Supabase service-role keys must never be exposed to the Vite client.

See `docs/supabase-hosted-setup.md` for the active hosted-dashboard setup path. `docs/hosted-storage-design.md` remains the hosted storage design draft, and `docs/sql/hosted-storage-draft.sql` remains a non-wired schema sketch.

## GitHub Pages Deployment

The Vite config uses `base: './'`, so the static build is suitable for GitHub Pages project hosting.

```bash
npm run build
```

Publish the `dist/` folder through your preferred GitHub Pages workflow. The JSON files and image assets must be committed under `public/` before building, or copied into the deployed static output.

Student routes are hash-compatible for GitHub Pages. Teacher/admin dashboard routes are hash-compatible gated routes (`#/teacher`, `#/teacher/classes/<class-id>`, and `#/admin`) but are disabled unless `VITE_ASTERION_DASHBOARD_DEMO=enabled` or `VITE_ASTERION_DASHBOARD_DATA_SOURCE=supabase`. Direct `/teacher` and `/admin` paths are retained only for hosts that provide an SPA fallback and follow the same gate.

See `docs/deployment-readiness.md` for current payload findings, route expectations, repo-cleanliness rules, and the planned CSS split boundaries.

## Current Limitations

- No authentication or durable identity.
- No production classroom backend or cross-device sync.
- No Supabase hosted progress sync, learner-response writes, or production classroom authority yet.
- Supabase diagnostic "Connected" state is not backend readiness.
- Teacher/admin dashboard data can come from mock demo data or the read-only Supabase adapter, but roster actions, dashboard exports, and region toggles are not production authority without a reviewed auth/session and write policy.
- No AI marking.
- No browser-side answer input or automatic grading for Quick Checks or generated warm-ups.
- No automated browser smoke test for the full student flow.
- Adaptive selection is intentionally simple and rule-based.
- Generated warm-up coverage is intentionally still being expanded through reviewed deterministic families.
- P3 `33autumn25` records are quarantined from training until canonical mark-scheme images are available.
- Source UI art still contributes to static deploy size because it remains under `public/`.
- Mastered region rank is reserved for a later mixed review/mastery trial loop.

## Roadmap

- Move source-only UI art out of `public` or exclude it from static deploy output while preserving optimized runtime assets.
- Split `src/styles.css` into smaller feature-owned style files before more UI work.
- Extract attempt construction from `PracticeView` into a pure tested utility.
- Extract root app orchestration from `App.tsx` into a controller hook once region flows stabilize further.
- Add deterministic warm-up generators for trigonometry, differentiation, integration, vectors, and numerical methods.
- Extend Guardian attempts with clearer teacher-facing reporting once a controlled demo identifies useful export columns.
- Tighten practice-ladder selection so warm-up, weak-area review, and challenge sessions choose questions differently where the bank has enough metadata.
- Add avatar unlock history derived from guardian or mixed-review evidence, not from Field Guide completion alone.
- Resolve or continue explicitly quarantining the `33autumn25` mark-scheme gap.
- Run browser/mobile QA and hosted-readiness cleanup before any public classroom pilot.
- Add broader P1, P4/Mechanics, and P5/Statistics worlds only after the P3 region loop is proven.
- Implement real classroom backend behavior only after auth/identity, durable roster authority, read-only dashboard adapter, student-side region access enforcement backed by durable data, live RLS verification, bounded progress snapshot policy, export/delete, local-to-hosted migration UX, canonical asset access, and learner-response privacy decisions are reviewed.

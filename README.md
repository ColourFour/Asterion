# Asterion

Asterion is a local-first, image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The current MVP focuses on the Paper 3 Astral Academy: a Pure Mathematics 3 world map with region learning, canonical question-image practice, reviewed Field Guide support, Quick Checks, deterministic warm-up practice, and evidence-gated Guardian checks.

The question image and mark-scheme image are the source of truth. Extracted text and DeepSeek enrichment are used as metadata for routing, display, review, and teacher export.

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
Export       -> academic record
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
- Region Guardian: an evidence-gated mastery check selected from trainable canonical questions in the same region.

Field Guide completion and guardian clear state are stored locally through the progress adapter. Field Guide completion does not award mastery, XP, avatar rewards, or restored-region state by itself. Region clearing and reward placeholders require saved attempts, marks, mark-scheme availability, and guardian evidence.

The current implementation exposes the region hub for all active P3 regions. Every active region has reviewed Field Guide content and at least one Quick Check. Generated warm-up practice currently covers Algebra Vault, Logarithm Observatory, Trigonometry Spire, and partial-fractions support that also appears in Integral Terraces.

Class Hall / Academy Commons v0.1 is a local-only avatar showcase for the current demo build. It is separate from Content Lab Worked Examples v1 and does not affect teaching-content publishing gates, mastery, or academic attempt records.

See `docs/region-learning-loop-roadmap.md` for current state and remaining roadmap.

## Content Lab

Content Lab is a repo-local pipeline under `tools/content_lab`. It turns exam-bank evidence into reviewed teaching support without moving generation logic into React.

The current release track is **Content Lab Worked Examples v1 / Question-to-Lesson Pass**. The teaching/generated-practice schema contract is v2, while the worked-example content model is v1. The v2 fields are optional in the schema/runtime contract so legacy content still loads, but they are required by the Phase 1 publishing verifier for Logarithm Observatory, Algebra Vault, and Trigonometry Spire.

Canonical exam question images and mark-scheme images remain the source of truth. Generated lessons, generated practice, and extracted question text are support material only and must not be treated as official exam wording.

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

As of 2026-05-09, runtime Content Lab coverage is 34 reviewed teaching snippets, 34 Quick Checks, 30 reviewed generated warm-ups, and 10 generator families. The verifier is the source of truth for current counts.

Run the pipeline with:

```bash
python3 tools/content_lab/scripts/build_skill_targets.py \
  --input public/data/question_bank.json \
  --output tools/content_lab/outputs/skill_targets.json \
  --review-output tools/content_lab/outputs/review_queue.json

python3 tools/content_lab/scripts/build_generated_practice.py \
  --skill-targets tools/content_lab/outputs/skill_targets.json \
  --snippets public/data/teaching_snippets.json \
  --output tools/content_lab/outputs/generated_practice_bank.json \
  --runtime-output public/data/generated_practice_bank.json

python3 tools/content_lab/scripts/verify_content_lab_outputs.py
```

`public/data/question_bank.json` must remain unchanged by Content Lab work.

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

Data and UI asset generation:

```bash
npm run data:p3
npm run assets:ui
```

## Data Files

The canonical extraction outputs stay here for compatibility, debugging, and future multi-paper work:

```text
public/data/question_bank.json
public/data/question_bank.deepseek.full.json
```

The main bank can use the extraction schema with root fields such as `schema_name`, `schema_version`, `record_count`, and a `questions` array. Asterion reads records with fields including `question_id`, `paper`, `paper_family`, `question_number`, `topic`, `notes.subtopic`, `question_solution_marks`, `question_image_path`, `mark_scheme_image_path`, `question_image_paths`, and `mark_scheme_image_paths`.

The DeepSeek sidecar can use an `enrichments` object keyed by `question_id`. Asterion reads `deepseek_topic`, `deepseek_topic_normalized`, `deepseek_subtopic`, `deepseek_difficulty`, `deepseek_difficulty_normalized`, `deepseek_confidence`, `topic_reconciliation_status`, `final_review_required`, and `final_review_reasons`. Missing, malformed, or error entries are tolerated.

The P3 Astral Academy MVP loads generated P3-only bundles first:

```text
public/data/question_bank.p3.json
public/data/question_bank.deepseek.p3.json
```

Generate those files from the canonical full bank with:

```bash
npm run data:p3
```

The full-bank path remains supported through `loadQuestionBankWithDiagnostics({ scope: 'full' })` and as a fallback if the P3 bundle is missing. Do not hand-edit generated P3 bundles except for emergency inspection; update the canonical full files, then regenerate.

Runtime teaching support files:

```text
public/data/teaching_snippets.json
public/data/generated_practice_bank.json
```

These files are static reviewed artifacts. React does not mine the exam bank, build skill targets, or generate practice in the browser.

## Image Path Resolution

Bank records may contain paths such as:

```text
p3/15autumn25/questions/q01.png
p3/15autumn25/mark_scheme/q01.png
```

Asterion resolves those to public URLs:

```text
/assets/15autumn25/questions/q01.png
/assets/15autumn25/mark_scheme/q01.png
```

This logic lives in `src/lib/resolveAssetPath.ts`. Components should use normalized question objects and must not duplicate path-resolution rules.

Current deployed canonical question and mark-scheme image crops use the public asset root layout:

```text
public/assets/<paper>/questions/q##.png
public/assets/<paper>/mark_scheme/q##.png
```

For example:

```text
public/assets/32spring21/questions/q01.png
public/assets/32spring21/mark_scheme/q01.png
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

The resolver tries the current root layout first, then legacy compatibility layouts:

```text
/assets/15autumn25/questions/q01.png
/assets/questions/p3/15autumn25/questions/q01.png
/assets/questions/15autumn25/questions/q01.png
```

Legacy `public/assets/questions/p3/<paper>/...` and `public/assets/questions/<paper>/...` layouts are compatibility fallbacks only. New local data should use the root layout under `public/assets/<paper>/...`.

## Static Data Caching

`src/lib/loadQuestionBank.ts` uses `cache: 'no-store'` outside production so local data edits are visible during development and tests. Production/static builds use the browser default cache behavior for committed JSON files. If data changes without a filename change, redeploy the static site and clear any CDN cache according to the host's normal invalidation rules.

The P3 flow fetches, in order:

```text
public/data/question_bank.p3.json
public/data/question_bank.json               # fallback/debug
public/data/question_bank.deepseek.p3.json
public/data/question_bank.deepseek.json      # optional compatibility name
public/data/question_bank.deepseek.full.json # fallback/debug
```

This keeps the local demo login-free and GitHub Pages compatible while avoiding an eager P1/P4/P5 fetch for the current P3 MVP.

## UI Asset Optimization

Project-owned UI/world art sources remain under:

```text
public/assets/ui/astral/
public/assets/ui/astral/regions/
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

Current deployment note: optimized UI assets are the ones referenced by the app, but source UI PNGs still live under `public/`, so Vite copies them into `dist`. Moving source-only UI art out of `public` is the next payload cleanup pass.

## Region Matching

Question topics and subtopics are mapped to world regions in `src/lib/worldMap.ts`. Matching is forgiving across title case, snake case, and common wording variants. Examples:

```text
partial_fractions       -> Algebra Vault
binomial expansion      -> Algebra Vault
logarithmic functions   -> Logarithm Observatory
trig identities         -> Trigonometry Spire
modulus and argument    -> Argand Atrium
```

Keep path, topic, and region matching centralized in utility modules rather than in React components.

## Real Data Integration Checklist

1. Put the main bank at `public/data/question_bank.json`.
2. Put the full DeepSeek sidecar at `public/data/question_bank.deepseek.full.json`, or the compatibility primary name `public/data/question_bank.deepseek.json`.
3. Run `npm run data:p3` so the P3 MVP has generated first-load bundles.
4. Put P3 image folders under the current deployed root layout:

```text
public/assets/<paper>/questions/q##.png
public/assets/<paper>/mark_scheme/q##.png
```

Legacy option A, family folder included:

```text
public/assets/questions/p3/<paper>/questions/q##.png
public/assets/questions/p3/<paper>/mark_scheme/q##.png
```

Legacy option B, paper-only folder:

```text
public/assets/questions/<paper>/questions/q##.png
public/assets/questions/<paper>/mark_scheme/q##.png
```

For JSON paths like `p3/15autumn25/questions/q01.png`, Asterion tries `/assets/15autumn25/questions/q01.png` first, then the legacy fallback layouts.

5. If using the full DeepSeek sidecar, either rename:

```text
public/data/question_bank.deepseek.full.json
```

to:

```text
public/data/question_bank.deepseek.json
```

or rely on the app fallback loader. The primary filename remains `question_bank.deepseek.json`; the app falls back to `question_bank.deepseek.full.json` when the primary sidecar is missing, empty, or has no enrichments.

6. Run `npm run assets:ui` after changing project-owned UI art.
7. Start the app with `npm run dev`.
8. Open Teacher/Export, then open **Data health**.
9. Check:
   - main JSON file loaded
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
   - sidecar file loaded
   - sidecar enrichment, merge, and error counts

Common path problems:

- Duplicated paper family folder, such as `/assets/questions/p3/p3/...`.
- Image paths pointing to `questions/` but files placed under `question/`.
- Mark schemes using `mark_scheme/` in JSON but a different folder name on disk.
- An empty placeholder `question_bank.json`; Data Health will show a warning and ask you to copy the populated extraction JSON to `public/data/question_bank.json`.

## MVP Features

- Local student profile with real name, class/group, teacher name, and avatar name.
- P3 Astral Academy world map with region cards, restoration ranks, active/dormant states, and region-filtered practice.
- P3-focused modes: World Map, Region Hub, Training Grounds, Region Guardian, Review Weak Areas, Profile, Teacher/Export.
- Region Learning Loop with Field Guide snippets, Quick Checks, generated warm-up practice, Guardian readiness, and evidence-gated Guardian challenges.
- Normalization layer that merges the main bank and DeepSeek sidecar without crashing on malformed enrichment.
- Question and mark-scheme image rendering for single paths or arrays.
- Required exact marks and mistake type after mark scheme reveal.
- Rule-based adaptive next-question selection.
- Region restoration derived from attempts, marks, recent accuracy, and subtopics touched.
- Local topic mastery, ranks, checkmarks, XP, and placeholder avatar gear derived from progress.
- Quiet per-question issue reporting.
- Teacher exports as JSON and CSV, including world/region fields where attempts have that context.
- Versioned localStorage persistence for profile, attempts, issue reports, avatar, and settings behind the progress storage adapter. Topic progress, region progress, XP, ranks, and avatar unlocks are derived from saved attempts rather than stored as source truth.

## Storage Mode

Local demo storage is the active default. The app uses a progress adapter boundary so a future hosted implementation can be added without moving academic correctness, mastery, routing, or reward logic into React components.

Current behavior:

- `VITE_ASTERION_STORAGE_MODE` defaults to `local`.
- `VITE_ASTERION_STORAGE_MODE=hosted` is recognized but not implemented; the app stays in local demo storage and shows a notice.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_ASSET_BASE_URL` are documented future hosted-mode inputs only.
- Supabase service-role keys must never be exposed to the Vite client.

See `docs/hosted-storage-design.md` for the hosted storage design draft and `docs/sql/hosted-storage-draft.sql` for non-wired schema sketches.

## GitHub Pages Deployment

The Vite config uses `base: './'`, so the static build is suitable for GitHub Pages project hosting.

```bash
npm run build
```

Publish the `dist/` folder through your preferred GitHub Pages workflow. The JSON files and image assets must be committed under `public/` before building, or copied into the deployed static output.

## Current Limitations

- No authentication.
- No backend or cross-device sync.
- No Supabase storage yet.
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
- Extend Guardian attempts with clearer teacher-facing reporting once the first classroom trial identifies useful export columns.
- Tighten practice-ladder selection so warm-up, weak-area review, and challenge sessions choose questions differently where the bank has enough metadata.
- Add avatar unlock history derived from guardian or mixed-review evidence, not from Field Guide completion alone.
- Resolve or continue explicitly quarantining the `33autumn25` mark-scheme gap.
- Run browser/mobile QA and hosted-readiness cleanup before any public classroom pilot.
- Add broader P1, P4/Mechanics, and P5/Statistics worlds only after the P3 region loop is proven.
- Implement hosted storage behind the existing progress adapter only after auth, RLS, export/delete, local-to-hosted migration UX, and canonical asset access decisions are reviewed.

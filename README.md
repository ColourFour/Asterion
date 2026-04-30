# Asterion

Asterion is a local-first, image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The first MVP focuses on Paper 3-style practice for Pure Mathematics 3, especially algebra, trigonometry, logarithms, and complex numbers, while keeping the data model ready for P1, Mechanics, and Statistics.

The question image and mark-scheme image are the source of truth. Extracted text and DeepSeek enrichment are used as metadata for routing, display, review, and teacher export.

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

- Algebra Forge
- Logarithm Grove
- Trig Observatory
- Complex Harbor
- Calculus Cliffs
- Integration Gardens
- Vector Workshop
- Numerical Mines
- Differential Shrine

Algebra Forge, Logarithm Grove, Trig Observatory, and Complex Harbor are the first active classroom regions. Other regions are visible as dormant or available when matching questions exist.

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

## Data Files

Place the extraction outputs here:

```text
public/data/question_bank.json
public/data/question_bank.deepseek.json
```

The main bank can use the extraction schema with root fields such as `schema_name`, `schema_version`, `record_count`, and a `questions` array. Asterion reads records with fields including `question_id`, `paper`, `paper_family`, `question_number`, `topic`, `notes.subtopic`, `question_solution_marks`, `question_image_path`, `mark_scheme_image_path`, `question_image_paths`, and `mark_scheme_image_paths`.

The DeepSeek sidecar can use an `enrichments` object keyed by `question_id`. Asterion reads `deepseek_topic`, `deepseek_topic_normalized`, `deepseek_subtopic`, `deepseek_difficulty`, `deepseek_difficulty_normalized`, `deepseek_confidence`, `topic_reconciliation_status`, `final_review_required`, and `final_review_reasons`. Missing, malformed, or error entries are tolerated.

Place image crops under:

```text
public/assets/questions/p3/
```

Future paper families should follow the same shape:

```text
public/assets/questions/p1/
public/assets/questions/p4/
public/assets/questions/p5/
```

## Image Path Resolution

Bank records may contain paths such as:

```text
p3/15autumn25/questions/q01.png
p3/15autumn25/mark_scheme/q01.png
```

Asterion resolves those to public URLs:

```text
/assets/questions/p3/15autumn25/questions/q01.png
/assets/questions/p3/15autumn25/mark_scheme/q01.png
```

This logic lives in `src/lib/resolveAssetPath.ts`. Components should use normalized question objects and must not duplicate path-resolution rules.

Supported source path variants include:

```text
p3/15autumn25/questions/q01.png
/p3/15autumn25/questions/q01.png
assets/questions/p3/15autumn25/questions/q01.png
/assets/questions/p3/15autumn25/questions/q01.png
public/assets/questions/p3/15autumn25/questions/q01.png
```

All of those canonicalize to one public URL shape and should never duplicate `p3`:

```text
/assets/questions/p3/15autumn25/questions/q01.png
```

## Region Matching

Question topics and subtopics are mapped to world regions in `src/lib/worldMap.ts`. Matching is forgiving across title case, snake case, and common wording variants. Examples:

```text
partial_fractions       -> Algebra Forge
binomial expansion      -> Algebra Forge
logarithmic functions   -> Logarithm Grove
trig identities         -> Trig Observatory
modulus and argument    -> Complex Harbor
```

Keep path, topic, and region matching centralized in utility modules rather than in React components.

## Real Data Integration Checklist

1. Put the main bank at `public/data/question_bank.json`.
2. Put the DeepSeek sidecar at `public/data/question_bank.deepseek.json`.
3. Put P3 image folders under one of the supported layouts.

Option A, family folder included:

```text
public/assets/questions/p3/<paper>/questions/q##.png
public/assets/questions/p3/<paper>/mark_scheme/q##.png
```

Option B, paper-only folder:

```text
public/assets/questions/<paper>/questions/q##.png
public/assets/questions/<paper>/mark_scheme/q##.png
```

For JSON paths like `p3/15autumn25/questions/q01.png`, Asterion tries both `/assets/questions/p3/15autumn25/questions/q01.png` and `/assets/questions/15autumn25/questions/q01.png`.

4. If using the full DeepSeek sidecar, either rename:

```text
public/data/question_bank.deepseek.full.json
```

to:

```text
public/data/question_bank.deepseek.json
```

or rely on the app fallback loader. The primary filename remains `question_bank.deepseek.json`; the app falls back to `question_bank.deepseek.full.json` when the primary sidecar is missing, empty, or has no enrichments.

5. Start the app with `npm run dev`.
6. Open Teacher/Export, then open **Data health**.
7. Check:
   - main JSON file loaded
   - main schema and record count
   - total questions loaded
   - total P3 questions loaded
   - P3 questions with question image metadata
   - P3 questions with mark-scheme image metadata
   - P3 questions by region
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
- P3-focused practice modes: World Map, Start Practice, region training, Review Weak Areas, Teacher/Export.
- Normalization layer that merges the main bank and DeepSeek sidecar without crashing on malformed enrichment.
- Question and mark-scheme image rendering for single paths or arrays.
- Required exact marks and mistake type after mark scheme reveal.
- Rule-based adaptive next-question selection.
- Region restoration derived from attempts, marks, recent accuracy, and subtopics touched.
- Local topic mastery, ranks, checkmarks, XP, and placeholder avatar gear derived from progress.
- Quiet per-question issue reporting.
- Teacher exports as JSON and CSV, including world/region fields where attempts have that context.
- localStorage persistence for profile, attempts, topic progress, issue reports, avatar, and settings.

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
- No automatic image availability scan.
- Adaptive selection is intentionally simple and rule-based.
- Mastered region rank is reserved for a later mixed review/mastery trial loop.

## Roadmap

- Add broader P1, P4/Mechanics, and P5/Statistics topic maps.
- Give each future paper family its own world map.
- Move academic data from localStorage to Supabase while preserving the existing storage boundary.
- Add teacher dashboards for classes and weak-area planning.
- Add optional Vercel deployment once the backend layer exists.
- Add richer avatar assets and progression events tied to topic mastery.

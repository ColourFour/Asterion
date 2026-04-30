# Asterion

Asterion is a local-first, image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The first MVP focuses on Paper 3-style practice for Pure Mathematics 3, especially algebra, trigonometry, and complex numbers, while keeping the data model ready for P1, Mechanics, and Statistics.

The question image and mark-scheme image are the source of truth. Extracted text and DeepSeek enrichment are used as metadata for routing, display, review, and teacher export.

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

## MVP Features

- Local student profile with real name, class/group, teacher name, and avatar name.
- P3-focused practice modes: Start Practice, Target Topic, Review Weak Areas, Teacher/Export.
- Normalization layer that merges the main bank and DeepSeek sidecar without crashing on malformed enrichment.
- Question and mark-scheme image rendering for single paths or arrays.
- Required exact marks and mistake type after mark scheme reveal.
- Rule-based adaptive next-question selection.
- Local topic mastery, ranks, checkmarks, XP, and placeholder avatar gear.
- Quiet per-question issue reporting.
- Teacher exports as JSON and CSV.
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

## Roadmap

- Add broader P1, P4/Mechanics, and P5/Statistics topic maps.
- Move academic data from localStorage to Supabase while preserving the existing storage boundary.
- Add teacher dashboards for classes and weak-area planning.
- Add optional Vercel deployment once the backend layer exists.
- Add richer avatar assets and progression events tied to topic mastery.

# Asterion Agent Notes

## Project Purpose
Asterion is a local-first, image-first, RPG-style adaptive trainer for CAIE 9709 Mathematics. The MVP targets Paper 3-style practice, with architecture that can later support P1, Mechanics, and Statistics.

## Architecture Principles
- Keep the app GitHub Pages compatible. Do not add a backend, authentication, Supabase, or AI marking in the MVP.
- The question image and mark-scheme image are the student-facing source of truth. Text extraction is metadata support only.
- Do not hard-code image path logic in components. Use `src/lib/resolveAssetPath.ts`.
- Preserve local question-bank labels and DeepSeek labels internally. Student-facing routing/display may prefer valid DeepSeek labels, but local labels must remain available.
- Treat malformed or missing DeepSeek enrichment as expected data, not an exception path.
- Keep localStorage access isolated in `src/lib/progressStore.ts` so academic data can migrate to Supabase later.
- Keep RPG/avatar progression separate from academic attempts.
- Prefer small, understandable modules and pure utilities with focused Vitest coverage.

## Data Assumptions
- Main bank: `public/data/question_bank.json`.
- DeepSeek sidecar: `public/data/question_bank.deepseek.json`.
- Question and mark-scheme crops live under `public/assets/questions/{paper-family}/...`.
- JSON image paths may be strings or arrays.
- Marks, difficulty, subtopic, and enrichment fields may be absent.

## Before Finalizing Changes
- Run `npm test`.
- Run `npm run build` for TypeScript and Vite validation when app code changes.
- Check that components still use normalized question objects and resolved public URLs.

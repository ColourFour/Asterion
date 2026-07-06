# Protected Files / Behaviors

Protect the static CAIE 9709 study hub and the integrity of student-facing academic signals.

## Protected Behaviors

- Do not reintroduce authentication, Supabase, dashboards, server dependencies, teacher/classroom flows, AI marking, or non-static production infrastructure.
- Do not weaken deterministic checking, Skill Check validation, answer normalization, or static interaction checks.
- Do not give mastery, progress, readiness, or completion credit for revealed, repaired, hinted, self-marked, or mark-scheme-viewed answers unless existing rules explicitly allow that behavior.
- Do not use deprecated difficulty metadata to drive routing, mastery, selection, warm-up readiness, or generation eligibility.
- Do not break GitHub Pages compatibility, static routing, asset resolution, or the generated `docs/` site structure.
- Do not move canonical P3 routes or rename stable P3 topic URLs unless the selected plan is explicitly a route migration with redirects/static-output proof.
- Do not replace canonical question images or mark-scheme images with generated text, OCR, labels, or AI summaries as the source of truth.
- Do not expand P1, M1, or S1 beyond coming-soon course pages without an explicit syllabus audit task.
- Do not bury academic attempt fields inside presentation state or expand legacy RPG/avatar/mastery systems.
- Do not hard-code course slugs, image paths, topic matching, region matching, or localStorage behavior inside components when existing helpers own those boundaries.

## Protected File Areas

- `src/data/courses.ts`: course metadata authority.
- `src/lib/resolveAssetPath.ts`: public image URL and asset-path behavior.
- `src/lib/worldMap.ts` and related helpers: topic, label, paper-family, and region routing.
- `src/static-study/static-study.js`: static browser behavior and localStorage-backed progress behavior.
- `src/skill-checks/localAttempts.ts`: checked-practice attempt validation helpers.
- `src/types.ts`: academic attempt and data shapes.
- `public/assets/exam-bank-data/`: canonical exam-bank image/data surface.

These files may be changed only when the selected slice directly requires it and the plan names the risk, acceptance criteria, and verification commands.

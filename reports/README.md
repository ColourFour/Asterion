# Asterion Reports Archive

This folder is a historical audit archive. Reports here capture the repo state at the date in each filename or heading; they are not the current static-page contract unless a newer task explicitly refreshes them.

For the current project contract, use:

- `README.md` for setup, routes, source data, and static product boundaries.
- `AGENTS.md` for agent operating rules and cleanup boundaries.
- `src/lib/staticStudyRoutes.ts` and `docs/static-pages.json` for the generated page set.
- `tests/staticProduct.test.ts` and `tests/skillCheckData.test.ts` for the enforced static product and deterministic Skill Check contracts.

Current static-page state:

- P3 is the only ready product path.
- P1 remains coming-soon but now has internal eight-topic review routes; M1 and S1 are coming-soon course pages only.
- P3 topic pages include Learn, Field Guide bridge, Checked Practice, Exam Training, and printable worksheet routes.
- The old self-reported `I tried this` Checked Practice path is gone.
- Current tests expect 171 authored P3 Skill Check items, all deterministically checkable.
- Static browser progress is local-only under `asterion.progress.v1`.

Cleanup note: report Markdown, screenshots, and generated audit artifacts do not face the static pages. Keep them only when they are useful historical evidence or active maintenance inputs.

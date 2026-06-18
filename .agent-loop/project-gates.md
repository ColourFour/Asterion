# Project Gates

Use these commands to verify Asterion loop iterations. Select the smallest set that proves the chosen slice, but default to all three for app, content, routing, or static-output changes.

## Expected Commands

- `npm test` - runs the Vitest suite.
- `npm run build` - syncs exam-bank assets, runs TypeScript build validation, and generates the static site.
- `npm run static:check` - validates generated static pages, rendered static output, and Skill Check interactions.

## Missing Expected Commands

None. As of 2026-06-19, `package.json` defines `test`, `build`, and `static:check`.

## Gate Policy

- Do not pretend a command passed if it was not run.
- If a command is skipped, the plan or implementation report must say why.
- If a command is missing in a future repo state, update this file instead of assuming it exists.
- For deterministic Skill Check, practice-loop, route, or generated-site changes, `npm run static:check` is required unless the plan proves it is irrelevant.

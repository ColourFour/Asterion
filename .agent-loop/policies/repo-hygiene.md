# Repo Hygiene Policy

The loop must leave the repo cleaner and more trustworthy than it found it. Asterion is a static study hub, so cleanliness means fewer misleading artifacts, fewer stale feature remnants, and stable generated output.

## Default behavior

- Prefer editing existing files over creating new files.
- Delete obsolete files when replacing behavior.
- Keep generated outputs in `.agent-runs/`, not in source directories.
- Do not commit caches, logs, screenshots, one-off reports, local databases, or model outputs.
- Do not introduce new dependency stacks for small problems.
- Do not create a permanent framework for a one-time workflow.
- Do not create broad audit reports, syllabus reports, visual reports, or extraction dumps unless the selected iteration specifically requires that artifact.
- Do not leave generated loop packets, plans, implementation reports, or auditor reports anywhere outside `.agent-runs/`.
- Do not add product source, topic content, routes, package files, tests, or generated site output unless the selected iteration explicitly owns those files.
- Treat generated `docs/` changes as build output that must be intentional, reproducible, and relevant to the selected slice.
- Remove stale SPA/auth/dashboard/server/Supabase/deprecated remnants only when repo evidence shows they are unused and the cleanup is bounded.
- Keep P3-first improvements focused on existing static Learn, Field Guide bridge, Checked Practice, worksheet, Exam Training, review/export, and asset-resolution flows.

## Bloat budget

Per iteration default maximum:

- 6 changed files.
- 2 new files.
- 0 new dependencies.

Exceeding this budget requires explicit justification in the plan and auditor approval.

## Reports and Artifacts

`.agent-runs/` is the only default home for loop artifacts. A report may be added outside `.agent-runs/` only when it is a deliberate product or maintenance artifact named in the plan, reviewed by the auditor, and useful beyond the current iteration.

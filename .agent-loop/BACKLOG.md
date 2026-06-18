# Improvement Backlog

The Planner may select from this backlog, but it may also propose a better Asterion-specific item if repo evidence supports it. Prefer one bounded improvement that directly improves CAIE 9709 exam readiness or keeps the static study hub reliable.

## Candidates

- [ ] Patch one known syllabus gap or weak explanation in mature P3 topic coverage.
- [ ] Add or improve one deterministic checked example or Skill Check where feedback is weak, ambiguous, or too easy to game.
- [ ] Improve exam-question transfer by tightening topic-to-question mapping, Field Guide references, or exam-training prompts without changing canonical question or mark-scheme evidence.
- [ ] Improve feedback after wrong answers so students see the mathematical reason, not just pass/fail state.
- [ ] Improve one review-session behavior that helps students revisit weak skills without random gating or mastery inflation.
- [ ] Improve print/PDF worksheet support only when the slice is tightly scoped and keeps the static build clean.
- [ ] Fix static build reliability, static route correctness, or GitHub Pages output when tests or generated pages expose a real issue.
- [ ] Remove stale SPA, auth, dashboard, server, Supabase, teacher/classroom, RPG/avatar, or deprecated code only when repo evidence shows it is unused noise.
- [ ] Reduce generated artifact clutter when files outside `.agent-runs/` make diffs, reviews, or static output harder to trust.

## Do not select

- Large rewrites.
- Framework swaps.
- New dependencies unless the plan proves they are required and still compatible with the static site.
- Cosmetic churn.
- Generic repo improvement that does not affect exam performance, syllabus correctness, deterministic checks, static reliability, or repo hygiene.
- Audit-only work unless explicitly requested.
- P1, M1, or S1 expansion that hides their draft starter status or treats unaudited content as final syllabus-contract content.

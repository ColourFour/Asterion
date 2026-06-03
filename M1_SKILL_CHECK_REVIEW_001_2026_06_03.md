# M1 Skill Check Review 001 - 2026-06-03

## Scope

Reviewed the first M1 draft Skill Check seed batch in `src/data/m1SkillCheckItems.ts`, its shared schema in `src/data/skillCheckItems.ts`, the M1 Field Guide and visual-template context, generated M1 practice pages, and the existing Skill Check renderer/tests.

The review solved all 16 items independently and checked stored answers, units, rounding, sign conventions, wording, renderer contracts, visual-template dependencies, worked routes, feedback text, and draft/support-only trust boundaries.

## Final Decision

`accepted_with_deferrals`

The batch is safe for draft student use as support-only practice. It must remain draft/review-needed and must not feed mastery, unlock systems, adaptive evidence, teacher evidence, official readiness, or course completion. Expansion should wait until this first batch has been reviewed in use and the next candidate topics have stricter diagram/answer contracts.

## Item Verdict Table

| ID | Independent result | Stored contract | Verdict | Notes |
| --- | --- | --- | --- | --- |
| `m1-sc-velocity-displacement-001` | $s=12\times8=96$ m east | `96` | pass | Clear positive direction, units, and worked route. |
| `m1-sc-velocity-acceleration-001` | $a=(17-5)/6=2$ m s$^{-2}$ | `2` | pass | Deterministic direct acceleration item. |
| `m1-sc-velocity-suvat-001` | $s=\frac12(1.5)(8^2)=48$ m | `48` | pass | Correct single-stage constant-acceleration contract. |
| `m1-sc-velocity-vt-graph-area-001` | $\frac12(4)(12)+5(12)=84$ m | `84` | pass | Visual dependency is valid; graph feature is explicitly area under velocity-time graph. |
| `m1-sc-general-dsdt-001` | $v=3t^2-12t+9$, so $v(2)=-3$ m s$^{-1}$ | `-3` | pass | Sign is explained as negative direction. |
| `m1-sc-general-dvdt-001` | $a=6t-4$, so $a(2)=8$ m s$^{-2}$ | `8` | pass | Clear derivative-of-velocity contract. |
| `m1-sc-general-integral-v-001` | $\int_0^3(4t-1)\,dt=15$ m | `15` | pass | Uses displacement, not distance; no sign-change ambiguity affects the asked value. |
| `m1-sc-general-integral-a-001` | $v=3t^2+4$, so $v(3)=31$ m s$^{-1}$ | `31` | pass | Initial condition is explicit and worked route includes constant. |
| `m1-sc-momentum-definition-001` | $p=0.25(-8)=-2$ kg m s$^{-1}$ | `-2` | pass | Sign convention is explicit. |
| `m1-sc-momentum-conservation-table-001` | Before total $=2(3)+1(-1)=5$; $5=2(0.5)+v_B$, so $v_B=4$ m s$^{-1}$ | `5`, `4` | pass | Signed before/after table contract is clear; visual template is valid. |
| `m1-sc-energy-kinetic-001` | $KE=\frac12(4)(5^2)=50$ J | `50` | pass | Direct formula item with correct units. |
| `m1-sc-energy-gpe-001` | $\Delta PE=3(9.8)(2)=58.8$ J | `58.8` | pass | Vertical height change and $g$ are explicit. |
| `m1-sc-energy-power-001` | $P=600/12=50$ W | `50` | pass | Average power wording is clear. |
| `m1-sc-energy-conservation-smooth-001` | $9.8(1.25)=\frac12v^2$, so $v=4.95$ m s$^{-1}$ to 3 s.f. | `4.95` | pass | Smooth/no-resistance assumptions and rounding are explicit; visual template is valid. |
| `m1-sc-force-resultant-001` | Resultant $=30-10=20$ N, so $a=20/5=4$ m s$^{-2}$ | `4` | pass | One-dimensional force model avoids ambiguous normal/reaction issues. |
| `m1-sc-force-resolving-horizontal-001` | Horizontal $=20\cos30^\circ=17.3$ N; vertical $=20\sin30^\circ=10.0$ N to 3 s.f. | `17.3`, `10.0` | pass after minor fix | Primary displayed vertical answer changed from `10` to `10.0` to match the 3 s.f. instruction; `10` remains accepted. |

## Fixes Made

- Updated `m1-sc-force-resolving-horizontal-001` so the primary displayed expected answer for the vertical component is `10.0` N, matching the prompt's 3 significant figures instruction.
- No items were added.
- No items were replaced.
- No items were removed.

## Renderer and Contract Findings

- All 16 items use existing renderer-compatible answer types: `numeric` or `two_value`.
- All deterministic expected answers check correctly through the existing `QuickCheckContract` path.
- The two visual-dependent calculation items and two table/triangle-dependent items reference valid templates:
  - `m1-template-velocity-time-area-gradient`
  - `m1-template-momentum-before-after-table`
  - `m1-template-energy-table`
  - `m1-template-resolving-triangle`
- Static M1 pages show answer details inside reveal blocks, consistent with current static Skill Check behavior.
- The interactive React/static Skill Check pathways still treat these as support practice rather than mastery evidence.

## Trust Boundary Check

Every reviewed M1 item remains:

- `paperFamily: 'm1'`
- `courseId: 'm1'`
- `review.status: 'draft_review_needed'`
- `review.sourceSkillReviewed: false`
- `review.markEventReviewed: false`
- `review.affectsMastery: false`
- `review.supportOnly: true`
- `review.evidenceEnabled: false`

No M1 item is wired into P3 mastery, unlock systems, adaptive selection, teacher evidence, official readiness, or course completion claims.

## Remaining Concerns

- The batch is not syllabus-contract reviewed against the official Cambridge 9709 M1 syllabus.
- These are deterministic draft Skill Checks, not exam questions or mark schemes.
- The static page currently exposes the answer contract in a reveal block and saves only local support-practice completion, not checked mastery.
- The velocity-time, momentum, energy, and resolving visuals are generic templates. They are appropriate for this batch but should not be treated as proof that broader diagram-heavy M1 generation is safe.
- General motion item `m1-sc-general-integral-v-001` asks for displacement only. Do not generalize it into total-distance questions without sign-change splitting rules.
- Conservation of energy remains safe only for smooth/no-resistance prompts with explicit vertical height change.

## Deferred Topics

Still excluded:

- Friction and limiting friction.
- Rough slopes.
- Pulleys.
- Rods and tow-bars.
- Complex connected particles.
- Resistance-heavy work-energy.
- Ambiguous normal reaction questions.
- Broad visual-heavy Skill Check generation.

## Validation

Validation was rerun after review fixes:

- `npm run build`: passed.
- `npm run static:check`: passed.
- `npm test`: passed.
- `git diff --check`: passed.
- Browser inspection confirmed an M1 generated Skill Check page renders math, SVGs, answer details, and support-only warnings without desktop or mobile overflow.

## Recommendation

Use this first M1 Skill Check batch only as draft support practice. Do not expand M1 Skill Checks until a content reviewer samples this batch in the generated pages and confirms the answer contracts, wording, and template use match the intended student workflow.

The next generation batch should stay small and should target only controlled formula/model items unless a reviewed diagram-specific template exists.

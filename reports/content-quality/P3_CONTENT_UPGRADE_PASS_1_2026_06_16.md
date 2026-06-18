# P3 Content Upgrade Pass 1 - 2026-06-16

Post-implementation inventory for the P3 Learn, Checked Practice, and Exam Training content-quality pass.

Scope stayed static-only: no routing changes, no evidence-rule changes, no backend, no dependency changes, and no fabricated exam records. Exam Training counts below are rendered student-facing counts after the existing eight-question page cap.

## Topic Inventory

| Topic | Learn steps | Checked similar questions | Exam Training questions | Mark-point self-marked | Coarse self-marked | Weakest Learn subtopic | Weakest Exam Training coverage area | Recommended next content addition |
|---|---:|---:|---:|---:|---:|---|---|---|
| Algebra | 11 | 11 | 2 | 1 | 1 | Modulus/discriminant are thin compared with polynomial, partial-fraction, and binomial steps. | Only 2 visible questions; no safe reviewed runtime records beyond current algebra projection. | Review/promote safe Algebra source records, prioritising modulus, partial fractions plus binomial, and discriminant/root-condition questions. |
| Logarithmic and Exponential Functions | 13 | 13 | 6 | 4 | 2 | Graph/asymptote and linearisation transfer is weaker than log-law solving. | Graph/domain and model interpretation are less represented than equation solving. | Add a reviewed log graph/asymptote or exponential-linearisation exam record with clean mark points. |
| Trigonometry | 11 | 11 | 4 | 2 | 2 | Compound-angle expression rewriting is the most cognitively dense step. | Only 4 visible questions; reciprocal/compound-angle variants need more breadth. | Add reviewed reciprocal/compound-angle equation questions with clean interval-solution mark points. |
| Differentiation | 14 | 14 | 8 | 5 | 3 | Parametric and implicit follow-through still need careful exam-transfer reinforcement. | First page is capped at 8; coarse records remain for some one-question derivatives and stationary-point items. | Add or promote clearer parametric/implicit tangent-normal records with reliable part splits. |
| Integration | 13 | 13 | 3 | 2 | 1 | Method-choice transfer is strong, but by-parts and partial-fraction integration need more exam-facing repetition. | Major topic has only 3 clean visible questions; review-only mixed calculus records remain blocked. | Review/promote safe Integration records for substitution, parts, partial fractions, and definite area. |
| Numerical Solution of Equations | 12 | 12 | 3 | 3 | 0 | Convergence/domain-failure comparisons are thinner than routine iteration tables. | Only 3 visible questions; graph proof, bracket, and iteration are present but narrow. | Review/promote more numerical-method questions with sign-change, graph-intersection, and convergence wording. |
| Vectors | 9 | 9 | 3 | 2 | 1 | Distance/reflection geometry has the thinnest Learn depth. | Only 3 visible questions; skew, perpendicular distance, and reflection are underrepresented. | Review/promote vector line-distance, skew/intersection, and reflection records with clean part splits. |
| Differential Equations | 12 | 12 | 8 | 6 | 2 | Worded model formation is weaker than separation mechanics. | Good volume, but two one-question records still lack safe mark-point extraction. | Add a model-formation Learn/example bridge and review the remaining coarse DE records. |
| Complex Numbers | 14 | 14 | 8 | 3 | 5 | Roots/de Moivre transfer needs the most exam-facing repetition. | Good volume, but many records remain coarse and first-page coverage leans loci/Argand. | Add or prioritise reviewed roots/de Moivre and Cartesian-equation records with clean mark points. |

## Exam Training Expansion

No new Exam Training question records were added in this pass.

Reason: the current reviewed student-runtime projection already contains all records that are both `student_runtime_safe=true` and `review_status=reviewed` for the four thin priority topics. The full catalog does contain additional routed records, but the non-runtime candidates are unsafe for this pass:

| Priority topic | Additional routed catalog records outside runtime projection | Blocking status |
|---|---:|---|
| Algebra | 51 | All are `student_runtime_safe=false`, `review_status=needs_review`; most have question-crop or mark-scheme-crop QA blockers. |
| Integration | 48 | All are `student_runtime_safe=false`, `review_status=needs_review`; current mixed calculus records with unresolved review reasons remain non-clean. |
| Numerical Solution of Equations | 24 | All are `student_runtime_safe=false`, `review_status=needs_review`; several have OCR/crop blockers. |
| Vectors | 33 | All are `student_runtime_safe=false`, `review_status=needs_review`; several have OCR/crop blockers. |

Thin-topic improvement therefore came from safe support and mark-point quality, not from increasing question count.

## Mark-Point Conversions

Converted coarse one-part records to tickable mark-point self-marking only where the source subpart marks matched the total marks and mark-scheme text produced one clear mark point per mark.

Converted records:

| Topic | Records converted |
|---|---|
| Algebra | `31summer24_q01` |
| Logarithmic and Exponential Functions | `32spring23_q01`, `31summer23_q01`, `31summer24_q02`, `31summer24_q03` |
| Differentiation | `32autumn23_q02` |
| Differential Equations | `31summer22_q04`, `32spring23_q09`, `31autumn23_q07` |
| Complex Numbers | `32summer21_q02` |

Non-converted records stayed coarse when the mark text did not provide a clean one-action-per-mark split, when OCR wording was too noisy, or when only the mark-scheme image was safe as source of truth. Examples include `33autumn23_q03`, `31autumn23_q03`, `33autumn23_q01`, `32autumn23_q05`, `33summer23_q09`, and several Complex Numbers locus records.

## First-Step Support

Added question-specific first-step support prompts for the clean visible runtime Exam Training records. The prompts reference the actual expression, equation, vector form, locus condition, substitution, or differential equation type. Records without authored support continue to hide the support box.

No visible support prompt should now contain generic repeated text.

## Learn Transfer And Sequencing

Strengthened at least two Learn exam-transfer lines per topic. The edits name the exam behaviour, identify a common trap, and tell the student what to produce. Topic intro descriptions were shortened into sequencing notes so the student understands why the unit order exists.

Examples of changed transfer focus:

| Topic | Transfer focus improved |
|---|---|
| Algebra | Remainder/factor theorem now says to show the divisor-root substitution and zero-remainder evidence. |
| Logarithmic and Exponential Functions | Log conversion and product-law steps now warn against swapped base/input and false `ln(a+b)` shortcuts. |
| Trigonometry | Identity steps now emphasise producing the rewrite before interval solving. |
| Differentiation | Method choice and power rewrites now state the mark-bearing setup line. |
| Integration | Method choice and substitution setup now tell students to write the method, `u`, and `du` line before evaluating. |
| Numerical Solution of Equations | Iteration steps now require a stated numerical target and an explicit `x_{n+1}=g(x_n)` formula. |
| Vectors | Direction-vector and line-equation steps now warn against using a point as the direction. |
| Differential Equations | Separation steps now emphasise the readable separated equation with differentials. |
| Complex Numbers | Cartesian and quotient steps now emphasise final form and avoiding a complex denominator. |

## Remaining Risks

- Algebra, Integration, Numerical Solution, and Vectors still have thin Exam Training counts because safe reviewed source records are unavailable in the runtime projection.
- The eight-question page cap means Differentiation and Complex Numbers have more clean trainable records than the page displays.
- Several coarse records remain appropriate because the mark-scheme image is trustworthy but the extracted text is not clean enough for tickable mark points.

## Verification

Post-implementation commands:

- `npm test` - passed, 131 tests.
- `npm run build` - passed, generated 55 static HTML pages.
- `npm run static:check` - passed, including rendered static page and P3 Learn Mode browser interaction checks.

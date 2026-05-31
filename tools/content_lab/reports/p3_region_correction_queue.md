# P3 Region-Correction Queue

This deterministic queue plans future content correction only. It does not correct the question bank, route sidecar, skill map, snippets, generated practice, or runtime data.

## Source Route Summary

- `ambiguous_multi_topic_route`: 15
- `missing_p3_route`: 12
- `review_needed_route`: 13
- `safe_p3_route`: 356
- `total_p3_route_records`: 396

## Queue Counts

### route_correction

- `ambiguous_multi_topic_routes`: 15
- `audited_route_decisions`: 42
- `fallback_display_only_region_placements`: 12
- `missing_p3_routes`: 12
- `review_needed_routes`: 13

### text_review

- `routing_text_or_visual_blockers`: 18

### mark_scheme_subpart_review

- `deferred_evidence_cases`: 0

### support_content_gaps

- `weak_or_missing_skill_support`: 4

## Reviewed Route Decision Summary

- review label: `phase-1-route-and-evidence-cleanup-v1-plus-phase-2b-clean-source-pool-v1`
- recorded decisions: 14
- decided questions: 14
- still-needs-review route questions: 37

- `ambiguous`: 2
- `blocked`: 2
- `clean`: 6
- `deferred`: 1
- `fallback_only`: 0
- `review_needed`: 1
- `still_needs_review`: 37
- `thin`: 2

| Question | Previous | Decision | Reviewed Region | Mastery | Generation | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 31autumn23_q09 | missing_p3_route | ambiguous | Calculus Cliffs | False | False | The route is resolvable at part level but not as a single mastery claim because the reviewed parts belong to different regions. |
| 32spring21_q10 | missing_p3_route | ambiguous | Integral Terraces | False | False | Part-level evidence is reviewed but split across integration and differentiation, so the whole question remains mastery-ineligible. |
| 31summer23_q02 | missing_p3_route | blocked | Algebra Vault | False | False | Canonical evidence shows the old fallback region is wrong, but the projected quality gate still has an unresolved question-crop confidence blocker. Leave blocked instead of converting it to clean mastery evidence. |
| 33autumn24_q11 | missing_p3_route | blocked | Calculus Cliffs | False | False | Projected quality gate has validation failure, untrusted math text, low question crop confidence, and medium mark-scheme crop confidence. Keep blocked even though canonical images reveal the likely route. |
| 31autumn21_q01 | safe_p3_route | clean | Logarithm Observatory | True | True | Canonical question and mark scheme clearly support the exact exponential-equation skill. Candidate promotion remains blocked because this pass reviews source routing only, not generated practice or mark events. |
| 31autumn21_q02 | safe_p3_route | clean | Trigonometry Spire | True | True | Canonical question and mark scheme narrowly support R-form compound-angle work without needing family-level or nearby-skill inference. |
| 31autumn21_q04 | safe_p3_route | clean | Integral Terraces | True | True | Both reviewed skills sit in the same integration region and are explicitly evidenced by the question and mark scheme. This is not used for broad integration method-choice support because the substitution is given. |
| 31autumn21_q05 | safe_p3_route | clean | Trigonometry Spire | True | True | Canonical question and mark scheme support interval-equation and quadrant-solution skills exactly. The decision does not claim broader identity-selection or reciprocal/double-angle source backing. |
| 31autumn23_q01 | missing_p3_route | clean | Calculus Cliffs | True | True | Canonical question and mark scheme support a clean differentiation route. Candidate promotion remains blocked because mark events are still machine candidates, not reviewed source-skill evidence. |
| 31autumn23_q06 | missing_p3_route | clean | Calculus Cliffs | True | True | Both subparts resolve to the same reviewed P3 differentiation skill, so the multipart route can be clean without broad-route mastery inflation. |
| 33autumn24_q07 | missing_p3_route | deferred | Calculus Cliffs | False | False | Defer route cleanup until the crop uncertainty and topic uncertainty are resolved with a dedicated image review. |
| 32autumn22_q03 | missing_p3_route | review_needed | Calculus Cliffs | False | False | Question crop confidence is low and topic uncertainty remains. Keep in review_needed rather than making a clean route from old labels. |
| 31summer23_q05 | missing_p3_route | thin | Calculus Cliffs | False | False | The region is clear, but the current reviewed skill target is thinner than the exact implicit-differentiation evidence. Keep review-only until a reviewer accepts the source-skill fit. |
| 32spring21_q04 | missing_p3_route | thin | Differential Shrine | False | False | Part a has reviewed differential-equation evidence, but the whole record includes visual sketch evidence and should stay review-only until subpart publication semantics are explicit. |

## Region Summary

| Region | Issues | Workstreams | Categories |
| --- | ---: | --- | --- |
| Integral Terraces | 26 | route_correction:24, text_review:2 | ambiguous_multi_topic_routes:10, audited_route_decisions:7, fallback_display_only_region_placements:1, missing_p3_routes:1, review_needed_routes:5, routing_text_or_visual_blockers:2 |
| Algebra Vault | 21 | route_correction:14, support_content_gaps:3, text_review:4 | audited_route_decisions:7, fallback_display_only_region_placements:3, missing_p3_routes:3, review_needed_routes:1, routing_text_or_visual_blockers:4, weak_or_missing_skill_support:3 |
| Calculus Cliffs | 19 | route_correction:17, text_review:2 | ambiguous_multi_topic_routes:2, audited_route_decisions:11, fallback_display_only_region_placements:2, missing_p3_routes:2, routing_text_or_visual_blockers:2 |
| Iteration Forge | 15 | route_correction:11, text_review:4 | ambiguous_multi_topic_routes:2, audited_route_decisions:3, fallback_display_only_region_placements:1, missing_p3_routes:1, review_needed_routes:4, routing_text_or_visual_blockers:4 |
| Logarithm Observatory | 13 | route_correction:10, support_content_gaps:1, text_review:2 | audited_route_decisions:6, fallback_display_only_region_placements:2, missing_p3_routes:2, routing_text_or_visual_blockers:2, weak_or_missing_skill_support:1 |
| Argand Atrium | 8 | route_correction:5, text_review:3 | fallback_display_only_region_placements:2, missing_p3_routes:2, review_needed_routes:1, routing_text_or_visual_blockers:3 |
| Trigonometry Spire | 7 | route_correction:7 | audited_route_decisions:6, review_needed_routes:1 |
| Differential Shrine | 4 | route_correction:4 | ambiguous_multi_topic_routes:1, audited_route_decisions:2, review_needed_routes:1 |
| Vectors Gate | 3 | route_correction:2, text_review:1 | fallback_display_only_region_placements:1, missing_p3_routes:1, routing_text_or_visual_blockers:1 |

## Route Correction

### Missing P3 Routes

| Question | Fallback Region | Confidence | Review Reasons |
| --- | --- | --- | --- |
| 33autumn24_q05 | Algebra Vault | low | schema_validation_error |
| 33autumn24_q08 | Algebra Vault | low | schema_validation_error |
| 33autumn24_q09 | Algebra Vault | low | schema_validation_error |
| 33autumn24_q07 | Calculus Cliffs | low | schema_validation_error |
| 33autumn24_q11 | Calculus Cliffs | low | schema_validation_error |
| 33autumn24_q01 | Argand Atrium | low | schema_validation_error |
| 33autumn24_q04 | Argand Atrium | low | schema_validation_error |
| 33autumn24_q10 | Integral Terraces | low | schema_validation_error |
| 33autumn24_q03 | Logarithm Observatory | low | schema_validation_error |
| 33autumn25_q03 | Logarithm Observatory | low | Poor OCR text; unable to determine topic. |
| 33autumn24_q02 | Iteration Forge | low | schema_validation_error |
| 33autumn24_q06 | Vectors Gate | low | schema_validation_error |

### Fallback Display-Only Region Placements

| Question | Fallback Region | Local Topic | Why Risky |
| --- | --- | --- | --- |
| 33autumn24_q05 | Algebra Vault | algebra | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q08 | Algebra Vault | partial_fractions | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q09 | Algebra Vault | polynomials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q11 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q01 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q04 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q10 | Integral Terraces | integration | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q03 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn25_q03 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q02 | Iteration Forge | numerical_methods | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q06 | Vectors Gate | vectors | No mapped P3 primary topic exists in the topic-routing sidecar. |

### Ambiguous Multi-Topic Routes

| Question | Primary Region | Review Reasons | Why Risky |
| --- | --- | --- | --- |
| 32autumn21_q11 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 32summer25_q11 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 33autumn21_q10 | Differential Shrine |  | A single whole-question route hides multiple P3 topic signals. |
| 31autumn23_q09 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 32autumn21_q06 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 32autumn23_q09 | Integral Terraces | Question involves both differentiation and integration; primary topic set to integration based on final objective. | A single whole-question route hides multiple P3 topic signals. |
| 32spring23_q08 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 32spring23_q11 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 32summer25_q10 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 33autumn21_q09 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 33autumn22_q11 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 33summer21_q04 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 33summer21_q08 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 31summer22_q10 | Iteration Forge | Part (a) involves differentiation, but the main focus is iterative solution. | A single whole-question route hides multiple P3 topic signals. |
| 33summer23_q05 | Iteration Forge |  | A single whole-question route hides multiple P3 topic signals. |

### Review-Needed Routes

| Question | Primary Region | Confidence | Review Reasons |
| --- | --- | --- | --- |
| 32autumn25_q01 | Algebra Vault | low | Visual-dependent question without image; text insufficient for full routing. |
| 32summer23_q05 | Argand Atrium | medium | No OCR text provided, mark scheme only used |
| 31summer25_q10 | Differential Shrine | medium | Spans algebra and differential equations; primary chosen as differential equations. |
| 31autumn24_q06 | Integral Terraces | medium | Visual dependence: diagram may affect identification of region R |
| 31summer25_q09 | Integral Terraces | medium | Spans integration and numerical solution of equations; primary chosen as integration. |
| 31summer25_q11 | Integral Terraces | medium | Spans differentiation and integration; primary chosen as integration. |
| 32spring22_q08 | Integral Terraces | medium | Question covers both polynomial division (Algebra) and integration; primary topic assigned to Integration as the main goal. |
| 32spring22_q11 | Integral Terraces | medium | Question includes both differentiation (finding maximum) and integration (area); primary topic assigned to Integration as the final result. |
| 31autumn22_q07 | Iteration Forge | high | OCR text ambiguous for part (a) |
| 31summer23_q09 | Iteration Forge | medium | Question involves both integration and iterative numerical solution; primary focus is numerical method. |
| 32autumn25_q06 | Iteration Forge | low | Visual-dependent question without image; text insufficient for full routing. |
| 32summer23_q06 | Iteration Forge | medium | No OCR text provided, mark scheme only used; involves iterative method |
| 33summer24_q07 | Trigonometry Spire | medium | Question involves both polynomial factorization and trigonometric equation; primary topic chosen as trigonometry based on final solving step. |

### Audited Route Decisions

| Skill | Question | Audit Status | Reviewed Region | Recommended Action |
| --- | --- | --- | --- | --- |
| p3_alg_discriminant_root_conditions | 31autumn25_q06 | corrected_skill_map | Algebra Vault | Remove this question from algebra discriminant/root-condition evidence. |
| p3_alg_discriminant_root_conditions | 33summer22_q08 | corrected_skill_map | Algebra Vault | Remove this question from algebra discriminant/root-condition evidence and from the algebra Guardian candidates. |
| p3_alg_modulus_cases | 31autumn25_q06 | corrected_skill_map | Algebra Vault | Remove this question from algebra modulus-case evidence. |
| p3_alg_modulus_cases | 32autumn25_q01 | corrected_question_metadata | Algebra Vault | Correct the question-bank topic to algebra and subtopic to modulus inequalities. |
| p3_alg_structure_rearrangement | 33autumn21_q03 | corrected_skill_map | Algebra Vault | Remove this question from algebra structure evidence and correct the question-bank topic to logarithms_and_exponentials. |
| p3_alg_structure_rearrangement | 33summer22_q03 | corrected_skill_map | Algebra Vault | Remove this question from algebra structure evidence and correct the question-bank topic to logarithms_and_exponentials. |
| p3_alg_structure_rearrangement | 33summer24_q08 | corrected_skill_map | Algebra Vault | Remove this question from algebra structure evidence and from the algebra Guardian candidates; correct the question-bank topic to trigonometry. |
| p3_diff_chain_product_quotient | 31summer21_q09 | validated_skill_map_route | Calculus Cliffs | Accept this as clean product-rule differentiation evidence while keeping the log and integration context visible as separate support. |
| p3_diff_chain_product_quotient | 33summer21_q08 | validated_skill_map_route | Calculus Cliffs | Accept this as clean product/quotient-rule differentiation evidence from the maximum-point subpart. |
| p3_diff_chain_product_quotient | 35summer25_q04 | validated_skill_map_route | Calculus Cliffs | Accept this as clean product-rule differentiation evidence inside a logarithmic stationary-point task. |
| p3_diff_chain_product_quotient | 35summer25_q07 | validated_skill_map_route | Calculus Cliffs | Accept this as clean chain-rule differentiation evidence from part (a); keep the integration-by-parts subpart represented by its own integration evidence. |
| p3_diff_implicit_log_exp | 31summer21_q09 | corrected_skill_map | Calculus Cliffs | Remove this question from implicit log/exponential differentiation evidence; keep it under product-rule, stationary-point, and log-calculus context evidence instead. |
| p3_diff_implicit_log_exp | 32autumn21_q09 | validated_skill_map_route | Calculus Cliffs | Accept this as clean implicit differentiation evidence with exponential structure. |
| p3_diff_implicit_log_exp | 35autumn25_q04 | validated_skill_map_route | Calculus Cliffs | Accept this as clean implicit differentiation evidence with logarithmic structure. |
| p3_diff_stationary_tangent_normal | 31summer21_q09 | validated_skill_map_route | Calculus Cliffs | Accept this as clean stationary-point evidence in a logarithmic curve context. |
| p3_diff_stationary_tangent_normal | 32autumn21_q11 | corrected_skill_map | Calculus Cliffs | Remove this question from stationary-point, tangent, and normal evidence; keep it under numerical iteration and related derivative-context support only. |
| p3_diff_stationary_tangent_normal | 33summer21_q08 | validated_skill_map_route | Calculus Cliffs | Accept this as clean stationary-point evidence from the maximum-point subpart. |
| p3_diff_stationary_tangent_normal | 35summer25_q07 | corrected_skill_map | Calculus Cliffs | Remove this question from stationary-point, tangent, and normal evidence. |
| p3_de_forming_context_model | 31summer21_q10 | corrected_skill_map | Differential Shrine | Remove this question from forming-context-model evidence. |
| p3_de_separation_setup | 32spring21_q04 | validated_skill_map_route | Differential Shrine | Keep this as clean separation-of-variables evidence under Differential Shrine. |
| p3_int_definite_improper_area | 32spring21_q10 | validated_skill_map_route | Integral Terraces | Accept this as clean definite-area evidence from the area subpart. |
| p3_int_definite_improper_area | 33summer21_q04 | validated_skill_map_route | Integral Terraces | Accept this as clean definite-integration evidence after partial fractions. |
| p3_int_partial_fractions | 31summer21_q10 | validated_skill_map_route | Integral Terraces | Accept this as clean partial-fractions integration evidence inside a differential-equation solve. |
| p3_int_partial_fractions | 32spring21_q06 | validated_skill_map_route | Integral Terraces | Accept this as clean integration-using-partial-fractions evidence. |
| p3_int_partial_fractions | 32summer21_q09 | corrected_skill_map | Integral Terraces | Remove this question from integration-using-partial-fractions evidence; it belongs to partial-fraction algebra/binomial-expansion support, not integration mastery. |
| p3_int_partial_fractions | 33summer21_q04 | validated_skill_map_route | Integral Terraces | Accept this as clean integration-using-partial-fractions evidence. |
| p3_int_partial_fractions | 35summer25_q09 | corrected_skill_map | Integral Terraces | Remove this question from integration-using-partial-fractions evidence; it belongs to partial-fraction algebra/binomial-expansion support, not integration mastery. |
| p3_log_calculus_contexts | 31summer21_q09 | validated_skill_map_route | Logarithm Observatory | Keep this as clean log-calculus context evidence. |
| p3_log_calculus_contexts | 32autumn21_q09 | validated_skill_map_route | Logarithm Observatory | Keep this as clean log/exponential calculus-context evidence. |
| p3_log_calculus_contexts | 33autumn21_q07 | validated_skill_map_route | Logarithm Observatory | Accept this as clean log-calculus context evidence. |
| p3_log_calculus_contexts | 35autumn25_q04 | validated_skill_map_route | Logarithm Observatory | Keep this as clean log-calculus context evidence. |
| p3_log_calculus_contexts | 35summer25_q04 | validated_skill_map_route | Logarithm Observatory | Keep this as clean log-calculus context evidence. |
| p3_log_linearisation | 31summer23_q08 | corrected_skill_map | Logarithm Observatory | Remove this question from log-linearisation evidence and correct the question-bank topic to integration. |
| p3_num_iteration_formula | 32autumn21_q11 | validated_skill_map_route | Iteration Forge | Keep this as clean numerical iteration-formula evidence. |
| p3_num_iteration_formula | 33autumn21_q10 | corrected_skill_map | Iteration Forge | Remove this question from iteration-formula evidence and correct the question-bank topic to differential_equations. |
| p3_num_sign_change_graph_evidence | 31summer21_q07 | validated_skill_map_route | Iteration Forge | Keep this as clean numerical bracket/iteration evidence. |
| p3_trig_identity_selection | 31summer21_q04 | validated_skill_map_route | Trigonometry Spire | Accept this as clean trigonometric identity-selection evidence. |
| p3_trig_identity_selection | 32autumn21_q06 | validated_skill_map_route | Trigonometry Spire | Keep this as clean trigonometric identity-selection evidence. |
| p3_trig_identity_selection | 32autumn25_q08 | validated_skill_map_route | Trigonometry Spire | Keep this as clean trigonometric identity-selection evidence. |
| p3_trig_identity_selection | 32summer21_q06 | validated_skill_map_route | Trigonometry Spire | Accept this as clean trigonometric identity-selection evidence. |
| p3_trig_reciprocal_double_angle | 32autumn25_q08 | validated_skill_map_route | Trigonometry Spire | Keep this as clean reciprocal/double-angle evidence. |
| p3_trig_reciprocal_double_angle | 32summer21_q06 | validated_skill_map_route | Trigonometry Spire | Accept this as clean reciprocal/double-angle evidence. |

## Text Review

| Question | Region | Confidence | Review Reasons | Recommended Action |
| --- | --- | --- | --- | --- |
| 32autumn25_q01 | Algebra Vault | low | Visual-dependent question without image; text insufficient for full routing. | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q05 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q08 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q09 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q11 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32summer23_q05 | Argand Atrium | medium | No OCR text provided, mark scheme only used | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q01 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q04 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn24_q06 | Integral Terraces | medium | Visual dependence: diagram may affect identification of region R | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q10 | Integral Terraces | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q03 | Logarithm Observatory | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn25_q03 | Logarithm Observatory | low | Poor OCR text; unable to determine topic. | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn22_q07 | Iteration Forge | high | OCR text ambiguous for part (a) | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn25_q06 | Iteration Forge | low | Visual-dependent question without image; text insufficient for full routing. | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32summer23_q06 | Iteration Forge | medium | No OCR text provided, mark scheme only used; involves iterative method | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q02 | Iteration Forge | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q06 | Vectors Gate | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |

## Mark-Scheme And Subpart Review

| Skill | Question | App Region | Reviewed Region | Recommended Action |
| --- | --- | --- | --- | --- |

## Support-Content Gaps

| Region | Skill | Priority | Status | Gaps / Blockers |
| --- | --- | --- | --- | --- |
| Algebra Vault | p3_alg_discriminant_root_conditions | P2_missing_practice_support | missing_support | warm_up |
| Algebra Vault | p3_alg_partial_fraction_form | P0_blocked_mastery | blocked_for_mastery | blocking reasons: unreviewed_app_region_mismatch |
| Algebra Vault | p3_alg_structure_rearrangement | P2_missing_practice_support | missing_support | warm_up |
| Logarithm Observatory | p3_log_calculus_contexts | P2_missing_practice_support | missing_support | warm_up |

## Policy

- Content mutation allowed in this pass: `false`
- Fallback display routes are browsing hints only, not mastery or generation evidence.
- Deferred evidence remains practice-allowed only where structurally valid, mastery-blocked, and export-blocked.

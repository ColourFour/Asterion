# P3 Region-Correction Queue

This deterministic queue plans future content correction only. It does not correct the question bank, route sidecar, skill map, snippets, generated practice, or runtime data.

## Source Route Summary

- `ambiguous_multi_topic_route`: 16
- `missing_p3_route`: 47
- `review_needed_route`: 14
- `safe_p3_route`: 319
- `total_p3_route_records`: 396

## Queue Counts

### route_correction

- `ambiguous_multi_topic_routes`: 16
- `audited_route_decisions`: 42
- `fallback_display_only_region_placements`: 47
- `missing_p3_routes`: 47
- `review_needed_routes`: 14

### text_review

- `routing_text_or_visual_blockers`: 53

### mark_scheme_subpart_review

- `deferred_evidence_cases`: 0

### support_content_gaps

- `weak_or_missing_skill_support`: 0

## Reviewed Route Decision Summary

- review label: `phase-1-route-and-evidence-cleanup-v1`
- recorded decisions: 10
- decided questions: 10
- still-needs-review route questions: 69

- `ambiguous`: 2
- `blocked`: 2
- `clean`: 2
- `deferred`: 1
- `fallback_only`: 0
- `review_needed`: 1
- `still_needs_review`: 69
- `thin`: 2

| Question | Previous | Decision | Reviewed Region | Mastery | Generation | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 31autumn23_q09 | missing_p3_route | ambiguous | Calculus Cliffs | False | False | The route is resolvable at part level but not as a single mastery claim because the reviewed parts belong to different regions. |
| 32spring21_q10 | missing_p3_route | ambiguous | Integral Terraces | False | False | Part-level evidence is reviewed but split across integration and differentiation, so the whole question remains mastery-ineligible. |
| 31summer23_q02 | missing_p3_route | blocked | Algebra Vault | False | False | Canonical evidence shows the old fallback region is wrong, but the projected quality gate still has an unresolved question-crop confidence blocker. Leave blocked instead of converting it to clean mastery evidence. |
| 33autumn24_q11 | missing_p3_route | blocked | Calculus Cliffs | False | False | Projected quality gate has validation failure, untrusted math text, low question crop confidence, and medium mark-scheme crop confidence. Keep blocked even though canonical images reveal the likely route. |
| 31autumn23_q01 | missing_p3_route | clean | Calculus Cliffs | True | True | Canonical question and mark scheme support a clean differentiation route. Candidate promotion remains blocked because mark events are still machine candidates, not reviewed source-skill evidence. |
| 31autumn23_q06 | missing_p3_route | clean | Calculus Cliffs | True | True | Both subparts resolve to the same reviewed P3 differentiation skill, so the multipart route can be clean without broad-route mastery inflation. |
| 33autumn24_q07 | missing_p3_route | deferred | Calculus Cliffs | False | False | Defer route cleanup until the crop uncertainty and topic uncertainty are resolved with a dedicated image review. |
| 32autumn22_q03 | missing_p3_route | review_needed | Calculus Cliffs | False | False | Question crop confidence is low and topic uncertainty remains. Keep in review_needed rather than making a clean route from old labels. |
| 31summer23_q05 | missing_p3_route | thin | Calculus Cliffs | False | False | The region is clear, but the current reviewed skill target is thinner than the exact implicit-differentiation evidence. Keep review-only until a reviewer accepts the source-skill fit. |
| 32spring21_q04 | missing_p3_route | thin | Differential Shrine | False | False | Part a has reviewed differential-equation evidence, but the whole record includes visual sketch evidence and should stay review-only until subpart publication semantics are explicit. |

## Region Summary

| Region | Issues | Workstreams | Categories |
| --- | ---: | --- | --- |
| Algebra Vault | 42 | route_correction:30, text_review:12 | audited_route_decisions:7, fallback_display_only_region_placements:11, missing_p3_routes:11, review_needed_routes:1, routing_text_or_visual_blockers:12 |
| Calculus Cliffs | 39 | route_correction:31, text_review:8 | ambiguous_multi_topic_routes:3, audited_route_decisions:11, fallback_display_only_region_placements:8, missing_p3_routes:8, review_needed_routes:1, routing_text_or_visual_blockers:8 |
| Integral Terraces | 26 | route_correction:24, text_review:2 | ambiguous_multi_topic_routes:10, audited_route_decisions:7, fallback_display_only_region_placements:1, missing_p3_routes:1, review_needed_routes:5, routing_text_or_visual_blockers:2 |
| Iteration Forge | 26 | route_correction:18, text_review:8 | ambiguous_multi_topic_routes:2, audited_route_decisions:3, fallback_display_only_region_placements:5, missing_p3_routes:5, review_needed_routes:3, routing_text_or_visual_blockers:8 |
| Logarithm Observatory | 24 | route_correction:18, text_review:6 | audited_route_decisions:6, fallback_display_only_region_placements:6, missing_p3_routes:6, routing_text_or_visual_blockers:6 |
| Trigonometry Spire | 22 | route_correction:17, text_review:5 | audited_route_decisions:6, fallback_display_only_region_placements:5, missing_p3_routes:5, review_needed_routes:1, routing_text_or_visual_blockers:5 |
| Argand Atrium | 20 | route_correction:13, text_review:7 | fallback_display_only_region_placements:6, missing_p3_routes:6, review_needed_routes:1, routing_text_or_visual_blockers:7 |
| Vectors Gate | 15 | route_correction:10, text_review:5 | fallback_display_only_region_placements:5, missing_p3_routes:5, routing_text_or_visual_blockers:5 |
| Differential Shrine | 5 | route_correction:5 | ambiguous_multi_topic_routes:1, audited_route_decisions:2, review_needed_routes:2 |

## Route Correction

### Missing P3 Routes

| Question | Fallback Region | Confidence | Review Reasons |
| --- | --- | --- | --- |
| 31autumn23_q10 | Algebra Vault | low | schema_validation_error |
| 31summer23_q03 | Algebra Vault | low | schema_validation_error |
| 31summer23_q08 | Algebra Vault | low | schema_validation_error |
| 31summer23_q10 | Algebra Vault | low | schema_validation_error |
| 32autumn22_q02 | Algebra Vault | low | schema_validation_error |
| 32autumn22_q10 | Algebra Vault | low | schema_validation_error |
| 32spring21_q02 | Algebra Vault | low | schema_validation_error |
| 32spring21_q06 | Algebra Vault | low | schema_validation_error |
| 33autumn24_q05 | Algebra Vault | low | schema_validation_error |
| 33autumn24_q08 | Algebra Vault | low | schema_validation_error |
| 33autumn24_q09 | Algebra Vault | low | schema_validation_error |
| 31autumn23_q07 | Calculus Cliffs | low | schema_validation_error |
| 31summer23_q02 | Calculus Cliffs | low | schema_validation_error |
| 31summer23_q07 | Calculus Cliffs | low | schema_validation_error |
| 32autumn22_q03 | Calculus Cliffs | low | schema_validation_error |
| 32autumn22_q07 | Calculus Cliffs | low | schema_validation_error |
| 32autumn22_q08 | Calculus Cliffs | low | schema_validation_error |
| 33autumn24_q07 | Calculus Cliffs | low | schema_validation_error |
| 33autumn24_q11 | Calculus Cliffs | low | schema_validation_error |
| 31autumn23_q02 | Argand Atrium | low | schema_validation_error |
| 31autumn23_q04 | Argand Atrium | low | schema_validation_error |
| 32autumn22_q05 | Argand Atrium | low | schema_validation_error |
| 32spring21_q08 | Argand Atrium | low | schema_validation_error |
| 33autumn24_q01 | Argand Atrium | low | schema_validation_error |
| 33autumn24_q04 | Argand Atrium | low | schema_validation_error |
| 33autumn24_q10 | Integral Terraces | low | schema_validation_error |
| 31autumn23_q03 | Logarithm Observatory | low | schema_validation_error |
| 31summer23_q01 | Logarithm Observatory | low | schema_validation_error |
| 32autumn22_q01 | Logarithm Observatory | low | schema_validation_error |
| 32spring21_q01 | Logarithm Observatory | low | schema_validation_error |
| 33autumn24_q03 | Logarithm Observatory | low | schema_validation_error |
| 33autumn25_q03 | Logarithm Observatory | low | Poor OCR text; unable to determine topic. |
| 31autumn23_q08 | Iteration Forge | low | schema_validation_error |
| 31summer23_q09 | Iteration Forge | low | schema_validation_error |
| 32autumn22_q09 | Iteration Forge | low | schema_validation_error |
| 32spring21_q09 | Iteration Forge | low | schema_validation_error |
| 33autumn24_q02 | Iteration Forge | low | schema_validation_error |
| 31autumn23_q05 | Trigonometry Spire | low | schema_validation_error |
| 31summer23_q04 | Trigonometry Spire | low | schema_validation_error |
| 32autumn22_q04 | Trigonometry Spire | low | schema_validation_error |
| 32spring21_q03 | Trigonometry Spire | low | schema_validation_error |
| 32spring21_q05 | Trigonometry Spire | low | schema_validation_error |
| 31autumn23_q11 | Vectors Gate | low | schema_validation_error |
| 31summer23_q06 | Vectors Gate | low | schema_validation_error |
| 32autumn22_q06 | Vectors Gate | low | schema_validation_error |
| 32spring21_q07 | Vectors Gate | low | schema_validation_error |
| 33autumn24_q06 | Vectors Gate | low | schema_validation_error |

### Fallback Display-Only Region Placements

| Question | Fallback Region | Local Topic | Why Risky |
| --- | --- | --- | --- |
| 31autumn23_q10 | Algebra Vault | partial_fractions | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q03 | Algebra Vault | binomial_expansion | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q08 | Algebra Vault | partial_fractions | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q10 | Algebra Vault | polynomials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q02 | Algebra Vault | polynomials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q10 | Algebra Vault | partial_fractions | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q02 | Algebra Vault | polynomials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q06 | Algebra Vault | partial_fractions | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q05 | Algebra Vault | algebra | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q08 | Algebra Vault | partial_fractions | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q09 | Algebra Vault | polynomials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q02 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q03 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q08 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q11 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q02 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q04 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q05 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q08 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q01 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q04 | Argand Atrium | complex_numbers | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q10 | Integral Terraces | integration | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q03 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q01 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q01 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q01 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q03 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn25_q03 | Logarithm Observatory | logarithms_and_exponentials | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q08 | Iteration Forge | numerical_methods | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q09 | Iteration Forge | numerical_methods | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q09 | Iteration Forge | numerical_methods | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q09 | Iteration Forge | numerical_methods | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q02 | Iteration Forge | numerical_methods | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q05 | Trigonometry Spire | trigonometry | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q04 | Trigonometry Spire | trigonometry | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q04 | Trigonometry Spire | trigonometry | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q03 | Trigonometry Spire | trigonometry | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q05 | Trigonometry Spire | trigonometry | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q11 | Vectors Gate | vectors | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q06 | Vectors Gate | vectors | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q06 | Vectors Gate | vectors | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q07 | Vectors Gate | vectors | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 33autumn24_q06 | Vectors Gate | vectors | No mapped P3 primary topic exists in the topic-routing sidecar. |

### Ambiguous Multi-Topic Routes

| Question | Primary Region | Review Reasons | Why Risky |
| --- | --- | --- | --- |
| 31autumn23_q09 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 32autumn21_q11 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 32summer25_q11 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 33autumn21_q10 | Differential Shrine |  | A single whole-question route hides multiple P3 topic signals. |
| 32autumn21_q06 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
| 32autumn23_q09 | Integral Terraces | Question involves both differentiation and integration; primary topic set to integration based on final objective. | A single whole-question route hides multiple P3 topic signals. |
| 32spring21_q10 | Integral Terraces |  | A single whole-question route hides multiple P3 topic signals. |
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
| 31summer23_q05 | Calculus Cliffs | medium | phase1_thin_skill_fit_implicit_differentiation, reviewed_region_clear_but_source_skill_fit_requires_teacher_review |
| 32summer23_q05 | Argand Atrium | medium | No OCR text provided, mark scheme only used |
| 31summer25_q10 | Differential Shrine | medium | Spans algebra and differential equations; primary chosen as differential equations. |
| 32spring21_q04 | Differential Shrine | medium | phase1_thin_whole_question_includes_visual_sketch_subpart, part_b_graph_sketch_not_mastery_evidence |
| 31autumn24_q06 | Integral Terraces | medium | Visual dependence: diagram may affect identification of region R |
| 31summer25_q09 | Integral Terraces | medium | Spans integration and numerical solution of equations; primary chosen as integration. |
| 31summer25_q11 | Integral Terraces | medium | Spans differentiation and integration; primary chosen as integration. |
| 32spring22_q08 | Integral Terraces | medium | Question covers both polynomial division (Algebra) and integration; primary topic assigned to Integration as the main goal. |
| 32spring22_q11 | Integral Terraces | medium | Question includes both differentiation (finding maximum) and integration (area); primary topic assigned to Integration as the final result. |
| 31autumn22_q07 | Iteration Forge | high | OCR text ambiguous for part (a) |
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
| 31autumn23_q10 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q03 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q08 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q10 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q02 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q10 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn25_q01 | Algebra Vault | low | Visual-dependent question without image; text insufficient for full routing. | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q02 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q06 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q05 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q08 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q09 | Algebra Vault | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q02 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q03 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q08 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q11 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q02 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q04 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q05 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q08 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32summer23_q05 | Argand Atrium | medium | No OCR text provided, mark scheme only used | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q01 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q04 | Argand Atrium | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn24_q06 | Integral Terraces | medium | Visual dependence: diagram may affect identification of region R | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q10 | Integral Terraces | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q03 | Logarithm Observatory | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q01 | Logarithm Observatory | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q01 | Logarithm Observatory | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q01 | Logarithm Observatory | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q03 | Logarithm Observatory | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn25_q03 | Logarithm Observatory | low | Poor OCR text; unable to determine topic. | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn22_q07 | Iteration Forge | high | OCR text ambiguous for part (a) | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q08 | Iteration Forge | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q09 | Iteration Forge | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q09 | Iteration Forge | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn25_q06 | Iteration Forge | low | Visual-dependent question without image; text insufficient for full routing. | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q09 | Iteration Forge | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32summer23_q06 | Iteration Forge | medium | No OCR text provided, mark scheme only used; involves iterative method | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q02 | Iteration Forge | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q05 | Trigonometry Spire | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q04 | Trigonometry Spire | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q04 | Trigonometry Spire | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q03 | Trigonometry Spire | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q05 | Trigonometry Spire | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q11 | Vectors Gate | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q06 | Vectors Gate | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q06 | Vectors Gate | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q07 | Vectors Gate | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 33autumn24_q06 | Vectors Gate | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |

## Mark-Scheme And Subpart Review

| Skill | Question | App Region | Reviewed Region | Recommended Action |
| --- | --- | --- | --- | --- |

## Support-Content Gaps

| Region | Skill | Priority | Status | Gaps / Blockers |
| --- | --- | --- | --- | --- |

## Policy

- Content mutation allowed in this pass: `false`
- Fallback display routes are browsing hints only, not mastery or generation evidence.
- Deferred evidence remains practice-allowed only where structurally valid, mastery-blocked, and export-blocked.

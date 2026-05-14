# P3 Region-Correction Queue

This deterministic queue plans future content correction only. It does not correct the question bank, route sidecar, skill map, snippets, generated practice, or runtime data.

## Source Route Summary

- `ambiguous_multi_topic_route`: 14
- `missing_p3_route`: 53
- `review_needed_route`: 12
- `safe_p3_route`: 317
- `total_p3_route_records`: 396

## Queue Counts

### route_correction

- `ambiguous_multi_topic_routes`: 14
- `audited_route_decisions`: 10
- `fallback_display_only_region_placements`: 53
- `missing_p3_routes`: 53
- `review_needed_routes`: 12

### text_review

- `routing_text_or_visual_blockers`: 59

### mark_scheme_subpart_review

- `deferred_evidence_cases`: 14

### support_content_gaps

- `weak_or_missing_skill_support`: 30

## Region Summary

| Region | Issues | Workstreams | Categories |
| --- | ---: | --- | --- |
| Calculus Cliffs | 54 | mark_scheme_subpart_review:5, route_correction:30, support_content_gaps:5, text_review:14 | ambiguous_multi_topic_routes:2, deferred_evidence_cases:5, fallback_display_only_region_placements:14, missing_p3_routes:14, routing_text_or_visual_blockers:14, weak_or_missing_skill_support:5 |
| Algebra Vault | 46 | route_correction:30, support_content_gaps:4, text_review:12 | audited_route_decisions:7, fallback_display_only_region_placements:11, missing_p3_routes:11, review_needed_routes:1, routing_text_or_visual_blockers:12, weak_or_missing_skill_support:4 |
| Iteration Forge | 27 | route_correction:16, support_content_gaps:3, text_review:8 | ambiguous_multi_topic_routes:2, audited_route_decisions:1, fallback_display_only_region_placements:5, missing_p3_routes:5, review_needed_routes:3, routing_text_or_visual_blockers:8, weak_or_missing_skill_support:3 |
| Integral Terraces | 26 | mark_scheme_subpart_review:5, route_correction:16, support_content_gaps:3, text_review:2 | ambiguous_multi_topic_routes:9, deferred_evidence_cases:5, fallback_display_only_region_placements:1, missing_p3_routes:1, review_needed_routes:5, routing_text_or_visual_blockers:2, weak_or_missing_skill_support:3 |
| Argand Atrium | 24 | route_correction:13, support_content_gaps:4, text_review:7 | fallback_display_only_region_placements:6, missing_p3_routes:6, review_needed_routes:1, routing_text_or_visual_blockers:7, weak_or_missing_skill_support:4 |
| Logarithm Observatory | 23 | mark_scheme_subpart_review:1, route_correction:13, support_content_gaps:3, text_review:6 | audited_route_decisions:1, deferred_evidence_cases:1, fallback_display_only_region_placements:6, missing_p3_routes:6, routing_text_or_visual_blockers:6, weak_or_missing_skill_support:3 |
| Trigonometry Spire | 21 | mark_scheme_subpart_review:3, route_correction:11, support_content_gaps:2, text_review:5 | deferred_evidence_cases:3, fallback_display_only_region_placements:5, missing_p3_routes:5, review_needed_routes:1, routing_text_or_visual_blockers:5, weak_or_missing_skill_support:2 |
| Vectors Gate | 18 | route_correction:10, support_content_gaps:3, text_review:5 | fallback_display_only_region_placements:5, missing_p3_routes:5, routing_text_or_visual_blockers:5, weak_or_missing_skill_support:3 |
| Differential Shrine | 6 | route_correction:3, support_content_gaps:3 | ambiguous_multi_topic_routes:1, audited_route_decisions:1, review_needed_routes:1, weak_or_missing_skill_support:3 |

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
| 31autumn23_q01 | Calculus Cliffs | low | schema_validation_error |
| 31autumn23_q06 | Calculus Cliffs | low | schema_validation_error |
| 31autumn23_q07 | Calculus Cliffs | low | schema_validation_error |
| 31autumn23_q09 | Calculus Cliffs | low | schema_validation_error |
| 31summer23_q02 | Calculus Cliffs | low | schema_validation_error |
| 31summer23_q05 | Calculus Cliffs | low | schema_validation_error |
| 31summer23_q07 | Calculus Cliffs | low | schema_validation_error |
| 32autumn22_q03 | Calculus Cliffs | low | schema_validation_error |
| 32autumn22_q07 | Calculus Cliffs | low | schema_validation_error |
| 32autumn22_q08 | Calculus Cliffs | low | schema_validation_error |
| 32spring21_q04 | Calculus Cliffs | low | schema_validation_error |
| 32spring21_q10 | Calculus Cliffs | low | schema_validation_error |
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
| 31autumn23_q01 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q06 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31autumn23_q09 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q02 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q05 | Calculus Cliffs | differentiation | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 31summer23_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q03 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q07 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32autumn22_q08 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q04 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
| 32spring21_q10 | Calculus Cliffs | parametric_equations | No mapped P3 primary topic exists in the topic-routing sidecar. |
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
| 32autumn21_q11 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 32summer25_q11 | Calculus Cliffs |  | A single whole-question route hides multiple P3 topic signals. |
| 33autumn21_q10 | Differential Shrine |  | A single whole-question route hides multiple P3 topic signals. |
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
| p3_de_forming_context_model | 31summer21_q10 | corrected_skill_map | Differential Shrine | Remove this question from forming-context-model evidence. |
| p3_log_linearisation | 31summer23_q08 | corrected_skill_map | Logarithm Observatory | Remove this question from log-linearisation evidence and correct the question-bank topic to integration. |
| p3_num_iteration_formula | 33autumn21_q10 | corrected_skill_map | Iteration Forge | Remove this question from iteration-formula evidence and correct the question-bank topic to differential_equations. |

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
| 31autumn23_q01 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q06 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31autumn23_q09 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q02 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q05 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 31summer23_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q03 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q07 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32autumn22_q08 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q04 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
| 32spring21_q10 | Calculus Cliffs | low | schema_validation_error | Review against the canonical question image and mark-scheme image before trusting extracted text or route labels. |
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
| p3_diff_chain_product_quotient | 31summer21_q09 | Integral Terraces | Calculus Cliffs | Keep visible until a reviewer decides whether this mixed log-calculus question should remain differentiation evidence or be represented with part-level metadata. |
| p3_diff_chain_product_quotient | 33summer21_q08 | Integral Terraces | Calculus Cliffs | Keep visible until reviewed for part-level differentiation versus integration evidence. |
| p3_diff_implicit_log_exp | 31summer21_q09 | Integral Terraces | Calculus Cliffs | Keep visible until reviewed for whether it belongs under implicit log/exponential differentiation or only under product/quotient differentiation. |
| p3_diff_stationary_tangent_normal | 31summer21_q09 | Integral Terraces | Calculus Cliffs | Keep visible until reviewed for part-level stationary-point evidence. |
| p3_diff_stationary_tangent_normal | 33summer21_q08 | Integral Terraces | Calculus Cliffs | Keep visible until reviewed for part-level stationary-point evidence. |
| p3_int_definite_improper_area | 32spring21_q10 | Calculus Cliffs | Integral Terraces | Keep visible until reviewed for part-level area/integration evidence. |
| p3_int_partial_fractions | 31summer21_q10 | Differential Shrine | Integral Terraces | Keep visible until reviewed for whether this should be differential-equation solving evidence, integration evidence, or both with part-level metadata. |
| p3_int_partial_fractions | 32spring21_q06 | Algebra Vault | Integral Terraces | Keep visible until reviewed for part-level integration using partial fractions. |
| p3_int_partial_fractions | 32summer21_q09 | Algebra Vault | Integral Terraces | Keep visible until reviewed; this looks more like partial fractions plus expansion than integration. |
| p3_int_partial_fractions | 35summer25_q09 | Algebra Vault | Integral Terraces | Keep visible until reviewed; this looks more like partial fractions plus expansion than integration. |
| p3_log_calculus_contexts | 33autumn21_q07 | Calculus Cliffs | Logarithm Observatory | Keep visible until reviewed as a log-calculus bridge or part-level implicit-differentiation item. |
| p3_trig_identity_selection | 31summer21_q04 | Integral Terraces | Trigonometry Spire | Keep visible until reviewed for part-level trigonometric identity evidence. |
| p3_trig_identity_selection | 32summer21_q06 | Integral Terraces | Trigonometry Spire | Keep visible until reviewed for part-level trigonometric identity evidence. |
| p3_trig_reciprocal_double_angle | 32summer21_q06 | Integral Terraces | Trigonometry Spire | Keep visible until reviewed for part-level reciprocal/double-angle evidence. |

## Support-Content Gaps

| Region | Skill | Priority | Status | Gaps / Blockers |
| --- | --- | --- | --- | --- |
| Algebra Vault | p3_alg_discriminant_root_conditions | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Algebra Vault | p3_alg_partial_fraction_form | P0_blocked_mastery | blocked_for_mastery | blocking reasons: unreviewed_app_region_mismatch |
| Algebra Vault | p3_alg_polynomial_remainder_factor | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Algebra Vault | p3_alg_structure_rearrangement | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Calculus Cliffs | p3_diff_chain_product_quotient | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Calculus Cliffs | p3_diff_implicit_log_exp | P1_missing_core_support | needs_teacher_review | quick_check, warm_up |
| Calculus Cliffs | p3_diff_method_selection | P2_missing_practice_support | missing_support | warm_up |
| Calculus Cliffs | p3_diff_parametric_gradients | P2_missing_practice_support | missing_support | warm_up |
| Calculus Cliffs | p3_diff_stationary_tangent_normal | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Argand Atrium | p3_complex_argand_loci_regions | P2_missing_practice_support | missing_support | warm_up |
| Argand Atrium | p3_complex_cartesian_conjugate | P2_missing_practice_support | missing_support | warm_up |
| Argand Atrium | p3_complex_modulus_argument_form | P2_missing_practice_support | missing_support | warm_up |
| Argand Atrium | p3_complex_roots_powers | P1_missing_core_support | missing_support | quick_check, warm_up |
| Differential Shrine | p3_de_forming_context_model | P1_missing_core_support | missing_support | quick_check, warm_up |
| Differential Shrine | p3_de_initial_condition | P2_missing_practice_support | missing_support | warm_up |
| Differential Shrine | p3_de_separation_setup | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Integral Terraces | p3_int_definite_improper_area | P1_missing_core_support | needs_teacher_review | quick_check, warm_up |
| Integral Terraces | p3_int_method_choice | P2_missing_practice_support | missing_support | warm_up |
| Integral Terraces | p3_int_parts_substitution | P2_missing_practice_support | missing_support | warm_up |
| Logarithm Observatory | p3_log_calculus_contexts | P0_blocked_mastery | blocked_for_mastery | snippet, worked_example, quick_check, warm_up |
| Logarithm Observatory | p3_log_domain_validation | P2_missing_practice_support | missing_support | warm_up |
| Logarithm Observatory | p3_log_linearisation | P2_missing_practice_support | missing_support | warm_up |
| Iteration Forge | p3_num_accuracy_rounding | P2_missing_practice_support | missing_support | warm_up |
| Iteration Forge | p3_num_iteration_formula | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Iteration Forge | p3_num_sign_change_graph_evidence | P0_blocked_mastery | blocked_for_mastery | warm_up |
| Trigonometry Spire | p3_trig_identity_selection | P0_blocked_mastery | blocked_for_mastery | blocking reasons: unreviewed_app_region_mismatch |
| Trigonometry Spire | p3_trig_reciprocal_double_angle | P0_blocked_mastery | blocked_for_mastery | blocking reasons: unreviewed_app_region_mismatch |
| Vectors Gate | p3_vec_3d_geometry_modelling | P1_missing_core_support | missing_support | quick_check, warm_up |
| Vectors Gate | p3_vec_line_equations_intersections | P2_missing_practice_support | missing_support | warm_up |
| Vectors Gate | p3_vec_scalar_product_angles | P2_missing_practice_support | missing_support | warm_up |

## Policy

- Content mutation allowed in this pass: `false`
- Fallback display routes are browsing hints only, not mastery or generation evidence.
- Deferred evidence remains practice-allowed only where structurally valid, mastery-blocked, and export-blocked.

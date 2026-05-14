# P3 Coverage Matrix

## Executive Summary

This deterministic matrix covers 40 reviewed CAIE 9709 Paper 3 skills. It separates reviewed skills, official syllabus sections, app regions, teaching support, clean mastery evidence, deferred ambiguous evidence, and correction priority. Deferred ambiguous cases remain visible, practice-allowed where structurally valid, mastery-ineligible, and export-blocked.

Coverage status counts:

- `blocked_for_mastery`: 12
- `missing_support`: 16
- `needs_teacher_review`: 3
- `partial`: 0
- `ready_for_review`: 9

Correction priority counts:

- `P0_blocked_mastery`: 12
- `P1_missing_core_support`: 5
- `P2_missing_practice_support`: 13
- `P3_teacher_review_backlog`: 1
- `P4_polish_or_complete`: 9

## Counts By Official Syllabus Section

- `Algebra`: 7
- `Complex numbers`: 4
- `Differential equations`: 3
- `Differentiation`: 5
- `Integration`: 4
- `Logarithmic and exponential functions`: 6
- `Numerical solution of equations`: 3
- `Trigonometry`: 5
- `Vectors`: 3

## Counts By Region

- `algebra-forge` (Algebra Vault): 7
- `calculus-cliffs` (Calculus Cliffs): 5
- `complex-harbor` (Argand Atrium): 4
- `differential-shrine` (Differential Shrine): 3
- `integration-gardens` (Integral Terraces): 4
- `logarithm-grove` (Logarithm Observatory): 6
- `numerical-mines` (Iteration Forge): 3
- `trig-observatory` (Trigonometry Spire): 5
- `vector-workshop` (Vectors Gate): 3

## Priority Buckets

### P0_blocked_mastery

`p3_alg_discriminant_root_conditions`, `p3_alg_partial_fraction_form`, `p3_alg_polynomial_remainder_factor`, `p3_alg_structure_rearrangement`, `p3_de_separation_setup`, `p3_diff_chain_product_quotient`, `p3_diff_stationary_tangent_normal`, `p3_log_calculus_contexts`, `p3_num_iteration_formula`, `p3_num_sign_change_graph_evidence`, `p3_trig_identity_selection`, `p3_trig_reciprocal_double_angle`

### P1_missing_core_support

`p3_complex_roots_powers`, `p3_de_forming_context_model`, `p3_diff_implicit_log_exp`, `p3_int_definite_improper_area`, `p3_vec_3d_geometry_modelling`

### P2_missing_practice_support

`p3_complex_argand_loci_regions`, `p3_complex_cartesian_conjugate`, `p3_complex_modulus_argument_form`, `p3_de_initial_condition`, `p3_diff_method_selection`, `p3_diff_parametric_gradients`, `p3_int_method_choice`, `p3_int_parts_substitution`, `p3_log_domain_validation`, `p3_log_linearisation`, `p3_num_accuracy_rounding`, `p3_vec_line_equations_intersections`, `p3_vec_scalar_product_angles`

### P3_teacher_review_backlog

`p3_int_partial_fractions`

### P4_polish_or_complete

`p3_alg_binomial_terms_coefficients`, `p3_alg_binomial_validity`, `p3_alg_modulus_cases`, `p3_log_convert_forms`, `p3_log_exponential_equations`, `p3_log_laws_equations`, `p3_trig_equation_interval`, `p3_trig_quadrant_solutions`, `p3_trig_r_form_compound_angles`

## Compact Skill Matrix

| Skill | Section | Region | Status | Clean Evidence | Deferred Evidence | Support Gaps | Priority | Next Action |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| p3_alg_binomial_terms_coefficients | Algebra | Algebra Vault | ready_for_review | 5 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_alg_binomial_validity | Algebra | Algebra Vault | ready_for_review | 4 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_alg_discriminant_root_conditions | Algebra | Algebra Vault | blocked_for_mastery | 0 | 0 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_alg_modulus_cases | Algebra | Algebra Vault | ready_for_review | 3 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_alg_partial_fraction_form | Algebra | Algebra Vault | blocked_for_mastery | 4 | 0 | none | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_alg_polynomial_remainder_factor | Algebra | Algebra Vault | blocked_for_mastery | 4 | 0 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_alg_structure_rearrangement | Algebra | Algebra Vault | blocked_for_mastery | 0 | 0 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_complex_argand_loci_regions | Complex numbers | Argand Atrium | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_complex_cartesian_conjugate | Complex numbers | Argand Atrium | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_complex_modulus_argument_form | Complex numbers | Argand Atrium | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_complex_roots_powers | Complex numbers | Argand Atrium | missing_support | 5 | 0 | quick_check, warm_up | P1_missing_core_support | Add reviewed snippet, worked-example, or Quick Check support for the missing core support types. |
| p3_de_forming_context_model | Differential equations | Differential Shrine | missing_support | 4 | 0 | quick_check, warm_up | P1_missing_core_support | Add reviewed snippet, worked-example, or Quick Check support for the missing core support types. |
| p3_de_initial_condition | Differential equations | Differential Shrine | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_de_separation_setup | Differential equations | Differential Shrine | blocked_for_mastery | 4 | 0 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_diff_chain_product_quotient | Differentiation | Calculus Cliffs | blocked_for_mastery | 2 | 2 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_diff_implicit_log_exp | Differentiation | Calculus Cliffs | needs_teacher_review | 3 | 1 | quick_check, warm_up | P1_missing_core_support | Add reviewed snippet, worked-example, or Quick Check support for the missing core support types. |
| p3_diff_method_selection | Differentiation | Calculus Cliffs | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_diff_parametric_gradients | Differentiation | Calculus Cliffs | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_diff_stationary_tangent_normal | Differentiation | Calculus Cliffs | blocked_for_mastery | 2 | 2 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_int_definite_improper_area | Integration | Integral Terraces | needs_teacher_review | 4 | 1 | quick_check, warm_up | P1_missing_core_support | Add reviewed snippet, worked-example, or Quick Check support for the missing core support types. |
| p3_int_method_choice | Integration | Integral Terraces | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_int_partial_fractions | Integration | Integral Terraces | needs_teacher_review | 1 | 4 | none | P3_teacher_review_backlog | Keep deferred cases visible and route them through teacher review before export or mastery claims. |
| p3_int_parts_substitution | Integration | Integral Terraces | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_log_calculus_contexts | Logarithmic and exponential functions | Logarithm Observatory | blocked_for_mastery | 0 | 1 | snippet, worked_example, quick_check, warm_up | P0_blocked_mastery | Find or review clean P3 canonical mastery evidence before claiming mastery. |
| p3_log_convert_forms | Logarithmic and exponential functions | Logarithm Observatory | ready_for_review | 5 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_log_domain_validation | Logarithmic and exponential functions | Logarithm Observatory | missing_support | 4 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_log_exponential_equations | Logarithmic and exponential functions | Logarithm Observatory | ready_for_review | 5 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_log_laws_equations | Logarithmic and exponential functions | Logarithm Observatory | ready_for_review | 5 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_log_linearisation | Logarithmic and exponential functions | Logarithm Observatory | missing_support | 3 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_num_accuracy_rounding | Numerical solution of equations | Iteration Forge | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_num_iteration_formula | Numerical solution of equations | Iteration Forge | blocked_for_mastery | 3 | 0 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_num_sign_change_graph_evidence | Numerical solution of equations | Iteration Forge | blocked_for_mastery | 4 | 0 | warm_up | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_trig_equation_interval | Trigonometry | Trigonometry Spire | ready_for_review | 5 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_trig_identity_selection | Trigonometry | Trigonometry Spire | blocked_for_mastery | 1 | 2 | none | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_trig_quadrant_solutions | Trigonometry | Trigonometry Spire | ready_for_review | 5 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_trig_r_form_compound_angles | Trigonometry | Trigonometry Spire | ready_for_review | 4 | 0 | none | P4_polish_or_complete | Teacher review can confirm this row for region-by-region correction planning. |
| p3_trig_reciprocal_double_angle | Trigonometry | Trigonometry Spire | blocked_for_mastery | 3 | 1 | none | P0_blocked_mastery | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_vec_3d_geometry_modelling | Vectors | Vectors Gate | missing_support | 5 | 0 | quick_check, warm_up | P1_missing_core_support | Add reviewed snippet, worked-example, or Quick Check support for the missing core support types. |
| p3_vec_line_equations_intersections | Vectors | Vectors Gate | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |
| p3_vec_scalar_product_angles | Vectors | Vectors Gate | missing_support | 5 | 0 | warm_up | P2_missing_practice_support | Add reviewed deterministic warm-up support after core teaching support is safe. |

## Blocked Mastery Skills

| Skill | Clean Evidence | Deferred Evidence | Blocking Reasons | Next Action |
| --- | ---: | ---: | --- | --- |
| p3_alg_discriminant_root_conditions | 0 | 0 | mastery_evidence_blocked_by_routing_audit, no_clean_mastery_evidence, unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_alg_partial_fraction_form | 4 | 0 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_alg_polynomial_remainder_factor | 4 | 0 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_alg_structure_rearrangement | 0 | 0 | mastery_evidence_blocked_by_routing_audit, no_clean_mastery_evidence, unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_de_separation_setup | 4 | 0 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_diff_chain_product_quotient | 2 | 2 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_diff_stationary_tangent_normal | 2 | 2 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_log_calculus_contexts | 0 | 1 | all_available_evidence_deferred, mastery_evidence_blocked_by_routing_audit, no_clean_mastery_evidence, unreviewed_app_region_mismatch | Find or review clean P3 canonical mastery evidence before claiming mastery. |
| p3_num_iteration_formula | 3 | 0 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_num_sign_change_graph_evidence | 4 | 0 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_trig_identity_selection | 1 | 2 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |
| p3_trig_reciprocal_double_angle | 3 | 1 | unreviewed_app_region_mismatch | Resolve mastery-safety blockers before using this skill for mastery claims. |

## Deferred Ambiguous Evidence

- Deferred case count: 14
- Affected skill count: 8
- Mastery evidence allowed: false
- Practice allowed: true
- Export allowed: false

| Skill | Question | App Region | Reviewed Region | Evidence Status |
| --- | --- | --- | --- | --- |
| p3_diff_chain_product_quotient | 31summer21_q09 | integration-gardens | calculus-cliffs | ambiguous_part_level_evidence |
| p3_diff_chain_product_quotient | 33summer21_q08 | integration-gardens | calculus-cliffs | ambiguous_part_level_evidence |
| p3_diff_implicit_log_exp | 31summer21_q09 | integration-gardens | calculus-cliffs | ambiguous_part_level_evidence |
| p3_diff_stationary_tangent_normal | 31summer21_q09 | integration-gardens | calculus-cliffs | ambiguous_part_level_evidence |
| p3_diff_stationary_tangent_normal | 33summer21_q08 | integration-gardens | calculus-cliffs | ambiguous_part_level_evidence |
| p3_int_definite_improper_area | 32spring21_q10 | calculus-cliffs | integration-gardens | ambiguous_part_level_evidence |
| p3_int_partial_fractions | 31summer21_q10 | differential-shrine | integration-gardens | ambiguous_part_level_evidence |
| p3_int_partial_fractions | 32spring21_q06 | algebra-forge | integration-gardens | ambiguous_part_level_evidence |
| p3_int_partial_fractions | 32summer21_q09 | algebra-forge | integration-gardens | ambiguous_part_level_evidence |
| p3_int_partial_fractions | 35summer25_q09 | algebra-forge | integration-gardens | ambiguous_part_level_evidence |
| p3_log_calculus_contexts | 33autumn21_q07 | calculus-cliffs | logarithm-grove | ambiguous_part_level_evidence |
| p3_trig_identity_selection | 31summer21_q04 | integration-gardens | trig-observatory | ambiguous_part_level_evidence |
| p3_trig_identity_selection | 32summer21_q06 | integration-gardens | trig-observatory | ambiguous_part_level_evidence |
| p3_trig_reciprocal_double_angle | 32summer21_q06 | integration-gardens | trig-observatory | ambiguous_part_level_evidence |

## Support Gaps

- `field_guide`: 0
- `quick_check`: 6
- `snippet`: 1
- `warm_up`: 27
- `worked_example`: 1

| Support Type | Skills |
| --- | --- |
| field_guide | none |
| snippet | `p3_log_calculus_contexts` |
| worked_example | `p3_log_calculus_contexts` |
| quick_check | `p3_complex_roots_powers`, `p3_de_forming_context_model`, `p3_diff_implicit_log_exp`, `p3_int_definite_improper_area`, `p3_log_calculus_contexts`, `p3_vec_3d_geometry_modelling` |
| warm_up | `p3_alg_discriminant_root_conditions`, `p3_alg_polynomial_remainder_factor`, `p3_alg_structure_rearrangement`, `p3_complex_argand_loci_regions`, `p3_complex_cartesian_conjugate`, `p3_complex_modulus_argument_form`, `p3_complex_roots_powers`, `p3_de_forming_context_model`, `p3_de_initial_condition`, `p3_de_separation_setup`, `p3_diff_chain_product_quotient`, `p3_diff_implicit_log_exp`, `p3_diff_method_selection`, `p3_diff_parametric_gradients`, `p3_diff_stationary_tangent_normal`, `p3_int_definite_improper_area`, `p3_int_method_choice`, `p3_int_parts_substitution`, `p3_log_calculus_contexts`, `p3_log_domain_validation`, `p3_log_linearisation`, `p3_num_accuracy_rounding`, `p3_num_iteration_formula`, `p3_num_sign_change_graph_evidence`, `p3_vec_3d_geometry_modelling`, `p3_vec_line_equations_intersections`, `p3_vec_scalar_product_angles` |

## Suggested Region-By-Region Correction Order

| Order | Region | Highest Priority | Blocked Skills | Support Gap Skills |
| ---: | --- | --- | ---: | ---: |
| 1 | Algebra Vault | P0_blocked_mastery | 4 | 3 |
| 2 | Calculus Cliffs | P0_blocked_mastery | 2 | 5 |
| 3 | Iteration Forge | P0_blocked_mastery | 2 | 3 |
| 4 | Trigonometry Spire | P0_blocked_mastery | 2 | 0 |
| 5 | Differential Shrine | P0_blocked_mastery | 1 | 3 |
| 6 | Logarithm Observatory | P0_blocked_mastery | 1 | 3 |
| 7 | Argand Atrium | P1_missing_core_support | 0 | 4 |
| 8 | Integral Terraces | P1_missing_core_support | 0 | 3 |
| 9 | Vectors Gate | P1_missing_core_support | 0 | 3 |

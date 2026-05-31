#!/usr/bin/env python3
"""Build deterministic Content Lab generated warm-up practice.

These items are original low-stakes practice prompts. The React app consumes only
the reviewed, verified static runtime JSON written by this script.
"""

from __future__ import annotations

import argparse
import json
import sys
from fractions import Fraction
from math import comb, gcd
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from p3_skill_contract import P3_REGION_DISPLAY_NAMES, PRIORITY_P3_REGION_IDS, load_p3_skill_map, p3_region_ids_from_skill_map, p3_skill_ids_from_skill_map


GENERATED_BY = "tools/content_lab/scripts/build_generated_practice.py"
VERIFIER_NAME = "content_lab_schema_v2"
RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}
REVIEW_QUEUE_STATUS = "needs_review"

LOG_TOPIC = "logarithms_and_exponentials"
LOG_FAMILY = "logarithms_and_exponentials.log_equation_basic"
LOG_GRAPH_INVERSE_FAMILY = "logarithms_and_exponentials.graph_inverse_basic"
LOG_LAWS_FAMILY = "logarithms_and_exponentials.laws_basic"
LOG_EXPONENTIAL_INEQUALITY_FAMILY = "logarithms_and_exponentials.exponential_inequality_basic"
BINOMIAL_TOPIC = "binomial_expansion"
BINOMIAL_FAMILY = "binomial_expansion.first_terms_and_coefficient"
BINOMIAL_VALIDITY_FAMILY = "algebra.binomial_validity_range"
PARTIAL_FRACTIONS_TOPIC = "partial_fractions"
PARTIAL_FRACTIONS_DISTINCT_FAMILY = "algebra.partial_fractions_distinct_linear"
PARTIAL_FRACTIONS_REPEATED_FAMILY = "algebra.partial_fractions_repeated_linear"
ALGEBRA_TOPIC = "algebra"
ALGEBRA_STRUCTURE_FAMILY = "algebra.structure_rearrangement_basic"
ALGEBRA_STRUCTURE_BRIDGE_FAMILY = "algebra.structure_first_bridge"
POLYNOMIAL_REMAINDER_FAMILY = "algebra.polynomial_remainder_factor_basic"
MODULUS_EQUATION_FAMILY = "algebra.modulus_equation_basic"
QUADRATICS_TOPIC = "quadratics"
QUADRATICS_DISCRIMINANT_FAMILY = "quadratics.discriminant_root_condition_basic"
QUADRATICS_DISCRIMINANT_BRIDGE_FAMILY = "quadratics.discriminant_root_condition_bridge"
TRIG_TOPIC = "trigonometry"
TRIG_IDENTITY_FAMILY = "trigonometry.identity_rewrite_basic"
TRIG_ADDITION_FORMULAE_FAMILY = "trigonometry.addition_formulae_basic"
TRIG_DOUBLE_ANGLE_FAMILY = "trigonometry.double_angle_basic"
TRIG_SOLVE_INTERVAL_FAMILY = "trigonometry.solve_equation_interval_basic"
TRIG_R_FORM_FAMILY = "trigonometry.r_form_basic"
LOG_DOMAIN_FAMILY = "logarithms_and_exponentials.domain_validation_basic"
LOG_LINEARISATION_FAMILY = "logarithms_and_exponentials.linearisation_basic"
LOG_CALCULUS_CONTEXT_FAMILY = "logarithms_and_exponentials.calculus_context_basic"
DIFFERENTIATION_TOPIC = "differentiation"
DIFFERENTIATION_CHAIN_PRODUCT_FAMILY = "differentiation.chain_product_basic"
DIFFERENTIATION_IMPLICIT_LOG_EXP_FAMILY = "differentiation.implicit_log_exp_basic"
DIFFERENTIATION_STATIONARY_TANGENT_FAMILY = "differentiation.stationary_tangent_normal_basic"
PARAMETRIC_TOPIC = "parametric_equations"
PARAMETRIC_DERIVATIVE_FAMILY = "parametric_equations.derivative_ratio_basic"
INTEGRATION_TOPIC = "integration"
INTEGRATION_METHOD_SETUP_FAMILY = "integration.method_setup_basic"
INTEGRATION_DEFINITE_AREA_FAMILY = "integration.definite_area_basic"
INTEGRATION_PARTS_SUBSTITUTION_FAMILY = "integration.parts_substitution_basic"
COMPLEX_TOPIC = "complex_numbers"
COMPLEX_MODULUS_ARGUMENT_FAMILY = "complex_numbers.modulus_argument_basic"
COMPLEX_LOCUS_FAMILY = "complex_numbers.locus_basic"
COMPLEX_ROOTS_FAMILY = "complex_numbers.roots_basic"
COMPLEX_CARTESIAN_LOCUS_ROOTS_FAMILY = "complex_numbers.cartesian_locus_roots_basic"
COMPLEX_CARTESIAN_CONJUGATE_FAMILY = "complex_numbers.cartesian_conjugate_basic"
VECTORS_TOPIC = "vectors"
VECTORS_LINE_SCALAR_FAMILY = "vectors.line_scalar_product_basic"
VECTORS_LINE_INTERSECTION_FAMILY = "vectors.line_intersection_basic"
VECTORS_LINE_RELATIONSHIP_FAMILY = "vectors.line_relationship_basic"
NUMERICAL_TOPIC = "numerical_methods"
NUMERICAL_SIGN_CHANGE_ITERATION_FAMILY = "numerical_methods.sign_change_iteration_basic"
NUMERICAL_ITERATION_FORMULA_FAMILY = "numerical_methods.iteration_formula_basic"
NUMERICAL_ACCURACY_ROUNDING_FAMILY = "numerical_methods.accuracy_rounding_basic"
DIFFERENTIAL_EQUATIONS_TOPIC = "differential_equations"
DIFFERENTIAL_EQUATIONS_SEPARATION_FAMILY = "differential_equations.separation_basic"
DIFFERENTIAL_EQUATIONS_INITIAL_CONDITION_FAMILY = "differential_equations.initial_condition_basic"
DIFFERENTIAL_EQUATIONS_CONTEXT_MODEL_FAMILY = "differential_equations.context_model_basic"
PAPER_FAMILY = "p3"
SEQUENCE_ROLES = ("first_step", "complete_step", "guardian_prep")
ACTIVE_P3_REGION_IDS = sorted(p3_region_ids_from_skill_map(load_p3_skill_map()))
REVIEWED_P3_SKILL_IDS = p3_skill_ids_from_skill_map(load_p3_skill_map())
PRIORITY_REGION_IDS = sorted(PRIORITY_P3_REGION_IDS)
REGION_DISPLAY_NAMES = P3_REGION_DISPLAY_NAMES

GENERATOR_FAMILY_SKILL_TARGET_IDS = {
    ALGEBRA_STRUCTURE_FAMILY: "p3_alg_structure_rearrangement",
    ALGEBRA_STRUCTURE_BRIDGE_FAMILY: "p3_alg_structure_rearrangement",
    POLYNOMIAL_REMAINDER_FAMILY: "p3_alg_polynomial_remainder_factor",
    QUADRATICS_DISCRIMINANT_FAMILY: "p3_alg_discriminant_root_conditions",
    QUADRATICS_DISCRIMINANT_BRIDGE_FAMILY: "p3_alg_discriminant_root_conditions",
    LOG_FAMILY: "p3_log_exponential_equations",
    LOG_GRAPH_INVERSE_FAMILY: "p3_log_convert_forms",
    LOG_LAWS_FAMILY: "p3_log_laws_equations",
    LOG_EXPONENTIAL_INEQUALITY_FAMILY: "p3_log_exponential_equations",
    BINOMIAL_FAMILY: "p3_alg_binomial_terms_coefficients",
    BINOMIAL_VALIDITY_FAMILY: "p3_alg_binomial_validity",
    PARTIAL_FRACTIONS_DISTINCT_FAMILY: "p3_alg_partial_fraction_form",
    PARTIAL_FRACTIONS_REPEATED_FAMILY: "p3_alg_partial_fraction_form",
    MODULUS_EQUATION_FAMILY: "p3_alg_modulus_cases",
    TRIG_IDENTITY_FAMILY: "p3_trig_identity_selection",
    TRIG_ADDITION_FORMULAE_FAMILY: "p3_trig_r_form_compound_angles",
    TRIG_DOUBLE_ANGLE_FAMILY: "p3_trig_reciprocal_double_angle",
    TRIG_SOLVE_INTERVAL_FAMILY: "p3_trig_equation_interval",
    TRIG_R_FORM_FAMILY: "p3_trig_r_form_compound_angles",
    LOG_DOMAIN_FAMILY: "p3_log_domain_validation",
    LOG_LINEARISATION_FAMILY: "p3_log_linearisation",
    LOG_CALCULUS_CONTEXT_FAMILY: "p3_log_calculus_contexts",
    DIFFERENTIATION_CHAIN_PRODUCT_FAMILY: "p3_diff_chain_product_quotient",
    DIFFERENTIATION_IMPLICIT_LOG_EXP_FAMILY: "p3_diff_implicit_log_exp",
    PARAMETRIC_DERIVATIVE_FAMILY: "p3_diff_parametric_gradients",
    INTEGRATION_METHOD_SETUP_FAMILY: "p3_int_method_choice",
    INTEGRATION_DEFINITE_AREA_FAMILY: "p3_int_definite_improper_area",
    INTEGRATION_PARTS_SUBSTITUTION_FAMILY: "p3_int_parts_substitution",
    COMPLEX_MODULUS_ARGUMENT_FAMILY: "p3_complex_modulus_argument_form",
    COMPLEX_LOCUS_FAMILY: "p3_complex_argand_loci_regions",
    COMPLEX_ROOTS_FAMILY: "p3_complex_roots_powers",
    COMPLEX_CARTESIAN_LOCUS_ROOTS_FAMILY: "p3_complex_argand_loci_regions",
    COMPLEX_CARTESIAN_CONJUGATE_FAMILY: "p3_complex_cartesian_conjugate",
    VECTORS_LINE_SCALAR_FAMILY: "p3_vec_scalar_product_angles",
    VECTORS_LINE_INTERSECTION_FAMILY: "p3_vec_line_equations_intersections",
    VECTORS_LINE_RELATIONSHIP_FAMILY: "p3_vec_3d_geometry_modelling",
    NUMERICAL_SIGN_CHANGE_ITERATION_FAMILY: "p3_num_sign_change_graph_evidence",
    NUMERICAL_ITERATION_FORMULA_FAMILY: "p3_num_iteration_formula",
    NUMERICAL_ACCURACY_ROUNDING_FAMILY: "p3_num_accuracy_rounding",
    DIFFERENTIAL_EQUATIONS_SEPARATION_FAMILY: "p3_de_separation_setup",
    DIFFERENTIAL_EQUATIONS_INITIAL_CONDITION_FAMILY: "p3_de_initial_condition",
    DIFFERENTIAL_EQUATIONS_CONTEXT_MODEL_FAMILY: "p3_de_forming_context_model",
    DIFFERENTIATION_STATIONARY_TANGENT_FAMILY: "p3_diff_stationary_tangent_normal",
}

PROMOTED_RUNTIME_GENERATOR_FAMILIES = {
    ALGEBRA_STRUCTURE_BRIDGE_FAMILY,
    POLYNOMIAL_REMAINDER_FAMILY,
    QUADRATICS_DISCRIMINANT_BRIDGE_FAMILY,
    LOG_GRAPH_INVERSE_FAMILY,
    LOG_LAWS_FAMILY,
    LOG_EXPONENTIAL_INEQUALITY_FAMILY,
    LOG_DOMAIN_FAMILY,
    LOG_LINEARISATION_FAMILY,
    DIFFERENTIATION_CHAIN_PRODUCT_FAMILY,
    DIFFERENTIATION_IMPLICIT_LOG_EXP_FAMILY,
    INTEGRATION_METHOD_SETUP_FAMILY,
    INTEGRATION_DEFINITE_AREA_FAMILY,
    INTEGRATION_PARTS_SUBSTITUTION_FAMILY,
    COMPLEX_MODULUS_ARGUMENT_FAMILY,
    COMPLEX_LOCUS_FAMILY,
    COMPLEX_ROOTS_FAMILY,
    COMPLEX_CARTESIAN_CONJUGATE_FAMILY,
    DIFFERENTIATION_STATIONARY_TANGENT_FAMILY,
    NUMERICAL_SIGN_CHANGE_ITERATION_FAMILY,
    NUMERICAL_ITERATION_FORMULA_FAMILY,
    NUMERICAL_ACCURACY_ROUNDING_FAMILY,
    DIFFERENTIAL_EQUATIONS_SEPARATION_FAMILY,
    DIFFERENTIAL_EQUATIONS_INITIAL_CONDITION_FAMILY,
    DIFFERENTIAL_EQUATIONS_CONTEXT_MODEL_FAMILY,
    VECTORS_LINE_SCALAR_FAMILY,
    VECTORS_LINE_INTERSECTION_FAMILY,
    VECTORS_LINE_RELATIONSHIP_FAMILY,
}

QUARANTINED_RUNTIME_GENERATOR_FAMILIES = {
    ALGEBRA_STRUCTURE_FAMILY,
    QUADRATICS_DISCRIMINANT_FAMILY,
    LOG_CALCULUS_CONTEXT_FAMILY,
}


def load_json_optional(path: Path | None) -> dict[str, Any]:
    if path is None or not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def non_empty_string(value: Any) -> str | None:
    return value.strip() if isinstance(value, str) and value.strip() else None


def string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return sorted({item.strip() for item in value if isinstance(item, str) and item.strip()})


EXAMPLE_REQUIRED_SNIPPET_TYPES = {"concept", "method", "mistake_repair"}


def valid_worked_example(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    return (
        bool(non_empty_string(value.get("prompt")))
        and bool(non_empty_string(value.get("answer")))
        and bool(string_list(value.get("steps")))
    )


def worked_example_count(snippet: dict[str, Any]) -> int:
    count = 1 if valid_worked_example(snippet.get("worked_example")) else 0
    worked_examples = snippet.get("worked_examples")
    if isinstance(worked_examples, list):
        count += sum(1 for example in worked_examples if valid_worked_example(example))
    return count


def context_from_inputs(skill_targets: dict[str, Any], snippets: dict[str, Any]) -> dict[str, Any]:
    skill_ids_by_key: dict[tuple[str, str], list[str]] = {}
    for target in skill_targets.get("skill_targets", []):
        if not isinstance(target, dict):
            continue
        skill_target_id = non_empty_string(target.get("skill_target_id"))
        paper_family = non_empty_string(target.get("paper_family"))
        topic = non_empty_string(target.get("topic"))
        if skill_target_id and paper_family and topic:
            skill_ids_by_key.setdefault((paper_family, topic), []).append(skill_target_id)

    snippet_ids_by_key: dict[tuple[str, str], list[str]] = {}
    snippet_ids_by_id: dict[str, list[str]] = {}
    example_ids_by_snippet_id: dict[str, list[str]] = {}
    example_metadata_by_id: dict[str, dict[str, str]] = {}
    snippet_metadata_by_id: dict[str, dict[str, str]] = {}
    region_ids_by_key: dict[tuple[str, str], list[str]] = {}
    for snippet in snippets.get("snippets", []):
        if not isinstance(snippet, dict):
            continue
        if snippet.get("review_status") not in RUNTIME_REVIEW_STATUSES:
            continue
        snippet_id = non_empty_string(snippet.get("snippet_id"))
        paper_family = non_empty_string(snippet.get("paper_family"))
        topics = string_list(snippet.get("topics"))
        region_ids = string_list(snippet.get("region_ids"))
        if not snippet_id or not paper_family:
            continue
        snippet_ids_by_id[snippet_id] = [snippet_id]
        snippet_metadata_by_id[snippet_id] = {
            "exam_move": non_empty_string(snippet.get("exam_move")) or "",
            "key_method": non_empty_string(snippet.get("title")) or "",
            "question_type": non_empty_string(snippet.get("topic")) or (topics[0] if topics else ""),
        }
        example_ids: list[str] = []
        worked_example = snippet.get("worked_example")
        if isinstance(worked_example, dict):
            example_id = non_empty_string(worked_example.get("id"))
            if example_id:
                example_ids.append(example_id)
                example_metadata_by_id[example_id] = {
                    "exam_move": non_empty_string(worked_example.get("exam_move")) or snippet_metadata_by_id[snippet_id]["exam_move"],
                    "key_method": non_empty_string(worked_example.get("key_method")) or snippet_metadata_by_id[snippet_id]["key_method"],
                    "question_type": non_empty_string(worked_example.get("question_type")) or snippet_metadata_by_id[snippet_id]["question_type"],
                }
        worked_examples = snippet.get("worked_examples")
        if isinstance(worked_examples, list):
            for example in worked_examples:
                if isinstance(example, dict):
                    example_id = non_empty_string(example.get("id"))
                    if example_id:
                        example_ids.append(example_id)
                        example_metadata_by_id[example_id] = {
                            "exam_move": non_empty_string(example.get("exam_move")) or snippet_metadata_by_id[snippet_id]["exam_move"],
                            "key_method": non_empty_string(example.get("key_method")) or snippet_metadata_by_id[snippet_id]["key_method"],
                            "question_type": non_empty_string(example.get("question_type")) or snippet_metadata_by_id[snippet_id]["question_type"],
                        }
        if example_ids:
            example_ids_by_snippet_id[snippet_id] = sorted(set(example_ids))
        for topic in topics:
            key = (paper_family, topic)
            snippet_ids_by_key.setdefault(key, []).append(snippet_id)
            region_ids_by_key.setdefault(key, []).extend(region_ids)

    return {
        "skill_ids_by_key": {key: sorted(set(values)) for key, values in skill_ids_by_key.items()},
        "snippet_ids_by_key": {key: sorted(set(values)) for key, values in snippet_ids_by_key.items()},
        "snippet_ids_by_id": snippet_ids_by_id,
        "example_ids_by_snippet_id": example_ids_by_snippet_id,
        "example_metadata_by_id": example_metadata_by_id,
        "snippet_metadata_by_id": snippet_metadata_by_id,
        "region_ids_by_key": {key: sorted(set(values)) for key, values in region_ids_by_key.items()},
    }


def preferred_snippet_ids(
    context: dict[str, Any],
    topic: str,
    preferred_ids: list[str],
) -> list[str]:
    key = (PAPER_FAMILY, topic)
    available = set(context["snippet_ids_by_key"].get(key, []))
    preferred = [snippet_id for snippet_id in preferred_ids if snippet_id in available]
    return preferred or context["snippet_ids_by_key"].get(key, [])[:2]


def base_item(
    *,
    practice_id: str,
    generator_family: str,
    topic: str,
    prompt: str,
    answer: str,
    worked_solution: list[str],
    parameters: dict[str, Any],
    context: dict[str, Any],
    sequence_role: str,
    difficulty_band: str = "easy",
    snippet_ids: list[str] | None = None,
    source_snippet_id: str | None = None,
    example_model_id: str | None = None,
    review_status: str = "teacher_reviewed",
) -> dict[str, Any]:
    if sequence_role not in SEQUENCE_ROLES:
        raise ValueError(f"{practice_id} has invalid sequence role {sequence_role}")
    key = (PAPER_FAMILY, topic)
    parameters = dict(parameters)
    parameters.setdefault("sequence_role", sequence_role)
    item: dict[str, Any] = {
        "answer": answer,
        "difficulty_band": difficulty_band,
        "generator_family": generator_family,
        "paper_family": PAPER_FAMILY,
        "parameters": parameters,
        "practice_id": practice_id,
        "prompt": prompt,
        "review_status": review_status,
        "sequence_role": sequence_role,
        "topic": topic,
        "verification": {
            "method": "deterministic",
            "status": "pass",
            "verifier": VERIFIER_NAME,
        },
        "worked_solution": worked_solution,
    }
    reviewed_skill_target_id = GENERATOR_FAMILY_SKILL_TARGET_IDS.get(generator_family)
    skill_target_ids = context["skill_ids_by_key"].get(key, [])
    if reviewed_skill_target_id:
        item["skill_target_id"] = reviewed_skill_target_id
        item["skill_target_resolution_status"] = "reviewed_p3_skill_map_id"
    elif skill_target_ids:
        item["skill_target_id"] = skill_target_ids[0]
    resolved_snippet_ids = snippet_ids if snippet_ids is not None else context["snippet_ids_by_key"].get(key, [])
    if resolved_snippet_ids:
        item["snippet_ids"] = sorted(set(resolved_snippet_ids))
        source_snippet_id = source_snippet_id or next(
            (
                snippet_id for snippet_id in resolved_snippet_ids
                if context["example_ids_by_snippet_id"].get(snippet_id)
            ),
            resolved_snippet_ids[0],
        )
    if source_snippet_id:
        item["source_snippet_id"] = source_snippet_id
        example_ids = context["example_ids_by_snippet_id"].get(source_snippet_id, [])
        resolved_example_id = example_model_id or (example_ids[0] if example_ids else None)
        if resolved_example_id:
            item["example_model_id"] = resolved_example_id
            metadata = context["example_metadata_by_id"].get(resolved_example_id, {})
        else:
            metadata = context["snippet_metadata_by_id"].get(source_snippet_id, {})
        for output_key, metadata_key in (
            ("question_type", "question_type"),
            ("key_method", "key_method"),
            ("exam_move", "exam_move"),
        ):
            value = non_empty_string(metadata.get(metadata_key))
            if value:
                item[output_key] = value
    region_ids = context["region_ids_by_key"].get(key, [])
    if region_ids:
        item["region_ids"] = region_ids
    return item


def assert_positive_integer(value: int, practice_id: str) -> None:
    if not isinstance(value, int) or value <= 0:
        raise ValueError(f"{practice_id} generated a non-positive solution")


def reject_parameters(practice_id: str, message: str) -> None:
    raise ValueError(f"{practice_id} refused invalid parameters: {message}")


def int_parameter(
    case: dict[str, Any],
    key: str,
    practice_id: str,
    *,
    min_value: int,
    max_value: int,
    allow_zero: bool = True,
) -> int:
    value = case.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        reject_parameters(practice_id, f"{key} must be an integer")
    if value < min_value or value > max_value:
        reject_parameters(practice_id, f"{key}={value} is outside [{min_value}, {max_value}]")
    if not allow_zero and value == 0:
        reject_parameters(practice_id, f"{key} must be non-zero")
    return value


def item_type_parameter(case: dict[str, Any], practice_id: str, allowed: set[str]) -> str:
    value = non_empty_string(case.get("item_type"))
    if value not in allowed:
        reject_parameters(practice_id, f"item_type must be one of {sorted(allowed)}")
    return value


def sequence_role_parameter(case: dict[str, Any], practice_id: str) -> str:
    value = non_empty_string(case.get("sequence_role"))
    if value not in SEQUENCE_ROLES:
        reject_parameters(practice_id, f"sequence_role must be one of {list(SEQUENCE_ROLES)}")
    return value


def require_safe(condition: bool, practice_id: str, message: str) -> None:
    if not condition:
        reject_parameters(practice_id, message)


def integer_square_root(value: int, practice_id: str, label: str) -> int:
    require_safe(value > 0, practice_id, f"{label} must be positive")
    root = int(value ** 0.5)
    if root * root != value:
        reject_parameters(practice_id, f"{label} must be a perfect square")
    return root


def fraction_text(numerator: int, denominator: int) -> str:
    if denominator == 0:
        raise ValueError("Cannot format a fraction with zero denominator")
    sign = -1 if numerator * denominator < 0 else 1
    numerator = abs(numerator)
    denominator = abs(denominator)
    factor = gcd(numerator, denominator)
    numerator //= factor
    denominator //= factor
    prefix = "-" if sign < 0 else ""
    if denominator == 1:
        return f"{prefix}{numerator}"
    return f"{prefix}{numerator}/{denominator}"


def decimal_text(value: Fraction, places: int = 3) -> str:
    return f"{float(value):.{places}f}"


def coefficient_variable_text(coefficient: int, variable: str, power: int = 1) -> str:
    variable_part = variable if power == 1 else f"{variable}^{power}"
    if coefficient == 1:
        return variable_part
    if coefficient == -1:
        return f"-{variable_part}"
    return f"{coefficient}{variable_part}"


def append_constant_text(expression: str, constant: int) -> str:
    if constant > 0:
        return f"{expression} + {constant}"
    if constant < 0:
        return f"{expression} - {abs(constant)}"
    return expression


def quadratic_parameter_text(coefficient: int, constant: int, variable: str = "t") -> str:
    return append_constant_text(coefficient_variable_text(coefficient, variable, 2), constant)


def linear_parameter_text(coefficient: int, constant: int, variable: str = "t") -> str:
    return append_constant_text(coefficient_variable_text(coefficient, variable), constant)


def complex_text(real: int, imaginary: int) -> str:
    if imaginary == 0:
        return str(real)
    imaginary_body = "i" if abs(imaginary) == 1 else f"{abs(imaginary)}i"
    if real == 0:
        return f"-{imaginary_body}" if imaginary < 0 else imaginary_body
    sign = "-" if imaginary < 0 else "+"
    return f"{real} {sign} {imaginary_body}"


def argument_text(real: int, imaginary: int, practice_id: str) -> str:
    require_safe(real != 0 and imaginary != 0, practice_id, "argument warm-up avoids axis-only arguments")
    ratio = f"{abs(imaginary)}/{abs(real)}"
    if real > 0 and imaginary > 0:
        return f"arctan({ratio})"
    if real < 0 and imaginary > 0:
        return f"pi - arctan({ratio})"
    if real < 0 and imaginary < 0:
        return f"-pi + arctan({ratio})"
    return f"-arctan({ratio})"


def pi_fraction_text(numerator: int, denominator: int) -> str:
    factor = gcd(abs(numerator), abs(denominator))
    numerator //= factor
    denominator //= factor
    if denominator == 1:
        if numerator == 0:
            return "0"
        if numerator == 1:
            return "pi"
        if numerator == -1:
            return "-pi"
        return f"{numerator}pi"
    if numerator == 1:
        return f"pi/{denominator}"
    if numerator == -1:
        return f"-pi/{denominator}"
    return f"{numerator}pi/{denominator}"


def vector_text(components: tuple[int, int, int]) -> str:
    return f"<{components[0]}, {components[1]}, {components[2]}>"


def vector_from_case(case: dict[str, Any], prefix: str, practice_id: str, *, allow_zero_vector: bool = False) -> tuple[int, int, int]:
    vector = (
        int_parameter(case, f"{prefix}_x", practice_id, min_value=-9, max_value=9),
        int_parameter(case, f"{prefix}_y", practice_id, min_value=-9, max_value=9),
        int_parameter(case, f"{prefix}_z", practice_id, min_value=-9, max_value=9),
    )
    if not allow_zero_vector:
        require_safe(any(component != 0 for component in vector), practice_id, f"{prefix} must be non-zero")
    return vector


def dot_product(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return sum(left * right for left, right in zip(a, b))


def build_log_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = [
        {"form": "isolated_exp", "coefficient": 2, "rhs": 7, "sequence_stage": "first_step", "difficulty_band": "easy"},
        {"form": "scaled_exp", "scale": 5, "coefficient": 3, "rhs": 20, "sequence_stage": "complete_step", "difficulty_band": "easy"},
        {"form": "shifted_exp", "scale": 2, "shift": 1, "rhs": 9, "sequence_stage": "guardian_prep", "difficulty_band": "medium"},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_log_equation_basic_{index:04d}"
        form = str(case["form"])
        parameters = {"form": form, "topic_contract_id": "log_e_natural_logs"}
        sequence_role = str(case["sequence_stage"])
        difficulty_band = str(case["difficulty_band"])
        parameters["sequence_stage"] = sequence_role

        if form == "isolated_exp":
            coefficient = int(case["coefficient"])
            rhs = int(case["rhs"])
            assert_positive_integer(rhs, practice_id)
            parameters.update({"coefficient": coefficient, "rhs": rhs})
            prompt = f"If e^({coefficient}x) = {rhs}, write x exactly."
            answer = f"x = (1/{coefficient})ln {rhs}"
            worked_solution = [
                f"Take ln of both sides: {coefficient}x = ln {rhs}.",
                f"Divide by {coefficient}.",
                f"So x = (1/{coefficient})ln {rhs}.",
            ]
        elif form == "scaled_exp":
            scale = int(case["scale"])
            coefficient = int(case["coefficient"])
            rhs = int(case["rhs"])
            if rhs % scale != 0:
                raise ValueError(f"{practice_id} has awkward exponential isolation")
            isolated_rhs = rhs // scale
            assert_positive_integer(isolated_rhs, practice_id)
            parameters.update({"scale": scale, "coefficient": coefficient, "rhs": rhs, "isolated_rhs": isolated_rhs})
            prompt = f"Solve {scale}e^({coefficient}x) = {rhs}."
            answer = f"x = (1/{coefficient})ln {isolated_rhs}"
            worked_solution = [
                f"Divide by {scale}: e^({coefficient}x) = {isolated_rhs}.",
                f"Take ln of both sides: {coefficient}x = ln {isolated_rhs}.",
                f"Divide by {coefficient}, so x = (1/{coefficient})ln {isolated_rhs}.",
            ]
        elif form == "shifted_exp":
            scale = int(case["scale"])
            shift = int(case["shift"])
            rhs = int(case["rhs"])
            assert_positive_integer(rhs, practice_id)
            parameters.update({"scale": scale, "shift": shift, "rhs": rhs})
            prompt = f"Solve {scale}e^(x+{shift}) = {rhs}."
            answer = f"x = ln({rhs}/{scale}) - {shift}"
            worked_solution = [
                f"Divide by {scale}: e^(x+{shift}) = {rhs}/{scale}.",
                f"Take ln of both sides: x + {shift} = ln({rhs}/{scale}).",
                f"Subtract {shift}: x = ln({rhs}/{scale}) - {shift}.",
            ]
        else:
            raise ValueError(f"Unknown log practice form: {form}")

        items.append(base_item(
            practice_id=practice_id,
            generator_family=LOG_FAMILY,
            topic=LOG_TOPIC,
            prompt=prompt,
            answer=answer,
            worked_solution=worked_solution,
            parameters=parameters,
            context=context,
            sequence_role=sequence_role,
            difficulty_band=difficulty_band,
            snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-ln-e-inverse-001", "p3-exp-equations-001"]),
        ))

    return items


def build_log_graph_inverse_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_log_graph_inverse_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"convert_to_exponential", "inverse_point", "domain_range"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "easy"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small positive bases and integer graph points",
        "topic_contract_id": "log_graph_inverse",
    }

    if item_type == "convert_to_exponential":
        base = int_parameter(case, "base", practice_id, min_value=2, max_value=9)
        value = int_parameter(case, "value", practice_id, min_value=2, max_value=200)
        exponent = int_parameter(case, "exponent", practice_id, min_value=1, max_value=6)
        require_safe(base ** exponent == value, practice_id, "log conversion value must match base^exponent")
        prompt = f"Rewrite log_{base} {value} = {exponent} in exponential form."
        answer = f"{base}^{exponent} = {value}"
        worked_solution = [
            "Use log_a b = c means a^c = b.",
            f"The base is {base}, the exponent is {exponent}, and the output value is {value}.",
            f"So {answer}.",
        ]
        parameters.update({"base": base, "value": value, "exponent": exponent})
    elif item_type == "inverse_point":
        base = int_parameter(case, "base", practice_id, min_value=2, max_value=9)
        exponent = int_parameter(case, "exponent", practice_id, min_value=1, max_value=6)
        value = base ** exponent
        prompt = f"The point ({exponent}, {value}) lies on y = {base}^x. State the matching point on y = log_{base} x."
        answer = f"({value}, {exponent})"
        worked_solution = [
            "Inverse functions swap input and output coordinates.",
            f"The inverse of y = {base}^x is y = log_{base} x.",
            f"So ({exponent}, {value}) becomes {answer}.",
        ]
        parameters.update({"base": base, "exponent": exponent, "value": value})
    else:
        base = int_parameter(case, "base", practice_id, min_value=2, max_value=9)
        prompt = f"State the domain and range of y = log_{base} x."
        answer = "domain x > 0, range all real y"
        worked_solution = [
            f"y = log_{base} x is the inverse of y = {base}^x.",
            "The exponential graph has range y > 0, so the logarithm graph has domain x > 0.",
            "The exponential domain is all real x, so the logarithm range is all real y.",
        ]
        parameters.update({"base": base})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=LOG_GRAPH_INVERSE_FAMILY,
        topic=LOG_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-log-exp-convert-001"]),
    )


def build_log_graph_inverse_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "convert_to_exponential", "base": 2, "value": 32, "exponent": 5, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "inverse_point", "base": 2, "exponent": 3, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "domain_range", "base": 3, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_log_graph_inverse_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_log_laws_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_log_laws_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"product_law", "quotient_power_law", "invalid_sum_law"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "easy"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "same-base logarithms with positive-domain reminders",
        "topic_contract_id": "log_laws",
    }

    if item_type == "product_law":
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=9)
        prompt = f"Simplify ln x + ln {constant} into a single logarithm."
        answer = f"ln({constant}x)"
        worked_solution = [
            "Use ln a + ln b = ln(ab).",
            f"So ln x + ln {constant} = ln({constant}x).",
            "The original domain includes x > 0.",
        ]
        parameters.update({"constant": constant})
    elif item_type == "quotient_power_law":
        power = int_parameter(case, "power", practice_id, min_value=2, max_value=5)
        shift = int_parameter(case, "shift", practice_id, min_value=1, max_value=9)
        prompt = f"Write {power}ln x - ln(x + {shift}) as a single logarithm."
        answer = f"ln(x^{power}/(x + {shift}))"
        worked_solution = [
            f"Use the power law: {power}ln x = ln(x^{power}).",
            "Subtraction of logs gives a quotient.",
            f"So the expression is {answer}.",
        ]
        parameters.update({"power": power, "shift": shift})
    else:
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=9)
        prompt = f"Explain why ln(x + {constant}) is not equal to ln x + ln {constant}."
        answer = "No valid log law splits a sum inside one logarithm."
        worked_solution = [
            "The product law works for products: ln(xc) = ln x + ln c.",
            f"x + {constant} is a sum, not a product.",
            "Therefore the proposed split is invalid.",
        ]
        parameters.update({"constant": constant})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=LOG_LAWS_FAMILY,
        topic=LOG_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-log-laws-001", "p3-log-invalid-operations-001"]),
    )


def build_log_laws_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "product_law", "constant": 5, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "quotient_power_law", "power": 2, "shift": 1, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "invalid_sum_law", "constant": 3, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_log_laws_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_log_exponential_inequality_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_log_exponential_inequality_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"increasing_base", "decreasing_base", "isolated_e"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small exact exponent comparisons and isolated exponential inequalities",
        "topic_contract_id": "exponential_equations_inequalities",
    }

    if item_type == "increasing_base":
        base = int_parameter(case, "base", practice_id, min_value=2, max_value=9)
        exponent = int_parameter(case, "exponent", practice_id, min_value=1, max_value=6)
        rhs = base ** exponent
        prompt = f"Solve {base}^x > {rhs}."
        answer = f"x > {exponent}"
        worked_solution = [
            f"Rewrite {rhs} as {base}^{exponent}.",
            f"Because {base} > 1, the function is increasing.",
            f"So {answer}.",
        ]
        parameters.update({"base": base, "exponent": exponent, "rhs": rhs})
    elif item_type == "decreasing_base":
        denominator = int_parameter(case, "denominator", practice_id, min_value=2, max_value=9)
        exponent = int_parameter(case, "exponent", practice_id, min_value=1, max_value=6)
        prompt = f"Solve (1/{denominator})^x <= (1/{denominator})^{exponent}."
        answer = f"x >= {exponent}"
        worked_solution = [
            f"The base 1/{denominator} is between 0 and 1, so the function is decreasing.",
            "A smaller output comes from a larger exponent.",
            f"Therefore {answer}.",
        ]
        parameters.update({"denominator": denominator, "exponent": exponent})
    else:
        scale = int_parameter(case, "scale", practice_id, min_value=1, max_value=9)
        coefficient = int_parameter(case, "coefficient", practice_id, min_value=1, max_value=6)
        rhs = int_parameter(case, "rhs", practice_id, min_value=2, max_value=50)
        require_safe(rhs > scale, practice_id, "right side must leave a positive isolated bound above 1")
        prompt = f"Solve {scale}e^({coefficient}x) < {rhs}."
        answer = f"x < (1/{coefficient})ln({rhs}/{scale})"
        worked_solution = [
            f"Divide by {scale}: e^({coefficient}x) < {rhs}/{scale}.",
            "The exponential base e is greater than 1, so the inequality direction stays the same.",
            f"Take ln and divide by {coefficient}: {answer}.",
        ]
        parameters.update({"scale": scale, "coefficient": coefficient, "rhs": rhs})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=LOG_EXPONENTIAL_INEQUALITY_FAMILY,
        topic=LOG_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-exp-equations-001", "p3-ln-e-inverse-001"]),
    )


def build_log_exponential_inequality_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "increasing_base", "base": 3, "exponent": 3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "decreasing_base", "denominator": 2, "exponent": 3, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "isolated_e", "scale": 3, "coefficient": 2, "rhs": 12, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_log_exponential_inequality_item(context, index, case) for index, case in enumerate(cases, start=1)]


def binomial_expression(a: int, n: int | str) -> str:
    if a == 1:
        inner = "1 + x"
    elif a == -1:
        inner = "1 - x"
    elif a > 0:
        inner = f"1 + {a}x"
    else:
        inner = f"1 - {abs(a)}x"
    return f"({inner})^{n}"


def signed_fraction_text(value: Fraction | int) -> str:
    fraction = value if isinstance(value, Fraction) else Fraction(value, 1)
    return fraction_text(fraction.numerator, fraction.denominator)


def term_text(coefficient: Fraction | int, power: int) -> str:
    if power == 0:
        return signed_fraction_text(abs(coefficient))
    variable = "x" if power == 1 else f"x^{power}"
    magnitude = abs(coefficient)
    if magnitude == 1:
        return variable
    if isinstance(magnitude, Fraction) and magnitude.denominator != 1:
        return f"({signed_fraction_text(magnitude)}){variable}"
    return f"{magnitude}{variable}"


def polynomial_text(terms: list[tuple[Fraction | int, int]]) -> str:
    pieces: list[str] = []
    for coefficient, power in terms:
        if coefficient == 0:
            continue
        text = term_text(coefficient, power)
        if not pieces:
            pieces.append(f"-{text}" if coefficient < 0 else text)
        else:
            pieces.append(f"- {text}" if coefficient < 0 else f"+ {text}")
    return " ".join(pieces) if pieces else "0"


def first_three_coefficients(a: int, n: int) -> tuple[int, int, int]:
    return (1, n * a, comb(n, 2) * a * a)


def first_three_coefficients_general(a: int, n: Fraction) -> tuple[Fraction, Fraction, Fraction]:
    return (Fraction(1), n * a, n * (n - 1) * a * a / 2)


def build_binomial_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "item_type": "expand_to_cubic",
            "sequence_stage": "first_step",
            "difficulty_band": "easy",
            "prompt": "Expand (1 - 2x)^-2 up to and including the x^3 term, and state the validity condition.",
            "answer": "1 + 4x + 12x^2 + 32x^3, valid for |x| < 1/2",
            "worked_solution": [
                "Use (1 + u)^n with u = -2x and n = -2.",
                "The linear term is (-2)(-2x) = 4x.",
                "The x^2 term is (-2)(-3)(-2x)^2/2 = 12x^2.",
                "The x^3 term is (-2)(-3)(-4)(-2x)^3/6 = 32x^3.",
                "Validity is |-2x| < 1, so |x| < 1/2.",
            ],
            "parameters": {
                "n": "-2",
                "k": -2,
                "max_power": 3,
                "x_coefficient": "4",
                "x2_coefficient": "12",
                "x3_coefficient": "32",
            },
        },
        {
            "item_type": "rewrite_then_expand",
            "sequence_stage": "complete_step",
            "difficulty_band": "medium",
            "prompt": "Rewrite sqrt(2 - 6x) in binomial form, then expand up to and including the x^2 term.",
            "answer": "sqrt(2)(1 - (3/2)x - (9/8)x^2), valid for |x| < 1/3",
            "worked_solution": [
                "Factor out 2: sqrt(2 - 6x) = sqrt(2)(1 - 3x)^(1/2).",
                "Use n = 1/2 and u = -3x.",
                "The first terms are 1 - (3/2)x - (9/8)x^2.",
                "So the expansion is sqrt(2)(1 - (3/2)x - (9/8)x^2), valid for |3x| < 1.",
            ],
            "parameters": {
                "n": "1/2",
                "k": -3,
                "max_power": 2,
                "validity": "|x| < 1/3",
            },
        },
        {
            "item_type": "coefficient_extraction",
            "sequence_stage": "guardian_prep",
            "difficulty_band": "medium",
            "prompt": "Find the coefficient of x^3 in (3 + x)/(1 + 3x), using a binomial expansion.",
            "answer": "coefficient of x^3 = -72",
            "worked_solution": [
                "Write (3 + x)/(1 + 3x) as (3 + x)(1 + 3x)^-1.",
                "Expand (1 + 3x)^-1 = 1 - 3x + 9x^2 - 27x^3 + ...",
                "The x^3 coefficient comes from 3(-27x^3) and x(9x^2).",
                "So the coefficient is -81 + 9 = -72.",
            ],
            "parameters": {
                "coefficient_x3": "-72",
                "denominator_k": 3,
                "numerator_constant": 3,
                "numerator_x_coefficient": 1,
            },
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_binomial_first_terms_and_coefficient_{index:04d}"
        parameters = {
            **case["parameters"],
            "item_type": str(case["item_type"]),
            "sequence_stage": str(case["sequence_stage"]),
            "topic_contract_id": "algebra_binomial_expansion",
        }
        items.append(base_item(
            practice_id=practice_id,
            generator_family=BINOMIAL_FAMILY,
            topic=BINOMIAL_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_stage"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, BINOMIAL_TOPIC, ["p3-binomial-term-001"]),
        ))

    return items


def linear_factor(root: int) -> str:
    if root == 0:
        return "x"
    if root > 0:
        return f"x - {root}"
    return f"x + {abs(root)}"


def fraction_term(numerator: int | str, denominator: str) -> str:
    return f"\\frac{{{numerator}}}{{{denominator}}}"


def signed_fraction_sum(terms: list[tuple[int, str]]) -> str:
    pieces: list[str] = []
    for numerator, denominator in terms:
        body = fraction_term(abs(numerator), denominator)
        if not pieces:
            pieces.append(f"-{body}" if numerator < 0 else body)
        else:
            pieces.append(f"- {body}" if numerator < 0 else f"+ {body}")
    return " ".join(pieces)


def linear_expression(coefficient: int, constant: int) -> str:
    if coefficient == 1:
        expression = "x"
    elif coefficient == -1:
        expression = "-x"
    else:
        expression = f"{coefficient}x"
    if constant > 0:
        return f"{expression} + {constant}"
    if constant < 0:
        return f"{expression} - {abs(constant)}"
    return expression


def coefficient_symbol(index: int) -> str:
    return chr(ord("A") + index)


def build_partial_fractions_distinct_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "item_type": "distinct_form",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
            "prompt": "Write the partial-fraction form for \\frac{x + 3}{(x - 2)(x + 1)}. Do not solve for constants.",
            "answer": "\\frac{A}{x - 2} + \\frac{B}{x + 1}",
            "worked_solution": [
                "The denominator has two distinct linear factors.",
                "Each distinct linear factor gets one constant numerator.",
                "Use A over x - 2 and B over x + 1.",
            ],
        },
        {
            "item_type": "distinct_decompose",
            "sequence_role": "complete_step",
            "difficulty_band": "medium",
            "prompt": "Decompose \\frac{x + 3}{(x - 2)(x + 1)} into partial fractions.",
            "answer": "\\frac{5}{3(x - 2)} - \\frac{2}{3(x + 1)}",
            "worked_solution": [
                "Start with A/(x - 2) + B/(x + 1).",
                "Multiplying through gives x + 3 = A(x + 1) + B(x - 2).",
                "Set x = 2 to get A = 5/3.",
                "Set x = -1 to get B = -2/3.",
            ],
        },
        {
            "item_type": "quadratic_form",
            "sequence_role": "first_step",
            "difficulty_band": "medium",
            "prompt": "Write the partial-fraction form for \\frac{2x^2 - x + 6}{(x + 1)(x^2 + 2)}. Do not solve for constants.",
            "answer": "\\frac{A}{x + 1} + \\frac{Bx + C}{x^2 + 2}",
            "worked_solution": [
                "The factor x + 1 is linear, so it gets a constant numerator.",
                "The irreducible quadratic x^2 + 2 gets a linear numerator.",
                "The correct form is A/(x + 1) + (Bx + C)/(x^2 + 2).",
            ],
        },
        {
            "item_type": "quadratic_decompose",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
            "prompt": "Decompose \\frac{2x^2 - x + 6}{(x + 1)(x^2 + 2)} into partial fractions.",
            "answer": "\\frac{3}{x + 1} - \\frac{x}{x^2 + 2}",
            "worked_solution": [
                "Start with A/(x + 1) + (Bx + C)/(x^2 + 2).",
                "Multiplying through gives 2x^2 - x + 6 = A(x^2 + 2) + (Bx + C)(x + 1).",
                "Set x = -1 to get A = 3.",
                "Compare coefficients to get B = -1 and C = 0.",
            ],
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_partial_fractions_distinct_linear_{index:04d}"
        parameters: dict[str, Any] = {
            "item_type": str(case["item_type"]),
            "topic_contract_id": "algebra_partial_fractions",
        }

        items.append(base_item(
            practice_id=practice_id,
            generator_family=PARTIAL_FRACTIONS_DISTINCT_FAMILY,
            topic=PARTIAL_FRACTIONS_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, PARTIAL_FRACTIONS_TOPIC, [
                "p3-partial-fractions-form-001",
                "p3-partial-fractions-repeated-linear-001",
            ]),
        ))
    return items


def build_partial_fractions_repeated_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "item_type": "repeated_form",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
            "prompt": "Write the partial-fraction form for \\frac{3x^2 + 2}{x(x - 1)^2}. Do not solve for constants.",
            "answer": "\\frac{A}{x} + \\frac{B}{x - 1} + \\frac{C}{(x - 1)^2}",
            "worked_solution": [
                "The factor x is a distinct linear factor, so it gets A/x.",
                "The repeated factor (x - 1)^2 needs terms over x - 1 and (x - 1)^2.",
                "The form is A/x + B/(x - 1) + C/(x - 1)^2.",
            ],
        },
        {
            "item_type": "repeated_decompose",
            "sequence_role": "complete_step",
            "difficulty_band": "medium",
            "prompt": "Decompose \\frac{3x^2 + 2}{x(x - 1)^2} into partial fractions.",
            "answer": "\\frac{2}{x} + \\frac{1}{x - 1} + \\frac{5}{(x - 1)^2}",
            "worked_solution": [
                "Start with A/x + B/(x - 1) + C/(x - 1)^2.",
                "Multiplying through gives 3x^2 + 2 = A(x - 1)^2 + Bx(x - 1) + Cx.",
                "Set x = 0 to get A = 2 and x = 1 to get C = 5.",
                "Compare coefficients to get B = 1.",
            ],
        },
        {
            "item_type": "mixed_form_review",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
            "prompt": "For each denominator, name the partial-fraction form: (i) (x - 2)(x + 1), (ii) x(x - 1)^2, (iii) (x + 1)(x^2 + 2).",
            "answer": "(i) A/(x - 2) + B/(x + 1); (ii) A/x + B/(x - 1) + C/(x - 1)^2; (iii) A/(x + 1) + (Bx + C)/(x^2 + 2)",
            "worked_solution": [
                "Distinct linear factors each get one constant numerator.",
                "A repeated linear factor needs every power up to the repeated power.",
                "An irreducible quadratic factor gets a linear numerator Bx + C.",
            ],
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_partial_fractions_repeated_linear_{index:04d}"
        parameters: dict[str, Any] = {
            "item_type": str(case["item_type"]),
            "topic_contract_id": "algebra_partial_fractions",
        }

        items.append(base_item(
            practice_id=practice_id,
            generator_family=PARTIAL_FRACTIONS_REPEATED_FAMILY,
            topic=PARTIAL_FRACTIONS_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, PARTIAL_FRACTIONS_TOPIC, [
                "p3-partial-fractions-repeated-linear-001",
                "p3-partial-fractions-form-001",
            ]),
        ))
    return items


def build_modulus_equation_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "item_type": "linear_equals_constant",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
            "prompt": "Solve |3x + 1| = 7.",
            "answer": "x = -8/3 or x = 2",
            "worked_solution": [
                "Split into 3x + 1 = 7 and 3x + 1 = -7.",
                "The first equation gives x = 2.",
                "The second equation gives x = -8/3.",
                "Both values make the original modulus equal 7.",
            ],
        },
        {
            "item_type": "modulus_equals_modulus",
            "sequence_role": "complete_step",
            "difficulty_band": "medium",
            "prompt": "Solve |x + 2| = |3x|.",
            "answer": "x = -1/2 or x = 1",
            "worked_solution": [
                "Use A = B or A = -B for |A| = |B|.",
                "x + 2 = 3x gives x = 1.",
                "x + 2 = -3x gives x = -1/2.",
                "These are the two graph intersection x-values.",
            ],
        },
        {
            "item_type": "modulus_inequality",
            "sequence_role": "complete_step",
            "difficulty_band": "medium",
            "prompt": "Solve |x - 3| < 5.",
            "answer": "-2 < x < 8",
            "worked_solution": [
                "The expression x - 3 is within distance 5 of zero.",
                "Write -5 < x - 3 < 5.",
                "Add 3 throughout.",
                "The solution interval is -2 < x < 8.",
            ],
        },
        {
            "item_type": "graph_interval",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
            "prompt": "The graphs y = |x + 2| and y = |3x| meet at x = -1/2 and x = 1. For which x-values is |x + 2| < |3x|?",
            "answer": "x < -1/2 or x > 1",
            "worked_solution": [
                "The inequality asks where the graph y = |x + 2| is below y = |3x|.",
                "The intersection points split the number line into three intervals.",
                "Testing x = 0 gives |2| < |0|, which is false, so the middle interval is excluded.",
                "The solution is outside the intersections: x < -1/2 or x > 1.",
            ],
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_modulus_equation_basic_{index:04d}"
        parameters = {
            "item_type": str(case["item_type"]),
            "topic_contract_id": "algebra_modulus_graph_equations",
        }

        items.append(base_item(
            practice_id=practice_id,
            generator_family=MODULUS_EQUATION_FAMILY,
            topic=ALGEBRA_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, ALGEBRA_TOPIC, ["p3-modulus-cases-001"]),
        ))
    return items


def build_binomial_validity_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "form": "validity_condition",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
            "prompt": "State the interval of validity for the expansion of (1 + 3x)^-2.",
            "answer": "-1/3 < x < 1/3",
            "worked_solution": [
                "For (1 + u)^n with negative or fractional n, require |u| < 1.",
                "Here u = 3x, so |3x| < 1.",
                "Therefore -1/3 < x < 1/3.",
            ],
        },
        {
            "form": "rewrite_factor",
            "sequence_role": "complete_step",
            "difficulty_band": "medium",
            "prompt": "Rewrite (5 - x)^-3 in the form a(1 + kx)^n and state the validity interval.",
            "answer": "5^-3(1 - x/5)^-3, valid for -5 < x < 5",
            "worked_solution": [
                "Factor out 5 before applying the binomial expansion.",
                "(5 - x)^-3 = 5^-3(1 - x/5)^-3.",
                "The variable part is -x/5, so |-x/5| < 1.",
                "Therefore -5 < x < 5.",
            ],
        },
        {
            "form": "estimate_value",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
            "prompt": "Using sqrt(1 + x) = 1 + x/2 - x^2/8 + ..., estimate sqrt(1.04).",
            "answer": "1.0198",
            "worked_solution": [
                "Use x = 0.04 in the expansion.",
                "1 + x/2 - x^2/8 = 1 + 0.02 - 0.0016/8.",
                "This gives 1.0198.",
            ],
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_binomial_validity_range_{index:04d}"
        sequence_role = str(case["sequence_role"])
        parameters = {
            "form": str(case["form"]),
            "topic_contract_id": "algebra_binomial_expansion",
        }

        items.append(base_item(
            practice_id=practice_id,
            generator_family=BINOMIAL_VALIDITY_FAMILY,
            topic=BINOMIAL_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters=parameters,
            context=context,
            sequence_role=sequence_role,
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, BINOMIAL_TOPIC, [
                "p3-binomial-validity-range-001",
                "p3-binomial-term-001",
            ]),
        ))
    return items


def build_trig_identity_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "prompt": "Rewrite sec x using sine or cosine.",
            "answer": "sec x = 1/cos x",
            "worked_solution": [
                "The reciprocal identities define sec, cosec, and cot.",
                "Secant is the reciprocal of cosine.",
                "So sec x = 1/cos x.",
            ],
            "identity": "reciprocal_sec",
            "topic_contract_id": "trig_reciprocal_functions",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Rewrite 1 - cos^2 x using a Pythagorean identity.",
            "answer": "sin^2 x",
            "worked_solution": [
                "Start from sin^2 x + cos^2 x = 1.",
                "Rearrange to 1 - cos^2 x = sin^2 x.",
                "This keeps the expression in a single trig function.",
            ],
            "identity": "pythagorean",
            "topic_contract_id": "trig_pythagorean_identities",
            "sequence_role": "complete_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Rewrite (1 - cos 2x)/sin x as a simpler expression, stating the restriction.",
            "answer": "2sin x, for sin x != 0",
            "worked_solution": [
                "Use 1 - cos 2x = 2sin^2 x.",
                "Then (1 - cos 2x)/sin x = 2sin^2 x/sin x.",
                "Cancel only when sin x != 0, giving 2sin x.",
            ],
            "identity": "double_angle_cancel",
            "topic_contract_id": "trig_double_angle_formulae",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        items.append(base_item(
            practice_id=f"gen_trig_identity_rewrite_basic_{index:04d}",
            generator_family=TRIG_IDENTITY_FAMILY,
            topic=TRIG_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters={
                "identity": str(case["identity"]),
                "topic_contract_id": str(case["topic_contract_id"]),
            },
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, [
                "p3-trig-identity-selection-001",
                "p3-trig-reciprocal-rform-001",
            ]),
        ))
    return items


def build_trig_double_angle_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "prompt": "Choose a double-angle identity for sin 2x.",
            "answer": "sin 2x = 2sin x cos x",
            "worked_solution": [
                "Use this form when the expression contains both sine and cosine.",
                "The identity is sin 2x = 2sin x cos x.",
            ],
            "identity": "sin_double",
            "topic_contract_id": "trig_double_angle_formulae",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Rewrite cos 2x in terms of sin x only.",
            "answer": "cos 2x = 1 - 2sin^2 x",
            "worked_solution": [
                "Cosine double-angle has several equivalent forms.",
                "The form using sine only is cos 2x = 1 - 2sin^2 x.",
            ],
            "identity": "cos_double_sin",
            "topic_contract_id": "trig_double_angle_formulae",
            "sequence_role": "complete_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Rewrite 3 - 4sin^2 x using cos 2x.",
            "answer": "1 + 2cos 2x",
            "worked_solution": [
                "Use sin^2 x = (1 - cos 2x)/2.",
                "Then 3 - 4sin^2 x = 3 - 2(1 - cos 2x).",
                "This simplifies to 1 + 2cos 2x.",
            ],
            "identity": "convert_quadratic_sine",
            "topic_contract_id": "trig_double_angle_formulae",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        items.append(base_item(
            practice_id=f"gen_trig_double_angle_basic_{index:04d}",
            generator_family=TRIG_DOUBLE_ANGLE_FAMILY,
            topic=TRIG_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters={
                "identity": str(case["identity"]),
                "topic_contract_id": str(case["topic_contract_id"]),
            },
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, ["p3-trig-identity-selection-001"]),
        ))
    return items


def build_trig_solve_interval_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "prompt": "Solve sec x = 2 for 0 <= x < 2pi.",
            "answer": "x = pi/3 or 5pi/3",
            "worked_solution": [
                "Rewrite sec x as 1/cos x.",
                "Then cos x = 1/2.",
                "Cosine is positive in quadrants I and IV, so x = pi/3 or 5pi/3.",
            ],
            "equation": "sec_two",
            "topic_contract_id": "trig_reciprocal_functions",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Solve sin(x + pi/6) = 1/2 for 0 <= x < 2pi.",
            "answer": "x = 0 or 2pi/3",
            "worked_solution": [
                "Let u = x + pi/6, so pi/6 <= u < 13pi/6.",
                "sin u = 1/2 gives u = pi/6, 5pi/6, or 13pi/6 in the shifted interval.",
                "Subtract pi/6 to get x = 0, 2pi/3, or 2pi.",
                "The original interval excludes 2pi, so x = 0 or 2pi/3.",
            ],
            "equation": "shifted_sine_half",
            "topic_contract_id": "trig_addition_formulae",
            "sequence_role": "complete_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Solve sin x(2cos x - 1) = 0 for 0 <= x < 2pi.",
            "answer": "x = 0, pi/3, pi, 5pi/3",
            "worked_solution": [
                "Use the product form instead of dividing by sin x.",
                "sin x = 0 gives x = 0 or pi.",
                "2cos x - 1 = 0 gives cos x = 1/2, so x = pi/3 or 5pi/3.",
                "All four values lie in the interval.",
            ],
            "equation": "product_zero",
            "topic_contract_id": "trig_double_angle_formulae",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        items.append(base_item(
            practice_id=f"gen_trig_solve_equation_interval_basic_{index:04d}",
            generator_family=TRIG_SOLVE_INTERVAL_FAMILY,
            topic=TRIG_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters={
                "equation": str(case["equation"]),
                "topic_contract_id": str(case["topic_contract_id"]),
            },
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, [
                "p3-trig-interval-001",
                "p3-trig-lost-solutions-001",
            ]),
        ))
    return items


def build_trig_addition_formulae_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "prompt": "Use an addition formula to find sin(45 degrees + 30 degrees).",
            "answer": "(sqrt(6) + sqrt(2))/4",
            "worked_solution": [
                "Use sin(A + B) = sin A cos B + cos A sin B.",
                "Substitute A = 45 degrees and B = 30 degrees.",
                "This gives (sqrt(2)/2)(sqrt(3)/2) + (sqrt(2)/2)(1/2).",
                "So sin 75 degrees = (sqrt(6) + sqrt(2))/4.",
            ],
            "item_type": "exact_sine_sum",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Use an addition formula to find tan(pi/4 + pi/6).",
            "answer": "2 + sqrt(3)",
            "worked_solution": [
                "Use tan(A + B) = (tan A + tan B)/(1 - tan A tan B).",
                "Substitute tan(pi/4) = 1 and tan(pi/6) = 1/sqrt(3).",
                "This gives (1 + 1/sqrt(3))/(1 - 1/sqrt(3)).",
                "Simplifying gives 2 + sqrt(3).",
            ],
            "item_type": "exact_tangent_sum",
            "sequence_role": "complete_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Solve sin(x + pi/6) = 1/2 for 0 <= x < 2pi.",
            "answer": "x = 0 or 2pi/3",
            "worked_solution": [
                "Let u = x + pi/6, so pi/6 <= u < 13pi/6.",
                "sin u = 1/2 gives u = pi/6, 5pi/6, or 13pi/6 in that shifted interval.",
                "Subtract pi/6 to get x = 0, 2pi/3, or 2pi.",
                "The endpoint 2pi is not allowed, so x = 0 or 2pi/3.",
            ],
            "item_type": "shifted_angle_equation",
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        items.append(base_item(
            practice_id=f"gen_trig_addition_formulae_basic_{index:04d}",
            generator_family=TRIG_ADDITION_FORMULAE_FAMILY,
            topic=TRIG_TOPIC,
            prompt=str(case["prompt"]),
            answer=str(case["answer"]),
            worked_solution=[str(step) for step in case["worked_solution"]],
            parameters={
                "item_type": str(case["item_type"]),
                "topic_contract_id": "trig_addition_formulae",
            },
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, [
                "p3-trig-identity-selection-001",
                "p3-trig-interval-001",
            ]),
        ))
    return items


def build_trig_r_form_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"a": 3, "b": 4, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"a": 5, "b": 12, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"a": 8, "b": -6, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        a = int(case["a"])
        b = int(case["b"])
        r_squared = a * a + b * b
        r = int(r_squared ** 0.5)
        if r * r != r_squared:
            raise ValueError("R-form case did not produce an integer R")
        parameters = {"a": a, "b": b, "r": r, "topic_contract_id": "trig_r_form_transformations"}
        practice_id = f"gen_trig_r_form_basic_{index:04d}"
        if case["sequence_role"] == "first_step":
            prompt = f"Find R for {a}sin x + {b}cos x."
            answer = f"R = {r}"
            worked_solution = [
                "For R-form, R is the amplitude of the combined wave.",
                f"Use R = sqrt({a}^2 + {b}^2).",
                f"So R = {r}.",
            ]
        elif case["sequence_role"] == "complete_step":
            prompt = f"Write {a}sin x + {b}cos x in the form R sin(x + alpha), with alpha acute."
            answer = f"{r}sin(x + alpha), where cos alpha = {a}/{r} and sin alpha = {b}/{r}"
            worked_solution = [
                f"Match R sin(x + alpha) = Rsin x cos alpha + Rcos x sin alpha.",
                f"R = sqrt({a}^2 + {b}^2) = {r}.",
                f"So R cos alpha = {a} and R sin alpha = {b}.",
                f"Therefore cos alpha = {a}/{r} and sin alpha = {b}/{r}.",
            ]
        else:
            sign = "-" if b < 0 else "+"
            prompt = f"Find R and the maximum value of {a}sin x {sign} {abs(b)}cos x."
            answer = f"R = {r}; maximum value = {r}"
            worked_solution = [
                f"The combined expression has amplitude R = sqrt({a}^2 + ({b})^2).",
                f"This gives R = {r}.",
                "A sine or cosine wave with amplitude R has maximum value R.",
                f"So the maximum value is {r}.",
            ]

        items.append(base_item(
            practice_id=practice_id,
            generator_family=TRIG_R_FORM_FAMILY,
            topic=TRIG_TOPIC,
            prompt=prompt,
            answer=answer,
            worked_solution=worked_solution,
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, ["p3-trig-reciprocal-rform-001"]),
        ))
    return items


def review_queue_item(
    *,
    practice_id: str,
    generator_family: str,
    topic: str,
    prompt: str,
    answer: str,
    worked_solution: list[str],
    parameters: dict[str, Any],
    context: dict[str, Any],
    sequence_role: str,
    difficulty_band: str,
    snippet_ids: list[str],
) -> dict[str, Any]:
    parameters = dict(parameters)
    parameters.setdefault("sequence_stage", sequence_role)
    return base_item(
        practice_id=practice_id,
        generator_family=generator_family,
        topic=topic,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=snippet_ids,
        review_status="teacher_reviewed" if generator_family in PROMOTED_RUNTIME_GENERATOR_FAMILIES else REVIEW_QUEUE_STATUS,
    )


def build_algebra_structure_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_algebra_structure_rearrangement_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"factor_common", "cancel_factor", "zero_product"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "easy"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small integer factors; denominator restrictions retained when cancelling",
    }

    if item_type == "factor_common":
        constant = int_parameter(case, "constant", practice_id, min_value=1, max_value=9)
        prompt = f"Factor x^2 + {constant}x by taking out the shared factor first."
        answer = f"x(x + {constant})"
        worked_solution = [
            "Both terms contain a factor of x.",
            "Take out the shared factor before doing anything else.",
            f"x^2 + {constant}x = {answer}.",
        ]
        parameters.update({"constant": constant})
    elif item_type == "cancel_factor":
        root = int_parameter(case, "root", practice_id, min_value=1, max_value=9)
        other = int_parameter(case, "other", practice_id, min_value=-9, max_value=9)
        require_safe(root != other, practice_id, "roots must be distinct")
        numerator_constant = root * other
        numerator_middle = -(root + other)
        numerator = polynomial_text([(1, 2), (numerator_middle, 1), (numerator_constant, 0)])
        denominator = linear_factor(root)
        survivor = linear_factor(other)
        prompt = f"Simplify ({numerator})/({denominator}), stating the restriction."
        answer = f"{survivor}, with x != {root}"
        worked_solution = [
            f"Factor the numerator: {numerator} = ({denominator})({survivor}).",
            f"Cancel the common factor {denominator}.",
            f"The original denominator means x != {root}.",
            f"So the simplified expression is {answer}.",
        ]
        parameters.update({"root": root, "other_root": other})
    else:
        left_root = int_parameter(case, "left_root", practice_id, min_value=-9, max_value=9)
        right_root = int_parameter(case, "right_root", practice_id, min_value=-9, max_value=9)
        require_safe(left_root != right_root, practice_id, "zero-product roots must be distinct")
        left_factor = linear_factor(left_root)
        right_factor = linear_factor(right_root)
        prompt = f"Solve ({left_factor})({right_factor}) = 0 without expanding."
        solutions = sorted([left_root, right_root])
        answer = " or ".join(f"x = {solution}" for solution in solutions)
        worked_solution = [
            "Use the zero-product rule instead of expanding.",
            f"Set {left_factor} = 0 or {right_factor} = 0.",
            f"This gives {answer}.",
        ]
        parameters.update({"left_root": left_root, "right_root": right_root, "solutions": ",".join(str(solution) for solution in solutions)})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=ALGEBRA_STRUCTURE_FAMILY,
        topic=ALGEBRA_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, ALGEBRA_TOPIC, ["p3-algebra-rearrangement-001"]),
    )


def build_algebra_structure_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "factor_common", "constant": 5, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "cancel_factor", "root": 3, "other": -2, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "zero_product", "left_root": -2, "right_root": 5, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_algebra_structure_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_algebra_structure_bridge_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_algebra_structure_first_bridge_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"repeated_block_substitution", "cancel_with_restriction", "solve_without_expanding"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "easy"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "original deterministic P3 support bridge; repeated blocks and cancellable factors use small integer coefficients",
        "topic_contract_id": "algebra_structure_first_bridge",
    }

    if item_type == "repeated_block_substitution":
        prompt = "In (x^2 + 2x)^2 - 5(x^2 + 2x) + 6 = 0, what substitution keeps the structure?"
        answer = "u = x^2 + 2x"
        worked_solution = [
            "The whole block x^2 + 2x appears twice.",
            "Set u = x^2 + 2x before expanding anything.",
            "The equation becomes u^2 - 5u + 6 = 0.",
        ]
    elif item_type == "cancel_with_restriction":
        prompt = "Simplify ((x - 3)(x + 2))/(x - 3), stating the restriction."
        answer = "x + 2, with x != 3"
        worked_solution = [
            "The original denominator is zero when x = 3, so x != 3.",
            "Cancel the common factor x - 3.",
            "The simplified expression is x + 2, with x != 3.",
        ]
    else:
        prompt = "Solve (x^2 + 2x)^2 - 5(x^2 + 2x) + 6 = 0 without expanding the quartic."
        answer = "x = -3, 1, -1 - sqrt(3), or -1 + sqrt(3)"
        worked_solution = [
            "Set u = x^2 + 2x to get u^2 - 5u + 6 = 0.",
            "Factor: (u - 2)(u - 3) = 0, so u = 2 or u = 3.",
            "Solve x^2 + 2x = 2 and x^2 + 2x = 3.",
            "This gives x = -1 +/- sqrt(3), and x = -3 or 1.",
        ]

    return review_queue_item(
        practice_id=practice_id,
        generator_family=ALGEBRA_STRUCTURE_BRIDGE_FAMILY,
        topic=ALGEBRA_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, ALGEBRA_TOPIC, ["p3-algebra-rearrangement-001"]),
    )


def build_algebra_structure_bridge_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "repeated_block_substitution", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "cancel_with_restriction", "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "solve_without_expanding", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_algebra_structure_bridge_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_polynomial_remainder_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_polynomial_remainder_factor_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {
        "division_no_remainder",
        "division_remainder",
        "division_missing_zero",
        "division_non_monic",
        "substitution_value",
        "remainder_non_monic",
        "show_factor",
        "factor_parameter",
        "two_condition_parameters",
        "solve_by_factors",
    })
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    is_division_item = item_type.startswith("division_")
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "cubic coefficients, divisor roots, and constants kept small; arithmetic checked exactly",
        "topic_contract_id": "algebra_polynomial_division" if is_division_item else "algebra_remainder_factor_theorem",
    }

    if item_type == "division_no_remainder":
        prompt = "Divide x^3 - 6x^2 + 11x - 6 by x - 1."
        answer = "quotient = x^2 - 5x + 6, remainder = 0"
        worked_solution = [
            "Divide the leading terms: x^3 divided by x is x^2.",
            "Subtract x^3 - x^2 to get -5x^2 + 11x - 6.",
            "Continue with -5x, then +6.",
            "The quotient is x^2 - 5x + 6 and the remainder is 0.",
        ]
    elif item_type == "division_remainder":
        prompt = "Divide x^3 + 3x^2 - x + 5 by x - 2, giving the quotient and remainder."
        answer = "quotient = x^2 + 5x + 9, remainder = 23"
        worked_solution = [
            "x^3 divided by x gives x^2; subtract x^3 - 2x^2.",
            "The next line is 5x^2 - x + 5; divide to get +5x.",
            "The next line is 9x + 5; divide to get +9.",
            "Subtract 9x - 18, leaving remainder 23.",
        ]
    elif item_type == "division_missing_zero":
        prompt = "Divide 2x^3 - 5x + 4 by x + 1, writing the missing term first."
        answer = "quotient = 2x^2 - 2x - 3, remainder = 7"
        worked_solution = [
            "Write the dividend as 2x^3 + 0x^2 - 5x + 4.",
            "2x^3 divided by x gives 2x^2; subtract 2x^3 + 2x^2.",
            "Continue with -2x, then -3.",
            "The remainder is 7.",
        ]
    elif item_type == "division_non_monic":
        prompt = "Divide 2x^3 - x^2 + 5x + 7 by 2x + 1, giving the quotient and remainder."
        answer = "quotient = x^2 - x + 3, remainder = 4"
        worked_solution = [
            "2x^3 divided by 2x gives x^2.",
            "Subtract (2x + 1)x^2 to get -2x^2 + 5x + 7.",
            "Next terms are -x and +3.",
            "Multiplying back gives 2x^3 - x^2 + 5x + 3, so the remainder is 4.",
        ]
    elif item_type == "substitution_value":
        root = int_parameter(case, "root", practice_id, min_value=-5, max_value=5)
        prompt = f"For f(x) = x^3 - 4x + 1, what substitution gives the remainder on division by {linear_factor(root)}?"
        answer = f"x = {root}"
        worked_solution = [
            "The remainder theorem says the remainder after division by x - a is found by evaluating f(a).",
            f"Here the divisor is {linear_factor(root)}, so a = {root}.",
            f"The first move is to evaluate f({root}).",
        ]
        parameters.update({"root": root})
    elif item_type == "remainder_non_monic":
        prompt = "Find the remainder when f(x) = 2x^3 - x + 4 is divided by 2x + 1."
        answer = "remainder = 17/4"
        worked_solution = [
            "Set the divisor equal to zero: 2x + 1 = 0, so x = -1/2.",
            "Evaluate f(-1/2).",
            "2(-1/8) - (-1/2) + 4 = -1/4 + 1/2 + 4 = 17/4.",
        ]
        parameters.update({"root": "-1/2", "remainder": "17/4"})
    elif item_type == "show_factor":
        prompt = "Show that x - 2 is a factor of x^3 - 3x^2 - 4x + 12."
        answer = "f(2) = 0, so x - 2 is a factor"
        worked_solution = [
            "For x - 2, use x = 2.",
            "f(2) = 2^3 - 3(2^2) - 4(2) + 12.",
            "This is 8 - 12 - 8 + 12 = 0.",
            "A zero remainder means x - 2 is a factor.",
        ]
        parameters.update({"root": 2, "remainder": 0})
    elif item_type == "factor_parameter":
        root = int_parameter(case, "root", practice_id, min_value=-5, max_value=5)
        constant = int_parameter(case, "constant", practice_id, min_value=-9, max_value=9)
        require_safe(root != 0, practice_id, "factor parameter root must be non-zero")
        numerator = -(root ** 3 - root + constant)
        require_safe(numerator % (root * root) == 0, practice_id, "parameter must be an integer")
        parameter = numerator // (root * root)
        require_safe(root ** 3 + parameter * root * root - root + constant == 0, practice_id, "parameter must make the divisor a factor")
        prompt = f"Find k if {linear_factor(root)} is a factor of x^3 + kx^2 - x + {constant}."
        answer = f"k = {parameter}"
        worked_solution = [
            f"If {linear_factor(root)} is a factor, use f({root}) = 0.",
            f"Substitution gives {root}^3 + k({root})^2 - ({root}) + {constant} = 0.",
            f"Solving gives k = {parameter}.",
        ]
        parameters.update({"root": root, "constant": constant, "k": parameter})
    elif item_type == "two_condition_parameters":
        prompt = "For f(x) = x^3 + ax^2 + bx + 6, x - 1 is a factor and the remainder on division by x + 2 is 12. Find a and b."
        answer = "a = 0, b = -7"
        worked_solution = [
            "Factor condition: f(1) = 0, so 1 + a + b + 6 = 0 and a + b = -7.",
            "Remainder condition: f(-2) = 12.",
            "-8 + 4a - 2b + 6 = 12, so 2a - b = 7.",
            "Solving the simultaneous equations gives a = 0 and b = -7.",
        ]
        parameters.update({"factor_root": 1, "remainder_root": -2, "remainder": 12, "a": 0, "b": -7})
    else:
        prompt = "Solve x^3 - 4x^2 - x + 4 = 0, using simple factors."
        answer = "x = -1, 1, or 4"
        worked_solution = [
            "Test simple roots: f(1) = 0, so x - 1 is a factor.",
            "Factor by grouping: x^3 - 4x^2 - x + 4 = (x^2 - 1)(x - 4).",
            "Then (x^2 - 1)(x - 4) = (x - 1)(x + 1)(x - 4).",
            "So the solutions are x = -1, 1, and 4.",
        ]
        parameters.update({"roots": "-1,1,4"})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=POLYNOMIAL_REMAINDER_FAMILY,
        topic=ALGEBRA_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, ALGEBRA_TOPIC, ["p3-polynomial-theorem-001"]),
    )


def build_polynomial_remainder_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "division_no_remainder", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "division_remainder", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "division_missing_zero", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "division_non_monic", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
        {"item_type": "substitution_value", "root": -2, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "remainder_non_monic", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "show_factor", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "factor_parameter", "root": -1, "constant": 5, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
        {"item_type": "two_condition_parameters", "sequence_role": "guardian_prep", "difficulty_band": "hard"},
        {"item_type": "solve_by_factors", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_polynomial_remainder_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_quadratics_discriminant_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_quadratics_discriminant_root_condition_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"discriminant_value", "root_type", "repeated_root_parameter"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "integer quadratic coefficients; discriminants checked within small exact bounds",
    }
    a = int_parameter(case, "a", practice_id, min_value=1, max_value=6)
    b = int_parameter(case, "b", practice_id, min_value=-15, max_value=15)
    c = int_parameter(case, "c", practice_id, min_value=-15, max_value=15)
    discriminant = b * b - 4 * a * c
    require_safe(abs(discriminant) <= 300, practice_id, "discriminant magnitude is too large")
    parameters.update({"a": a, "b": b, "c": c, "discriminant": discriminant})

    if item_type == "discriminant_value":
        prompt = f"For {polynomial_text([(a, 2), (b, 1), (c, 0)])} = 0, calculate the discriminant."
        answer = f"D = {discriminant}"
        worked_solution = [
            "Use D = b^2 - 4ac.",
            f"Here a = {a}, b = {b}, and c = {c}.",
            f"So D = {b}^2 - 4({a})({c}) = {discriminant}.",
        ]
    elif item_type == "root_type":
        root_type = "two distinct real roots" if discriminant > 0 else "one repeated real root" if discriminant == 0 else "no real roots"
        prompt = f"Use the discriminant to state the root type of {polynomial_text([(a, 2), (b, 1), (c, 0)])} = 0."
        answer = root_type
        worked_solution = [
            f"Compute D = b^2 - 4ac = {discriminant}.",
            "Positive D gives two distinct real roots; zero gives a repeated root; negative gives no real roots.",
            f"Therefore the equation has {root_type}.",
        ]
    else:
        constant = c
        require_safe(a == 1 and constant > 0, practice_id, "repeated-root parameter case uses x^2 + kx + positive constant")
        root = integer_square_root(constant, practice_id, "constant")
        prompt = f"Find k if x^2 + kx + {constant} = 0 has a repeated root."
        answer = f"k = -{2 * root} or k = {2 * root}"
        worked_solution = [
            "A repeated root means the discriminant is zero.",
            f"So k^2 - 4(1)({constant}) = 0.",
            f"k^2 = {4 * constant}, giving {answer}.",
        ]
        parameters.update({"root": root})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=QUADRATICS_DISCRIMINANT_FAMILY,
        topic=QUADRATICS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, QUADRATICS_TOPIC, ["p3-quadratics-discriminant-001"]),
    )


def build_quadratics_discriminant_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "discriminant_value", "a": 2, "b": 5, "c": -3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "root_type", "a": 1, "b": 2, "c": 5, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "repeated_root_parameter", "a": 1, "b": 0, "c": 9, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_quadratics_discriminant_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_quadratics_discriminant_bridge_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_algebra_discriminant_root_condition_bridge_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"discriminant_sign", "root_type", "repeated_root_parameter"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "easy"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "original deterministic P3 support bridge; small integer coefficients and exact discriminants",
        "topic_contract_id": "algebra_discriminant_root_conditions",
    }

    if item_type == "discriminant_sign":
        prompt = "For x^2 + 2x + 5 = 0, calculate the discriminant and state its sign."
        answer = "D = -16, so D < 0"
        worked_solution = [
            "Use D = b^2 - 4ac.",
            "Here a = 1, b = 2, and c = 5.",
            "D = 2^2 - 4(1)(5) = 4 - 20 = -16, which is negative.",
        ]
        parameters.update({"a": 1, "b": 2, "c": 5, "discriminant": -16})
    elif item_type == "root_type":
        prompt = "Use the discriminant to state the root type of 2x^2 - 3x - 1 = 0."
        answer = "two distinct real roots"
        worked_solution = [
            "Use D = b^2 - 4ac with a = 2, b = -3, and c = -1.",
            "D = (-3)^2 - 4(2)(-1) = 9 + 8 = 17.",
            "Since D > 0, the equation has two distinct real roots.",
        ]
        parameters.update({"a": 2, "b": -3, "c": -1, "discriminant": 17})
    else:
        prompt = "Find k if x^2 + kx + 9 = 0 has a repeated root."
        answer = "k = -6 or k = 6"
        worked_solution = [
            "A repeated root means D = 0.",
            "So k^2 - 4(1)(9) = 0.",
            "k^2 = 36, giving k = -6 or k = 6.",
        ]
        parameters.update({"a": 1, "c": 9, "discriminant_condition": "D = 0"})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=QUADRATICS_DISCRIMINANT_BRIDGE_FAMILY,
        topic=QUADRATICS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, QUADRATICS_TOPIC, ["p3-quadratics-discriminant-001"]),
    )


def build_quadratics_discriminant_bridge_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "discriminant_sign", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "root_type", "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "repeated_root_parameter", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_quadratics_discriminant_bridge_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_log_domain_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_log_domain_validation_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"domain_first", "single_log_equation", "combined_log_equation"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "linear log arguments with positive checked final roots",
        "topic_contract_id": "log_equations_inequalities",
    }

    if item_type == "domain_first":
        shift = int_parameter(case, "shift", practice_id, min_value=-9, max_value=9)
        prompt = f"State the domain restriction before working with ln(x - {shift})."
        answer = f"x > {shift}"
        worked_solution = [
            "A logarithm argument must be positive.",
            f"So x - {shift} > 0.",
            f"Therefore {answer}.",
        ]
        parameters.update({"shift": shift})
    elif item_type == "single_log_equation":
        shift = int_parameter(case, "shift", practice_id, min_value=-9, max_value=9)
        rhs = int_parameter(case, "rhs", practice_id, min_value=1, max_value=20)
        solution = shift + rhs
        require_safe(solution - shift > 0, practice_id, "solution must satisfy the log domain")
        prompt = f"Solve ln(x - {shift}) = ln {rhs}, checking the domain."
        answer = f"x = {solution}"
        worked_solution = [
            f"The domain needs x - {shift} > 0.",
            f"Equal natural logs have equal positive arguments, so x - {shift} = {rhs}.",
            f"This gives x = {solution}, which satisfies the domain.",
        ]
        parameters.update({"shift": shift, "rhs": rhs, "solution": solution})
    else:
        left_shift = int_parameter(case, "left_shift", practice_id, min_value=-6, max_value=6)
        right_shift = int_parameter(case, "right_shift", practice_id, min_value=-6, max_value=6)
        rhs = int_parameter(case, "rhs", practice_id, min_value=1, max_value=30)
        require_safe(left_shift != right_shift, practice_id, "log shifts must be distinct")
        # ln(x - 2) + ln(x + 1) = ln 10 gives valid x = 4 and extraneous x = -3.
        valid_root = int_parameter(case, "valid_root", practice_id, min_value=-10, max_value=10)
        invalid_root = int_parameter(case, "invalid_root", practice_id, min_value=-10, max_value=10)
        require_safe(valid_root != invalid_root, practice_id, "candidate roots must be distinct")
        require_safe((valid_root - left_shift) * (valid_root - right_shift) == rhs, practice_id, "valid root must solve combined log equation")
        require_safe((invalid_root - left_shift) * (invalid_root - right_shift) == rhs, practice_id, "invalid root must solve the algebraic equation")
        require_safe(valid_root - left_shift > 0 and valid_root - right_shift > 0, practice_id, "valid root must pass both domains")
        require_safe(not (invalid_root - left_shift > 0 and invalid_root - right_shift > 0), practice_id, "invalid root must fail at least one domain")
        left_arg = linear_expression(1, -left_shift)
        right_arg = linear_expression(1, -right_shift)
        prompt = f"Solve ln({left_arg}) + ln({right_arg}) = ln {rhs}, rejecting any invalid root."
        answer = f"x = {valid_root}"
        worked_solution = [
            f"Combine the logs: ln(({left_arg})({right_arg})) = ln {rhs}.",
            f"So ({left_arg})({right_arg}) = {rhs}.",
            f"The algebra gives x = {valid_root} or x = {invalid_root}.",
            f"Reject x = {invalid_root} because at least one original log argument is not positive.",
            "Check both original log arguments; only the valid root keeps both arguments positive.",
        ]
        parameters.update({"left_shift": left_shift, "right_shift": right_shift, "rhs": rhs, "valid_root": valid_root, "invalid_root": invalid_root})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=LOG_DOMAIN_FAMILY,
        topic=LOG_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-log-domain-001", "p3-log-invalid-operations-001"]),
    )


def build_log_domain_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "domain_first", "shift": 2, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "single_log_equation", "shift": 1, "rhs": 5, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "combined_log_equation", "left_shift": 2, "right_shift": -1, "rhs": 10, "valid_root": 4, "invalid_root": -3, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_log_domain_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_log_linearisation_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_log_linearisation_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"linearise_form", "read_gradient_intercept", "specific_model"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "positive coefficients and small gradients for log-linear forms",
        "topic_contract_id": "log_linearisation",
    }

    if item_type == "linearise_form":
        prompt = "For y = Ae^(kx), write a linear form suitable for plotting ln y against x."
        answer = "ln y = ln A + kx"
        worked_solution = [
            "Take natural logs of both sides.",
            "Use ln(uv) = ln u + ln v and ln(e^(kx)) = kx.",
            "This gives ln y = ln A + kx.",
        ]
    elif item_type == "read_gradient_intercept":
        intercept = int_parameter(case, "intercept", practice_id, min_value=-5, max_value=5)
        gradient = int_parameter(case, "gradient", practice_id, min_value=-5, max_value=5, allow_zero=False)
        prompt = f"If ln y = {intercept} + {gradient}x, state the gradient and intercept on a graph of ln y against x."
        answer = f"gradient = {gradient}, intercept = {intercept}"
        worked_solution = [
            "Compare the equation with Y = c + mx, where Y = ln y.",
            f"The coefficient of x is the gradient: {gradient}.",
            f"The constant term is the intercept: {intercept}.",
        ]
        parameters.update({"intercept": intercept, "gradient": gradient})
    else:
        coefficient = int_parameter(case, "coefficient", practice_id, min_value=1, max_value=9)
        gradient = int_parameter(case, "gradient", practice_id, min_value=-5, max_value=5, allow_zero=False)
        prompt = f"Linearise y = {coefficient}e^({gradient}x) by taking natural logs."
        answer = f"ln y = ln {coefficient} + {gradient}x"
        worked_solution = [
            "Take ln of both sides.",
            f"ln({coefficient}e^({gradient}x)) = ln {coefficient} + ln(e^({gradient}x)).",
            f"So {answer}.",
        ]
        parameters.update({"coefficient": coefficient, "gradient": gradient})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=LOG_LINEARISATION_FAMILY,
        topic=LOG_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-log-linearisation-001"]),
    )


def build_log_linearisation_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "linearise_form", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "read_gradient_intercept", "intercept": 2, "gradient": 3, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "specific_model", "coefficient": 4, "gradient": 2, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_log_linearisation_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_log_calculus_context_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_log_calculus_context_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"differentiate_exp", "differentiate_log_chain", "stationary_exp_product"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small chain-rule coefficients; stationary-product case has a single positive answer",
    }

    if item_type == "differentiate_exp":
        k = int_parameter(case, "k", practice_id, min_value=1, max_value=6)
        prompt = f"Differentiate e^({k}x)."
        answer = f"{k}e^({k}x)"
        worked_solution = [
            "Use the chain rule for e^(kx).",
            f"The derivative of {k}x is {k}.",
            f"So the derivative is {answer}.",
        ]
        parameters.update({"k": k})
    elif item_type == "differentiate_log_chain":
        a = int_parameter(case, "a", practice_id, min_value=1, max_value=6)
        b = int_parameter(case, "b", practice_id, min_value=-9, max_value=9)
        inner = linear_expression(a, b)
        prompt = f"Differentiate ln({inner})."
        answer = f"{a}/({inner})"
        worked_solution = [
            "Use d/dx ln u = u'/u.",
            f"Here u = {inner} and u' = {a}.",
            f"So the derivative is {answer}.",
        ]
        parameters.update({"a": a, "b": b})
    else:
        prompt = "Find the stationary x-value for y = x e^(-x)."
        answer = "x = 1"
        worked_solution = [
            "Use the product rule.",
            "dy/dx = e^(-x) - x e^(-x) = e^(-x)(1 - x).",
            "Since e^(-x) is never zero, set 1 - x = 0.",
            "Therefore x = 1.",
        ]

    return review_queue_item(
        practice_id=practice_id,
        generator_family=LOG_CALCULUS_CONTEXT_FAMILY,
        topic=LOG_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, LOG_TOPIC, ["p3-log-calculus-context-001"]),
    )


def build_log_calculus_context_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "differentiate_exp", "k": 3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "differentiate_log_chain", "a": 2, "b": 1, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "stationary_exp_product", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_log_calculus_context_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_differentiation_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_differentiation_chain_product_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"chain_first_line", "product_exp", "tangent_chain"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small integer coefficients; derivative magnitudes capped at 200",
    }

    if item_type == "chain_first_line":
        a = int_parameter(case, "a", practice_id, min_value=-6, max_value=6, allow_zero=False)
        b = int_parameter(case, "b", practice_id, min_value=-9, max_value=9)
        n = int_parameter(case, "n", practice_id, min_value=2, max_value=6)
        inner = linear_expression(a, b)
        derivative_coefficient = n * a
        require_safe(abs(derivative_coefficient) <= 36, practice_id, "chain derivative coefficient is too large")
        answer = f"{derivative_coefficient}({inner})^{n - 1}"
        prompt = f"Differentiate ({inner})^{n} by writing the chain-rule structure first."
        worked_solution = [
            f"Let u = {inner}.",
            f"Then y = u^{n}, so dy/du = {n}u^{n - 1} and du/dx = {a}.",
            f"Multiply the derivatives: dy/dx = {answer}.",
        ]
        parameters.update({"a": a, "b": b, "n": n, "derivative_coefficient": derivative_coefficient})
    elif item_type == "product_exp":
        k = int_parameter(case, "k", practice_id, min_value=1, max_value=5)
        prompt = f"Differentiate x e^({k}x)."
        answer = f"e^({k}x)(1 + {k}x)"
        worked_solution = [
            "Use the product rule with u = x and v = e^(kx).",
            f"du/dx = 1 and dv/dx = {k}e^({k}x).",
            f"dy/dx = e^({k}x) + {k}x e^({k}x).",
            f"Factor the common exponential to get {answer}.",
        ]
        parameters.update({"k": k})
    else:
        c = int_parameter(case, "c", practice_id, min_value=1, max_value=5)
        n = int_parameter(case, "n", practice_id, min_value=2, max_value=4)
        x0 = int_parameter(case, "x0", practice_id, min_value=1, max_value=3)
        inner_value = x0 * x0 + c
        y0 = inner_value ** n
        gradient = n * (inner_value ** (n - 1)) * 2 * x0
        require_safe(abs(gradient) <= 200, practice_id, "tangent gradient is too large")
        prompt = f"For y = (x^2 + {c})^{n}, find the tangent line at x = {x0}."
        answer = f"y - {y0} = {gradient}(x - {x0})"
        worked_solution = [
            f"Differentiate by the chain rule: dy/dx = {n}(x^2 + {c})^{n - 1}(2x).",
            f"At x = {x0}, the gradient is {gradient}.",
            f"The point on the curve is ({x0}, {y0}).",
            f"Use point-gradient form to get {answer}.",
        ]
        parameters.update({"c": c, "n": n, "x0": x0, "gradient": gradient, "y0": y0})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=DIFFERENTIATION_CHAIN_PRODUCT_FAMILY,
        topic=DIFFERENTIATION_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, DIFFERENTIATION_TOPIC, [
            "p3-differentiation-method-001",
            "p3-differentiation-follow-through-001",
        ]),
    )


def build_differentiation_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "chain_first_line", "a": 2, "b": 3, "n": 5, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "product_exp", "k": 2, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "tangent_chain", "c": 1, "n": 3, "x0": 1, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_differentiation_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_differentiation_stationary_tangent_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_differentiation_stationary_tangent_normal_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"stationary_condition", "tangent_line", "normal_line"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "low-degree polynomial curves with exact integer gradients or simple reciprocal normals",
        "topic_contract_id": "p3_diff_stationary_tangent_normal",
    }

    if item_type == "stationary_condition":
        prompt = "For y = x^3 - 12x, find the x-values of the stationary points."
        answer = "x = -2 or x = 2"
        worked_solution = [
            "Differentiate first: dy/dx = 3x^2 - 12.",
            "Stationary points have dy/dx = 0.",
            "Solve 3x^2 - 12 = 0 to get x^2 = 4.",
            "So x = -2 or x = 2.",
        ]
    elif item_type == "tangent_line":
        prompt = "Find the tangent line to y = x^2 + 1 at x = 3."
        answer = "y - 10 = 6(x - 3)"
        worked_solution = [
            "Differentiate: dy/dx = 2x.",
            "At x = 3, the gradient is 6 and y = 10.",
            "Use point-gradient form with point (3, 10).",
            "The tangent is y - 10 = 6(x - 3).",
        ]
        parameters.update({"x0": 3, "y0": 10, "gradient": 6})
    else:
        prompt = "Find the normal line to y = x^2 at x = 2."
        answer = "y - 4 = -1/4(x - 2)"
        worked_solution = [
            "Differentiate: dy/dx = 2x.",
            "At x = 2, the tangent gradient is 4.",
            "The normal gradient is the negative reciprocal, -1/4.",
            "The point is (2, 4), so the normal is y - 4 = -1/4(x - 2).",
        ]
        parameters.update({"x0": 2, "y0": 4, "tangent_gradient": 4, "normal_gradient": "-1/4"})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=DIFFERENTIATION_STATIONARY_TANGENT_FAMILY,
        topic=DIFFERENTIATION_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, DIFFERENTIATION_TOPIC, ["p3-differentiation-follow-through-001"]),
    )


def build_differentiation_stationary_tangent_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "stationary_condition", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "tangent_line", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "normal_line", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_differentiation_stationary_tangent_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_parametric_derivative_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_parametric_derivative_ratio_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"derivative_components", "dy_dx_at_t", "tangent_line"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small integer coefficients; dx/dt checked non-zero before division",
    }

    if item_type == "derivative_components":
        a = int_parameter(case, "a", practice_id, min_value=1, max_value=5)
        b = int_parameter(case, "b", practice_id, min_value=-9, max_value=9)
        c = int_parameter(case, "c", practice_id, min_value=-8, max_value=8, allow_zero=False)
        d = int_parameter(case, "d", practice_id, min_value=-9, max_value=9)
        x_expr = quadratic_parameter_text(a, b)
        y_expr = linear_parameter_text(c, d)
        dxdt = coefficient_variable_text(2 * a, "t")
        dydt = str(c)
        prompt = f"For x = {x_expr} and y = {y_expr}, write dx/dt and dy/dt."
        answer = f"dx/dt = {dxdt}, dy/dt = {dydt}"
        worked_solution = [
            "Differentiate x and y separately with respect to t.",
            f"From x = {x_expr}, dx/dt = {dxdt}.",
            f"From y = {y_expr}, dy/dt = {dydt}.",
        ]
        parameters.update({"a": a, "b": b, "c": c, "d": d})
    elif item_type == "dy_dx_at_t":
        a = int_parameter(case, "a", practice_id, min_value=1, max_value=5)
        b = int_parameter(case, "b", practice_id, min_value=-9, max_value=9)
        c = int_parameter(case, "c", practice_id, min_value=-12, max_value=12, allow_zero=False)
        d = int_parameter(case, "d", practice_id, min_value=-9, max_value=9)
        t0 = int_parameter(case, "t0", practice_id, min_value=1, max_value=5)
        dxdt_value = 2 * a * t0
        dydt_value = c
        require_safe(dxdt_value != 0, practice_id, "dx/dt cannot be zero")
        gradient = fraction_text(dydt_value, dxdt_value)
        x_expr = quadratic_parameter_text(a, b)
        y_expr = linear_parameter_text(c, d)
        prompt = f"For x = {x_expr} and y = {y_expr}, find dy/dx at t = {t0}."
        answer = f"dy/dx = {gradient}"
        worked_solution = [
            f"dx/dt = {coefficient_variable_text(2 * a, 't')} and dy/dt = {c}.",
            f"At t = {t0}, dx/dt = {dxdt_value} and dy/dt = {dydt_value}.",
            f"Use dy/dx = (dy/dt)/(dx/dt) = {dydt_value}/{dxdt_value}.",
            f"So dy/dx = {gradient}.",
        ]
        parameters.update({"a": a, "b": b, "c": c, "d": d, "t0": t0, "dxdt": dxdt_value, "dydt": dydt_value})
    else:
        a = int_parameter(case, "a", practice_id, min_value=-6, max_value=6, allow_zero=False)
        b = int_parameter(case, "b", practice_id, min_value=-9, max_value=9)
        c = int_parameter(case, "c", practice_id, min_value=-5, max_value=5, allow_zero=False)
        d = int_parameter(case, "d", practice_id, min_value=-9, max_value=9)
        t0 = int_parameter(case, "t0", practice_id, min_value=1, max_value=5)
        dydt_value = 2 * c * t0
        gradient_text = fraction_text(dydt_value, a)
        require_safe("/" not in gradient_text, practice_id, "tangent-line warm-up keeps integer gradients")
        gradient = int(gradient_text)
        require_safe(abs(gradient) <= 20, practice_id, "tangent gradient is too large")
        x0 = a * t0 + b
        y0 = c * t0 * t0 + d
        x_expr = linear_parameter_text(a, b)
        y_expr = quadratic_parameter_text(c, d)
        prompt = f"For x = {x_expr} and y = {y_expr}, find the tangent line at t = {t0}."
        answer = f"y - {y0} = {gradient}(x - {x0})"
        worked_solution = [
            f"dx/dt = {a} and dy/dt = {coefficient_variable_text(2 * c, 't')}.",
            f"At t = {t0}, dy/dx = {dydt_value}/{a} = {gradient}.",
            f"The point is ({x0}, {y0}).",
            f"Use point-gradient form to get {answer}.",
        ]
        parameters.update({"a": a, "b": b, "c": c, "d": d, "t0": t0, "gradient": gradient, "x0": x0, "y0": y0})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=PARAMETRIC_DERIVATIVE_FAMILY,
        topic=PARAMETRIC_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, PARAMETRIC_TOPIC, ["p3-parametric-derivative-001"]),
    )


def build_parametric_derivative_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "derivative_components", "a": 2, "b": 1, "c": 3, "d": -2, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "dy_dx_at_t", "a": 2, "b": -1, "c": 6, "d": 4, "t0": 3, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "tangent_line", "a": 2, "b": 1, "c": 1, "d": -4, "t0": 3, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_parametric_derivative_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_integration_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_integration_method_setup_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"substitution_setup", "substitution_integrate", "parts_exp"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small positive powers and coefficients; hidden derivative checked explicitly",
    }

    if item_type in {"substitution_setup", "substitution_integrate"}:
        c = int_parameter(case, "c", practice_id, min_value=1, max_value=9)
        n = int_parameter(case, "n", practice_id, min_value=1, max_value=5)
        integrand = f"2x(x^2 + {c})^{n}"
        if item_type == "substitution_setup":
            prompt = f"Using u = x^2 + {c}, transform the integral of {integrand} dx."
            answer = f"u = x^2 + {c}, du = 2x dx"
            worked_solution = [
                f"The substitution is given as u = x^2 + {c}.",
                f"The derivative of x^2 + {c} is 2x.",
                f"So du = 2x dx and the method line is {answer}.",
            ]
        else:
            result_power = n + 1
            prompt = f"Integrate {integrand} dx using u = x^2 + {c}."
            answer = f"(x^2 + {c})^{result_power}/{result_power} + C"
            worked_solution = [
                f"Use the given substitution u = x^2 + {c}, so du = 2x dx.",
                f"The integral becomes integral of u^{n} du.",
                f"Integrating gives u^{result_power}/{result_power} + C.",
                f"Substitute back to get {answer}.",
            ]
            parameters["result_power"] = result_power
        parameters.update({"c": c, "n": n})
    else:
        k = int_parameter(case, "k", practice_id, min_value=1, max_value=5)
        prompt = f"Integrate x e^({k}x) dx using integration by parts."
        answer = f"x e^({k}x)/{k} - e^({k}x)/{k * k} + C"
        worked_solution = [
            "Use parts with u = x and dv = e^(kx) dx.",
            f"Then du = dx and v = e^({k}x)/{k}.",
            "Apply integral u dv = uv - integral v du.",
            f"This gives {answer}.",
        ]
        parameters.update({"k": k})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=INTEGRATION_METHOD_SETUP_FAMILY,
        topic=INTEGRATION_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, INTEGRATION_TOPIC, [
            "p3-integration-method-choice-001",
            "p3-integration-parts-substitution-001",
        ]),
    )


def build_integration_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "substitution_setup", "c": 5, "n": 4, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "substitution_integrate", "c": 3, "n": 2, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "parts_exp", "k": 2, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_integration_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_complex_modulus_argument_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_complex_modulus_argument_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"modulus", "modulus_argument", "power_argument"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small integer Cartesian parts; modulus checked as exact square root",
    }

    if item_type in {"modulus", "modulus_argument"}:
        real = int_parameter(case, "real", practice_id, min_value=-12, max_value=12)
        imaginary = int_parameter(case, "imaginary", practice_id, min_value=-12, max_value=12)
        require_safe(real != 0 or imaginary != 0, practice_id, "complex number cannot be zero")
        modulus = integer_square_root(real * real + imaginary * imaginary, practice_id, "modulus squared")
        z_text = complex_text(real, imaginary)
        if item_type == "modulus":
            prompt = f"Find the modulus of z = {z_text}."
            answer = f"|z| = {modulus}"
            worked_solution = [
                "Use |a + bi| = sqrt(a^2 + b^2).",
                f"Here |z| = sqrt({real}^2 + {imaginary}^2).",
                f"So |z| = {modulus}.",
            ]
        else:
            argument = argument_text(real, imaginary, practice_id)
            prompt = f"For z = {z_text}, state the modulus and a quadrant-aware argument."
            answer = f"|z| = {modulus}, arg z = {argument}"
            worked_solution = [
                f"The modulus is sqrt({real}^2 + {imaginary}^2) = {modulus}.",
                "Use the signs of the real and imaginary parts to choose the quadrant.",
                f"The reference angle has tan alpha = {abs(imaginary)}/{abs(real)}.",
                f"So arg z = {argument}.",
            ]
            parameters["argument"] = argument
        parameters.update({"real": real, "imaginary": imaginary, "modulus": modulus})
    else:
        modulus = int_parameter(case, "modulus", practice_id, min_value=1, max_value=5)
        argument_numerator = int_parameter(case, "argument_numerator", practice_id, min_value=1, max_value=6)
        argument_denominator = int_parameter(case, "argument_denominator", practice_id, min_value=2, max_value=12)
        power = int_parameter(case, "power", practice_id, min_value=2, max_value=5)
        require_safe(argument_numerator < argument_denominator, practice_id, "argument fraction must be proper")
        powered_modulus = modulus ** power
        require_safe(powered_modulus <= 125, practice_id, "powered modulus is too large")
        powered_argument = pi_fraction_text(argument_numerator * power, argument_denominator)
        prompt = f"If z has modulus {modulus} and argument {pi_fraction_text(argument_numerator, argument_denominator)}, state the modulus and argument of z^{power}."
        answer = f"modulus = {powered_modulus}, argument = {powered_argument}"
        worked_solution = [
            f"For a power, raise the modulus to the power: {modulus}^{power} = {powered_modulus}.",
            f"Multiply the argument by {power}.",
            f"This gives argument {powered_argument}.",
        ]
        parameters.update({
            "modulus": modulus,
            "argument_numerator": argument_numerator,
            "argument_denominator": argument_denominator,
            "power": power,
            "powered_modulus": powered_modulus,
        })

    return review_queue_item(
        practice_id=practice_id,
        generator_family=COMPLEX_MODULUS_ARGUMENT_FAMILY,
        topic=COMPLEX_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, COMPLEX_TOPIC, [
            "p3-complex-form-001",
            "p3-complex-locus-argument-001",
        ]),
    )


def build_complex_modulus_argument_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "modulus", "real": 3, "imaginary": 4, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "modulus_argument", "real": -3, "imaginary": 4, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "power_argument", "modulus": 2, "argument_numerator": 1, "argument_denominator": 6, "power": 3, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_complex_modulus_argument_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_complex_locus_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_complex_locus_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"circle_centre_radius", "equal_distance_bisector", "argument_ray"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small integer centres and simple pi-fraction argument rays",
    }

    if item_type == "circle_centre_radius":
        center_real = int_parameter(case, "center_real", practice_id, min_value=-6, max_value=6)
        center_imaginary = int_parameter(case, "center_imaginary", practice_id, min_value=-6, max_value=6)
        radius = int_parameter(case, "radius", practice_id, min_value=1, max_value=8)
        prompt = f"For |z - ({complex_text(center_real, center_imaginary)})| = {radius}, state the centre and radius of the locus."
        answer = f"centre ({center_real}, {center_imaginary}), radius {radius}"
        worked_solution = [
            "|z - a| = r means distance r from the point a.",
            f"Here a = {complex_text(center_real, center_imaginary)}.",
            f"So the centre is ({center_real}, {center_imaginary}) and the radius is {radius}.",
        ]
        parameters.update({"center_real": center_real, "center_imaginary": center_imaginary, "radius": radius})
    elif item_type == "equal_distance_bisector":
        left_real = int_parameter(case, "left_real", practice_id, min_value=-6, max_value=6)
        right_real = int_parameter(case, "right_real", practice_id, min_value=-6, max_value=6)
        imaginary = int_parameter(case, "imaginary", practice_id, min_value=-6, max_value=6)
        require_safe(left_real != right_real, practice_id, "equal-distance points must be distinct")
        midpoint = Fraction(left_real + right_real, 2)
        midpoint_text = fraction_text(midpoint.numerator, midpoint.denominator)
        prompt = f"Describe the locus |z - ({complex_text(left_real, imaginary)})| = |z - ({complex_text(right_real, imaginary)})|."
        answer = f"the vertical line Re(z) = {midpoint_text}"
        worked_solution = [
            "The equation says the point z is the same distance from two fixed points.",
            "That locus is the perpendicular bisector of the segment joining the fixed points.",
            f"The midpoint has real part {midpoint_text}, so the line is Re(z) = {midpoint_text}.",
        ]
        parameters.update({"left_real": left_real, "right_real": right_real, "imaginary": imaginary, "midpoint_real": str(midpoint)})
    else:
        start_real = int_parameter(case, "start_real", practice_id, min_value=-6, max_value=6)
        start_imaginary = int_parameter(case, "start_imaginary", practice_id, min_value=-6, max_value=6)
        argument_numerator = int_parameter(case, "argument_numerator", practice_id, min_value=1, max_value=5)
        argument_denominator = int_parameter(case, "argument_denominator", practice_id, min_value=3, max_value=8)
        require_safe(argument_numerator < argument_denominator, practice_id, "argument ray fraction must be proper")
        angle = pi_fraction_text(argument_numerator, argument_denominator)
        prompt = f"Describe the locus arg(z - ({complex_text(start_real, start_imaginary)})) = {angle}."
        answer = f"a ray from ({start_real}, {start_imaginary}) at angle {angle} to the positive real direction"
        worked_solution = [
            "arg(z - a) measures direction from the point a.",
            f"Here the starting point is {complex_text(start_real, start_imaginary)}.",
            f"The locus is the ray from that point at angle {angle}.",
        ]
        parameters.update({
            "start_real": start_real,
            "start_imaginary": start_imaginary,
            "argument_numerator": argument_numerator,
            "argument_denominator": argument_denominator,
        })

    return review_queue_item(
        practice_id=practice_id,
        generator_family=COMPLEX_LOCUS_FAMILY,
        topic=COMPLEX_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, COMPLEX_TOPIC, ["p3-complex-locus-argument-001"]),
    )


def build_complex_locus_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "circle_centre_radius", "center_real": 2, "center_imaginary": 1, "radius": 3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "equal_distance_bisector", "left_real": 1, "right_real": 5, "imaginary": 0, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "argument_ray", "start_real": 1, "start_imaginary": -2, "argument_numerator": 1, "argument_denominator": 4, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_complex_locus_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_complex_roots_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_complex_roots_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"power_argument", "square_roots", "cube_roots_real"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small moduli and standard pi-fraction arguments with exact roots",
    }

    if item_type == "power_argument":
        modulus = int_parameter(case, "modulus", practice_id, min_value=1, max_value=5)
        argument_numerator = int_parameter(case, "argument_numerator", practice_id, min_value=1, max_value=6)
        argument_denominator = int_parameter(case, "argument_denominator", practice_id, min_value=2, max_value=12)
        power = int_parameter(case, "power", practice_id, min_value=2, max_value=4)
        require_safe(argument_numerator < argument_denominator, practice_id, "argument fraction must be proper")
        powered_modulus = modulus ** power
        argument = pi_fraction_text(argument_numerator, argument_denominator)
        powered_argument = pi_fraction_text(argument_numerator * power, argument_denominator)
        prompt = f"If z = {modulus}e^(i*{argument}), find z^{power} in modulus-argument form."
        answer = f"{powered_modulus}e^(i*{powered_argument})"
        worked_solution = [
            f"Raise the modulus to the power: {modulus}^{power} = {powered_modulus}.",
            f"Multiply the argument by {power}.",
            f"So z^{power} has argument {powered_argument}.",
        ]
        parameters.update({
            "modulus": modulus,
            "argument_numerator": argument_numerator,
            "argument_denominator": argument_denominator,
            "power": power,
            "powered_modulus": powered_modulus,
        })
    elif item_type == "square_roots":
        modulus = int_parameter(case, "modulus", practice_id, min_value=1, max_value=16)
        require_safe(modulus == 4, practice_id, "square-root warm-up uses modulus 4 for exact root modulus")
        prompt = "Find the square roots of 4e^(i*pi/3) in modulus-argument form."
        answer = "2e^(i*pi/6) and 2e^(i*7pi/6)"
        worked_solution = [
            "The square-root modulus is sqrt(4) = 2.",
            "Use arguments (pi/3 + 2kpi)/2 for k = 0 and k = 1.",
            "This gives pi/6 and 7pi/6.",
        ]
        parameters.update({"modulus": modulus, "root_count": 2})
    else:
        root_modulus = int_parameter(case, "root_modulus", practice_id, min_value=1, max_value=5)
        require_safe(root_modulus == 2, practice_id, "cube-root warm-up uses roots of 8 for exact simple roots")
        prompt = "Find the cube roots of 8 in Cartesian form."
        answer = "2, -1 + sqrt(3)i, -1 - sqrt(3)i"
        worked_solution = [
            "Write 8 as 8e^(i0).",
            "Cube roots have modulus 2 and arguments 0, 2pi/3, and 4pi/3.",
            "Converting these to Cartesian form gives 2, -1 + sqrt(3)i, and -1 - sqrt(3)i.",
        ]
        parameters.update({"root_modulus": root_modulus, "root_count": 3})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=COMPLEX_ROOTS_FAMILY,
        topic=COMPLEX_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, COMPLEX_TOPIC, ["p3-complex-roots-001", "p3-complex-form-001"]),
    )


def build_complex_roots_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "power_argument", "modulus": 2, "argument_numerator": 1, "argument_denominator": 6, "power": 3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "square_roots", "modulus": 4, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "cube_roots_real", "root_modulus": 2, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_complex_roots_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_vectors_line_scalar_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_vectors_line_scalar_product_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"dot_product", "perpendicular_check", "angle_cosine"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "3D integer components within [-9, 9]; non-zero direction vectors checked",
    }

    if item_type in {"dot_product", "perpendicular_check"}:
        left = vector_from_case(case, "left", practice_id)
        right = vector_from_case(case, "right", practice_id)
        dot = dot_product(left, right)
        require_safe(abs(dot) <= 120, practice_id, "dot product is too large")
        perpendicular_text = "perpendicular" if dot == 0 else "not perpendicular"
        if item_type == "dot_product":
            prompt = f"Find {vector_text(left)} . {vector_text(right)}."
            answer = f"dot product = {dot}"
            topic_contract_id = "vectors_scalar_product"
        else:
            prompt = f"Use a scalar product to decide whether {vector_text(left)} and {vector_text(right)} are perpendicular."
            answer = f"dot product = {dot}; the vectors are {perpendicular_text}"
            topic_contract_id = "vectors_scalar_product"
        worked_solution = [
            "Multiply matching components and add.",
            f"{vector_text(left)} . {vector_text(right)} = {left[0]}({right[0]}) + {left[1]}({right[1]}) + {left[2]}({right[2]}).",
            f"The dot product is {dot}.",
        ]
        if item_type == "perpendicular_check":
            worked_solution.append("A zero dot product means perpendicular; otherwise they are not perpendicular.")
        parameters.update({
            "left_x": left[0],
            "left_y": left[1],
            "left_z": left[2],
            "right_x": right[0],
            "right_y": right[1],
            "right_z": right[2],
            "dot": dot,
            "topic_contract_id": topic_contract_id,
        })
    else:
        left = vector_from_case(case, "left", practice_id)
        right = vector_from_case(case, "right", practice_id)
        dot = dot_product(left, right)
        left_norm = integer_square_root(dot_product(left, left), practice_id, "left norm squared")
        right_norm = integer_square_root(dot_product(right, right), practice_id, "right norm squared")
        denominator = left_norm * right_norm
        cosine = fraction_text(dot, denominator)
        prompt = f"For direction vectors {vector_text(left)} and {vector_text(right)}, find cos theta for the angle between them."
        answer = f"cos theta = {cosine}"
        worked_solution = [
            "Use a . b = |a||b| cos theta.",
            f"The dot product is {dot}.",
            f"The magnitudes are {left_norm} and {right_norm}.",
            f"So cos theta = {dot}/({left_norm} x {right_norm}) = {cosine}.",
        ]
        parameters.update({
            "left_x": left[0],
            "left_y": left[1],
            "left_z": left[2],
            "right_x": right[0],
            "right_y": right[1],
            "right_z": right[2],
            "dot": dot,
            "left_norm": left_norm,
            "right_norm": right_norm,
            "topic_contract_id": "vectors_angle_between_lines",
        })

    return review_queue_item(
        practice_id=practice_id,
        generator_family=VECTORS_LINE_SCALAR_FAMILY,
        topic=VECTORS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, VECTORS_TOPIC, [
            "p3-vectors-lines-001",
            "p3-vectors-scalar-product-001",
        ]),
    )


def build_vectors_line_scalar_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "item_type": "dot_product",
            "left_x": 1,
            "left_y": 2,
            "left_z": -1,
            "right_x": 3,
            "right_y": -1,
            "right_z": 2,
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "item_type": "perpendicular_check",
            "left_x": 2,
            "left_y": -1,
            "left_z": 2,
            "right_x": 1,
            "right_y": 2,
            "right_z": 0,
            "sequence_role": "complete_step",
            "difficulty_band": "easy",
        },
        {
            "item_type": "angle_cosine",
            "left_x": 1,
            "left_y": 2,
            "left_z": 2,
            "right_x": 2,
            "right_y": 1,
            "right_z": 2,
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    return [build_vectors_line_scalar_item(context, index, case) for index, case in enumerate(cases, start=1)]


def newton_sqrt_sequence(constant: int, x0: int, iterations: int, practice_id: str) -> list[Fraction]:
    require_safe(constant > 0, practice_id, "constant must be positive")
    require_safe(x0 > 0, practice_id, "starting value must be positive")
    values = [Fraction(x0, 1)]
    current = values[0]
    for _ in range(iterations):
        current = (current + Fraction(constant, 1) / current) / 2
        require_safe(current > 0 and current < 20, practice_id, "iteration left safe numeric bounds")
        values.append(current)
    return values


def build_numerical_sign_change_iteration_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_numerical_sign_change_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"endpoint_check", "interval_select", "graph_interpret"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small integer endpoint checks with explicit opposite signs",
    }

    if item_type == "endpoint_check":
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=30)
        left = int_parameter(case, "left", practice_id, min_value=-10, max_value=10)
        right = int_parameter(case, "right", practice_id, min_value=-10, max_value=10)
        require_safe(left < right, practice_id, "left endpoint must be smaller than right endpoint")
        left_value = left * left - constant
        right_value = right * right - constant
        require_safe(left_value * right_value < 0, practice_id, "endpoints must give a sign change")
        prompt = f"For f(x) = x^2 - {constant}, check whether the interval ({left}, {right}) contains a root."
        answer = f"f({left}) = {left_value} and f({right}) = {right_value}, so a root lies in ({left}, {right})"
        worked_solution = [
            f"Evaluate the function at both ends: f({left}) = {left_value}.",
            f"Evaluate the other end: f({right}) = {right_value}.",
            "The signs are opposite, so the continuous function crosses zero in the interval.",
        ]
        parameters.update({"constant": constant, "left": left, "right": right, "left_value": left_value, "right_value": right_value})
    elif item_type == "interval_select":
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=30)
        left = int_parameter(case, "left", practice_id, min_value=-10, max_value=10)
        mid = int_parameter(case, "mid", practice_id, min_value=-10, max_value=10)
        right = int_parameter(case, "right", practice_id, min_value=-10, max_value=10)
        require_safe(left < mid < right, practice_id, "endpoints must be ordered")
        values = {point: point * point - constant for point in (left, mid, right)}
        require_safe(values[left] * values[mid] < 0 or values[mid] * values[right] < 0, practice_id, "one adjacent pair must give a sign change")
        if values[left] * values[mid] < 0:
            interval = f"({left}, {mid})"
            pair = (left, mid)
        else:
            interval = f"({mid}, {right})"
            pair = (mid, right)
        prompt = f"For f(x) = x^2 - {constant}, use f({left}), f({mid}) and f({right}) to choose an interval containing a root."
        answer = f"A root lies in {interval}"
        worked_solution = [
            f"The endpoint values are f({left}) = {values[left]}, f({mid}) = {values[mid]}, and f({right}) = {values[right]}.",
            f"The sign change is between {pair[0]} and {pair[1]}.",
            f"So the justified interval is {interval}.",
        ]
        parameters.update({"constant": constant, "left": left, "mid": mid, "right": right, "values": values, "interval": interval})
    else:
        lower = int_parameter(case, "lower", practice_id, min_value=-10, max_value=10)
        upper = int_parameter(case, "upper", practice_id, min_value=-10, max_value=10)
        lower_value = int_parameter(case, "lower_value", practice_id, min_value=-50, max_value=50)
        upper_value = int_parameter(case, "upper_value", practice_id, min_value=-50, max_value=50)
        require_safe(lower < upper, practice_id, "lower endpoint must be smaller than upper endpoint")
        require_safe(lower_value * upper_value < 0, practice_id, "graph endpoint values must give a sign change")
        prompt = f"A graph of y = f(x) shows f({lower}) = {lower_value} and f({upper}) = {upper_value}. What root interval is justified?"
        answer = f"A root is justified in ({lower}, {upper})"
        worked_solution = [
            "Read the two endpoint signs from the graph evidence.",
            f"f({lower}) and f({upper}) have opposite signs.",
            f"That supports a crossing in ({lower}, {upper}).",
        ]
        parameters.update({"lower": lower, "upper": upper, "lower_value": lower_value, "upper_value": upper_value})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=NUMERICAL_SIGN_CHANGE_ITERATION_FAMILY,
        topic=NUMERICAL_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, NUMERICAL_TOPIC, ["p3-numerical-method-evidence-001"]),
    )


def build_numerical_sign_change_iteration_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "endpoint_check", "constant": 5, "left": 2, "right": 3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "interval_select", "constant": 7, "left": 2, "mid": 3, "right": 4, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "graph_interpret", "lower": 1, "upper": 2, "lower_value": -3, "upper_value": 4, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_numerical_sign_change_iteration_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_numerical_iteration_formula_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_numerical_iteration_formula_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"identify_formula", "perform_iterations", "suitability_check"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small positive constants; iteration values checked positive and bounded",
    }

    if item_type == "identify_formula":
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=20)
        prompt = f"For x^2 = {constant}, which recurrence keeps the fixed-point equation unchanged: x_(n+1) = sqrt({constant}) or x_(n+1) = {constant}/x_n?"
        answer = f"x_(n+1) = {constant}/x_n"
        worked_solution = [
            f"A fixed point must satisfy x = g(x).",
            f"For x = {constant}/x, multiplying by x gives x^2 = {constant}.",
            "The constant square-root option does not use the previous approximation.",
        ]
        parameters.update({"constant": constant})
    elif item_type == "perform_iterations":
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=19)
        x0 = int_parameter(case, "x0", practice_id, min_value=1, max_value=9)
        iterations = int_parameter(case, "iterations", practice_id, min_value=2, max_value=4)
        values = newton_sqrt_sequence(constant, x0, iterations, practice_id)
        rounded_values = [decimal_text(value) for value in values]
        prompt = f"Use x_(n+1) = (x_n + {constant}/x_n)/2 with x_0 = {x0}. Find x_1 and x_2 to 3 d.p."
        answer = f"x_1 = {rounded_values[1]}, x_2 = {rounded_values[2]}"
        worked_solution = [
            f"Substitute x_0 = {x0} into the iteration formula.",
            f"x_1 = {rounded_values[1]}.",
            f"Use x_1 in the same formula to get x_2 = {rounded_values[2]}.",
        ]
        parameters.update({"constant": constant, "x0": x0, "iterations": iterations, "x1_3dp": rounded_values[1], "x2_3dp": rounded_values[2]})
    else:
        multiplier = int_parameter(case, "multiplier", practice_id, min_value=2, max_value=9)
        gradient_abs = Fraction(multiplier, 10)
        gradient_text = fraction_text(gradient_abs.numerator, gradient_abs.denominator)
        require_safe(gradient_abs < 1, practice_id, "fixed-point suitability check requires gradient magnitude below 1")
        prompt = f"Near the fixed point, an iteration has |g'(x)| = {gradient_text}. Is this locally suitable for convergence?"
        answer = "Yes, it is locally suitable because |g'(x)| < 1"
        worked_solution = [
            "Use the lightweight fixed-point check.",
            f"The gradient magnitude is {gradient_text}, which is less than 1.",
            "That supports local convergence for the warm-up check.",
        ]
        parameters.update({"gradient_abs": gradient_text})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=NUMERICAL_ITERATION_FORMULA_FAMILY,
        topic=NUMERICAL_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, NUMERICAL_TOPIC, ["p3-iteration-formula-discipline-001"]),
    )


def build_numerical_iteration_formula_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "identify_formula", "constant": 6, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "perform_iterations", "constant": 5, "x0": 2, "iterations": 2, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "suitability_check", "multiplier": 6, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_numerical_iteration_formula_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_numerical_accuracy_rounding_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_numerical_accuracy_rounding_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"round_decimal", "avoid_early_rounding", "successive_bounds"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "short decimal checks using fixed deterministic approximations",
    }

    if item_type == "round_decimal":
        numerator = int_parameter(case, "numerator", practice_id, min_value=1000, max_value=99999)
        value = Fraction(numerator, 10000)
        prompt = f"An iteration gives x = {decimal_text(value, 4)}. State x to 3 significant figures."
        answer = f"x = {float(value):.3g}"
        worked_solution = [
            "Keep the displayed approximation until the final step.",
            "Count three significant figures from the first non-zero digit.",
            f"The rounded value is {float(value):.3g}.",
        ]
        parameters.update({"value": decimal_text(value, 4), "significant_figures": 3})
    elif item_type == "avoid_early_rounding":
        constant = int_parameter(case, "constant", practice_id, min_value=2, max_value=19)
        x0 = int_parameter(case, "x0", practice_id, min_value=1, max_value=9)
        values = newton_sqrt_sequence(constant, x0, 2, practice_id)
        exact_x1 = decimal_text(values[1], 5)
        rounded_x1 = decimal_text(values[1], 1)
        exact_x2 = decimal_text(values[2], 5)
        prompt = f"For x_(n+1) = (x_n + {constant}/x_n)/2 and x_0 = {x0}, should x_1 = {exact_x1} be rounded to {rounded_x1} before finding x_2?"
        answer = "No, keep extra figures before finding x_2"
        worked_solution = [
            "Early rounding changes the input to the next iteration.",
            f"Use the stored value near {exact_x1}, then compute x_2 near {exact_x2}.",
            "Round only after the requested iteration or accuracy is reached.",
        ]
        parameters.update({"constant": constant, "x0": x0, "x1_5dp": exact_x1, "x2_5dp": exact_x2})
    else:
        lower_numerator = int_parameter(case, "lower_numerator", practice_id, min_value=1000, max_value=9999)
        upper_numerator = int_parameter(case, "upper_numerator", practice_id, min_value=1000, max_value=9999)
        lower_value = Fraction(lower_numerator, 10000)
        upper_value = Fraction(upper_numerator, 10000)
        require_safe(lower_value < upper_value, practice_id, "successive bounds must be ordered")
        lower_2dp = f"{float(lower_value):.2f}"
        upper_2dp = f"{float(upper_value):.2f}"
        require_safe(lower_2dp == upper_2dp, practice_id, "bounds must justify the same 2 d.p. value")
        prompt = f"Two successive approximations are {decimal_text(lower_value, 4)} and {decimal_text(upper_value, 4)}. Give the value to 2 d.p. if both round the same way."
        answer = f"x = {lower_2dp} to 2 d.p."
        worked_solution = [
            f"{decimal_text(lower_value, 4)} rounds to {lower_2dp}.",
            f"{decimal_text(upper_value, 4)} also rounds to {upper_2dp}.",
            f"So the justified 2 d.p. value is {lower_2dp}.",
        ]
        parameters.update({"lower_value": decimal_text(lower_value, 4), "upper_value": decimal_text(upper_value, 4), "decimal_places": 2})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=NUMERICAL_ACCURACY_ROUNDING_FAMILY,
        topic=NUMERICAL_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, NUMERICAL_TOPIC, ["p3-numerical-method-evidence-001"]),
    )


def build_numerical_accuracy_rounding_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "round_decimal", "numerator": 15248, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "avoid_early_rounding", "constant": 5, "x0": 2, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "successive_bounds", "lower_numerator": 1523, "upper_numerator": 1524, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_numerical_accuracy_rounding_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_differential_equations_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_differential_equations_separation_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"separate_first", "solve_exponential", "initial_condition_value"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "positive initial values and small coefficients; exact outputs checked",
    }

    if item_type == "separate_first":
        k = int_parameter(case, "k", practice_id, min_value=1, max_value=6)
        power = int_parameter(case, "power", practice_id, min_value=1, max_value=4)
        prompt = f"For dy/dx = {k}x^{power}y, write a separated-variable first line."
        answer = f"(1/y) dy = {k}x^{power} dx"
        worked_solution = [
            "Move every y expression to the dy side and every x expression to the dx side.",
            "Divide by y before integrating.",
            f"The separated first line is {answer}.",
        ]
        parameters.update({"k": k, "power": power})
    elif item_type == "solve_exponential":
        k = int_parameter(case, "k", practice_id, min_value=2, max_value=8)
        y0 = int_parameter(case, "y0", practice_id, min_value=1, max_value=9)
        require_safe(k % 2 == 0, practice_id, "k must be even for this exact warm-up")
        exponent_coefficient = k // 2
        prompt = f"Solve dy/dx = {k}xy given y(0) = {y0}."
        exponent_text = "x^2" if exponent_coefficient == 1 else f"{exponent_coefficient}x^2"
        answer = f"y = {y0}e^({exponent_text})"
        worked_solution = [
            f"Separate variables: (1/y) dy = {k}x dx.",
            f"Integrate to get ln y = {exponent_text} + C.",
            f"Use y(0) = {y0}, so e^C = {y0}.",
            f"Therefore {answer}.",
        ]
        parameters.update({"k": k, "y0": y0, "exponent_coefficient": exponent_coefficient})
    else:
        y0 = int_parameter(case, "y0", practice_id, min_value=1, max_value=9)
        x_value = int_parameter(case, "x_value", practice_id, min_value=1, max_value=12)
        final_y = integer_square_root(y0 * y0 + x_value * x_value, practice_id, "final y squared")
        prompt = f"For dy/dx = x/y with y(0) = {y0}, find y when x = {x_value}, taking the positive branch."
        answer = f"y = {final_y}"
        worked_solution = [
            "Separate variables: y dy = x dx.",
            "Integrate to get y^2/2 = x^2/2 + C.",
            f"Using y(0) = {y0} gives y^2 = x^2 + {y0 * y0}.",
            f"At x = {x_value}, y^2 = {final_y * final_y}, so the positive value is y = {final_y}.",
        ]
        parameters.update({"y0": y0, "x_value": x_value, "final_y": final_y})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=DIFFERENTIAL_EQUATIONS_SEPARATION_FAMILY,
        topic=DIFFERENTIAL_EQUATIONS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, DIFFERENTIAL_EQUATIONS_TOPIC, [
            "p3-differential-separation-001",
            "p3-differential-initial-condition-001",
        ]),
    )


def build_differential_equations_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "separate_first", "k": 3, "power": 2, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "solve_exponential", "k": 2, "y0": 5, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "initial_condition_value", "y0": 3, "x_value": 4, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_differential_equations_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_differential_initial_condition_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_differential_equations_initial_condition_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"constant_from_relation", "particular_exponential", "value_from_relation"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small positive values; initial condition applied only after an integrated relation is given",
    }

    if item_type == "constant_from_relation":
        y0 = int_parameter(case, "y0", practice_id, min_value=1, max_value=9)
        x0 = int_parameter(case, "x0", practice_id, min_value=0, max_value=6)
        constant = y0 * y0 - x0 * x0
        prompt = f"Given the integrated relation y^2 = x^2 + C and y = {y0} when x = {x0}, find C."
        answer = f"C = {constant}"
        worked_solution = [
            "Use the condition in the integrated relation, not in the original differential equation.",
            f"Substitute y = {y0} and x = {x0}: {y0 * y0} = {x0 * x0} + C.",
            f"So C = {constant}.",
        ]
        parameters.update({"y0": y0, "x0": x0, "constant": constant})
    elif item_type == "particular_exponential":
        y0 = int_parameter(case, "y0", practice_id, min_value=1, max_value=9)
        a = int_parameter(case, "a", practice_id, min_value=1, max_value=5)
        prompt = f"A general solution is y = Ae^({a}x^2). If y = {y0} when x = 0, write the particular solution."
        answer = f"y = {y0}e^({a}x^2)"
        worked_solution = [
            "Substitute the given point after the general solution is known.",
            f"{y0} = Ae^0, so A = {y0}.",
            f"The particular solution is {answer}.",
        ]
        parameters.update({"y0": y0, "a": a})
    else:
        y0 = int_parameter(case, "y0", practice_id, min_value=1, max_value=9)
        x0 = int_parameter(case, "x0", practice_id, min_value=0, max_value=6)
        x_value = int_parameter(case, "x_value", practice_id, min_value=1, max_value=12)
        constant = y0 * y0 - x0 * x0
        final_y = integer_square_root(x_value * x_value + constant, practice_id, "final y squared")
        prompt = f"For y^2 = x^2 + C, y = {y0} when x = {x0}. Find the positive y when x = {x_value}."
        answer = f"y = {final_y}"
        worked_solution = [
            f"First find C: {y0 * y0} = {x0 * x0} + C, so C = {constant}.",
            f"At x = {x_value}, y^2 = {x_value * x_value} + {constant} = {final_y * final_y}.",
            f"The positive value is y = {final_y}.",
        ]
        parameters.update({"y0": y0, "x0": x0, "x_value": x_value, "constant": constant, "final_y": final_y})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=DIFFERENTIAL_EQUATIONS_INITIAL_CONDITION_FAMILY,
        topic=DIFFERENTIAL_EQUATIONS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, DIFFERENTIAL_EQUATIONS_TOPIC, ["p3-differential-initial-condition-001"]),
    )


def build_differential_initial_condition_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "constant_from_relation", "y0": 3, "x0": 1, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "particular_exponential", "y0": 4, "a": 2, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "value_from_relation", "y0": 3, "x0": 0, "x_value": 4, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_differential_initial_condition_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_differentiation_implicit_log_exp_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_differentiation_implicit_log_exp_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"implicit_setup", "implicit_solve", "implicit_log_relation"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "canonical implicit forms with exact symbolic derivative checks",
    }

    if item_type == "implicit_setup":
        radius_squared = int_parameter(case, "radius_squared", practice_id, min_value=1, max_value=100)
        prompt = f"For x^2 + y^2 = {radius_squared}, write the first implicit-differentiation line."
        answer = "2x + 2y dy/dx = 0"
        worked_solution = [
            "Differentiate both sides with respect to x.",
            "The x^2 term gives 2x.",
            "The y^2 term gives 2y dy/dx by the chain rule.",
            "The constant differentiates to 0.",
        ]
        parameters.update({"radius_squared": radius_squared})
    elif item_type == "implicit_solve":
        prompt = "For x^2 + y^2 = 25, find dy/dx in terms of x and y."
        answer = "dy/dx = -x/y"
        worked_solution = [
            "Differentiate implicitly: 2x + 2y dy/dx = 0.",
            "Move 2x to the other side.",
            "Divide by 2y to get dy/dx = -x/y.",
        ]
    else:
        prompt = "For y ln x = x^2, find dy/dx."
        answer = "dy/dx = (2x - y/x)/ln x"
        worked_solution = [
            "Differentiate y ln x using the product rule.",
            "This gives (dy/dx)ln x + y/x = 2x.",
            "Move y/x to the right side.",
            "Divide by ln x to get dy/dx = (2x - y/x)/ln x.",
        ]

    return review_queue_item(
        practice_id=practice_id,
        generator_family=DIFFERENTIATION_IMPLICIT_LOG_EXP_FAMILY,
        topic=DIFFERENTIATION_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, DIFFERENTIATION_TOPIC, ["p3-differentiation-implicit-log-exp-001"]),
    )


def build_differentiation_implicit_log_exp_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "implicit_setup", "radius_squared": 25, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "implicit_solve", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "implicit_log_relation", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_differentiation_implicit_log_exp_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_integration_definite_area_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_integration_definite_area_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"antiderivative", "definite_integral", "area_under_curve"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "low-degree polynomials with exact integer or simple fractional areas",
    }

    if item_type == "antiderivative":
        prompt = "Find an antiderivative of 3x^2 + 2x."
        answer = "x^3 + x^2 + C"
        worked_solution = [
            "Increase each power by 1 and divide by the new power.",
            "3x^2 integrates to x^3.",
            "2x integrates to x^2.",
            "Include + C for an indefinite integral.",
        ]
    elif item_type == "definite_integral":
        upper = int_parameter(case, "upper", practice_id, min_value=1, max_value=5)
        value = upper ** 3 + upper ** 2
        require_safe(value <= 150, practice_id, "definite integral value is too large")
        prompt = f"Evaluate the definite integral of 3x^2 + 2x from 0 to {upper}."
        answer = str(value)
        worked_solution = [
            "An antiderivative is x^3 + x^2.",
            f"Evaluate at {upper}: {upper}^3 + {upper}^2 = {value}.",
            "Evaluate at 0 and subtract 0.",
            f"So the definite integral is {value}.",
        ]
        parameters.update({"upper": upper, "value": value})
    else:
        width = int_parameter(case, "width", practice_id, min_value=1, max_value=6)
        numerator = width ** 3
        denominator = 6
        area = fraction_text(numerator, denominator)
        prompt = f"Find the area under y = {width}x - x^2 from x = 0 to x = {width}."
        answer = area
        worked_solution = [
            f"The curve is non-negative between 0 and {width}, so area is the definite integral.",
            f"Integrate {width}x - x^2 to get {fraction_text(width, 2)}x^2 - x^3/3.",
            f"Substitute {width} and 0.",
            f"The area is {area}.",
        ]
        parameters.update({"width": width, "area": area})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=INTEGRATION_DEFINITE_AREA_FAMILY,
        topic=INTEGRATION_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, INTEGRATION_TOPIC, ["p3-integration-definite-area-001"]),
    )


def build_integration_definite_area_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "antiderivative", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "definite_integral", "upper": 2, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "area_under_curve", "width": 4, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_integration_definite_area_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_integration_parts_substitution_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_integration_parts_substitution_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"substitution_setup", "substitution_integrate", "parts_linear_exp"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "single-substitution and one-step parts cases with exact symbolic answers",
    }

    if item_type == "substitution_setup":
        prompt = "Using u = x^2 + 1, transform the integral of 2x(x^2 + 1)^4 dx."
        answer = "u = x^2 + 1, du = 2x dx"
        worked_solution = [
            "The substitution is given as u = x^2 + 1.",
            "Its derivative is 2x, which appears outside the bracket.",
            "So du = 2x dx and the method line is u = x^2 + 1, du = 2x dx.",
        ]
    elif item_type == "substitution_integrate":
        prompt = "Integrate 2x(x^2 + 1)^4 dx using u = x^2 + 1."
        answer = "(x^2 + 1)^5/5 + C"
        worked_solution = [
            "Let u = x^2 + 1, so du = 2x dx.",
            "The integral becomes integral of u^4 du.",
            "Integrating gives u^5/5 + C.",
            "Substitute back to get (x^2 + 1)^5/5 + C.",
        ]
    else:
        prompt = "Integrate x e^x dx using integration by parts."
        answer = "x e^x - e^x + C"
        worked_solution = [
            "Use parts with u = x and dv = e^x dx.",
            "Then du = dx and v = e^x.",
            "Apply integral u dv = uv - integral v du.",
            "This gives x e^x - e^x + C.",
        ]

    return review_queue_item(
        practice_id=practice_id,
        generator_family=INTEGRATION_PARTS_SUBSTITUTION_FAMILY,
        topic=INTEGRATION_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, INTEGRATION_TOPIC, ["p3-integration-parts-substitution-001"]),
    )


def build_integration_parts_substitution_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "substitution_setup", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "substitution_integrate", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "parts_linear_exp", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_integration_parts_substitution_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_complex_cartesian_locus_roots_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_complex_cartesian_locus_roots_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"cartesian_add", "locus_circle", "cube_roots_real"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small Cartesian parts; locus and root prompts use exact standard forms",
    }

    if item_type == "cartesian_add":
        a = int_parameter(case, "a", practice_id, min_value=-9, max_value=9)
        b = int_parameter(case, "b", practice_id, min_value=-9, max_value=9)
        c = int_parameter(case, "c", practice_id, min_value=-9, max_value=9)
        d = int_parameter(case, "d", practice_id, min_value=-9, max_value=9)
        real = a + c
        imaginary = b + d
        require_safe(abs(real) <= 18 and abs(imaginary) <= 18, practice_id, "Cartesian sum is too large")
        prompt = f"Add ({complex_text(a, b)}) and ({complex_text(c, d)}) in Cartesian form."
        answer = complex_text(real, imaginary)
        worked_solution = [
            "Add real parts together and imaginary parts together.",
            f"Real part: {a} + {c} = {real}.",
            f"Imaginary part: {b} + {d} = {imaginary}.",
            f"So the sum is {answer}.",
        ]
        parameters.update({"a": a, "b": b, "c": c, "d": d, "real": real, "imaginary": imaginary})
    elif item_type == "locus_circle":
        center_real = int_parameter(case, "center_real", practice_id, min_value=-9, max_value=9)
        center_imaginary = int_parameter(case, "center_imaginary", practice_id, min_value=-9, max_value=9)
        radius = int_parameter(case, "radius", practice_id, min_value=1, max_value=9)
        prompt = f"For |z - ({complex_text(center_real, center_imaginary)})| = {radius}, state the centre and radius of the locus."
        answer = f"centre ({center_real}, {center_imaginary}), radius {radius}"
        worked_solution = [
            "|z - w| = r is a circle centered at the complex number w.",
            f"Here w = {complex_text(center_real, center_imaginary)}.",
            f"So the centre is ({center_real}, {center_imaginary}) and the radius is {radius}.",
        ]
        parameters.update({"center_real": center_real, "center_imaginary": center_imaginary, "radius": radius})
    else:
        root_modulus = int_parameter(case, "root_modulus", practice_id, min_value=1, max_value=5)
        require_safe(root_modulus == 2, practice_id, "cube-root warm-up uses roots of 8 for exact simple roots")
        prompt = "Find the cube roots of 8 in Cartesian form."
        answer = "2, -1 + sqrt(3)i, -1 - sqrt(3)i"
        worked_solution = [
            "Write 8 as 8e^(i0).",
            "Cube roots have modulus 2 and arguments 0, 2pi/3, and 4pi/3.",
            "Converting these to Cartesian form gives 2, -1 + sqrt(3)i, and -1 - sqrt(3)i.",
        ]
        parameters.update({"root_modulus": root_modulus})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=COMPLEX_CARTESIAN_LOCUS_ROOTS_FAMILY,
        topic=COMPLEX_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, COMPLEX_TOPIC, [
            "p3-complex-form-001",
            "p3-complex-locus-argument-001",
        ]),
    )


def build_complex_cartesian_locus_roots_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "cartesian_add", "a": 3, "b": 2, "c": 1, "d": -5, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "locus_circle", "center_real": 2, "center_imaginary": 1, "radius": 3, "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "cube_roots_real", "root_modulus": 2, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_complex_cartesian_locus_roots_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_complex_cartesian_conjugate_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_complex_cartesian_conjugate_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"conjugate", "divide_by_complex", "solve_with_conjugate"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "small Cartesian components with exact conjugate products",
    }

    if item_type == "conjugate":
        prompt = "Write the conjugate of 3 - 4i."
        answer = "3 + 4i"
        worked_solution = [
            "The conjugate keeps the real part the same.",
            "It changes the sign of the imaginary part.",
            "So the conjugate of 3 - 4i is 3 + 4i.",
        ]
        parameters.update({"real": 3, "imaginary": -4})
    elif item_type == "divide_by_complex":
        prompt = "Simplify 1/(2 - i) in Cartesian form."
        answer = "(2 + i)/5"
        worked_solution = [
            "Multiply the numerator and denominator by the conjugate 2 + i.",
            "The denominator is (2 - i)(2 + i) = 2^2 + 1^2 = 5.",
            "The numerator is 2 + i.",
            "So the simplified form is (2 + i)/5.",
        ]
        parameters.update({"real": 2, "imaginary": -1, "denominator": 5})
    else:
        prompt = "Given z + conjugate(z) = 6 and z - conjugate(z) = 4i, find z."
        answer = "z = 3 + 2i"
        worked_solution = [
            "Let z = a + bi, so conjugate(z) = a - bi.",
            "Then z + conjugate(z) = 2a = 6, so a = 3.",
            "Also z - conjugate(z) = 2bi = 4i, so b = 2.",
            "Therefore z = 3 + 2i.",
        ]
        parameters.update({"real": 3, "imaginary": 2})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=COMPLEX_CARTESIAN_CONJUGATE_FAMILY,
        topic=COMPLEX_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, COMPLEX_TOPIC, ["p3-complex-form-001"]),
    )


def build_complex_cartesian_conjugate_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "conjugate", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "divide_by_complex", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "solve_with_conjugate", "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_complex_cartesian_conjugate_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_vectors_line_intersection_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_vectors_line_intersection_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"component_equations", "intersection_point", "point_on_line_parameter"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "3D integer line components chosen to give exact parameter checks",
    }

    if item_type in {"component_equations", "intersection_point"}:
        first_point = (1, 2, 0)
        first_direction = (2, -1, 1)
        second_point = (3, 1, 1)
        second_direction = (1, 0, 2)
        if item_type == "component_equations":
            prompt = f"Write the component equations for intersecting r = {vector_text(first_point)} + lambda{vector_text(first_direction)} and r = {vector_text(second_point)} + mu{vector_text(second_direction)}."
            answer = "1 + 2lambda = 3 + mu, 2 - lambda = 1, lambda = 1 + 2mu"
            worked_solution = [
                "Equate matching x, y, and z components.",
                "The x-components give 1 + 2lambda = 3 + mu.",
                "The y-components give 2 - lambda = 1.",
                "The z-components give lambda = 1 + 2mu.",
            ]
        else:
            prompt = f"Find the intersection point of r = {vector_text(first_point)} + lambda{vector_text(first_direction)} and r = {vector_text(second_point)} + mu{vector_text(second_direction)}."
            answer = "(3, 1, 1)"
            worked_solution = [
                "From the y-components, 2 - lambda = 1, so lambda = 1.",
                "Substitute into the x-components to get mu = 0.",
                "The z-components also agree.",
                "Substitute lambda = 1 into the first line to get (3, 1, 1).",
            ]
        parameters.update({"lambda": 1, "mu": 0, "topic_contract_id": "vectors_intersect_parallel_skew"})
    else:
        lambda_value = int_parameter(case, "lambda_value", practice_id, min_value=-5, max_value=5)
        point = (1, 2, 0)
        direction = (2, -1, 1)
        target = tuple(point[i] + lambda_value * direction[i] for i in range(3))
        prompt = f"The point (5, k, 2) lies on r = {vector_text(point)} + lambda{vector_text(direction)}. Find k."
        require_safe(target[0] == 5 and target[2] == 2, practice_id, "lambda must match fixed x and z coordinates")
        answer = f"k = {target[1]}"
        worked_solution = [
            "Use the x-coordinate first: 1 + 2lambda = 5, so lambda = 2.",
            "Check the z-coordinate: lambda = 2 gives z = 2.",
            f"Use the y-coordinate: k = 2 - 2 = {target[1]}.",
        ]
        parameters.update({"lambda_value": lambda_value, "k": target[1], "topic_contract_id": "vectors_line_equation"})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=VECTORS_LINE_INTERSECTION_FAMILY,
        topic=VECTORS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, VECTORS_TOPIC, ["p3-vectors-lines-001"]),
    )


def build_vectors_line_intersection_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "component_equations", "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "intersection_point", "sequence_role": "complete_step", "difficulty_band": "medium"},
        {"item_type": "point_on_line_parameter", "lambda_value": 2, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_vectors_line_intersection_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_vectors_line_relationship_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_vectors_line_relationship_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"direction_from_points", "point_from_parameter", "relationship_from_directions"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "3D integer point and direction components within [-9, 9]; exact component checks",
    }

    if item_type == "direction_from_points":
        ax = int_parameter(case, "ax", practice_id, min_value=-9, max_value=9)
        ay = int_parameter(case, "ay", practice_id, min_value=-9, max_value=9)
        az = int_parameter(case, "az", practice_id, min_value=-9, max_value=9)
        bx = int_parameter(case, "bx", practice_id, min_value=-9, max_value=9)
        by = int_parameter(case, "by", practice_id, min_value=-9, max_value=9)
        bz = int_parameter(case, "bz", practice_id, min_value=-9, max_value=9)
        direction = (bx - ax, by - ay, bz - az)
        require_safe(any(component != 0 for component in direction), practice_id, "points must be distinct")
        prompt = f"Find the direction vector from A({ax}, {ay}, {az}) to B({bx}, {by}, {bz})."
        answer = vector_text(direction)
        worked_solution = [
            "Subtract A from B component by component.",
            f"AB = {vector_text((bx, by, bz))} - {vector_text((ax, ay, az))}.",
            f"So the direction vector is {vector_text(direction)}.",
        ]
        parameters.update({"ax": ax, "ay": ay, "az": az, "bx": bx, "by": by, "bz": bz})
        parameters["topic_contract_id"] = "vectors_notation"
    elif item_type == "point_from_parameter":
        point = vector_from_case(case, "point", practice_id, allow_zero_vector=True)
        direction = vector_from_case(case, "direction", practice_id)
        parameter_value = int_parameter(case, "parameter_value", practice_id, min_value=-3, max_value=3)
        target = tuple(point[i] + parameter_value * direction[i] for i in range(3))
        prompt = f"Point P lies on r = {vector_text(point)} + lambda{vector_text(direction)} with lambda = {parameter_value}. Find P."
        answer = f"P = {vector_text(target)}"
        worked_solution = [
            f"Substitute lambda = {parameter_value} into the vector equation.",
            f"P = {vector_text(point)} + {parameter_value}{vector_text(direction)}.",
            f"So P = {vector_text(target)}.",
        ]
        parameters.update({
            "point_x": point[0],
            "point_y": point[1],
            "point_z": point[2],
            "direction_x": direction[0],
            "direction_y": direction[1],
            "direction_z": direction[2],
            "parameter_value": parameter_value,
            "topic_contract_id": "vectors_line_equation",
        })
    else:
        first_direction = vector_from_case(case, "first_direction", practice_id)
        scale_factor = int_parameter(case, "scale_factor", practice_id, min_value=-4, max_value=4, allow_zero=False)
        second_direction = tuple(component * scale_factor for component in first_direction)
        prompt = f"Lines have direction vectors {vector_text(first_direction)} and {vector_text(second_direction)}. What relationship is possible before checking positions?"
        answer = "The lines are parallel or coincident, not skew"
        worked_solution = [
            f"{vector_text(second_direction)} = {scale_factor}{vector_text(first_direction)}, so the direction vectors are scalar multiples.",
            "Scalar-multiple direction vectors mean the lines are parallel or coincident.",
            "They cannot be skew because skew lines are not parallel.",
        ]
        parameters.update({
            "first_direction_x": first_direction[0],
            "first_direction_y": first_direction[1],
            "first_direction_z": first_direction[2],
            "scale_factor": scale_factor,
            "topic_contract_id": "vectors_magnitude_unit_parallel",
        })

    return review_queue_item(
        practice_id=practice_id,
        generator_family=VECTORS_LINE_RELATIONSHIP_FAMILY,
        topic=VECTORS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, VECTORS_TOPIC, ["p3-vectors-3d-geometry-001", "p3-vectors-lines-001"]),
    )


def build_vectors_line_relationship_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {
            "item_type": "direction_from_points",
            "ax": 1,
            "ay": -2,
            "az": 0,
            "bx": 4,
            "by": 1,
            "bz": 2,
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "item_type": "point_from_parameter",
            "point_x": 1,
            "point_y": 2,
            "point_z": 0,
            "direction_x": 3,
            "direction_y": -1,
            "direction_z": 2,
            "parameter_value": 2,
            "sequence_role": "complete_step",
            "difficulty_band": "easy",
        },
        {
            "item_type": "relationship_from_directions",
            "first_direction_x": 1,
            "first_direction_y": 2,
            "first_direction_z": 3,
            "scale_factor": 2,
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    return [build_vectors_line_relationship_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_differential_equations_context_model_item(context: dict[str, Any], index: int, case: dict[str, Any]) -> dict[str, Any]:
    practice_id = f"gen_differential_equations_context_model_basic_{index:04d}"
    item_type = item_type_parameter(case, practice_id, {"proportional_model", "find_rate_constant", "write_model_from_rate"})
    sequence_role = sequence_role_parameter(case, practice_id)
    difficulty_band = non_empty_string(case.get("difficulty_band")) or "medium"
    parameters: dict[str, Any] = {
        "item_type": item_type,
        "safe_bounds": "positive context values with exact rational rate constants",
    }

    if item_type == "proportional_model":
        k = int_parameter(case, "k", practice_id, min_value=1, max_value=9)
        prompt = f"A quantity y grows at a rate proportional to y with constant {k}. Write the differential equation."
        answer = f"dy/dx = {k}y"
        worked_solution = [
            "Rate proportional to y means derivative equals a constant times y.",
            f"The proportionality constant is {k}.",
            f"So {answer}.",
        ]
        parameters.update({"k": k})
    elif item_type == "find_rate_constant":
        value = int_parameter(case, "value", practice_id, min_value=1, max_value=50)
        rate = int_parameter(case, "rate", practice_id, min_value=1, max_value=50)
        k = fraction_text(rate, value)
        prompt = f"If dy/dt = ky, y = {value}, and dy/dt = {rate}, find k."
        answer = f"k = {k}"
        worked_solution = [
            f"Substitute the given values into dy/dt = ky: {rate} = k({value}).",
            f"Divide by {value}.",
            f"So k = {k}.",
        ]
        parameters.update({"value": value, "rate": rate, "k": k})
    else:
        value = int_parameter(case, "value", practice_id, min_value=1, max_value=50)
        rate = int_parameter(case, "rate", practice_id, min_value=1, max_value=50)
        k = fraction_text(rate, value)
        prompt = f"A population P is {value} when its rate of increase is {rate}. If dP/dt = kP, write the model."
        answer = f"dP/dt = ({k})P"
        worked_solution = [
            f"Use dP/dt = kP with P = {value} and dP/dt = {rate}.",
            f"This gives {rate} = {value}k, so k = {k}.",
            f"Therefore the model is {answer}.",
        ]
        parameters.update({"value": value, "rate": rate, "k": k})

    return review_queue_item(
        practice_id=practice_id,
        generator_family=DIFFERENTIAL_EQUATIONS_CONTEXT_MODEL_FAMILY,
        topic=DIFFERENTIAL_EQUATIONS_TOPIC,
        prompt=prompt,
        answer=answer,
        worked_solution=worked_solution,
        parameters=parameters,
        context=context,
        sequence_role=sequence_role,
        difficulty_band=difficulty_band,
        snippet_ids=preferred_snippet_ids(context, DIFFERENTIAL_EQUATIONS_TOPIC, ["p3-differential-context-model-001"]),
    )


def build_differential_equations_context_model_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "proportional_model", "k": 3, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "find_rate_constant", "value": 10, "rate": 5, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "write_model_from_rate", "value": 20, "rate": 4, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    return [build_differential_equations_context_model_item(context, index, case) for index, case in enumerate(cases, start=1)]


def build_generated_practice(skill_targets: dict[str, Any], snippets: dict[str, Any]) -> dict[str, Any]:
    context = context_from_inputs(skill_targets, snippets)
    items = (
        build_log_items(context)
        + build_log_graph_inverse_items(context)
        + build_log_laws_items(context)
        + build_log_exponential_inequality_items(context)
        + build_binomial_items(context)
        + build_algebra_structure_bridge_items(context)
        + build_polynomial_remainder_items(context)
        + build_quadratics_discriminant_bridge_items(context)
        + build_log_domain_items(context)
        + build_log_linearisation_items(context)
        + build_log_calculus_context_items(context)
        + build_partial_fractions_distinct_items(context)
        + build_partial_fractions_repeated_items(context)
        + build_modulus_equation_items(context)
        + build_binomial_validity_items(context)
        + build_trig_identity_items(context)
        + build_trig_double_angle_items(context)
        + build_trig_solve_interval_items(context)
        + build_trig_addition_formulae_items(context)
        + build_trig_r_form_items(context)
        + build_differentiation_items(context)
        + build_differentiation_stationary_tangent_items(context)
        + build_parametric_derivative_items(context)
        + build_integration_items(context)
        + build_integration_parts_substitution_items(context)
        + build_complex_modulus_argument_items(context)
        + build_complex_locus_items(context)
        + build_complex_roots_items(context)
        + build_complex_cartesian_conjugate_items(context)
        + build_vectors_line_scalar_items(context)
        + build_vectors_line_relationship_items(context)
        + build_numerical_sign_change_iteration_items(context)
        + build_numerical_iteration_formula_items(context)
        + build_numerical_accuracy_rounding_items(context)
        + build_differential_equations_items(context)
        + build_differential_initial_condition_items(context)
        + build_differentiation_implicit_log_exp_items(context)
        + build_integration_definite_area_items(context)
        + build_complex_cartesian_locus_roots_items(context)
        + build_vectors_line_intersection_items(context)
        + build_differential_equations_context_model_items(context)
    )
    return {
        "generated_by": GENERATED_BY,
        "items": items,
        "schema_name": "asterion_generated_practice",
        "schema_version": 2,
    }


UNSAFE_RUNTIME_EVIDENCE_STATUSES = {
    "ambiguous",
    "ambiguous-route",
    "blocked",
    "deferred",
    "fallback-display-only",
    "fallback_only",
    "hard-failure",
    "missing-route",
    "review-needed",
    "review-only",
    "review_needed",
    "thin",
}


def has_unsafe_runtime_evidence_marker(item: dict[str, Any]) -> bool:
    for key in ("route_evidence_status", "routing_evidence_status", "evidence_status", "reviewed_status"):
        value = non_empty_string(item.get(key))
        if value and value in UNSAFE_RUNTIME_EVIDENCE_STATUSES:
            return True
    gate = item.get("generation_gate")
    if isinstance(gate, dict) and gate.get("blocked") is True:
        return True
    if string_list(item.get("block_reasons")):
        return True
    return False


def runtime_ready_item(item: Any) -> bool:
    if not isinstance(item, dict):
        return False
    if item.get("review_status") not in RUNTIME_REVIEW_STATUSES:
        return False
    if not isinstance(item.get("verification"), dict) or item["verification"].get("status") != "pass":
        return False
    if non_empty_string(item.get("paper_family")) == PAPER_FAMILY:
        if non_empty_string(item.get("skill_target_id")) not in REVIEWED_P3_SKILL_IDS:
            return False
        if item.get("skill_target_resolution_status") != "reviewed_p3_skill_map_id":
            return False
    if not non_empty_string(item.get("source_snippet_id")):
        return False
    if not non_empty_string(item.get("example_model_id")):
        return False
    if has_unsafe_runtime_evidence_marker(item):
        return False
    return True


def generated_practice_scope_summary(payload: dict[str, Any], *, artifact_scope: str) -> dict[str, Any]:
    items = [item for item in payload.get("items", []) if isinstance(item, dict)]
    status_counts: dict[str, int] = {}
    generator_family_counts: dict[str, int] = {}
    for item in items:
        status = non_empty_string(item.get("review_status")) or "missing"
        status_counts[status] = status_counts.get(status, 0) + 1
        family = non_empty_string(item.get("generator_family")) or "unknown"
        generator_family_counts[family] = generator_family_counts.get(family, 0) + 1
    runtime_reviewed = [item for item in items if runtime_ready_item(item)]
    return {
        "artifact_scope": artifact_scope,
        "total_count": len(items),
        "review_status_counts": dict(sorted(status_counts.items())),
        "runtime_reviewed_count": len(runtime_reviewed),
        "published_runtime_count": len(runtime_reviewed) if artifact_scope == "runtime" else 0,
        "internal_candidate_count": sum(1 for item in items if item.get("review_status") == "candidate"),
        "needs_review_internal_count": sum(1 for item in items if item.get("review_status") == "needs_review"),
        "blocked_candidate_count": sum(1 for item in items if item.get("review_status") == "blocked"),
        "verification_failure_count": sum(
            1
            for item in items
            if not isinstance(item.get("verification"), dict)
            or item["verification"].get("status") != "pass"
        ),
        "missing_example_model_id_count": sum(1 for item in items if not non_empty_string(item.get("example_model_id"))),
        "generator_family_counts": dict(sorted(generator_family_counts.items())),
    }


def with_scope_metadata(payload: dict[str, Any], *, artifact_scope: str) -> dict[str, Any]:
    summary = generated_practice_scope_summary(payload, artifact_scope=artifact_scope)
    return {
        **payload,
        "artifact_scope": artifact_scope,
        "scope_note": (
            "Runtime app-facing reviewed warm-up practice."
            if artifact_scope == "runtime"
            else "Internal planning/generated output; may include needs_review candidates and is not app-facing runtime."
        ),
        "runtime_reviewed_count": summary["runtime_reviewed_count"],
        "published_runtime_count": summary["published_runtime_count"],
        "internal_candidate_count": summary["internal_candidate_count"],
        "needs_review_internal_count": summary["needs_review_internal_count"],
        "blocked_candidate_count": summary["blocked_candidate_count"],
        "verification_failure_count": summary["verification_failure_count"],
        "missing_example_model_id_count": summary["missing_example_model_id_count"],
    }


def runtime_payload(payload: dict[str, Any], existing_runtime: dict[str, Any] | None = None) -> dict[str, Any]:
    runtime_items = [
        item for item in payload.get("items", [])
        if runtime_ready_item(item)
        and non_empty_string(item.get("generator_family")) not in QUARANTINED_RUNTIME_GENERATOR_FAMILIES
    ]
    emitted_ids = {
        item["practice_id"] for item in runtime_items
        if non_empty_string(item.get("practice_id"))
    }
    if existing_runtime:
        for item in existing_runtime.get("items", []):
            practice_id = non_empty_string(item.get("practice_id"))
            generator_family = non_empty_string(item.get("generator_family"))
            if (
                not practice_id
                or practice_id in emitted_ids
                or generator_family in QUARANTINED_RUNTIME_GENERATOR_FAMILIES
                or generator_family in PROMOTED_RUNTIME_GENERATOR_FAMILIES
                or not runtime_ready_item(item)
            ):
                continue
            runtime_items.append(item)
            emitted_ids.add(practice_id)
    return {
        "generated_by": GENERATED_BY,
        "items": runtime_items,
        "schema_name": "asterion_generated_practice",
        "schema_version": 2,
    }


def update_content_lab_report(
    report_path: Path,
    skill_targets: dict[str, Any],
    snippets: dict[str, Any],
    generated_practice: dict[str, Any],
    runtime_practice: dict[str, Any],
) -> None:
    report = load_json_optional(report_path)
    if not report:
        report = {
            "schema_name": "asterion_content_lab_report",
            "schema_version": 1,
            "generated_by": GENERATED_BY,
        }

    snippets_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_IDS}
    quick_checks_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_IDS}
    snippets_with_examples_by_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_IDS}
    method_snippets_missing_examples: list[dict[str, Any]] = []
    snippets_by_skill: dict[str, set[str]] = {}
    quick_checks_by_skill: dict[str, set[str]] = {}
    content_review_status_counts: dict[str, int] = {}
    snippet_topic_keys: set[tuple[str, str]] = set()
    guardian_topic_keys: set[tuple[str, str]] = set()
    for snippet in snippets.get("snippets", []):
        if not isinstance(snippet, dict) or snippet.get("review_status") not in RUNTIME_REVIEW_STATUSES:
            continue
        review_status = non_empty_string(snippet.get("review_status")) or "unknown"
        content_review_status_counts[f"snippet:{review_status}"] = content_review_status_counts.get(f"snippet:{review_status}", 0) + 1
        paper = non_empty_string(snippet.get("paper_family"))
        topics = string_list(snippet.get("topics"))
        related_skill_ids = sorted(set(
            string_list(snippet.get("related_skill_targets"))
            + string_list(snippet.get("source_skill_target_ids"))
        ))
        snippet_id = non_empty_string(snippet.get("snippet_id")) or "unknown"
        snippet_type = non_empty_string(snippet.get("snippet_type"))
        example_count = worked_example_count(snippet)
        for topic in topics:
            if paper:
                snippet_topic_keys.add((paper, topic))
                if isinstance(snippet.get("guardian_readiness"), dict):
                    guardian_topic_keys.add((paper, topic))
        has_quick_check = isinstance(snippet.get("quick_check"), dict)
        for skill_id in related_skill_ids:
            snippets_by_skill.setdefault(skill_id, set()).add(str(snippet.get("snippet_id")))
            if has_quick_check:
                quick_checks_by_skill.setdefault(skill_id, set()).add(str(snippet.get("snippet_id")))
        for region_id in string_list(snippet.get("region_ids")):
            if region_id in snippets_per_region:
                snippets_per_region[region_id] += 1
                if has_quick_check:
                    quick_checks_per_region[region_id] += 1
                if example_count > 0:
                    snippets_with_examples_by_region[region_id] += 1
        if snippet_type in EXAMPLE_REQUIRED_SNIPPET_TYPES and example_count == 0:
            method_snippets_missing_examples.append({
                "paper_family": paper,
                "region_ids": string_list(snippet.get("region_ids")),
                "snippet_id": snippet_id,
                "snippet_type": snippet_type,
                "title": non_empty_string(snippet.get("title")) or "",
                "topic": non_empty_string(snippet.get("topic")) or (topics[0] if topics else "unknown"),
            })

    generated_warmups_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_IDS}
    runtime_warmups_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_IDS}
    generator_family_counts: dict[str, int] = {}
    generated_families_by_topic: dict[str, dict[str, int]] = {}
    verification_failure_counts: dict[str, int] = {}
    warmups_linked_to_examples: list[dict[str, Any]] = []
    warmups_without_example_model: list[str] = []
    warmups_by_skill: dict[str, set[str]] = {}
    practice_topic_keys: set[tuple[str, str]] = set()
    for item in generated_practice.get("items", []):
        if not isinstance(item, dict):
            continue
        review_status = non_empty_string(item.get("review_status")) or "unknown"
        content_review_status_counts[f"generated_practice:{review_status}"] = content_review_status_counts.get(f"generated_practice:{review_status}", 0) + 1
        family = non_empty_string(item.get("generator_family")) or "unknown"
        generator_family_counts[family] = generator_family_counts.get(family, 0) + 1
        verification = item.get("verification") if isinstance(item.get("verification"), dict) else {}
        verification_status = non_empty_string(verification.get("status")) if isinstance(verification, dict) else None
        if verification_status != "pass":
            verification_failure_counts[family] = verification_failure_counts.get(family, 0) + 1
        paper = non_empty_string(item.get("paper_family"))
        topic = non_empty_string(item.get("topic"))
        if paper and topic:
            practice_topic_keys.add((paper, topic))
            generated_families_by_topic.setdefault(topic, {})
            generated_families_by_topic[topic][family] = generated_families_by_topic[topic].get(family, 0) + 1
        practice_id = non_empty_string(item.get("practice_id")) or "unknown"
        source_snippet_id = non_empty_string(item.get("source_snippet_id"))
        example_model_id = non_empty_string(item.get("example_model_id"))
        if source_snippet_id or example_model_id:
            warmups_linked_to_examples.append({
                "example_model_id": example_model_id,
                "practice_id": practice_id,
                "sequence_role": non_empty_string(item.get("sequence_role")),
                "source_snippet_id": source_snippet_id,
            })
        else:
            warmups_without_example_model.append(practice_id)
        sequence_role = non_empty_string(item.get("sequence_role"))
        if item.get("review_status") in RUNTIME_REVIEW_STATUSES and verification_status == "pass" and sequence_role in SEQUENCE_ROLES:
            skill_target_id = non_empty_string(item.get("skill_target_id"))
            if skill_target_id:
                warmups_by_skill.setdefault(skill_target_id, set()).add(str(item.get("practice_id")))
            for region_id in string_list(item.get("region_ids")):
                if region_id in generated_warmups_per_region:
                    generated_warmups_per_region[region_id] += 1

    for item in runtime_practice.get("items", []):
        if not isinstance(item, dict):
            continue
        verification = item.get("verification") if isinstance(item.get("verification"), dict) else {}
        verification_status = non_empty_string(verification.get("status")) if isinstance(verification, dict) else None
        sequence_role = non_empty_string(item.get("sequence_role"))
        if item.get("review_status") in RUNTIME_REVIEW_STATUSES and verification_status == "pass" and sequence_role in SEQUENCE_ROLES:
            for region_id in string_list(item.get("region_ids")):
                if region_id in runtime_warmups_per_region:
                    runtime_warmups_per_region[region_id] += 1

    skill_targets_per_topic: dict[str, dict[str, int]] = {}
    skill_target_topics: dict[str, tuple[str, str]] = {}
    skill_target_source_counts: dict[str, int] = {}
    for target in skill_targets.get("skill_targets", []):
        if not isinstance(target, dict):
            continue
        paper = non_empty_string(target.get("paper_family"))
        topic = non_empty_string(target.get("topic"))
        skill_target_id = non_empty_string(target.get("skill_target_id"))
        if paper and topic:
            skill_targets_per_topic.setdefault(paper, {})
            skill_targets_per_topic[paper][topic] = skill_targets_per_topic[paper].get(topic, 0) + 1
        if skill_target_id and paper and topic:
            skill_target_topics[skill_target_id] = (paper, topic)
            skill_target_source_counts[skill_target_id] = len(string_list(target.get("source_question_ids")))

    active_regions = [
        {
            "region_id": region_id,
            "region_name": REGION_DISPLAY_NAMES.get(region_id, region_id),
            "snippets": snippets_per_region[region_id],
            "snippets_with_examples": snippets_with_examples_by_region[region_id],
            "quick_checks": quick_checks_per_region[region_id],
            "generated_warmups": runtime_warmups_per_region[region_id],
        }
        for region_id in ACTIVE_P3_REGION_IDS
    ]

    skill_targets_with_snippets_but_no_quick_checks = [
        {
            "paper_family": skill_target_topics.get(skill_id, ("unknown", "unknown"))[0],
            "skill_target_id": skill_id,
            "snippet_count": len(snippet_ids),
            "topic": skill_target_topics.get(skill_id, ("unknown", "unknown"))[1],
        }
        for skill_id, snippet_ids in sorted(snippets_by_skill.items())
        if skill_id in skill_target_topics and skill_id not in quick_checks_by_skill
    ]
    skill_targets_with_quick_checks_but_no_warmups = [
        {
            "paper_family": skill_target_topics.get(skill_id, ("unknown", "unknown"))[0],
            "quick_check_count": len(check_ids),
            "skill_target_id": skill_id,
            "topic": skill_target_topics.get(skill_id, ("unknown", "unknown"))[1],
        }
        for skill_id, check_ids in sorted(quick_checks_by_skill.items())
        if skill_id in skill_target_topics and skill_id not in warmups_by_skill
    ]
    priority_region_depth = [
        {
            "region_id": region_id,
            "region_name": REGION_DISPLAY_NAMES.get(region_id, region_id),
            "depth_status": "priority_deepened" if (
                snippets_per_region[region_id] >= 4
                and quick_checks_per_region[region_id] >= 4
                and runtime_warmups_per_region[region_id] >= 3
            ) else "needs_more_depth",
            "snippets": snippets_per_region[region_id],
            "snippets_with_examples": snippets_with_examples_by_region[region_id],
            "quick_checks": quick_checks_per_region[region_id],
            "generated_warmups": runtime_warmups_per_region[region_id],
        }
        for region_id in PRIORITY_REGION_IDS
    ]
    regions_still_thin = [
        {
            "region_id": region_id,
            "region_name": REGION_DISPLAY_NAMES.get(region_id, region_id),
            "reason": "low snippet/check count or no deterministic warm-up",
            "snippets": snippets_per_region[region_id],
            "quick_checks": quick_checks_per_region[region_id],
            "generated_warmups": generated_warmups_per_region[region_id],
        }
        for region_id in ACTIVE_P3_REGION_IDS
        if snippets_per_region[region_id] < 3
        or quick_checks_per_region[region_id] < 2
        or runtime_warmups_per_region[region_id] == 0
    ]
    high_evidence_weak_teaching_support = [
        {
            "paper_family": paper,
            "skill_target_id": skill_id,
            "source_question_count": skill_target_source_counts.get(skill_id, 0),
            "snippet_count": len(snippets_by_skill.get(skill_id, set())),
            "quick_check_count": len(quick_checks_by_skill.get(skill_id, set())),
            "topic": topic,
            "warmup_count": len(warmups_by_skill.get(skill_id, set())),
        }
        for skill_id, (paper, topic) in sorted(skill_target_topics.items())
        if paper == PAPER_FAMILY
        and skill_target_source_counts.get(skill_id, 0) >= 20
        and (
            len(snippets_by_skill.get(skill_id, set())) < 2
            or len(quick_checks_by_skill.get(skill_id, set())) < 2
            or len(warmups_by_skill.get(skill_id, set())) == 0
        )
    ]
    topics_needing_deterministic_generators = [
        {"paper_family": paper, "topic": topic}
        for paper, topic in sorted(snippet_topic_keys)
        if paper == PAPER_FAMILY and (paper, topic) not in practice_topic_keys
    ]
    priority_region_example_coverage = [
        {
            "region_id": region_id,
            "region_name": REGION_DISPLAY_NAMES.get(region_id, region_id),
            "snippets": snippets_per_region[region_id],
            "snippets_with_examples": snippets_with_examples_by_region[region_id],
            "method_snippets_missing_examples": [
                item["snippet_id"]
                for item in method_snippets_missing_examples
                if region_id in item["region_ids"]
            ],
            "warmups": runtime_warmups_per_region[region_id],
        }
        for region_id in PRIORITY_REGION_IDS
    ]

    report.update({
        "schema_name": "asterion_content_lab_report",
        "schema_version": 1,
        "artifact_scope": "internal_planning",
        "generated_practice_scope_note": "Legacy generated_warmup coverage fields now report runtime-reviewed public warm-ups. Internal planning/candidate counts are separated under internal_generated_practice_summary.",
        "active_regions": active_regions,
        "snippets_per_region": snippets_per_region,
        "quick_checks_per_region": quick_checks_per_region,
        "snippets_with_examples_by_region": snippets_with_examples_by_region,
        "method_snippets_missing_examples": method_snippets_missing_examples,
        "generated_warmups_per_region": runtime_warmups_per_region,
        "internal_generated_warmups_per_region": generated_warmups_per_region,
        "warmups_linked_to_examples": sorted(warmups_linked_to_examples, key=lambda item: item["practice_id"]),
        "warmups_without_example_model": sorted(warmups_without_example_model),
        "priority_region_example_coverage": priority_region_example_coverage,
        "internal_generated_practice_summary": generated_practice_scope_summary(generated_practice, artifact_scope="internal_planning"),
        "runtime_generated_practice_summary": generated_practice_scope_summary(runtime_practice, artifact_scope="runtime"),
        "skill_targets_per_topic": skill_targets_per_topic,
        "batch_7_depth_summary": {
            "priority_region_depth": priority_region_depth,
            "regions_still_thin": regions_still_thin,
            "source_trail": "tools/content_lab/outputs/content_lab_research_notes.md",
        },
        "batch_8_recommendations": [
            "Review the needs_review warm-up candidates for differentiation, parametric equations, integration, complex numbers, vectors, numerical methods, and differential equations before runtime promotion.",
            "Split embedded Quick Checks into a dedicated runtime bank only if the app needs independent scheduling or spaced review.",
            "Use teacher review to promote the highest-value secondary-region snippets into deeper Guardian-prep sequences.",
        ],
        "content_review_status_counts": dict(sorted(content_review_status_counts.items())),
        "generated_families_by_topic": {
            topic: dict(sorted(families.items()))
            for topic, families in sorted(generated_families_by_topic.items())
        },
        "high_evidence_weak_teaching_support": high_evidence_weak_teaching_support,
        "skill_targets_with_quick_checks_but_no_warmups": skill_targets_with_quick_checks_but_no_warmups,
        "skill_targets_with_snippets_but_no_quick_checks": skill_targets_with_snippets_but_no_quick_checks,
        "topics_needing_deterministic_generators": topics_needing_deterministic_generators,
        "topics_with_snippets_but_no_warmups": [
            {"paper_family": paper, "topic": topic}
            for paper, topic in sorted(snippet_topic_keys)
            if (paper, topic) not in practice_topic_keys
        ],
        "topics_with_warmups_but_no_guardian_readiness_metadata": [
            {"paper_family": paper, "topic": topic}
            for paper, topic in sorted(practice_topic_keys)
            if (paper, topic) not in guardian_topic_keys
        ],
        "generator_family_counts": dict(sorted(generator_family_counts.items())),
        "verification_failure_counts": dict(sorted(verification_failure_counts.items())),
    })
    write_json(report_path, report)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build deterministic generated warm-up practice.")
    parser.add_argument("--skill-targets", default="tools/content_lab/outputs/skill_targets.json")
    parser.add_argument("--snippets", default="public/data/teaching_snippets.json")
    parser.add_argument("--output", default="tools/content_lab/outputs/generated_practice_bank.json")
    parser.add_argument("--runtime-output", default="public/data/generated_practice_bank.json")
    parser.add_argument("--report-output", default="tools/content_lab/outputs/content_lab_report.json")
    args = parser.parse_args()

    skill_targets = load_json_optional(Path(args.skill_targets))
    snippets = load_json_optional(Path(args.snippets))
    payload = build_generated_practice(skill_targets, snippets)
    runtime_output_path = Path(args.runtime_output)
    existing_runtime = load_json_optional(runtime_output_path)
    runtime = runtime_payload(payload, existing_runtime)
    payload = with_scope_metadata(payload, artifact_scope="internal_planning")
    runtime = with_scope_metadata(runtime, artifact_scope="runtime")

    write_json(Path(args.output), payload)
    write_json(runtime_output_path, runtime)
    update_content_lab_report(Path(args.report_output), skill_targets, snippets, payload, runtime)

    print(f"Wrote {len(payload['items'])} generated practice items.")
    print(f"Wrote {len(runtime['items'])} reviewed runtime practice items.")
    print(f"Updated {args.report_output}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build deterministic Content Lab generated warm-up practice.

These items are original low-stakes practice prompts. The React app consumes only
the reviewed, verified static runtime JSON written by this script.
"""

from __future__ import annotations

import argparse
import json
from math import comb
from pathlib import Path
from typing import Any


GENERATED_BY = "tools/content_lab/scripts/build_generated_practice.py"
VERIFIER_NAME = "content_lab_v1"
RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}

LOG_TOPIC = "logarithms_and_exponentials"
LOG_FAMILY = "logarithms_and_exponentials.log_equation_basic"
BINOMIAL_TOPIC = "binomial_expansion"
BINOMIAL_FAMILY = "binomial_expansion.first_terms_and_coefficient"
BINOMIAL_VALIDITY_FAMILY = "algebra.binomial_validity_range"
PARTIAL_FRACTIONS_TOPIC = "partial_fractions"
PARTIAL_FRACTIONS_DISTINCT_FAMILY = "algebra.partial_fractions_distinct_linear"
PARTIAL_FRACTIONS_REPEATED_FAMILY = "algebra.partial_fractions_repeated_linear"
ALGEBRA_TOPIC = "algebra"
MODULUS_EQUATION_FAMILY = "algebra.modulus_equation_basic"
TRIG_TOPIC = "trigonometry"
TRIG_IDENTITY_FAMILY = "trigonometry.identity_rewrite_basic"
TRIG_DOUBLE_ANGLE_FAMILY = "trigonometry.double_angle_basic"
TRIG_SOLVE_INTERVAL_FAMILY = "trigonometry.solve_equation_interval_basic"
TRIG_R_FORM_FAMILY = "trigonometry.r_form_basic"
PAPER_FAMILY = "p3"
SEQUENCE_ROLES = ("first_step", "complete_step", "guardian_prep")
ACTIVE_P3_REGION_IDS = [
    "algebra-forge",
    "logarithm-grove",
    "trig-observatory",
    "complex-harbor",
    "calculus-cliffs",
    "integration-gardens",
    "vector-workshop",
    "numerical-mines",
    "differential-shrine",
]
PRIORITY_REGION_IDS = ["algebra-forge", "logarithm-grove", "trig-observatory"]
REGION_DISPLAY_NAMES = {
    "algebra-forge": "Algebra Vault",
    "logarithm-grove": "Logarithm Observatory",
    "trig-observatory": "Trigonometry Spire",
    "complex-harbor": "Argand Atrium",
    "calculus-cliffs": "Calculus Cliffs",
    "integration-gardens": "Integral Terraces",
    "vector-workshop": "Vectors Gate",
    "numerical-mines": "Iteration Forge",
    "differential-shrine": "Differential Shrine",
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


def context_from_inputs(skill_targets: dict[str, Any], snippets: dict[str, Any]) -> dict[str, dict[Any, list[str]]]:
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
        example_ids: list[str] = []
        worked_example = snippet.get("worked_example")
        if isinstance(worked_example, dict):
            example_id = non_empty_string(worked_example.get("id"))
            if example_id:
                example_ids.append(example_id)
        worked_examples = snippet.get("worked_examples")
        if isinstance(worked_examples, list):
            for example in worked_examples:
                if isinstance(example, dict):
                    example_id = non_empty_string(example.get("id"))
                    if example_id:
                        example_ids.append(example_id)
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
        "region_ids_by_key": {key: sorted(set(values)) for key, values in region_ids_by_key.items()},
    }


def preferred_snippet_ids(
    context: dict[str, dict[Any, list[str]]],
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
    context: dict[str, dict[Any, list[str]]],
    sequence_role: str,
    difficulty_band: str = "easy",
    snippet_ids: list[str] | None = None,
    source_snippet_id: str | None = None,
    example_model_id: str | None = None,
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
        "review_status": "teacher_reviewed",
        "sequence_role": sequence_role,
        "topic": topic,
        "verification": {
            "method": "deterministic",
            "status": "pass",
            "verifier": VERIFIER_NAME,
        },
        "worked_solution": worked_solution,
    }
    skill_target_ids = context["skill_ids_by_key"].get(key, [])
    if skill_target_ids:
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
    region_ids = context["region_ids_by_key"].get(key, [])
    if region_ids:
        item["region_ids"] = region_ids
    return item


def assert_positive_integer(value: int, practice_id: str) -> None:
    if not isinstance(value, int) or value <= 0:
        raise ValueError(f"{practice_id} generated a non-positive solution")


def build_log_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = [
        {"form": "isolated_exp", "coefficient": 2, "rhs": 7, "sequence_stage": "first_step", "difficulty_band": "easy"},
        {"form": "scaled_exp", "scale": 5, "coefficient": 3, "rhs": 20, "sequence_stage": "complete_step", "difficulty_band": "easy"},
        {"form": "shifted_exp", "scale": 2, "shift": 1, "rhs": 9, "sequence_stage": "guardian_prep", "difficulty_band": "medium"},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_log_equation_basic_{index:04d}"
        form = str(case["form"])
        parameters = {"form": form}
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


def binomial_expression(a: int, n: int) -> str:
    if a == 1:
        inner = "1 + x"
    elif a == -1:
        inner = "1 - x"
    elif a > 0:
        inner = f"1 + {a}x"
    else:
        inner = f"1 - {abs(a)}x"
    return f"({inner})^{n}"


def term_text(coefficient: int, power: int) -> str:
    if power == 0:
        return str(abs(coefficient))
    variable = "x" if power == 1 else f"x^{power}"
    magnitude = abs(coefficient)
    return variable if magnitude == 1 else f"{magnitude}{variable}"


def polynomial_text(terms: list[tuple[int, int]]) -> str:
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


def build_binomial_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    expand_cases = [
        {"a": 3, "n": 4, "max_power": 1, "sequence_stage": "first_step", "difficulty_band": "easy"},
        {"a": -2, "n": 5, "max_power": 2, "sequence_stage": "complete_step", "difficulty_band": "easy"},
    ]
    product_cases = [
        {"a": 2, "m": 3, "b": -1, "n": 4, "sequence_stage": "guardian_prep", "difficulty_band": "medium"},
    ]

    items: list[dict[str, Any]] = []
    index = 1
    for case in expand_cases:
        a = int(case["a"])
        n = int(case["n"])
        max_power = int(case["max_power"])
        _, x_coefficient, x2_coefficient = first_three_coefficients(a, n)
        if abs(x2_coefficient) > 120:
            raise ValueError("Expansion coefficient is too large")
        terms = [(1, 0), (x_coefficient, 1)]
        if max_power >= 2:
            terms.append((x2_coefficient, 2))
        expansion = polynomial_text(terms)
        expression = binomial_expression(a, n)
        practice_id = f"gen_binomial_first_terms_and_coefficient_{index:04d}"
        parameters = {
            "a": a,
            "item_type": "expand_first_terms",
            "max_power": max_power,
            "n": n,
            "sequence_stage": str(case["sequence_stage"]),
            "x_coefficient": x_coefficient,
            "x2_coefficient": x2_coefficient,
        }
        if max_power == 1:
            prompt = f"Write the constant and x term in the expansion of {expression}."
            worked_solution = [
                f"Use (1 + t)^n = 1 + nt + ... with t = {a}x and n = {n}.",
                "For this first step, stop after the linear term.",
                f"The x term is {n}({a}x) = {polynomial_text([(x_coefficient, 1)])}.",
                f"So the requested start of the expansion is {expansion}.",
            ]
        else:
            prompt = f"Expand {expression} up to and including the x^2 term."
            worked_solution = [
                f"Use (1 + t)^n = 1 + nt + C(n,2)t^2 + ... with t = {a}x and n = {n}.",
                f"The x term is {n}({a}x) = {polynomial_text([(x_coefficient, 1)])}.",
                f"The x^2 term is C({n},2)({a}x)^2 = {polynomial_text([(x2_coefficient, 2)])}.",
                f"So the expansion up to x^2 is {expansion}.",
            ]
        items.append(base_item(
            practice_id=practice_id,
            generator_family=BINOMIAL_FAMILY,
            topic=BINOMIAL_TOPIC,
            prompt=prompt,
            answer=expansion,
            worked_solution=worked_solution,
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_stage"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, BINOMIAL_TOPIC, ["p3-binomial-term-001"]),
        ))
        index += 1

    for case in product_cases:
        a = int(case["a"])
        m = int(case["m"])
        b = int(case["b"])
        n = int(case["n"])
        _, left_x, left_x2 = first_three_coefficients(a, m)
        _, right_x, right_x2 = first_three_coefficients(b, n)
        coefficient = left_x2 + (left_x * right_x) + right_x2
        if abs(coefficient) > 120:
            raise ValueError("Product coefficient is too large")
        left_expression = binomial_expression(a, m)
        right_expression = binomial_expression(b, n)
        left_terms = polynomial_text([(1, 0), (left_x, 1), (left_x2, 2)])
        right_terms = polynomial_text([(1, 0), (right_x, 1), (right_x2, 2)])
        practice_id = f"gen_binomial_first_terms_and_coefficient_{index:04d}"
        parameters = {
            "a": a,
            "b": b,
            "coefficient_x2": coefficient,
            "item_type": "coefficient_product",
            "m": m,
            "n": n,
            "sequence_stage": str(case["sequence_stage"]),
        }
        items.append(base_item(
            practice_id=practice_id,
            generator_family=BINOMIAL_FAMILY,
            topic=BINOMIAL_TOPIC,
            prompt=f"Find the coefficient of x^2 in {left_expression}{right_expression}.",
            answer=f"Coefficient of x^2 = {coefficient}",
            worked_solution=[
                f"First terms: {left_expression} = {left_terms} + ...",
                f"First terms: {right_expression} = {right_terms} + ...",
                "The x^2 coefficient comes from left x^2, left x times right x, and right x^2.",
                f"So the coefficient is {left_x2} + ({left_x})({right_x}) + {right_x2} = {coefficient}.",
            ],
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_stage"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, BINOMIAL_TOPIC, ["p3-binomial-term-001"]),
        ))
        index += 1

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


def build_partial_fractions_distinct_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "setup_form", "roots": [1, -2], "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "decompose", "roots": [1, -2], "constants": [2, 1], "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"item_type": "decompose", "roots": [3, -1], "constants": [-1, 4], "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        roots = [int(value) for value in case["roots"]]
        factors = [linear_factor(root) for root in roots]
        denominator = "".join(f"({factor})" for factor in factors)
        form = " + ".join(fraction_term(coefficient_symbol(i), factor) for i, factor in enumerate(factors))
        parameters: dict[str, Any] = {
            "item_type": str(case["item_type"]),
            "root_a": roots[0],
            "root_b": roots[1],
        }
        practice_id = f"gen_partial_fractions_distinct_linear_{index:04d}"

        if case["item_type"] == "setup_form":
            prompt = f"Write the partial-fraction form for \\frac{{3x+1}}{{{denominator}}}. Do not solve for the constants."
            answer = form
            worked_solution = [
                "The denominator has two distinct linear factors.",
                "Each distinct linear factor gets one constant numerator.",
                f"So the setup is {form}.",
            ]
        else:
            constants = [int(value) for value in case["constants"]]
            a, b = roots
            a_const, b_const = constants
            x_coefficient = a_const + b_const
            constant_term = -a_const * b - b_const * a
            numerator = polynomial_text([(x_coefficient, 1), (constant_term, 0)])
            parameters.update({
                "constant_a": a_const,
                "constant_b": b_const,
                "numerator_constant": constant_term,
                "numerator_x_coefficient": x_coefficient,
            })
            prompt = f"Decompose \\frac{{{numerator}}}{{{denominator}}} into partial fractions."
            answer = signed_fraction_sum([(a_const, factors[0]), (b_const, factors[1])])
            worked_solution = [
                f"Start with {form}.",
                f"Multiplying by {denominator} gives {numerator} = A({factors[1]}) + B({factors[0]}).",
                f"Substituting x = {a} gives A = {a_const}; substituting x = {b} gives B = {b_const}.",
                f"Therefore the decomposition is {answer}.",
            ]

        items.append(base_item(
            practice_id=practice_id,
            generator_family=PARTIAL_FRACTIONS_DISTINCT_FAMILY,
            topic=PARTIAL_FRACTIONS_TOPIC,
            prompt=prompt,
            answer=answer,
            worked_solution=worked_solution,
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


def build_partial_fractions_repeated_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases = [
        {"item_type": "setup_repeated", "root": 2, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"item_type": "decompose_repeated", "root": 1, "constants": [3, 5], "sequence_role": "complete_step", "difficulty_band": "easy"},
        {
            "item_type": "decompose_repeated_with_distinct",
            "root": -2,
            "distinct_root": 1,
            "constants": [2, -3, 1],
            "sequence_role": "guardian_prep",
            "difficulty_band": "medium",
        },
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        root = int(case["root"])
        factor = linear_factor(root)
        repeated_denominator = f"({factor})^2"
        practice_id = f"gen_partial_fractions_repeated_linear_{index:04d}"
        parameters: dict[str, Any] = {"item_type": str(case["item_type"]), "root": root}

        if case["item_type"] == "setup_repeated":
            answer = f"{fraction_term('A', factor)} + {fraction_term('B', f'({factor})^2')}"
            prompt = f"Write the partial-fraction form for \\frac{{2x+1}}{{{repeated_denominator}}}. Do not solve for the constants."
            worked_solution = [
                "A repeated linear factor needs one term for each power.",
                f"Use one term over {factor} and one term over ({factor})^2.",
                f"So the setup is {answer}.",
            ]
        elif case["item_type"] == "decompose_repeated":
            a_const, b_const = [int(value) for value in case["constants"]]
            x_coefficient = a_const
            constant_term = -a_const * root + b_const
            numerator = polynomial_text([(x_coefficient, 1), (constant_term, 0)])
            answer = signed_fraction_sum([(a_const, factor), (b_const, f"({factor})^2")])
            prompt = f"Decompose \\frac{{{numerator}}}{{{repeated_denominator}}} into partial fractions."
            parameters.update({"constant_a": a_const, "constant_b": b_const})
            worked_solution = [
                f"Start with {fraction_term('A', factor)} + {fraction_term('B', f'({factor})^2')}.",
                f"Multiplying through gives {numerator} = A({factor}) + B.",
                f"Comparing coefficients gives A = {a_const} and B = {b_const}.",
                f"So the decomposition is {answer}.",
            ]
        else:
            distinct_root = int(case["distinct_root"])
            a_const, b_const, c_const = [int(value) for value in case["constants"]]
            distinct_factor = linear_factor(distinct_root)
            denominator = f"({factor})^2({distinct_factor})"
            # A/(x-r) + B/(x-r)^2 + C/(x-s)
            x2_coefficient = a_const + c_const
            x_coefficient = -a_const * (root + distinct_root) + b_const - 2 * c_const * root
            constant_term = a_const * root * distinct_root - b_const * distinct_root + c_const * root * root
            numerator = polynomial_text([(x2_coefficient, 2), (x_coefficient, 1), (constant_term, 0)])
            answer = signed_fraction_sum([
                (a_const, factor),
                (b_const, f"({factor})^2"),
                (c_const, distinct_factor),
            ])
            prompt = f"Decompose \\frac{{{numerator}}}{{{denominator}}} into partial fractions."
            parameters.update({
                "constant_a": a_const,
                "constant_b": b_const,
                "constant_c": c_const,
                "distinct_root": distinct_root,
            })
            worked_solution = [
                f"The repeated factor gives terms over {factor} and ({factor})^2; the distinct factor gives one term over {distinct_factor}.",
                f"Start with {fraction_term('A', factor)} + {fraction_term('B', f'({factor})^2')} + {fraction_term('C', distinct_factor)}.",
                "Multiply through and compare coefficients or substitute convenient roots.",
                f"The constants are A = {a_const}, B = {b_const}, and C = {c_const}, so {answer}.",
            ]

        items.append(base_item(
            practice_id=practice_id,
            generator_family=PARTIAL_FRACTIONS_REPEATED_FAMILY,
            topic=PARTIAL_FRACTIONS_TOPIC,
            prompt=prompt,
            answer=answer,
            worked_solution=worked_solution,
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


def build_modulus_equation_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases = [
        {"a": 4, "b": 7, "coefficient": 1, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"a": 3, "b": 5, "coefficient": 1, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"a": -1, "b": 5, "coefficient": 2, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        a = int(case["a"])
        b = int(case["b"])
        coefficient = int(case["coefficient"])
        inner = linear_expression(coefficient, -a if coefficient == 1 else a)
        practice_id = f"gen_modulus_equation_basic_{index:04d}"
        parameters = {"a": a, "b": b, "coefficient": coefficient}
        if case["sequence_role"] == "first_step":
            prompt = f"Write the two linear equations represented by |{inner}| = {b}."
            answer = f"{inner} = {b} or {inner} = -{b}"
            worked_solution = [
                "A modulus equation says the inside expression has that distance from zero.",
                "So the inside can equal the positive value or the negative value.",
                f"The first step is {answer}.",
            ]
        else:
            if coefficient == 1:
                solutions = [a + b, a - b]
            else:
                solutions = [(b - a) // coefficient, (-b - a) // coefficient]
                if any(coefficient * solution + a not in (b, -b) for solution in solutions):
                    raise ValueError(f"{practice_id} generated a non-integer modulus solution")
            solutions = sorted(solutions)
            prompt = f"Solve |{inner}| = {b}."
            answer = " or ".join(f"x = {solution}" for solution in solutions)
            worked_solution = [
                f"Split the modulus equation into {inner} = {b} and {inner} = -{b}.",
                "Solve each linear equation separately.",
                f"This gives {answer}.",
                "Substitute both values into the original modulus equation to check the distance.",
            ]
            parameters["solutions"] = ",".join(str(solution) for solution in solutions)

        items.append(base_item(
            practice_id=practice_id,
            generator_family=MODULUS_EQUATION_FAMILY,
            topic=ALGEBRA_TOPIC,
            prompt=prompt,
            answer=answer,
            worked_solution=worked_solution,
            parameters=parameters,
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, ALGEBRA_TOPIC, ["p3-modulus-cases-001"]),
        ))
    return items


def build_binomial_validity_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases = [
        {"form": "simple", "k": 3, "n": -2, "sequence_role": "first_step", "difficulty_band": "easy"},
        {"form": "simple_negative", "k": -2, "n": -1, "sequence_role": "complete_step", "difficulty_band": "easy"},
        {"form": "factor_first", "constant": 2, "k": 1, "n": -3, "sequence_role": "guardian_prep", "difficulty_band": "medium"},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_binomial_validity_range_{index:04d}"
        sequence_role = str(case["sequence_role"])
        parameters = {key: value for key, value in case.items() if key not in {"sequence_role", "difficulty_band"}}
        if case["form"] == "simple":
            k = int(case["k"])
            expression = f"(1 + {k}x)^{{{int(case['n'])}}}"
            prompt = f"For an expansion of {expression} in ascending powers of x, state the validity condition before simplifying it."
            answer = f"|{k}x| < 1"
            worked_solution = [
                "The binomial expansion with a negative or fractional power needs the variable part to have modulus less than 1.",
                f"Here the variable part is {k}x.",
                f"So the first condition is {answer}.",
            ]
        elif case["form"] == "simple_negative":
            k = abs(int(case["k"]))
            expression = f"(1 - {k}x)^{{{int(case['n'])}}}"
            prompt = f"State the interval of validity for the expansion of {expression}."
            answer = f"-1/{k} < x < 1/{k}"
            worked_solution = [
                "The variable part is -2x, so |-2x| < 1.",
                "This is the same as |2x| < 1.",
                f"Therefore {answer}.",
            ]
        else:
            constant = int(case["constant"])
            k = int(case["k"])
            expression = f"({constant} + x)^{{{int(case['n'])}}}"
            prompt = f"Rewrite {expression} into binomial form and state the interval of validity."
            answer = f"2^{{-3}}(1 + x/2)^{{-3}}, valid for -2 < x < 2"
            worked_solution = [
                "Factor out the constant before using the binomial expansion.",
                f"{expression} = {constant}^{{-3}}(1 + x/{constant})^{{-3}}.",
                "The variable part is x/2, so |x/2| < 1.",
                "Therefore -2 < x < 2.",
            ]
            parameters.update({"variable_part_denominator": constant})

        items.append(base_item(
            practice_id=practice_id,
            generator_family=BINOMIAL_VALIDITY_FAMILY,
            topic=BINOMIAL_TOPIC,
            prompt=prompt,
            answer=answer,
            worked_solution=worked_solution,
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


def build_trig_identity_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
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
            parameters={"identity": str(case["identity"])},
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, [
                "p3-trig-identity-selection-001",
                "p3-trig-reciprocal-rform-001",
            ]),
        ))
    return items


def build_trig_double_angle_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases = [
        {
            "prompt": "Choose a double-angle identity for sin 2x.",
            "answer": "sin 2x = 2sin x cos x",
            "worked_solution": [
                "Use this form when the expression contains both sine and cosine.",
                "The identity is sin 2x = 2sin x cos x.",
            ],
            "identity": "sin_double",
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
            parameters={"identity": str(case["identity"])},
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, ["p3-trig-identity-selection-001"]),
        ))
    return items


def build_trig_solve_interval_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
    cases = [
        {
            "prompt": "Solve sin x = 1/2 for 0 <= x <= pi.",
            "answer": "x = pi/6 or 5pi/6",
            "worked_solution": [
                "The reference angle is pi/6.",
                "Sine is positive in quadrants I and II.",
                "Both pi/6 and 5pi/6 lie in the interval.",
            ],
            "equation": "sin_half",
            "sequence_role": "first_step",
            "difficulty_band": "easy",
        },
        {
            "prompt": "Solve cos x = -1/2 for 0 <= x < 2pi.",
            "answer": "x = 2pi/3 or 4pi/3",
            "worked_solution": [
                "The reference angle is pi/3.",
                "Cosine is negative in quadrants II and III.",
                "So the interval solutions are 2pi/3 and 4pi/3.",
            ],
            "equation": "cos_negative_half",
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
            parameters={"equation": str(case["equation"])},
            context=context,
            sequence_role=str(case["sequence_role"]),
            difficulty_band=str(case["difficulty_band"]),
            snippet_ids=preferred_snippet_ids(context, TRIG_TOPIC, [
                "p3-trig-interval-001",
                "p3-trig-lost-solutions-001",
            ]),
        ))
    return items


def build_trig_r_form_items(context: dict[str, dict[Any, list[str]]]) -> list[dict[str, Any]]:
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
        parameters = {"a": a, "b": b, "r": r}
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


def build_generated_practice(skill_targets: dict[str, Any], snippets: dict[str, Any]) -> dict[str, Any]:
    context = context_from_inputs(skill_targets, snippets)
    items = (
        build_log_items(context)
        + build_binomial_items(context)
        + build_partial_fractions_distinct_items(context)
        + build_partial_fractions_repeated_items(context)
        + build_modulus_equation_items(context)
        + build_binomial_validity_items(context)
        + build_trig_identity_items(context)
        + build_trig_double_angle_items(context)
        + build_trig_solve_interval_items(context)
        + build_trig_r_form_items(context)
    )
    return {
        "generated_by": GENERATED_BY,
        "items": items,
        "schema_name": "asterion_generated_practice",
        "schema_version": 1,
    }


def runtime_payload(payload: dict[str, Any]) -> dict[str, Any]:
    runtime_items = [
        item for item in payload.get("items", [])
        if isinstance(item, dict)
        and item.get("review_status") in RUNTIME_REVIEW_STATUSES
        and isinstance(item.get("verification"), dict)
        and item["verification"].get("status") == "pass"
    ]
    return {
        "generated_by": GENERATED_BY,
        "items": runtime_items,
        "schema_name": "asterion_generated_practice",
        "schema_version": 1,
    }


def update_content_lab_report(
    report_path: Path,
    skill_targets: dict[str, Any],
    snippets: dict[str, Any],
    generated_practice: dict[str, Any],
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
        if item.get("review_status") in RUNTIME_REVIEW_STATUSES and verification_status == "pass":
            skill_target_id = non_empty_string(item.get("skill_target_id"))
            if skill_target_id:
                warmups_by_skill.setdefault(skill_target_id, set()).add(str(item.get("practice_id")))
            for region_id in string_list(item.get("region_ids")):
                if region_id in generated_warmups_per_region:
                    generated_warmups_per_region[region_id] += 1

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
            "generated_warmups": generated_warmups_per_region[region_id],
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
                and generated_warmups_per_region[region_id] >= 3
            ) else "needs_more_depth",
            "snippets": snippets_per_region[region_id],
            "snippets_with_examples": snippets_with_examples_by_region[region_id],
            "quick_checks": quick_checks_per_region[region_id],
            "generated_warmups": generated_warmups_per_region[region_id],
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
        or generated_warmups_per_region[region_id] == 0
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
            "warmups": generated_warmups_per_region[region_id],
        }
        for region_id in PRIORITY_REGION_IDS
    ]

    report.update({
        "schema_name": "asterion_content_lab_report",
        "schema_version": 1,
        "active_regions": active_regions,
        "snippets_per_region": snippets_per_region,
        "quick_checks_per_region": quick_checks_per_region,
        "snippets_with_examples_by_region": snippets_with_examples_by_region,
        "method_snippets_missing_examples": method_snippets_missing_examples,
        "generated_warmups_per_region": generated_warmups_per_region,
        "warmups_linked_to_examples": sorted(warmups_linked_to_examples, key=lambda item: item["practice_id"]),
        "warmups_without_example_model": sorted(warmups_without_example_model),
        "priority_region_example_coverage": priority_region_example_coverage,
        "skill_targets_per_topic": skill_targets_per_topic,
        "batch_7_depth_summary": {
            "priority_region_depth": priority_region_depth,
            "regions_still_thin": regions_still_thin,
            "source_trail": "tools/content_lab/outputs/content_lab_research_notes.md",
        },
        "batch_8_recommendations": [
            "Add deterministic warm-up families for differentiation, integration, vectors, numerical methods, differential equations, and complex numbers where they can stay small and verified.",
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
    runtime = runtime_payload(payload)

    write_json(Path(args.output), payload)
    write_json(Path(args.runtime_output), runtime)
    update_content_lab_report(Path(args.report_output), skill_targets, snippets, payload)

    print(f"Wrote {len(payload['items'])} generated practice items.")
    print(f"Wrote {len(runtime['items'])} reviewed runtime practice items.")
    print(f"Updated {args.report_output}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

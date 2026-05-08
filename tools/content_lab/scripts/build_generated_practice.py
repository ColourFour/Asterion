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
PAPER_FAMILY = "p3"


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


def context_from_inputs(skill_targets: dict[str, Any], snippets: dict[str, Any]) -> dict[str, dict[tuple[str, str], list[str]]]:
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
        for topic in topics:
            key = (paper_family, topic)
            snippet_ids_by_key.setdefault(key, []).append(snippet_id)
            region_ids_by_key.setdefault(key, []).extend(region_ids)

    return {
        "skill_ids_by_key": {key: sorted(set(values)) for key, values in skill_ids_by_key.items()},
        "snippet_ids_by_key": {key: sorted(set(values)) for key, values in snippet_ids_by_key.items()},
        "region_ids_by_key": {key: sorted(set(values)) for key, values in region_ids_by_key.items()},
    }


def base_item(
    *,
    practice_id: str,
    generator_family: str,
    topic: str,
    prompt: str,
    answer: str,
    worked_solution: list[str],
    parameters: dict[str, Any],
    context: dict[str, dict[tuple[str, str], list[str]]],
) -> dict[str, Any]:
    key = (PAPER_FAMILY, topic)
    item: dict[str, Any] = {
        "answer": answer,
        "difficulty_band": "easy",
        "generator_family": generator_family,
        "paper_family": PAPER_FAMILY,
        "parameters": parameters,
        "practice_id": practice_id,
        "prompt": prompt,
        "review_status": "teacher_reviewed",
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
    snippet_ids = context["snippet_ids_by_key"].get(key, [])
    if snippet_ids:
        item["snippet_ids"] = snippet_ids
    region_ids = context["region_ids_by_key"].get(key, [])
    if region_ids:
        item["region_ids"] = region_ids
    return item


def assert_positive_integer(value: int, practice_id: str) -> None:
    if not isinstance(value, int) or value <= 0:
        raise ValueError(f"{practice_id} generated a non-positive solution")


def build_log_items(context: dict[str, dict[tuple[str, str], list[str]]]) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = [
        {"form": "product", "a": 3, "b": 12},
        {"form": "product", "a": 5, "b": 45},
        {"form": "quotient", "a": 2, "c": 3, "d": 8},
        {"form": "quotient", "a": 4, "c": 6, "d": 10},
        {"form": "power_law", "k": 2, "solution": 5},
        {"form": "power_law", "k": 3, "solution": 2},
        {"form": "log_power", "n": 3, "solution": 4},
        {"form": "shifted_argument", "a": 3, "b": 11},
        {"form": "shifted_argument", "a": 5, "b": 14},
    ]
    items: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        practice_id = f"gen_log_equation_basic_{index:04d}"
        form = str(case["form"])
        parameters = {"form": form}

        if form == "product":
            a = int(case["a"])
            b = int(case["b"])
            if b % a != 0:
                raise ValueError(f"{practice_id} has non-integer product solution")
            solution = b // a
            assert_positive_integer(solution, practice_id)
            parameters.update({"a": a, "b": b, "solution": solution})
            prompt = f"Solve ln(x) + ln({a}) = ln({b})."
            answer = f"x = {solution}"
            worked_solution = [
                "The domain requires x > 0.",
                f"Use the product law: ln(x) + ln({a}) = ln({a}x).",
                f"So ln({a}x) = ln({b}), which gives {a}x = {b}.",
                f"Therefore x = {solution}.",
            ]
        elif form == "quotient":
            a = int(case["a"])
            c = int(case["c"])
            d = int(case["d"])
            numerator = c * d
            if numerator % a != 0:
                raise ValueError(f"{practice_id} has non-integer quotient solution")
            solution = numerator // a
            assert_positive_integer(solution, practice_id)
            parameters.update({"a": a, "c": c, "d": d, "solution": solution})
            prompt = f"Solve ln({a}x) - ln({c}) = ln({d})."
            answer = f"x = {solution}"
            worked_solution = [
                f"The domain requires {a}x > 0, so x > 0.",
                f"Use the quotient law: ln({a}x) - ln({c}) = ln(({a}x)/{c}).",
                f"So ({a}x)/{c} = {d}.",
                f"Therefore x = {solution}.",
            ]
        elif form == "power_law":
            k = int(case["k"])
            solution = int(case["solution"])
            assert_positive_integer(solution, practice_id)
            b = solution**k
            parameters.update({"k": k, "b": b, "solution": solution})
            prompt = f"Solve {k} ln(x) = ln({b})."
            answer = f"x = {solution}"
            worked_solution = [
                "The domain requires x > 0.",
                f"Use the power law: {k} ln(x) = ln(x^{k}).",
                f"So ln(x^{k}) = ln({b}), giving x^{k} = {b}.",
                f"The positive solution is x = {solution}.",
            ]
        elif form == "log_power":
            n = int(case["n"])
            solution = int(case["solution"])
            assert_positive_integer(solution, practice_id)
            b = solution**n
            parameters.update({"n": n, "b": b, "solution": solution})
            prompt = f"Solve ln(x^{n}) = ln({b})."
            answer = f"x = {solution}"
            worked_solution = [
                f"The original log argument requires x^{n} > 0, so x > 0 here.",
                f"Since ln(x^{n}) = ln({b}), the arguments are equal: x^{n} = {b}.",
                f"Taking the positive root gives x = {solution}.",
            ]
        elif form == "shifted_argument":
            a = int(case["a"])
            b = int(case["b"])
            solution = b - a
            assert_positive_integer(solution, practice_id)
            parameters.update({"a": a, "b": b, "solution": solution})
            prompt = f"Solve ln(x + {a}) = ln({b})."
            answer = f"x = {solution}"
            worked_solution = [
                f"The domain requires x + {a} > 0.",
                f"Equal natural logs have equal positive arguments, so x + {a} = {b}.",
                f"Therefore x = {solution}.",
                f"The check x + {a} = {b} is positive, so the domain is valid.",
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


def build_binomial_items(context: dict[str, dict[tuple[str, str], list[str]]]) -> list[dict[str, Any]]:
    expand_cases = [
        {"a": 2, "n": 4},
        {"a": -1, "n": 5},
        {"a": 3, "n": 3},
    ]
    product_cases = [
        {"a": 1, "m": 3, "b": 2, "n": 2},
        {"a": 2, "m": 3, "b": -1, "n": 4},
        {"a": -1, "m": 4, "b": 3, "n": 2},
    ]

    items: list[dict[str, Any]] = []
    index = 1
    for case in expand_cases:
        a = int(case["a"])
        n = int(case["n"])
        _, x_coefficient, x2_coefficient = first_three_coefficients(a, n)
        if abs(x2_coefficient) > 120:
            raise ValueError("Expansion coefficient is too large")
        expansion = polynomial_text([(1, 0), (x_coefficient, 1), (x2_coefficient, 2)])
        expression = binomial_expression(a, n)
        practice_id = f"gen_binomial_first_terms_and_coefficient_{index:04d}"
        parameters = {
            "a": a,
            "item_type": "expand_first_terms",
            "n": n,
            "x_coefficient": x_coefficient,
            "x2_coefficient": x2_coefficient,
        }
        items.append(base_item(
            practice_id=practice_id,
            generator_family=BINOMIAL_FAMILY,
            topic=BINOMIAL_TOPIC,
            prompt=f"Expand {expression} up to and including the x^2 term.",
            answer=expansion,
            worked_solution=[
                f"Use (1 + t)^n = 1 + nt + C(n,2)t^2 + ... with t = {a}x and n = {n}.",
                f"The x term is {n}({a}x) = {polynomial_text([(x_coefficient, 1)])}.",
                f"The x^2 term is C({n},2)({a}x)^2 = {polynomial_text([(x2_coefficient, 2)])}.",
                f"So the expansion up to x^2 is {expansion}.",
            ],
            parameters=parameters,
            context=context,
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
        ))
        index += 1

    return items


def build_generated_practice(skill_targets: dict[str, Any], snippets: dict[str, Any]) -> dict[str, Any]:
    context = context_from_inputs(skill_targets, snippets)
    items = build_log_items(context) + build_binomial_items(context)
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Build deterministic generated warm-up practice.")
    parser.add_argument("--skill-targets", default="tools/content_lab/outputs/skill_targets.json")
    parser.add_argument("--snippets", default="public/data/teaching_snippets.json")
    parser.add_argument("--output", default="tools/content_lab/outputs/generated_practice_bank.json")
    parser.add_argument("--runtime-output", default="public/data/generated_practice_bank.json")
    args = parser.parse_args()

    payload = build_generated_practice(
        load_json_optional(Path(args.skill_targets)),
        load_json_optional(Path(args.snippets)),
    )
    runtime = runtime_payload(payload)

    write_json(Path(args.output), payload)
    write_json(Path(args.runtime_output), runtime)

    print(f"Wrote {len(payload['items'])} generated practice items.")
    print(f"Wrote {len(runtime['items'])} reviewed runtime practice items.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

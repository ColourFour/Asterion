#!/usr/bin/env python3
"""Verify Content Lab static outputs without adding runtime dependencies."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from p3_skill_contract import PRIORITY_P3_REGION_IDS, load_p3_skill_map, p3_region_ids_from_skill_map


RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}
TARGET_REVIEW_STATUSES = {"needs_review", "teacher_reviewed", "published"}
PRACTICE_REVIEW_STATUSES = {"candidate", "needs_review", "teacher_reviewed", "published", "blocked"}
PRACTICE_RUNTIME_BLOCKED_STATUSES = {"candidate", "needs_review", "blocked"}
PRACTICE_VERIFICATION_STATUSES = {"pass", "fail"}
PRACTICE_DIFFICULTY_BANDS = {"easy", "medium", "hard"}
SEQUENCE_ROLES = {"first_step", "complete_step", "guardian_prep"}
SNIPPET_TYPES = {"concept", "method", "mistake_repair", "quick_check", "guardian_prep"}
EXAMPLE_REQUIRED_SNIPPET_TYPES = {"concept", "method", "mistake_repair"}
PRIORITY_REGION_IDS = PRIORITY_P3_REGION_IDS
KNOWN_PAPER_FAMILIES = {"p1", "p3", "p4", "p5"}
V2_BATCH_REQUIRED_FIELDS = ("question_type", "key_method", "exam_move")
ACTIVE_P3_REGION_SUPPORT = {
    "algebra-forge": {
        "primary_topic": "algebra_functions_and_binomial",
        "topics": {
            "algebra",
            "algebraic_manipulation",
            "functions",
            "polynomials",
            "partial_fractions",
            "binomial_expansion",
            "quadratics",
        },
        "aliases": {
            "algebraic manipulation",
            "function",
            "polynomial",
            "partial fractions",
            "binomial",
            "binomial expansion",
            "quadratic",
        },
    },
    "logarithm-grove": {
        "primary_topic": "logarithms_and_exponentials",
        "topics": {"logarithms_and_exponentials", "logarithms", "exponentials"},
        "aliases": {
            "log",
            "logs",
            "logarithm",
            "logarithmic",
            "logarithmic functions",
            "exponential",
            "exponential functions",
            "logarithms and exponentials",
        },
    },
    "trig-observatory": {
        "primary_topic": "trigonometry",
        "topics": {"trigonometry", "trigonometric_identities", "trigonometric_equations"},
        "aliases": {
            "trig",
            "trigonometric",
            "trigonometric identities",
            "trig identities",
            "trigonometric equations",
            "compound angle",
            "compound angle formulae",
        },
    },
    "complex-harbor": {
        "primary_topic": "complex_numbers",
        "topics": {"complex_numbers", "argand_diagrams", "modulus_and_argument"},
        "aliases": {
            "complex",
            "complex numbers",
            "argand",
            "argand diagram",
            "argand diagrams",
            "modulus and argument",
            "polar form",
        },
    },
    "calculus-cliffs": {
        "primary_topic": "differentiation",
        "topics": {"differentiation", "parametric_equations"},
        "aliases": {
            "calculus",
            "derivative",
            "derivatives",
            "parametric",
            "parametric equations",
            "implicit differentiation",
            "stationary points",
            "chain rule",
            "product rule",
            "quotient rule",
        },
    },
    "integration-gardens": {
        "primary_topic": "integration",
        "topics": {"integration", "partial_fractions"},
        "aliases": {
            "integral",
            "integrals",
            "integration by substitution",
            "substitution",
            "integration by parts",
            "partial fractions integration",
            "definite integrals",
        },
    },
    "vector-workshop": {
        "primary_topic": "vectors",
        "topics": {"vectors"},
        "aliases": {
            "vector",
            "vector lines",
            "scalar product",
            "dot product",
            "3d vectors",
            "angles between lines",
        },
    },
    "numerical-mines": {
        "primary_topic": "numerical_methods",
        "topics": {"numerical_methods", "numerical_solution_of_equations", "iteration"},
        "aliases": {
            "numerical",
            "numerical methods",
            "numerical solution",
            "numerical solution of equations",
            "iterative methods",
            "newton raphson",
            "newton-raphson",
            "sign change",
        },
    },
    "differential-shrine": {
        "primary_topic": "differential_equations",
        "topics": {"differential_equations", "separation_of_variables"},
        "aliases": {
            "differential equation",
            "differential equations",
            "first order differential",
            "first-order differential",
            "separation of variables",
            "forming differential equations",
        },
    },
}


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValueError(f"Missing required file: {path}") from None
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} is not valid JSON: {error}") from None


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def verify_region_support_matches_skill_map(errors: list[str]) -> None:
    skill_map_region_ids = p3_region_ids_from_skill_map(load_p3_skill_map())
    support_region_ids = set(ACTIVE_P3_REGION_SUPPORT)
    for region_id in sorted(skill_map_region_ids - support_region_ids):
        errors.append(f"ACTIVE_P3_REGION_SUPPORT missing reviewed skill-map region {region_id}")
    for region_id in sorted(support_region_ids - skill_map_region_ids):
        errors.append(f"ACTIVE_P3_REGION_SUPPORT contains non-skill-map region {region_id}")


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def first_non_empty_string(*values: Any) -> str | None:
    for value in values:
        if is_non_empty_string(value):
            return str(value).strip()
    return None


def normalize_label(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    normalized = value.lower().replace("_", " ")
    normalized = re.sub(r"[/_-]+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9 ]+", "", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def normalized_region_topics(region_id: str) -> set[str]:
    support = ACTIVE_P3_REGION_SUPPORT[region_id]
    values = {support["primary_topic"], *support["topics"], *support["aliases"]}
    return {normalize_label(value) for value in values if normalize_label(value)}


def matching_p3_regions(topics: list[str], region_ids: list[str]) -> set[str]:
    matched = {region_id for region_id in region_ids if region_id in ACTIVE_P3_REGION_SUPPORT}
    normalized_topics = {normalize_label(topic) for topic in topics}
    for region_id in ACTIVE_P3_REGION_SUPPORT:
        region_topics = normalized_region_topics(region_id)
        if normalized_topics & region_topics:
            matched.add(region_id)
    return matched


def require_non_empty_string(record: dict[str, Any], key: str, owner: str, errors: list[str]) -> None:
    require(is_non_empty_string(record.get(key)), f"{owner} has empty or missing {key}", errors)


def require_valid_math_text(value: Any, owner: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value:
        return
    if "\\(" in value or "\\)" in value or "\\[" in value or "\\]" in value:
        errors.append(f"{owner} uses unsupported math delimiters; use $...$ or $$...$$ only")
        return

    index = 0
    while index < len(value):
        if value.startswith("$$", index):
            end = value.find("$$", index + 2)
            if end == -1:
                errors.append(f"{owner} has an unclosed $$ math delimiter")
                return
            if end == index + 2:
                errors.append(f"{owner} has an empty $$ math segment")
                return
            if "$" in value[index + 2:end]:
                errors.append(f"{owner} has nested or malformed math delimiters")
                return
            index = end + 2
            continue
        if value[index] == "$":
            end = value.find("$", index + 1)
            if end == -1:
                errors.append(f"{owner} has an unclosed $ math delimiter")
                return
            if end == index + 1:
                errors.append(f"{owner} has an empty $ math segment")
                return
            if "$" in value[index + 1:end]:
                errors.append(f"{owner} has nested or malformed math delimiters")
                return
            index = end + 1
            continue
        index += 1


def require_valid_math_values(record: dict[str, Any], keys: tuple[str, ...], owner: str, errors: list[str]) -> None:
    for key in keys:
        value = record.get(key)
        if isinstance(value, str):
            require_valid_math_text(value, f"{owner}.{key}", errors)
        elif isinstance(value, list):
            for item_index, item in enumerate(value):
                require_valid_math_text(item, f"{owner}.{key}[{item_index}]", errors)


def source_index_from_question_bank(path: Path, errors: list[str]) -> dict[str, dict[str, set[str]]]:
    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return {}
    questions = data.get("questions")
    require(isinstance(questions, list), f"{path} must contain questions[]", errors)
    if not isinstance(questions, list):
        return {}

    source_index: dict[str, dict[str, set[str]]] = {}
    for index, question in enumerate(questions):
        if not isinstance(question, dict):
            errors.append(f"{path}.questions[{index}] is not an object")
            continue
        question_id = first_non_empty_string(question.get("question_id"), question.get("id"))
        if not question_id:
            errors.append(f"{path}.questions[{index}] missing question_id")
            continue
        question_assets = set(string_list(question.get("question_image_paths")))
        mark_scheme_assets = set(string_list(question.get("mark_scheme_image_paths")))
        for key in ("canonical_question_artifact", "question_image_path"):
            value = first_non_empty_string(question.get(key))
            if value:
                question_assets.add(value)
        mark_scheme_asset = first_non_empty_string(question.get("mark_scheme_image_path"))
        if mark_scheme_asset:
            mark_scheme_assets.add(mark_scheme_asset)
        source_index[question_id] = {
            "question_assets": question_assets,
            "mark_scheme_assets": mark_scheme_assets,
        }
    return source_index


def require_source_traceability(
    record: dict[str, Any],
    owner: str,
    source_index: dict[str, dict[str, set[str]]],
    errors: list[str],
    *,
    require_asset_ids: bool,
) -> None:
    source_question_ids = string_list(record.get("source_question_ids"))
    require(bool(source_question_ids), f"{owner} missing source link: source_question_ids is required", errors)
    if not source_question_ids:
        return

    expected_question_assets: set[str] = set()
    expected_mark_scheme_assets: set[str] = set()
    for source_question_id in source_question_ids:
        source = source_index.get(source_question_id)
        require(source is not None, f"{owner} has unresolved source_question_id {source_question_id}", errors)
        if not source:
            continue
        require(bool(source["question_assets"]), f"{owner} source_question_id {source_question_id} has no canonical question image asset", errors)
        require(bool(source["mark_scheme_assets"]), f"{owner} source_question_id {source_question_id} has no canonical mark-scheme image asset", errors)
        expected_question_assets.update(source["question_assets"])
        expected_mark_scheme_assets.update(source["mark_scheme_assets"])

    if not require_asset_ids:
        return

    question_asset_ids = set(string_list(record.get("source_question_asset_ids")))
    mark_scheme_asset_ids = set(string_list(record.get("source_mark_scheme_asset_ids")))
    require(bool(question_asset_ids), f"{owner} missing source_question_asset_ids", errors)
    require(bool(mark_scheme_asset_ids), f"{owner} missing source_mark_scheme_asset_ids", errors)
    unresolved_question_assets = question_asset_ids - expected_question_assets
    unresolved_mark_scheme_assets = mark_scheme_asset_ids - expected_mark_scheme_assets
    for asset_id in sorted(unresolved_question_assets):
        errors.append(f"{owner} has unresolved source_question_asset_id {asset_id}")
    for asset_id in sorted(unresolved_mark_scheme_assets):
        errors.append(f"{owner} has unresolved source_mark_scheme_asset_id {asset_id}")


def require_string_array(
    record: dict[str, Any],
    key: str,
    owner: str,
    errors: list[str],
    *,
    required: bool = False,
    min_items: int = 0,
) -> None:
    value = record.get(key)
    if value is None and not required:
        return
    require(isinstance(value, list), f"{owner}.{key} must be an array", errors)
    if not isinstance(value, list):
        return
    require(len(value) >= min_items, f"{owner}.{key} must contain at least {min_items} item(s)", errors)
    for item_index, item in enumerate(value):
        require(is_non_empty_string(item), f"{owner}.{key}[{item_index}] must be a non-empty string", errors)


def require_quick_check(value: Any, owner: str, errors: list[str]) -> None:
    require(isinstance(value, dict), f"{owner}.quick_check must be an object", errors)
    if not isinstance(value, dict):
        return
    for key in ("id", "region_id", "topic", "skill_target_id", "title", "prompt", "answer", "explanation", "micro_skill", "difficulty_band", "review_status"):
        require_non_empty_string(value, key, f"{owner}.quick_check", errors)
    if value.get("example_model_id") is not None:
        require_non_empty_string(value, "example_model_id", f"{owner}.quick_check", errors)
    require_valid_math_values(value, ("prompt", "answer", "explanation"), f"{owner}.quick_check", errors)
    estimated_time = value.get("estimated_time_minutes")
    require(isinstance(estimated_time, (int, float)) and estimated_time > 0, f"{owner}.quick_check.estimated_time_minutes must be positive", errors)
    require(value.get("difficulty_band") in PRACTICE_DIFFICULTY_BANDS, f"{owner}.quick_check has invalid difficulty_band", errors)
    require(value.get("review_status") in RUNTIME_REVIEW_STATUSES, f"{owner}.quick_check must be teacher_reviewed or published", errors)


def require_guardian_readiness(value: Any, owner: str, errors: list[str]) -> None:
    require(isinstance(value, dict), f"{owner}.guardian_readiness must be an object", errors)
    if not isinstance(value, dict):
        return
    require_string_array(value, "supports_topics", f"{owner}.guardian_readiness", errors, required=True)
    require_string_array(value, "recommended_before_question_ids", f"{owner}.guardian_readiness", errors, required=True)
    require_non_empty_string(value, "readiness_note", f"{owner}.guardian_readiness", errors)


def require_worked_example(
    value: Any,
    owner: str,
    errors: list[str],
    warnings: list[str],
    *,
    first_batch: bool = False,
    source_index: dict[str, dict[str, set[str]]] | None = None,
) -> bool:
    require(isinstance(value, dict), f"{owner} must be an object", errors)
    if not isinstance(value, dict):
        return False
    if value.get("id") is not None:
        require_non_empty_string(value, "id", owner, errors)
    require_non_empty_string(value, "prompt", owner, errors)
    require_non_empty_string(value, "answer", owner, errors)
    require_string_array(value, "steps", owner, errors, required=True, min_items=1)
    if value.get("teaching_note") is not None:
        require_non_empty_string(value, "teaching_note", owner, errors)
    require_valid_math_values(value, ("prompt", "answer", "steps", "teaching_note", "exam_move"), owner, errors)
    if first_batch:
        for key in V2_BATCH_REQUIRED_FIELDS:
            require_non_empty_string(value, key, owner, errors)
        require_source_traceability(value, owner, source_index or {}, errors, require_asset_ids=True)

    prompt = value.get("prompt")
    steps = value.get("steps")
    if isinstance(prompt, str) and len(prompt) > 180:
        warnings.append(f"{owner}.prompt is long for a Field Guide mini-example")
    if isinstance(steps, list) and len(steps) > 6:
        warnings.append(f"{owner}.steps has more than 6 steps")
    return (
        is_non_empty_string(value.get("prompt"))
        and is_non_empty_string(value.get("answer"))
        and isinstance(steps, list)
        and bool(string_list(steps))
    )


def worked_example_entries(snippet: dict[str, Any], owner: str) -> list[tuple[str, Any]]:
    entries: list[tuple[str, Any]] = []
    if "worked_example" in snippet:
        entries.append((f"{owner}.worked_example", snippet.get("worked_example")))
    if "worked_examples" in snippet:
        worked_examples = snippet.get("worked_examples")
        if isinstance(worked_examples, list):
            for example_index, example in enumerate(worked_examples):
                entries.append((f"{owner}.worked_examples[{example_index}]", example))
        else:
            entries.append((f"{owner}.worked_examples", worked_examples))
    return entries


def require_worked_examples(
    snippet: dict[str, Any],
    owner: str,
    errors: list[str],
    warnings: list[str],
    *,
    first_batch: bool = False,
    source_index: dict[str, dict[str, set[str]]] | None = None,
) -> int:
    example_count = 0

    if "worked_examples" in snippet:
        worked_examples = snippet.get("worked_examples")
        require(isinstance(worked_examples, list), f"{owner}.worked_examples must be an array", errors)
        if isinstance(worked_examples, list):
            require(len(worked_examples) > 0, f"{owner}.worked_examples must contain at least one item", errors)
    for example_owner, example in worked_example_entries(snippet, owner):
        if require_worked_example(
            example,
            example_owner,
            errors,
            warnings,
            first_batch=first_batch,
            source_index=source_index,
        ):
            example_count += 1

    return example_count


def require_record(value: Any, owner: str, errors: list[str]) -> dict[str, Any] | None:
    require(isinstance(value, dict), f"{owner} must be an object", errors)
    return value if isinstance(value, dict) else None


def verify_skill_targets(path: Path, errors: list[str], warnings: list[str] | None = None) -> None:
    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return
    targets = data.get("skill_targets")
    require(isinstance(targets, list), f"{path} must contain skill_targets[]", errors)
    if not isinstance(targets, list):
        return

    seen = set()
    last_sort_key: tuple[str, str, str] | None = None
    for index, target in enumerate(targets):
        if not isinstance(target, dict):
            errors.append(f"skill_targets[{index}] is not an object")
            continue
        skill_target_id = target.get("skill_target_id")
        sort_key = (
            str(target.get("paper_family", "")),
            str(target.get("topic", "")),
            str(skill_target_id or ""),
        )
        require(isinstance(skill_target_id, str) and bool(skill_target_id), f"skill_targets[{index}] missing skill_target_id", errors)
        require(skill_target_id not in seen, f"Duplicate skill_target_id: {skill_target_id}", errors)
        seen.add(skill_target_id)
        require(target.get("review_status") in TARGET_REVIEW_STATUSES, f"{skill_target_id} has invalid review_status", errors)
        require(isinstance(target.get("source_question_ids"), list) and len(target["source_question_ids"]) > 0, f"{skill_target_id} has no source_question_ids", errors)
        require_string_array(target, "assessed_by_source_question_ids", str(skill_target_id), errors, required=True, min_items=1)
        require_string_array(target, "micro_skills", str(skill_target_id), errors, required=True, min_items=1)
        require_string_array(target, "likely_prerequisites", str(skill_target_id), errors, required=True, min_items=1)
        require_string_array(target, "common_misconceptions", str(skill_target_id), errors, required=True, min_items=1)
        patterns = target.get("source_mark_scheme_patterns")
        require(isinstance(patterns, list), f"{skill_target_id}.source_mark_scheme_patterns must be an array", errors)
        if isinstance(patterns, list):
            for pattern_index, pattern in enumerate(patterns):
                pattern_record = require_record(pattern, f"{skill_target_id}.source_mark_scheme_patterns[{pattern_index}]", errors)
                if pattern_record:
                    require_non_empty_string(pattern_record, "pattern_id", f"{skill_target_id}.source_mark_scheme_patterns[{pattern_index}]", errors)
                    require_non_empty_string(pattern_record, "summary", f"{skill_target_id}.source_mark_scheme_patterns[{pattern_index}]", errors)
                    require_string_array(pattern_record, "source_question_ids", f"{skill_target_id}.source_mark_scheme_patterns[{pattern_index}]", errors, required=True, min_items=1)
        require(last_sort_key is None or sort_key >= last_sort_key, f"skill_targets not sorted at {skill_target_id}", errors)
        last_sort_key = sort_key


def verify_review_queue(path: Path, errors: list[str], warnings: list[str] | None = None) -> None:
    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return
    records = data.get("records")
    require(isinstance(records, list), f"{path} must contain records[]", errors)
    if not isinstance(records, list):
        return
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            errors.append(f"review_queue.records[{index}] is not an object")
            continue
        require(record.get("eligibility") in {"review_only", "blocked"}, f"review_queue.records[{index}] has invalid eligibility", errors)
        require(isinstance(record.get("reasons"), list) and len(record["reasons"]) > 0, f"review_queue.records[{index}] has no reasons", errors)


def verify_teaching_snippets(
    path: Path,
    errors: list[str],
    warnings: list[str] | None = None,
    *,
    source_index: dict[str, dict[str, set[str]]] | None = None,
) -> dict[str, Any]:
    warnings = warnings if warnings is not None else []
    source_index = source_index or {}
    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return {"snippet_ids": set(), "example_ids": set(), "reviewed_snippet_count": 0, "quick_check_count": 0}
    snippets = data.get("snippets")
    require(isinstance(snippets, list), f"{path} must contain snippets[]", errors)
    if not isinstance(snippets, list):
        return {"snippet_ids": set(), "example_ids": set(), "reviewed_snippet_count": 0, "quick_check_count": 0}

    seen = set()
    snippet_ids = {
        str(snippet.get("snippet_id"))
        for snippet in snippets
        if isinstance(snippet, dict) and is_non_empty_string(snippet.get("snippet_id"))
    }
    example_ids: set[str] = set()
    for snippet in snippets:
        if not isinstance(snippet, dict):
            continue
        owner = str(snippet.get("snippet_id") or "snippet")
        for _, example in worked_example_entries(snippet, owner):
            if isinstance(example, dict) and is_non_empty_string(example.get("id")):
                example_ids.add(str(example["id"]))

    reviewed_snippet_count = 0
    quick_check_count = 0
    p3_snippets_by_region: dict[str, list[str]] = {region_id: [] for region_id in ACTIVE_P3_REGION_SUPPORT}
    for index, snippet in enumerate(snippets):
        if not isinstance(snippet, dict):
            errors.append(f"snippets[{index}] is not an object")
            continue
        snippet_id = snippet.get("snippet_id")
        owner = f"snippets[{index}]"
        require(is_non_empty_string(snippet_id), f"{owner} missing snippet_id", errors)
        owner = str(snippet_id or owner)
        require(snippet_id not in seen, f"Duplicate snippet_id: {snippet_id}", errors)
        seen.add(snippet_id)
        require(snippet.get("review_status") in RUNTIME_REVIEW_STATUSES, f"{owner} must be teacher_reviewed or published", errors)
        if snippet.get("review_status") in RUNTIME_REVIEW_STATUSES:
            reviewed_snippet_count += 1

        for key in ("paper_family", "title", "student_goal", "exam_move", "common_trap", "source"):
            require_non_empty_string(snippet, key, owner, errors)
        require_valid_math_values(snippet, ("body", "explanation", "steps", "exam_move", "common_trap", "student_goal"), owner, errors)
        require(
            is_non_empty_string(snippet.get("body")) or is_non_empty_string(snippet.get("explanation")),
            f"{owner} must have non-empty body or explanation",
            errors,
        )
        require_string_array(snippet, "topics", owner, errors, required=True, min_items=1)
        require_string_array(snippet, "region_ids", owner, errors)
        require_string_array(snippet, "steps", owner, errors, required=True, min_items=1)
        for key in ("prerequisites", "micro_steps", "common_mistakes", "source_question_ids"):
            require_string_array(snippet, key, owner, errors)
        require_string_array(snippet, "source_skill_target_ids", owner, errors, required=True, min_items=1)
        require_string_array(snippet, "related_skill_targets", owner, errors, required=True, min_items=1)

        paper_family = snippet.get("paper_family")
        topics = [topic for topic in snippet.get("topics", []) if isinstance(topic, str)]
        region_ids = [region_id for region_id in snippet.get("region_ids", []) if isinstance(region_id, str)]
        if is_non_empty_string(paper_family):
            require(str(paper_family) in KNOWN_PAPER_FAMILIES, f"{owner}.paper_family has unsupported value {paper_family}", errors)
        topic = snippet.get("topic")
        require_non_empty_string(snippet, "topic", owner, errors)
        if topic is not None:
            require(not topics or topic in topics, f"{owner}.topic must also appear in topics[]", errors)

        if paper_family == "p3":
            unknown_regions = [region_id for region_id in region_ids if region_id not in ACTIVE_P3_REGION_SUPPORT]
            for region_id in unknown_regions:
                errors.append(f"{owner}.region_ids contains unknown P3 region {region_id}")
            matched_regions = matching_p3_regions(topics, region_ids)
            require(bool(matched_regions), f"{owner} does not map to any active P3 region by topic or region_ids", errors)
            for region_id in matched_regions:
                p3_snippets_by_region[region_id].append(owner)

        quick_check = snippet.get("quick_check")
        if quick_check is not None:
            require_quick_check(quick_check, owner, errors)
            if isinstance(quick_check, dict):
                quick_check_count += 1
                require(quick_check.get("topic") in topics, f"{owner}.quick_check.topic must appear in snippet topics[]", errors)
                if region_ids:
                    require(quick_check.get("region_id") in region_ids, f"{owner}.quick_check.region_id must appear in snippet region_ids[]", errors)
                related_skill_ids = set(string for string in string_list(snippet.get("related_skill_targets")) + string_list(snippet.get("source_skill_target_ids")))
                require(quick_check.get("skill_target_id") in related_skill_ids, f"{owner}.quick_check.skill_target_id must match snippet skill metadata", errors)
                example_model_id = quick_check.get("example_model_id")
                if is_non_empty_string(example_model_id):
                    require(str(example_model_id) in example_ids, f"{owner}.quick_check has unresolved example_model_id {example_model_id}", errors)

        guardian_readiness = snippet.get("guardian_readiness")
        if guardian_readiness is not None:
            require_guardian_readiness(guardian_readiness, owner, errors)

        estimated_time = snippet.get("estimated_time_minutes")
        if estimated_time is not None:
            require(isinstance(estimated_time, (int, float)) and estimated_time > 0, f"{owner}.estimated_time_minutes must be positive", errors)

        snippet_type = snippet.get("snippet_type")
        if snippet_type is not None:
            require(snippet_type in SNIPPET_TYPES, f"{owner}.snippet_type has invalid value", errors)
        first_batch_snippet = (
            paper_family == "p3"
            and bool(PRIORITY_REGION_IDS.intersection(region_ids))
        )
        worked_example_count = require_worked_examples(
            snippet,
            owner,
            errors,
            warnings,
            first_batch=first_batch_snippet,
            source_index=source_index,
        )
        if (
            paper_family == "p3"
            and snippet_type in EXAMPLE_REQUIRED_SNIPPET_TYPES
            and PRIORITY_REGION_IDS.intersection(region_ids)
            and worked_example_count == 0
        ):
            errors.append(f"missing batch-required worked example: first-batch {snippet_type} snippet {owner} has no worked example")
        if first_batch_snippet and isinstance(quick_check, dict):
            example_model_id = quick_check.get("example_model_id")
            require(
                is_non_empty_string(example_model_id),
                f"{owner}.quick_check missing batch-required example_model_id",
                errors,
            )

        lineage = snippet.get("lineage")
        if lineage is not None:
            lineage_record = require_record(lineage, f"{owner}.lineage", errors)
            if lineage_record:
                require_non_empty_string(lineage_record, "generated_from", f"{owner}.lineage", errors)

    for region_id, owners in p3_snippets_by_region.items():
        require(bool(owners), f"Active P3 region {region_id} has no reviewed/published teaching snippet", errors)

    return {
        "snippet_ids": snippet_ids,
        "example_ids": example_ids,
        "reviewed_snippet_count": reviewed_snippet_count,
        "quick_check_count": quick_check_count,
    }


def verify_generated_practice(
    path: Path,
    errors: list[str],
    warnings: list[str] | None = None,
    *,
    runtime: bool,
    snippet_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    warnings = warnings if warnings is not None else []
    snippet_context = snippet_context or {"snippet_ids": set(), "example_ids": set()}
    if not path.exists():
        return {"reviewed_generated_practice_count": 0, "generator_families": set()}

    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return {"reviewed_generated_practice_count": 0, "generator_families": set()}
    items = data.get("items")
    require(isinstance(items, list), f"{path} must contain items[]", errors)
    if not isinstance(items, list):
        return {"reviewed_generated_practice_count": 0, "generator_families": set()}

    seen = set()
    reviewed_generated_practice_count = 0
    generator_families: set[str] = set()
    for index, item_value in enumerate(items):
        item = require_record(item_value, f"generated_practice.items[{index}]", errors)
        if not item:
            continue
        practice_id = item.get("practice_id")
        owner = str(practice_id or f"generated_practice.items[{index}]")
        require(is_non_empty_string(practice_id), f"{owner} missing practice_id", errors)
        require(practice_id not in seen, f"Duplicate practice_id: {practice_id}", errors)
        seen.add(practice_id)

        for key in ("generator_family", "paper_family", "topic", "prompt", "answer", "difficulty_band", "review_status", "sequence_role"):
            require_non_empty_string(item, key, owner, errors)
        require_valid_math_values(item, ("prompt", "answer", "worked_solution", "exam_move"), owner, errors)
        require(item.get("difficulty_band") in PRACTICE_DIFFICULTY_BANDS, f"{owner} has invalid difficulty_band", errors)
        require(item.get("sequence_role") in SEQUENCE_ROLES, f"{owner} has invalid sequence_role", errors)
        require(item.get("review_status") in PRACTICE_REVIEW_STATUSES, f"{owner} has invalid review_status", errors)
        require_string_array(item, "worked_solution", owner, errors, required=True, min_items=2)
        require_string_array(item, "snippet_ids", owner, errors, required=runtime, min_items=1 if runtime else 0)
        require_string_array(item, "region_ids", owner, errors, required=runtime, min_items=1 if runtime else 0)
        snippet_ids = string_list(item.get("snippet_ids"))
        if item.get("skill_target_id") is not None:
            require_non_empty_string(item, "skill_target_id", owner, errors)
        if item.get("source_snippet_id") is not None:
            require_non_empty_string(item, "source_snippet_id", owner, errors)
        if item.get("example_model_id") is not None:
            require_non_empty_string(item, "example_model_id", owner, errors)
        for key in V2_BATCH_REQUIRED_FIELDS:
            if item.get(key) is not None:
                require_non_empty_string(item, key, owner, errors)
        source_snippet_id = item.get("source_snippet_id")
        if is_non_empty_string(source_snippet_id) and snippet_ids:
            require(source_snippet_id in snippet_ids, f"{owner}.source_snippet_id must appear in snippet_ids[]", errors)
        if is_non_empty_string(source_snippet_id):
            require(str(source_snippet_id) in snippet_context.get("snippet_ids", set()), f"{owner} has unresolved source_snippet_id {source_snippet_id}", errors)
        example_model_id = item.get("example_model_id")
        if is_non_empty_string(example_model_id):
            require(str(example_model_id) in snippet_context.get("example_ids", set()), f"{owner} has unresolved example_model_id {example_model_id}", errors)
        if not is_non_empty_string(item.get("source_snippet_id")) and not is_non_empty_string(item.get("example_model_id")):
            warnings.append(f"{owner} has no source_snippet_id or example_model_id")

        parameters = item.get("parameters")
        require(isinstance(parameters, dict) and bool(parameters), f"{owner}.parameters must be a non-empty object", errors)

        verification = require_record(item.get("verification"), f"{owner}.verification", errors)
        if verification:
            require(verification.get("status") in PRACTICE_VERIFICATION_STATUSES, f"{owner}.verification.status has invalid value", errors)
            require(verification.get("method") == "deterministic", f"{owner}.verification.method must be deterministic", errors)
            require_non_empty_string(verification, "verifier", f"{owner}.verification", errors)

        if runtime:
            review_status = item.get("review_status")
            verification_status = verification.get("status") if verification else None
            require_non_empty_string(item, "skill_target_id", f"Runtime practice {owner}", errors)
            require(review_status in RUNTIME_REVIEW_STATUSES, f"Runtime practice {owner} must be teacher_reviewed or published", errors)
            require(review_status not in PRACTICE_RUNTIME_BLOCKED_STATUSES, f"Runtime practice {owner} cannot be {review_status}", errors)
            require(verification_status == "pass", f"Runtime practice {owner} must have verification.status pass", errors)
            if review_status in RUNTIME_REVIEW_STATUSES and verification_status == "pass":
                reviewed_generated_practice_count += 1
                family = item.get("generator_family")
                if is_non_empty_string(family):
                    generator_families.add(str(family))
            first_batch_item = bool(PRIORITY_REGION_IDS.intersection(string_list(item.get("region_ids"))))
            if first_batch_item:
                for key in V2_BATCH_REQUIRED_FIELDS:
                    require_non_empty_string(item, key, f"Runtime practice {owner}", errors)
                require_non_empty_string(item, "source_snippet_id", f"Runtime practice {owner}", errors)
                require_non_empty_string(item, "example_model_id", f"Runtime practice {owner}", errors)

    return {
        "reviewed_generated_practice_count": reviewed_generated_practice_count,
        "generator_families": generator_families,
    }


def verify_content_lab_report(path: Path, errors: list[str], warnings: list[str] | None = None) -> None:
    if not path.exists():
        return
    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return
    require(data.get("schema_name") == "asterion_content_lab_report", f"{path} has invalid schema_name", errors)
    for key in (
        "active_regions",
        "snippets_per_region",
        "quick_checks_per_region",
        "generated_warmups_per_region",
        "skill_targets_per_topic",
        "batch_7_depth_summary",
        "content_review_status_counts",
        "generated_families_by_topic",
        "high_evidence_weak_teaching_support",
        "skill_targets_with_quick_checks_but_no_warmups",
        "skill_targets_with_snippets_but_no_quick_checks",
        "topics_needing_deterministic_generators",
        "topics_with_snippets_but_no_warmups",
        "generator_family_counts",
        "verification_failure_counts",
        "snippets_with_examples_by_region",
        "method_snippets_missing_examples",
        "warmups_linked_to_examples",
        "warmups_without_example_model",
        "priority_region_example_coverage",
    ):
        require(key in data, f"{path} missing {key}", errors)

    active_regions = data.get("active_regions")
    require(isinstance(active_regions, list), f"{path}.active_regions must be an array", errors)
    seen_regions = set()
    if isinstance(active_regions, list):
        for index, region_value in enumerate(active_regions):
            region = require_record(region_value, f"{path}.active_regions[{index}]", errors)
            if not region:
                continue
            region_id = region.get("region_id")
            require(region_id in ACTIVE_P3_REGION_SUPPORT, f"{path}.active_regions[{index}] has unknown region_id {region_id}", errors)
            if isinstance(region_id, str):
                seen_regions.add(region_id)
            for key in ("snippets", "quick_checks", "generated_warmups"):
                value = region.get(key)
                require(isinstance(value, int) and value >= 0, f"{path}.active_regions[{index}].{key} must be a non-negative integer", errors)
    for region_id in ACTIVE_P3_REGION_SUPPORT:
        require(region_id in seen_regions, f"{path}.active_regions missing {region_id}", errors)


def verify_question_bank_not_modified(path: Path, errors: list[str]) -> None:
    repo_root = Path(__file__).resolve().parents[3]
    try:
        relative_path = path.resolve().relative_to(repo_root)
    except ValueError:
        relative_path = path
    result = subprocess.run(
        ["git", "diff", "--quiet", "--", str(relative_path)],
        cwd=repo_root,
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode == 1:
        errors.append(f"{path} has local git modifications")
    elif result.returncode not in (0, 1):
        errors.append(f"Could not verify git diff for {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Content Lab outputs.")
    parser.add_argument("--outputs-dir", default="tools/content_lab/outputs")
    parser.add_argument("--snippets", default="public/data/teaching_snippets.json")
    parser.add_argument("--runtime-generated-practice", default="public/data/generated_practice_bank.json")
    parser.add_argument("--question-bank", default="public/assets/exam-bank-data/question_bank.json")
    parser.add_argument("--skip-question-bank-git-check", action="store_true")
    args = parser.parse_args()

    outputs_dir = Path(args.outputs_dir)
    errors: list[str] = []
    warnings: list[str] = []
    source_index: dict[str, dict[str, set[str]]] = {}
    verify_region_support_matches_skill_map(errors)
    try:
        source_index = source_index_from_question_bank(Path(args.question_bank), errors)
    except ValueError as error:
        errors.append(str(error))

    for verifier, path in (
        (verify_skill_targets, outputs_dir / "skill_targets.json"),
        (verify_review_queue, outputs_dir / "review_queue.json"),
    ):
        try:
            verifier(path, errors, warnings)
        except ValueError as error:
            errors.append(str(error))

    snippet_context: dict[str, Any] = {"snippet_ids": set(), "example_ids": set(), "reviewed_snippet_count": 0, "quick_check_count": 0}
    try:
        snippet_context = verify_teaching_snippets(Path(args.snippets), errors, warnings, source_index=source_index)
    except ValueError as error:
        errors.append(str(error))

    try:
        verify_content_lab_report(outputs_dir / "content_lab_report.json", errors, warnings)
    except ValueError as error:
        errors.append(str(error))

    runtime_practice_summary: dict[str, Any] = {"reviewed_generated_practice_count": 0, "generator_families": set()}
    for path, runtime in (
        (outputs_dir / "generated_practice_bank.json", False),
        (Path(args.runtime_generated_practice), True),
    ):
        try:
            summary = verify_generated_practice(path, errors, warnings, runtime=runtime, snippet_context=snippet_context)
            if runtime:
                runtime_practice_summary = summary
        except ValueError as error:
            errors.append(str(error))

    if not args.skip_question_bank_git_check:
        verify_question_bank_not_modified(Path(args.question_bank), errors)

    if errors:
        for warning in warnings:
            print(f"WARNING: {warning}")
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    for warning in warnings:
        print(f"WARNING: {warning}")
    print(
        "Content Lab runtime coverage: "
        f"{snippet_context.get('reviewed_snippet_count', 0)} reviewed teaching snippets, "
        f"{snippet_context.get('quick_check_count', 0)} Quick Checks, "
        f"{runtime_practice_summary.get('reviewed_generated_practice_count', 0)} reviewed generated warm-ups, "
        f"{len(runtime_practice_summary.get('generator_families', set()))} generator families."
    )
    print("Content Lab outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

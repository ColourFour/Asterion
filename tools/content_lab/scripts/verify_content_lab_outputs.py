#!/usr/bin/env python3
"""Verify Content Lab static outputs without adding runtime dependencies."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}
TARGET_REVIEW_STATUSES = {"needs_review", "teacher_reviewed", "published"}
SNIPPET_TYPES = {"concept", "method", "mistake_repair", "quick_check"}


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


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def require_non_empty_string(record: dict[str, Any], key: str, owner: str, errors: list[str]) -> None:
    require(is_non_empty_string(record.get(key)), f"{owner} has empty or missing {key}", errors)


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
    for key in ("prompt", "answer", "explanation"):
        require_non_empty_string(value, key, f"{owner}.quick_check", errors)


def require_guardian_readiness(value: Any, owner: str, errors: list[str]) -> None:
    require(isinstance(value, dict), f"{owner}.guardian_readiness must be an object", errors)
    if not isinstance(value, dict):
        return
    require_string_array(value, "supports_topics", f"{owner}.guardian_readiness", errors, required=True)
    require_string_array(value, "recommended_before_question_ids", f"{owner}.guardian_readiness", errors, required=True)
    require_non_empty_string(value, "readiness_note", f"{owner}.guardian_readiness", errors)


def verify_skill_targets(path: Path, errors: list[str]) -> None:
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
        require(last_sort_key is None or sort_key >= last_sort_key, f"skill_targets not sorted at {skill_target_id}", errors)
        last_sort_key = sort_key


def verify_review_queue(path: Path, errors: list[str]) -> None:
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


def verify_teaching_snippets(path: Path, errors: list[str]) -> None:
    data = load_json(path)
    require(isinstance(data, dict), f"{path} must contain an object", errors)
    if not isinstance(data, dict):
        return
    snippets = data.get("snippets")
    require(isinstance(snippets, list), f"{path} must contain snippets[]", errors)
    if not isinstance(snippets, list):
        return

    seen = set()
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

        for key in ("paper_family", "title", "student_goal", "body", "exam_move", "common_trap", "source"):
            require_non_empty_string(snippet, key, owner, errors)
        require_string_array(snippet, "topics", owner, errors, required=True, min_items=1)
        require_string_array(snippet, "region_ids", owner, errors)
        require_string_array(snippet, "steps", owner, errors, required=True, min_items=1)
        for key in ("prerequisites", "micro_steps", "common_mistakes", "source_question_ids", "source_skill_target_ids"):
            require_string_array(snippet, key, owner, errors)

        quick_check = snippet.get("quick_check")
        if quick_check is not None:
            require_quick_check(quick_check, owner, errors)

        guardian_readiness = snippet.get("guardian_readiness")
        if guardian_readiness is not None:
            require_guardian_readiness(guardian_readiness, owner, errors)

        estimated_time = snippet.get("estimated_time_minutes")
        if estimated_time is not None:
            require(isinstance(estimated_time, (int, float)) and estimated_time > 0, f"{owner}.estimated_time_minutes must be positive", errors)

        snippet_type = snippet.get("snippet_type")
        if snippet_type is not None:
            require(snippet_type in SNIPPET_TYPES, f"{owner}.snippet_type has invalid value", errors)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Content Lab outputs.")
    parser.add_argument("--outputs-dir", default="tools/content_lab/outputs")
    parser.add_argument("--snippets", default="public/data/teaching_snippets.json")
    args = parser.parse_args()

    outputs_dir = Path(args.outputs_dir)
    errors: list[str] = []
    for verifier, path in (
        (verify_skill_targets, outputs_dir / "skill_targets.json"),
        (verify_review_queue, outputs_dir / "review_queue.json"),
        (verify_teaching_snippets, Path(args.snippets)),
    ):
        try:
            verifier(path, errors)
        except ValueError as error:
            errors.append(str(error))

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("Content Lab outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

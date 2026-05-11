#!/usr/bin/env python3
"""Build a deterministic Content Lab coverage report for the reviewed P3 skill map.

The report is internal only. It checks reviewed teaching support and canonical
image-first question evidence without generating new learner-facing content.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


GENERATED_BY = "tools/content_lab/scripts/build_p3_skill_coverage.py"
HIGH_EVIDENCE_QUESTION_COUNT = 5
EXPECTED_SYLLABUS_TOPICS = [
    "Algebra",
    "Logarithmic and exponential functions",
    "Trigonometry",
    "Differentiation",
    "Integration",
    "Numerical solution of equations",
    "Vectors",
    "Differential equations",
    "Complex numbers",
]
ACTIVE_P3_REGION_IDS = {
    "algebra-forge",
    "logarithm-grove",
    "trig-observatory",
    "complex-harbor",
    "calculus-cliffs",
    "integration-gardens",
    "vector-workshop",
    "numerical-mines",
    "differential-shrine",
}
RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}
BLOCKING_TRAINING_STATUS_TOKENS = (
    "blocked",
    "broken",
    "exclude",
    "missing",
    "quarantine",
    "unavailable",
    "untrainable",
)

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SKILL_MAP = REPO_ROOT / "tools/content_lab/skill_maps/caie_9709_p3_skill_map.json"
DEFAULT_QUESTION_BANK = REPO_ROOT / "public/data/question_bank.json"
DEFAULT_SNIPPETS = REPO_ROOT / "public/data/teaching_snippets.json"
DEFAULT_GENERATED_PRACTICE = REPO_ROOT / "public/data/generated_practice_bank.json"
DEFAULT_OUTPUT = REPO_ROOT / "tools/content_lab/outputs/p3_skill_coverage_report.json"


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValueError(f"Missing required file: {path}") from None
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} is not valid JSON: {error}") from None


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def as_record(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def non_empty_string(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return None


def string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def unique_sorted(values: list[str] | set[str]) -> list[str]:
    return sorted({value for value in values if value})


def image_values(record: dict[str, Any], keys: tuple[str, ...]) -> list[str]:
    values: list[str] = []
    for key in keys:
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            values.append(value.strip())
        elif isinstance(value, list):
            values.extend(item.strip() for item in value if isinstance(item, str) and item.strip())
    nested = as_record(record.get("canonical_question_artifact"))
    if nested:
        for key in ("path", "image_path", "question_image_path"):
            value = non_empty_string(nested.get(key))
            if value:
                values.append(value)
    return unique_sorted(values)


def is_blocking_training_status(value: str | None) -> bool:
    if not value:
        return False
    normalized = value.lower()
    return any(token in normalized for token in BLOCKING_TRAINING_STATUS_TOKENS)


def training_blockers_for_record(record: dict[str, Any]) -> list[str]:
    blockers: list[str] = []
    training_status = non_empty_string(record.get("training_status") or record.get("practice_status") or record.get("asset_status"))
    excluded = record.get("exclude_from_training") or record.get("excluded_from_training") or record.get("practice_excluded")
    if excluded is True or (isinstance(excluded, str) and excluded.lower() == "true"):
        blockers.append("explicitly_excluded_from_training")
    if is_blocking_training_status(training_status):
        blockers.append(training_status or "blocked_training_status")
    if not image_values(record, ("question_image_paths", "question_images", "questionImagePaths", "question_image_path", "question_image", "image_path", "image")):
        blockers.append("missing_question_image_metadata")
    if not image_values(record, ("mark_scheme_image_paths", "mark_scheme_images", "markSchemeImagePaths", "mark_scheme_image_path", "mark_scheme_image", "mark_scheme_path", "ms_image")):
        blockers.append("missing_mark_scheme_image_metadata")
    return unique_sorted(blockers)


def question_id(record: dict[str, Any]) -> str | None:
    return non_empty_string(record.get("question_id")) or non_empty_string(record.get("id"))


def question_index_from_bank(data: Any) -> dict[str, dict[str, Any]]:
    root = as_record(data)
    questions = root.get("questions") if isinstance(root.get("questions"), list) else data if isinstance(data, list) else []
    index: dict[str, dict[str, Any]] = {}
    for value in questions:
        record = as_record(value)
        item_id = question_id(record)
        if item_id:
            blockers = training_blockers_for_record(record)
            index[item_id] = {
                "paper_family": non_empty_string(record.get("paper_family")) or "",
                "topic": non_empty_string(record.get("topic")) or "",
                "trainable": not blockers,
                "training_blockers": blockers,
            }
    return index


def snippet_support_index(data: Any) -> dict[str, Any]:
    root = as_record(data)
    snippets = root.get("snippets") if isinstance(root.get("snippets"), list) else []
    snippet_ids: set[str] = set()
    quick_check_ids: set[str] = set()
    guardian_recommended_question_ids: set[str] = set()

    for value in snippets:
        snippet = as_record(value)
        if snippet.get("review_status") not in RUNTIME_REVIEW_STATUSES:
            continue
        snippet_id = non_empty_string(snippet.get("snippet_id"))
        if snippet_id:
            snippet_ids.add(snippet_id)
        quick_check = as_record(snippet.get("quick_check"))
        if quick_check and quick_check.get("review_status") in RUNTIME_REVIEW_STATUSES:
            quick_check_id = non_empty_string(quick_check.get("id"))
            if quick_check_id:
                quick_check_ids.add(quick_check_id)
        guardian = as_record(snippet.get("guardian_readiness"))
        guardian_recommended_question_ids.update(string_list(guardian.get("recommended_before_question_ids")))

    return {
        "snippet_ids": snippet_ids,
        "quick_check_ids": quick_check_ids,
        "guardian_recommended_question_ids": guardian_recommended_question_ids,
    }


def generated_practice_index(data: Any) -> dict[str, Any]:
    root = as_record(data)
    items = root.get("items") if isinstance(root.get("items"), list) else []
    family_counts: dict[str, int] = {}
    for value in items:
        item = as_record(value)
        verification = as_record(item.get("verification"))
        if item.get("review_status") not in RUNTIME_REVIEW_STATUSES or verification.get("status") != "pass":
            continue
        family = non_empty_string(item.get("generator_family"))
        if family:
            family_counts[family] = family_counts.get(family, 0) + 1
    return {
        "generator_families": set(family_counts),
        "generator_family_counts": family_counts,
    }


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def validate_skill_map(data: Any) -> list[dict[str, Any]]:
    errors: list[str] = []
    root = as_record(data)
    require(root.get("schema_name") == "asterion_p3_skill_map", "skill map schema_name must be asterion_p3_skill_map", errors)
    require(root.get("paper_family") == "p3", "skill map paper_family must be p3", errors)
    require(root.get("review_status") == "reviewed", "skill map must be reviewed", errors)
    skills = root.get("skills")
    require(isinstance(skills, list), "skill map must contain skills[]", errors)
    if not isinstance(skills, list):
        raise ValueError("; ".join(errors))

    skill_ids: set[str] = set()
    topics: set[str] = set()
    required_fields = (
        "skill_id",
        "syllabus_topic",
        "region_id",
        "micro_skill_name",
        "recognizer_signals",
        "common_errors",
        "prerequisite_skills",
        "canonical_source_question_ids",
        "supported_by_snippet_ids",
        "supported_by_quick_check_ids",
        "supported_by_generator_families",
        "supported_by_guardian_candidates",
    )

    records: list[dict[str, Any]] = []
    for index, value in enumerate(skills):
        skill = as_record(value)
        if not skill:
            errors.append(f"skills[{index}] must be an object")
            continue
        records.append(skill)
        skill_id = non_empty_string(skill.get("skill_id"))
        owner = skill_id or f"skills[{index}]"
        require(bool(skill_id), f"{owner} missing skill_id", errors)
        if skill_id:
            require(bool(re.fullmatch(r"p3_[a-z0-9_]+", skill_id)), f"{owner} has invalid skill_id", errors)
            require(skill_id not in skill_ids, f"duplicate skill_id {skill_id}", errors)
            skill_ids.add(skill_id)
        for field in required_fields:
            require(field in skill, f"{owner} missing {field}", errors)
        for field in (
            "recognizer_signals",
            "common_errors",
            "prerequisite_skills",
            "canonical_source_question_ids",
            "supported_by_snippet_ids",
            "supported_by_quick_check_ids",
            "supported_by_generator_families",
            "supported_by_guardian_candidates",
        ):
            require(isinstance(skill.get(field), list), f"{owner}.{field} must be an array", errors)
        require(bool(string_list(skill.get("recognizer_signals"))), f"{owner}.recognizer_signals must not be empty", errors)
        require(bool(string_list(skill.get("common_errors"))), f"{owner}.common_errors must not be empty", errors)
        region_id = non_empty_string(skill.get("region_id"))
        require(region_id in ACTIVE_P3_REGION_IDS, f"{owner} has unknown P3 region_id {region_id}", errors)
        topic = non_empty_string(skill.get("syllabus_topic"))
        if topic:
            topics.add(topic)

    for skill in records:
        owner = str(skill.get("skill_id"))
        for prerequisite_id in string_list(skill.get("prerequisite_skills")):
            require(prerequisite_id in skill_ids, f"{owner} has unknown prerequisite skill {prerequisite_id}", errors)

    missing_topics = sorted(set(EXPECTED_SYLLABUS_TOPICS) - topics)
    extra_topics = sorted(topics - set(EXPECTED_SYLLABUS_TOPICS))
    for topic in missing_topics:
        errors.append(f"skill map missing required syllabus topic: {topic}")
    for topic in extra_topics:
        errors.append(f"skill map contains unexpected syllabus topic: {topic}")

    if errors:
        raise ValueError("; ".join(errors))
    return records


def gap_entry(skill_report: dict[str, Any], reasons: list[str] | None = None) -> dict[str, Any]:
    entry = {
        "skill_id": skill_report["skill_id"],
        "syllabus_topic": skill_report["syllabus_topic"],
        "region_id": skill_report["region_id"],
        "micro_skill_name": skill_report["micro_skill_name"],
    }
    if reasons:
        entry["reasons"] = reasons
    return entry


def skill_coverage(
    skill: dict[str, Any],
    question_index: dict[str, dict[str, Any]],
    snippet_index: dict[str, Any],
    generated_index: dict[str, Any],
) -> dict[str, Any]:
    canonical_ids = string_list(skill.get("canonical_source_question_ids"))
    snippet_ids = string_list(skill.get("supported_by_snippet_ids"))
    quick_check_ids = string_list(skill.get("supported_by_quick_check_ids"))
    generator_families = string_list(skill.get("supported_by_generator_families"))
    guardian_candidate_ids = string_list(skill.get("supported_by_guardian_candidates"))

    resolved_trainable_ids = [
        question_id
        for question_id in canonical_ids
        if question_index.get(question_id, {}).get("trainable") is True
    ]
    unresolved_question_ids = [question_id for question_id in canonical_ids if question_id not in question_index]
    untrainable_question_ids = [
        question_id
        for question_id in canonical_ids
        if question_id in question_index and question_index[question_id].get("trainable") is not True
    ]

    resolved_snippet_ids = [snippet_id for snippet_id in snippet_ids if snippet_id in snippet_index["snippet_ids"]]
    resolved_quick_check_ids = [quick_check_id for quick_check_id in quick_check_ids if quick_check_id in snippet_index["quick_check_ids"]]
    resolved_generator_families = [family for family in generator_families if family in generated_index["generator_families"]]
    resolved_guardian_candidates = [
        question_id
        for question_id in guardian_candidate_ids
        if question_index.get(question_id, {}).get("trainable") is True
    ]

    warm_up_item_count = sum(generated_index["generator_family_counts"].get(family, 0) for family in resolved_generator_families)
    weak_support_reasons: list[str] = []
    if not resolved_snippet_ids:
        weak_support_reasons.append("no_reviewed_snippet")
    if not resolved_quick_check_ids:
        weak_support_reasons.append("no_reviewed_quick_check")
    if not resolved_generator_families:
        weak_support_reasons.append("no_reviewed_generated_warm_up")

    report = {
        "canonical_source_question_count": len(canonical_ids),
        "has_generated_warm_up": bool(resolved_generator_families),
        "has_quick_check": bool(resolved_quick_check_ids),
        "has_snippet": bool(resolved_snippet_ids),
        "has_trainable_canonical_question": bool(resolved_trainable_ids),
        "high_evidence": len(resolved_trainable_ids) >= HIGH_EVIDENCE_QUESTION_COUNT,
        "micro_skill_name": skill["micro_skill_name"],
        "region_id": skill["region_id"],
        "resolved_generator_families": resolved_generator_families,
        "resolved_guardian_candidates": resolved_guardian_candidates,
        "resolved_quick_check_ids": resolved_quick_check_ids,
        "resolved_snippet_ids": resolved_snippet_ids,
        "resolved_trainable_canonical_question_ids": resolved_trainable_ids,
        "skill_id": skill["skill_id"],
        "syllabus_topic": skill["syllabus_topic"],
        "trainable_canonical_question_count": len(resolved_trainable_ids),
        "unresolved_generator_families": [family for family in generator_families if family not in generated_index["generator_families"]],
        "unresolved_guardian_candidates": [question_id for question_id in guardian_candidate_ids if question_id not in question_index],
        "unresolved_quick_check_ids": [quick_check_id for quick_check_id in quick_check_ids if quick_check_id not in snippet_index["quick_check_ids"]],
        "unresolved_question_ids": unresolved_question_ids,
        "unresolved_snippet_ids": [snippet_id for snippet_id in snippet_ids if snippet_id not in snippet_index["snippet_ids"]],
        "untrainable_canonical_question_ids": untrainable_question_ids,
        "warm_up_item_count": warm_up_item_count,
        "weak_support_reasons": weak_support_reasons,
    }
    report["high_evidence_weak_teaching_support"] = bool(report["high_evidence"] and weak_support_reasons)
    return report


def grouped_rows(skill_reports: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for report in skill_reports:
        groups.setdefault(str(report[key]), []).append(report)

    rows = []
    for group_id in sorted(groups):
        reports = groups[group_id]
        rows.append({
            key: group_id,
            "total_skills": len(reports),
            "skills_with_snippet": sum(1 for report in reports if report["has_snippet"]),
            "skills_with_quick_check": sum(1 for report in reports if report["has_quick_check"]),
            "skills_with_generated_warm_up": sum(1 for report in reports if report["has_generated_warm_up"]),
            "skills_with_trainable_canonical_question": sum(1 for report in reports if report["has_trainable_canonical_question"]),
            "high_evidence_weak_teaching_support": sum(1 for report in reports if report["high_evidence_weak_teaching_support"]),
        })
    return rows


def build_report(
    *,
    skill_map_path: Path,
    question_bank_path: Path,
    snippets_path: Path,
    generated_practice_path: Path,
) -> dict[str, Any]:
    skills = validate_skill_map(load_json(skill_map_path))
    question_index = question_index_from_bank(load_json(question_bank_path))
    snippet_index = snippet_support_index(load_json(snippets_path))
    generated_index = generated_practice_index(load_json(generated_practice_path))

    skill_reports = [
        skill_coverage(skill, question_index, snippet_index, generated_index)
        for skill in sorted(skills, key=lambda item: str(item["skill_id"]))
    ]

    skills_with_no_snippet = [gap_entry(report) for report in skill_reports if not report["has_snippet"]]
    skills_with_no_quick_check = [gap_entry(report) for report in skill_reports if not report["has_quick_check"]]
    skills_with_no_generated_warm_up = [gap_entry(report) for report in skill_reports if not report["has_generated_warm_up"]]
    skills_with_no_trainable_canonical_question = [gap_entry(report) for report in skill_reports if not report["has_trainable_canonical_question"]]
    high_evidence_weak = [
        gap_entry(report, report["weak_support_reasons"])
        for report in skill_reports
        if report["high_evidence_weak_teaching_support"]
    ]
    unresolved_reference_warnings = [
        {
            "skill_id": report["skill_id"],
            "unresolved_question_ids": report["unresolved_question_ids"],
            "untrainable_canonical_question_ids": report["untrainable_canonical_question_ids"],
            "unresolved_snippet_ids": report["unresolved_snippet_ids"],
            "unresolved_quick_check_ids": report["unresolved_quick_check_ids"],
            "unresolved_generator_families": report["unresolved_generator_families"],
            "unresolved_guardian_candidates": report["unresolved_guardian_candidates"],
        }
        for report in skill_reports
        if (
            report["unresolved_question_ids"]
            or report["untrainable_canonical_question_ids"]
            or report["unresolved_snippet_ids"]
            or report["unresolved_quick_check_ids"]
            or report["unresolved_generator_families"]
            or report["unresolved_guardian_candidates"]
        )
    ]

    ready = not (
        skills_with_no_snippet
        or skills_with_no_quick_check
        or skills_with_no_generated_warm_up
        or skills_with_no_trainable_canonical_question
        or high_evidence_weak
        or unresolved_reference_warnings
    )

    def display_path(path: Path) -> str:
        try:
            return str(path.resolve().relative_to(REPO_ROOT))
        except ValueError:
            return str(path)

    return {
        "dashboard": {
            "coverage_by_region": grouped_rows(skill_reports, "region_id"),
            "coverage_by_syllabus_topic": grouped_rows(skill_reports, "syllabus_topic"),
            "readiness_label": "ready" if ready else "not_ready",
            "ready_for_full_p3_learning": ready,
        },
        "generated_by": GENERATED_BY,
        "gaps": {
            "high_evidence_skills_with_weak_teaching_support": high_evidence_weak,
            "skills_with_no_generated_warm_up": skills_with_no_generated_warm_up,
            "skills_with_no_quick_check": skills_with_no_quick_check,
            "skills_with_no_snippet": skills_with_no_snippet,
            "skills_with_no_trainable_canonical_question": skills_with_no_trainable_canonical_question,
        },
        "inputs": {
            "generated_practice": display_path(generated_practice_path),
            "question_bank": display_path(question_bank_path),
            "skill_map": display_path(skill_map_path),
            "snippets": display_path(snippets_path),
        },
        "schema_name": "asterion_p3_skill_coverage_report",
        "schema_version": 1,
        "settings": {
            "high_evidence_question_count": HIGH_EVIDENCE_QUESTION_COUNT,
        },
        "skills": skill_reports,
        "summary": {
            "high_evidence_skills": sum(1 for report in skill_reports if report["high_evidence"]),
            "high_evidence_weak_teaching_support": len(high_evidence_weak),
            "ready_for_full_p3_learning": ready,
            "skills_with_generated_warm_up": sum(1 for report in skill_reports if report["has_generated_warm_up"]),
            "skills_with_quick_check": sum(1 for report in skill_reports if report["has_quick_check"]),
            "skills_with_snippet": sum(1 for report in skill_reports if report["has_snippet"]),
            "skills_with_trainable_canonical_question": sum(1 for report in skill_reports if report["has_trainable_canonical_question"]),
            "total_skills": len(skill_reports),
        },
        "unresolved_reference_warnings": unresolved_reference_warnings,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a P3 skill-map coverage report for Content Lab.")
    parser.add_argument("--skill-map", type=Path, default=DEFAULT_SKILL_MAP)
    parser.add_argument("--question-bank", type=Path, default=DEFAULT_QUESTION_BANK)
    parser.add_argument("--snippets", type=Path, default=DEFAULT_SNIPPETS)
    parser.add_argument("--generated-practice", type=Path, default=DEFAULT_GENERATED_PRACTICE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        report = build_report(
            skill_map_path=args.skill_map,
            question_bank_path=args.question_bank,
            snippets_path=args.snippets,
            generated_practice_path=args.generated_practice,
        )
        write_json(args.output, report)
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    summary = report["summary"]
    gaps = report["gaps"]
    print(
        "P3 skill coverage: "
        f"{summary['total_skills']} skills; "
        f"ready_for_full_p3_learning={str(summary['ready_for_full_p3_learning']).lower()}"
    )
    print(
        "Gaps: "
        f"no_snippet={len(gaps['skills_with_no_snippet'])}, "
        f"no_quick_check={len(gaps['skills_with_no_quick_check'])}, "
        f"no_generated_warm_up={len(gaps['skills_with_no_generated_warm_up'])}, "
        f"no_trainable_question={len(gaps['skills_with_no_trainable_canonical_question'])}, "
        f"high_evidence_weak_support={len(gaps['high_evidence_skills_with_weak_teaching_support'])}"
    )
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

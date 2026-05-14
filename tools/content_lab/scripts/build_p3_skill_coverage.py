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
EXPECTED_PRIMARY_CURRICULUM_TARGET = {
    "syllabus_id": "caie_9709_p3_2026_2027",
    "syllabus_code": "9709",
    "component": "Paper 3",
    "component_title": "Pure Mathematics 3",
    "paper_family": "p3",
    "syllabus_version": "Version 4",
}
EXPECTED_SUPPORTING_PREREQUISITE_TARGET = {
    "syllabus_id": "caie_9709_p1_2026_2027",
    "syllabus_code": "9709",
    "component": "Paper 1",
    "component_title": "Pure Mathematics 1",
    "paper_family": "p1",
    "role": "prerequisite_support",
}
EXPECTED_CURRICULUM_EXAM_YEARS = ["2026", "2027"]
EXPECTED_CURRICULUM_SOURCE_URLS = {
    "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-mathematics-9709/",
    "https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf",
}
ALLOWED_CURRICULUM_ROLES = {
    "p3_core",
    "bridge",
    "p1_prerequisite",
    "ambiguous",
    "out_of_scope",
}
NON_MASTERY_CURRICULUM_ROLES = {"p1_prerequisite", "out_of_scope"}
ALLOWED_PREREQUISITE_RELATIONSHIPS = {"supports"}
ALLOWED_P1_PREREQUISITE_SKILL_REFS = {
    "algebraic_manipulation",
    "coordinate_geometry",
    "differentiation_basics",
    "functions_and_graphs",
    "integration_basics",
    "radians_and_trigonometry",
    "sequences_and_series",
    "trigonometric_identities",
}
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
DEFAULT_QUESTION_BANK = REPO_ROOT / "public/assets/exam-bank-data/question_bank.json"
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


def validate_target_fields(
    target: dict[str, Any],
    expected: dict[str, str],
    owner: str,
    errors: list[str],
) -> None:
    for field, expected_value in expected.items():
        require(non_empty_string(target.get(field)) == expected_value, f"{owner}.{field} must be {expected_value}", errors)
    require(string_list(target.get("exam_years")) == EXPECTED_CURRICULUM_EXAM_YEARS, f"{owner}.exam_years must be {EXPECTED_CURRICULUM_EXAM_YEARS}", errors)
    source_urls = set(string_list(target.get("source_urls")))
    require(EXPECTED_CURRICULUM_SOURCE_URLS.issubset(source_urls), f"{owner}.source_urls must include official 9709 syllabus and qualification URLs", errors)
    require(bool(non_empty_string(target.get("scope_note"))), f"{owner}.scope_note must not be empty", errors)


def validate_curriculum_targets(root: dict[str, Any], errors: list[str]) -> set[str]:
    targets = as_record(root.get("curriculum_targets"))
    require(bool(targets), "skill map missing curriculum_targets", errors)
    if not targets:
        return set()

    primary = as_record(targets.get("primary"))
    require(bool(primary), "curriculum_targets.primary must be an object", errors)
    if primary:
        validate_target_fields(primary, EXPECTED_PRIMARY_CURRICULUM_TARGET, "curriculum_targets.primary", errors)
        require(bool(non_empty_string(primary.get("published"))), "curriculum_targets.primary.published must not be empty", errors)

    supporting = targets.get("supporting_prerequisites")
    require(isinstance(supporting, list), "curriculum_targets.supporting_prerequisites must be an array", errors)
    supporting_targets = [as_record(value) for value in supporting] if isinstance(supporting, list) else []
    supporting_target_ids = {
        target_id
        for target in supporting_targets
        if (target_id := non_empty_string(target.get("syllabus_id")))
    }
    p1_target = next((target for target in supporting_targets if non_empty_string(target.get("syllabus_id")) == "caie_9709_p1_2026_2027"), None)
    require(bool(p1_target), "curriculum_targets.supporting_prerequisites must include caie_9709_p1_2026_2027", errors)
    if p1_target:
        validate_target_fields(p1_target, EXPECTED_SUPPORTING_PREREQUISITE_TARGET, "curriculum_targets.supporting_prerequisites.caie_9709_p1_2026_2027", errors)

    mastery_policy = as_record(targets.get("mastery_policy"))
    require(bool(mastery_policy), "curriculum_targets.mastery_policy must be an object", errors)
    if mastery_policy:
        for field in ("p3_mastery_evidence", "p1_prerequisite_use", "reporting_boundary"):
            require(bool(non_empty_string(mastery_policy.get(field))), f"curriculum_targets.mastery_policy.{field} must not be empty", errors)

    require(bool(non_empty_string(targets.get("reviewed_at"))), "curriculum_targets.reviewed_at must not be empty", errors)
    require(bool(non_empty_string(targets.get("review_source_note"))), "curriculum_targets.review_source_note must not be empty", errors)
    return supporting_target_ids


def validate_prerequisite_skill_refs(
    skill: dict[str, Any],
    owner: str,
    supporting_target_ids: set[str],
    errors: list[str],
) -> None:
    refs = skill.get("prerequisite_skill_refs")
    if not isinstance(refs, list):
        return

    seen_refs: set[tuple[str, str, str]] = set()
    allowed_keys = {"syllabus_id", "skill_ref", "relationship"}
    for index, value in enumerate(refs):
        ref_owner = f"{owner}.prerequisite_skill_refs[{index}]"
        ref = as_record(value)
        if not ref:
            errors.append(f"{ref_owner} must be an object")
            continue
        extra_keys = sorted(set(ref) - allowed_keys)
        require(not extra_keys, f"{ref_owner} has unexpected fields: {', '.join(extra_keys)}", errors)

        syllabus_id = non_empty_string(ref.get("syllabus_id"))
        skill_ref = non_empty_string(ref.get("skill_ref"))
        relationship = non_empty_string(ref.get("relationship"))
        require(bool(syllabus_id), f"{ref_owner}.syllabus_id must not be empty", errors)
        require(bool(skill_ref), f"{ref_owner}.skill_ref must not be empty", errors)
        require(bool(relationship), f"{ref_owner}.relationship must not be empty", errors)
        if not (syllabus_id and skill_ref and relationship):
            continue

        require(
            syllabus_id in supporting_target_ids,
            f"{ref_owner}.syllabus_id references unknown curriculum target {syllabus_id}",
            errors,
        )
        if syllabus_id == "caie_9709_p1_2026_2027":
            require(
                skill_ref in ALLOWED_P1_PREREQUISITE_SKILL_REFS,
                f"{ref_owner}.skill_ref must be a known P1 prerequisite skill reference",
                errors,
            )
        require(
            relationship in ALLOWED_PREREQUISITE_RELATIONSHIPS,
            f"{ref_owner}.relationship must be one of {sorted(ALLOWED_PREREQUISITE_RELATIONSHIPS)}",
            errors,
        )

        ref_key = (syllabus_id, skill_ref, relationship)
        require(ref_key not in seen_refs, f"{ref_owner} duplicates an earlier prerequisite reference", errors)
        seen_refs.add(ref_key)


def validate_skill_map(data: Any) -> list[dict[str, Any]]:
    errors: list[str] = []
    root = as_record(data)
    require(root.get("schema_name") == "asterion_p3_skill_map", "skill map schema_name must be asterion_p3_skill_map", errors)
    require(isinstance(root.get("schema_version"), int) and root.get("schema_version") >= 2, "skill map schema_version must be at least 2", errors)
    require(root.get("paper_family") == "p3", "skill map paper_family must be p3", errors)
    require(root.get("review_status") == "reviewed", "skill map must be reviewed", errors)
    supporting_target_ids = validate_curriculum_targets(root, errors)
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
        "curriculum_role",
        "mastery_eligible",
        "prerequisite_skill_refs",
        "prerequisite_notes",
        "needs_teacher_review",
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
            "prerequisite_skill_refs",
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
        curriculum_role = non_empty_string(skill.get("curriculum_role"))
        require(bool(curriculum_role), f"{owner} missing curriculum_role", errors)
        require(curriculum_role in ALLOWED_CURRICULUM_ROLES, f"{owner} has unknown curriculum_role {curriculum_role}", errors)
        require(isinstance(skill.get("mastery_eligible"), bool), f"{owner} missing mastery_eligible", errors)
        require(isinstance(skill.get("needs_teacher_review"), bool), f"{owner} missing needs_teacher_review", errors)
        require(isinstance(skill.get("prerequisite_notes"), str), f"{owner}.prerequisite_notes must be a string", errors)
        if curriculum_role in NON_MASTERY_CURRICULUM_ROLES:
            require(skill.get("mastery_eligible") is False, f"{owner} cannot be mastery_eligible when curriculum_role is {curriculum_role}", errors)
        if curriculum_role == "ambiguous" and skill.get("mastery_eligible") is True:
            require(skill.get("needs_teacher_review") is True, f"{owner} ambiguous mastery_eligible skills must need teacher review", errors)
        validate_prerequisite_skill_refs(skill, owner, supporting_target_ids, errors)
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
        "curriculum_role": skill["curriculum_role"],
        "has_generated_warm_up": bool(resolved_generator_families),
        "has_quick_check": bool(resolved_quick_check_ids),
        "has_snippet": bool(resolved_snippet_ids),
        "has_trainable_canonical_question": bool(resolved_trainable_ids),
        "high_evidence": len(resolved_trainable_ids) >= HIGH_EVIDENCE_QUESTION_COUNT,
        "mastery_eligible": skill["mastery_eligible"],
        "micro_skill_name": skill["micro_skill_name"],
        "needs_teacher_review": skill["needs_teacher_review"],
        "prerequisite_notes": skill["prerequisite_notes"],
        "prerequisite_skill_refs": skill["prerequisite_skill_refs"],
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


def curriculum_metadata_summary(skill_reports: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "mastery_eligible_skills": sum(1 for report in skill_reports if report["mastery_eligible"]),
        "skills_by_curriculum_role": {
            role: sum(1 for report in skill_reports if report["curriculum_role"] == role)
            for role in sorted(ALLOWED_CURRICULUM_ROLES)
        },
        "skills_needing_teacher_review": sum(1 for report in skill_reports if report["needs_teacher_review"]),
        "skills_with_prerequisite_refs": sum(1 for report in skill_reports if report["prerequisite_skill_refs"]),
    }


def build_report(
    *,
    skill_map_path: Path,
    question_bank_path: Path,
    snippets_path: Path,
    generated_practice_path: Path,
) -> dict[str, Any]:
    skill_map_data = load_json(skill_map_path)
    skills = validate_skill_map(skill_map_data)
    curriculum_targets = as_record(as_record(skill_map_data).get("curriculum_targets"))
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
    metadata_summary = curriculum_metadata_summary(skill_reports)

    def display_path(path: Path) -> str:
        try:
            return str(path.resolve().relative_to(REPO_ROOT))
        except ValueError:
            return str(path)

    return {
        "dashboard": {
            "coverage_by_curriculum_role": grouped_rows(skill_reports, "curriculum_role"),
            "coverage_by_region": grouped_rows(skill_reports, "region_id"),
            "coverage_by_syllabus_topic": grouped_rows(skill_reports, "syllabus_topic"),
            "readiness_label": "ready" if ready else "not_ready",
            "ready_for_full_p3_learning": ready,
        },
        "curriculum_targets": curriculum_targets,
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
            **metadata_summary,
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
    role_counts = ", ".join(
        f"{role}={count}"
        for role, count in summary["skills_by_curriculum_role"].items()
    )
    print(
        "Curriculum metadata: "
        f"roles=({role_counts}), "
        f"mastery_eligible={summary['mastery_eligible_skills']}, "
        f"with_prerequisite_refs={summary['skills_with_prerequisite_refs']}, "
        f"needs_teacher_review={summary['skills_needing_teacher_review']}"
    )
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build the deterministic teacher-facing P3 coverage matrix.

The matrix is a reporting and prioritization layer over the reviewed P3 skill
map and the P3 content inventory. It does not generate learner content.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from build_p3_skill_coverage import as_record, load_json, non_empty_string, string_list, unique_sorted, validate_skill_map


GENERATED_BY = "tools/content_lab/scripts/build_p3_coverage_matrix.py"
GENERATED_LABEL = "deterministic-p3-coverage-matrix-v1"
REPORT_SCHEMA_NAME = "asterion_p3_coverage_matrix"
REPORT_SCHEMA_VERSION = 1
EXPECTED_SKILL_MAP_SCHEMA_NAME = "asterion_p3_skill_map"
EXPECTED_INVENTORY_SCHEMA_NAME = "asterion_p3_content_inventory_report"
EXPECTED_INVENTORY_SCHEMA_VERSION = 1

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SKILL_MAP = REPO_ROOT / "tools/content_lab/skill_maps/caie_9709_p3_skill_map.json"
DEFAULT_INVENTORY = REPO_ROOT / "tools/content_lab/reports/p3_content_inventory_report.json"
DEFAULT_JSON_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_coverage_matrix.json"
DEFAULT_MARKDOWN_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_coverage_matrix.md"

EXPECTED_TEACHING_SUPPORT_TYPES = ["field_guide", "snippet", "worked_example", "quick_check", "warm_up"]
CORE_SUPPORT_TYPES = ["snippet", "worked_example", "quick_check"]
COVERAGE_STATUS_LABELS = {
    "ready_for_review",
    "partial",
    "missing_support",
    "needs_teacher_review",
    "blocked_for_mastery",
}
CORRECTION_PRIORITY_LABELS = {
    "P0_blocked_mastery",
    "P1_missing_core_support",
    "P2_missing_practice_support",
    "P3_teacher_review_backlog",
    "P4_polish_or_complete",
}
INVENTORY_STATUS_LABELS = {"ready", "partial", "missing", "needs_review", "blocked"}
MASTERY_SAFETY_RISK_FLAGS = {
    "mastery_evidence_deferred",
    "teacher_review_deferred",
    "teacher_review_app_region_mismatch",
    "unreviewed_app_region_routing_mismatch",
}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_text(path: Path, payload: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload, encoding="utf-8")


def count_by(rows: list[dict[str, Any]], key: str, labels: list[str] | None = None) -> dict[str, int]:
    keys = labels or sorted({str(row.get(key, "")) for row in rows if row.get(key)})
    return {item: sum(1 for row in rows if row.get(key) == item) for item in keys}


def support_status(count: int) -> str:
    return "available" if count > 0 else "missing"


def missing_expected_support(row: dict[str, Any]) -> list[str]:
    missing = set(string_list(row.get("missing_support_types")))
    return [support_type for support_type in EXPECTED_TEACHING_SUPPORT_TYPES if support_type in missing]


def clean_mastery_evidence_ids(row: dict[str, Any]) -> list[str]:
    blocked = set(string_list(row.get("mastery_evidence_blocked_question_ids")))
    deferred = set(string_list(row.get("teacher_review_deferred_question_ids")))
    return [
        question_id
        for question_id in string_list(row.get("mastery_evidence_question_ids"))
        if question_id not in blocked and question_id not in deferred
    ]


def blocking_reasons(row: dict[str, Any], skill: dict[str, Any], clean_count: int) -> list[str]:
    reasons: list[str] = []
    deferred_count = len(string_list(row.get("teacher_review_deferred_question_ids")))
    available_evidence = len(set(string_list(row.get("canonical_question_ids"))) | set(string_list(row.get("practice_allowed_deferred_question_ids"))))

    if skill.get("mastery_eligible") is not True:
        reasons.append("skill_not_mastery_eligible")
    if clean_count == 0:
        reasons.append("no_clean_mastery_evidence")
    if clean_count == 0 and deferred_count > 0 and available_evidence > 0:
        reasons.append("all_available_evidence_deferred")
    if skill.get("needs_teacher_review") is True:
        reasons.append("skill_teacher_review_gated")
    if string_list(row.get("unreviewed_app_region_mismatch_question_ids")):
        reasons.append("unreviewed_app_region_mismatch")
    if clean_count == 0 and string_list(row.get("mastery_evidence_blocked_question_ids")):
        reasons.append("mastery_evidence_blocked_by_routing_audit")
    return unique_sorted(reasons)


def coverage_status(row: dict[str, Any], skill: dict[str, Any], missing_support: list[str], blockers: list[str], clean_count: int) -> str:
    deferred_count = len(string_list(row.get("teacher_review_deferred_question_ids")))
    if blockers:
        return "blocked_for_mastery"
    if deferred_count > 0 or row.get("instructional_status") == "needs_review":
        return "needs_teacher_review"
    if missing_support:
        return "missing_support"
    if (
        skill.get("curriculum_role") == "p3_core"
        and clean_count > 0
        and not missing_support
        and len(string_list(row.get("guardian_candidate_question_ids"))) > 0
    ):
        return "ready_for_review"
    return "partial"


def correction_priority(row: dict[str, Any], missing_support: list[str], blockers: list[str], clean_count: int) -> str:
    deferred_count = len(string_list(row.get("teacher_review_deferred_question_ids")))
    if blockers or clean_count == 0:
        return "P0_blocked_mastery"
    if any(item in missing_support for item in CORE_SUPPORT_TYPES):
        return "P1_missing_core_support"
    if "warm_up" in missing_support:
        return "P2_missing_practice_support"
    if deferred_count > 0 or row.get("instructional_status") == "needs_review":
        return "P3_teacher_review_backlog"
    return "P4_polish_or_complete"


def next_action(status: str, priority: str, missing_support: list[str], blockers: list[str], deferred_count: int) -> str:
    if priority == "P0_blocked_mastery":
        if "all_available_evidence_deferred" in blockers:
            return "Find or review clean P3 canonical mastery evidence before claiming mastery."
        return "Resolve mastery-safety blockers before using this skill for mastery claims."
    if priority == "P1_missing_core_support":
        return "Add reviewed snippet, worked-example, or Quick Check support for the missing core support types."
    if priority == "P2_missing_practice_support":
        return "Add reviewed deterministic warm-up support after core teaching support is safe."
    if deferred_count > 0:
        return "Keep deferred cases visible and route them through teacher review before export or mastery claims."
    if missing_support:
        return "Complete the remaining support gaps and rerun the matrix."
    if status == "ready_for_review":
        return "Teacher review can confirm this row for region-by-region correction planning."
    return "Review support and evidence balance before marking this skill complete."


def validate_inputs(skill_map: dict[str, Any], inventory: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    errors: list[str] = []
    if skill_map.get("schema_name") != EXPECTED_SKILL_MAP_SCHEMA_NAME:
        errors.append(f"skill map schema_name must be {EXPECTED_SKILL_MAP_SCHEMA_NAME}")
    if inventory.get("schema_name") != EXPECTED_INVENTORY_SCHEMA_NAME:
        errors.append(f"inventory schema_name must be {EXPECTED_INVENTORY_SCHEMA_NAME}")
    if inventory.get("schema_version") != EXPECTED_INVENTORY_SCHEMA_VERSION:
        errors.append(f"inventory schema_version must be {EXPECTED_INVENTORY_SCHEMA_VERSION}")

    try:
        skills = validate_skill_map(skill_map)
    except ValueError as error:
        errors.append(str(error))
        skills = []

    skill_by_ref = {str(skill["skill_id"]): skill for skill in skills}
    region_rows = as_record(inventory).get("per_region_inventory")
    if not isinstance(region_rows, list):
        errors.append("inventory per_region_inventory must be a list")
        region_rows = []
    region_by_id = {
        str(as_record(region).get("region_id")): as_record(region)
        for region in region_rows
        if non_empty_string(as_record(region).get("region_id"))
    }

    inventory_rows = as_record(inventory).get("per_skill_inventory")
    if not isinstance(inventory_rows, list):
        errors.append("inventory per_skill_inventory must be a list")
        inventory_rows = []

    rows_by_skill: dict[str, dict[str, Any]] = {}
    for index, raw_row in enumerate(inventory_rows, start=1):
        row = as_record(raw_row)
        skill_ref = non_empty_string(row.get("skill_ref"))
        if not skill_ref:
            errors.append(f"inventory per_skill_inventory row {index} is missing skill_ref")
            continue
        if skill_ref not in skill_by_ref:
            errors.append(f"inventory row {skill_ref} references unknown reviewed P3 skill")
        if skill_ref in rows_by_skill:
            errors.append(f"inventory has duplicate row for reviewed skill {skill_ref}")
        rows_by_skill[skill_ref] = row

        region_id = non_empty_string(row.get("region_id"))
        if not region_id or region_id not in region_by_id:
            errors.append(f"inventory row {skill_ref} references unknown region_id {region_id}")
        if row.get("instructional_status") not in INVENTORY_STATUS_LABELS:
            errors.append(f"inventory row {skill_ref} has invalid instructional_status {row.get('instructional_status')}")

        raw_mastery_ids = set(string_list(row.get("mastery_evidence_question_ids")))
        clean_ids = set(clean_mastery_evidence_ids(row))
        deferred_ids = set(string_list(row.get("teacher_review_deferred_question_ids")))
        blocked_ids = set(string_list(row.get("mastery_evidence_blocked_question_ids")))
        if raw_mastery_ids.intersection(deferred_ids):
            errors.append(f"inventory row {skill_ref} counts deferred evidence as clean mastery evidence")
        if raw_mastery_ids.intersection(blocked_ids):
            errors.append(f"inventory row {skill_ref} counts blocked evidence as clean mastery evidence")
        if row.get("mastery_evidence_question_count") != len(clean_mastery_evidence_ids(row)):
            errors.append(f"inventory row {skill_ref} mastery_evidence_question_count does not match clean evidence ids")

    missing_skill_refs = sorted(set(skill_by_ref) - set(rows_by_skill))
    extra_skill_refs = sorted(set(rows_by_skill) - set(skill_by_ref))
    if missing_skill_refs:
        errors.append(f"inventory is missing reviewed skill rows: {', '.join(missing_skill_refs)}")
    if extra_skill_refs:
        errors.append(f"inventory has non-reviewed skill rows: {', '.join(extra_skill_refs)}")

    if errors:
        raise ValueError("; ".join(errors))
    return sorted(skills, key=lambda item: str(item["skill_id"])), rows_by_skill, region_by_id


def build_matrix_rows(
    skills: list[dict[str, Any]],
    inventory_rows_by_skill: dict[str, dict[str, Any]],
    region_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for skill in skills:
        skill_ref = str(skill["skill_id"])
        inventory = inventory_rows_by_skill[skill_ref]
        region_id = str(inventory["region_id"])
        region = region_by_id[region_id]
        clean_ids = clean_mastery_evidence_ids(inventory)
        deferred_ids = string_list(inventory.get("teacher_review_deferred_question_ids"))
        missing_support = missing_expected_support(inventory)
        blockers = blocking_reasons(inventory, skill, len(clean_ids))
        status = coverage_status(inventory, skill, missing_support, blockers, len(clean_ids))
        priority = correction_priority(inventory, missing_support, blockers, len(clean_ids))
        if status not in COVERAGE_STATUS_LABELS:
            raise ValueError(f"{skill_ref} produced invalid coverage_status {status}")
        if priority not in CORRECTION_PRIORITY_LABELS:
            raise ValueError(f"{skill_ref} produced invalid correction_priority {priority}")

        rows.append({
            "blocking_reasons": blockers,
            "canonical_question_count": len(string_list(inventory.get("canonical_question_ids"))),
            "clean_mastery_evidence_count": len(clean_ids),
            "clean_mastery_evidence_question_ids": clean_ids,
            "correction_priority": priority,
            "coverage_status": status,
            "curriculum_role": skill["curriculum_role"],
            "deferred_evidence_count": len(deferred_ids),
            "deferred_evidence_question_ids": deferred_ids,
            "export_allowed_evidence_count": len(clean_ids),
            "field_guide_status": support_status(int(inventory.get("field_guide_count") or 0)),
            "guardian_candidate_count": int(inventory.get("guardian_candidate_count") or 0),
            "mastery_eligible": skill["mastery_eligible"],
            "needs_teacher_review": bool(skill["needs_teacher_review"] or deferred_ids or inventory.get("instructional_status") == "needs_review"),
            "official_syllabus_section": skill["syllabus_topic"],
            "practice_allowed_deferred_count": len(string_list(inventory.get("practice_allowed_deferred_question_ids"))),
            "prerequisite_notes": skill["prerequisite_notes"],
            "prerequisite_skill_refs": skill["prerequisite_skill_refs"],
            "quick_check_status": support_status(int(inventory.get("quick_check_count") or 0)),
            "recommended_next_action": next_action(status, priority, missing_support, blockers, len(deferred_ids)),
            "region_id": region_id,
            "region_title": non_empty_string(region.get("region_title")) or region_id,
            "skill_id": skill_ref,
            "skill_ref": skill_ref,
            "skill_title": skill["micro_skill_name"],
            "snippet_status": support_status(int(inventory.get("snippet_count") or 0)),
            "support_gaps": missing_support,
            "warmup_status": support_status(int(inventory.get("warmup_support_count") or 0)),
            "worked_example_status": support_status(int(inventory.get("worked_example_count") or 0)),
        })
    return rows


def summary_entries(counts: dict[str, int]) -> list[dict[str, Any]]:
    return [{"label": label, "count": counts[label]} for label in sorted(counts)]


def build_report(skill_map: dict[str, Any], inventory: dict[str, Any]) -> dict[str, Any]:
    skills, inventory_rows_by_skill, region_by_id = validate_inputs(skill_map, inventory)
    rows = build_matrix_rows(skills, inventory_rows_by_skill, region_by_id)
    status_counts = count_by(rows, "coverage_status", sorted(COVERAGE_STATUS_LABELS))
    priority_counts = count_by(rows, "correction_priority", sorted(CORRECTION_PRIORITY_LABELS))
    section_counts = count_by(rows, "official_syllabus_section")
    region_counts = count_by(rows, "region_id")
    support_gap_counts = {
        support_type: sum(1 for row in rows if support_type in row["support_gaps"])
        for support_type in EXPECTED_TEACHING_SUPPORT_TYPES
    }
    deferred_rows = [row for row in rows if row["deferred_evidence_count"] > 0]
    blocked_rows = [row for row in rows if row["coverage_status"] == "blocked_for_mastery"]

    route_backlog = as_record(as_record(inventory.get("routing_audit_summary")).get("deferred_review_backlog"))
    deferred_items = route_backlog.get("items") if isinstance(route_backlog.get("items"), list) else []
    curriculum_targets = as_record(skill_map.get("curriculum_targets"))

    return {
        "schema_name": REPORT_SCHEMA_NAME,
        "schema_version": REPORT_SCHEMA_VERSION,
        "generated_by": GENERATED_BY,
        "generated_label": GENERATED_LABEL,
        "curriculum_target_summary": {
            "primary": curriculum_targets.get("primary"),
            "supporting_prerequisites": curriculum_targets.get("supporting_prerequisites"),
            "mastery_policy": curriculum_targets.get("mastery_policy"),
        },
        "official_syllabus_section_summary": {
            "section_count": len(section_counts),
            "skill_counts": section_counts,
        },
        "region_summary": {
            "region_count": len(region_counts),
            "skill_counts": region_counts,
            "region_titles": {
                region_id: non_empty_string(region_by_id[region_id].get("region_title")) or region_id
                for region_id in sorted(region_counts)
            },
        },
        "skill_summary": {
            "reviewed_skill_count": len(rows),
            "coverage_status_counts": status_counts,
            "correction_priority_counts": priority_counts,
            "mastery_eligible_skill_count": sum(1 for row in rows if row["mastery_eligible"] is True),
            "teacher_review_skill_count": sum(1 for row in rows if row["needs_teacher_review"] is True),
        },
        "coverage_rows": rows,
        "clean_mastery_evidence_summary": {
            "skills_with_clean_mastery_evidence": sum(1 for row in rows if row["clean_mastery_evidence_count"] > 0),
            "skills_without_clean_mastery_evidence": sum(1 for row in rows if row["clean_mastery_evidence_count"] == 0),
            "total_clean_mastery_evidence_links": sum(row["clean_mastery_evidence_count"] for row in rows),
        },
        "deferred_evidence_summary": {
            "affected_skill_count": len(deferred_rows),
            "affected_skill_refs": [row["skill_ref"] for row in deferred_rows],
            "case_count": len(deferred_items),
            "mastery_evidence_allowed": route_backlog.get("mastery_evidence_allowed"),
            "mastery_evidence_blocked_case_count": route_backlog.get("mastery_evidence_blocked_case_count", 0),
            "practice_allowed": route_backlog.get("practice_allowed"),
            "practice_allowed_case_count": route_backlog.get("practice_allowed_case_count", 0),
            "export_allowed": route_backlog.get("export_allowed"),
            "export_blocked_case_count": route_backlog.get("export_blocked_case_count", 0),
            "items": deferred_items,
        },
        "teaching_support_summary": {
            "expected_support_types": EXPECTED_TEACHING_SUPPORT_TYPES,
            "support_gap_counts": support_gap_counts,
            "skills_with_any_support_gap": sum(1 for row in rows if row["support_gaps"]),
        },
        "correction_priority_summary": {
            "priority_counts": priority_counts,
            "suggested_region_correction_order": suggested_region_order(rows),
        },
        "risk_summary": {
            "blocked_mastery_skill_refs": [row["skill_ref"] for row in blocked_rows],
            "deferred_ambiguous_skill_refs": [row["skill_ref"] for row in deferred_rows],
            "support_gap_counts": support_gap_counts,
            "p1_prerequisite_ref_count": sum(len(row["prerequisite_skill_refs"]) for row in rows),
            "p1_prerequisite_refs_are_mastery_evidence": False,
            "app_and_deepseek_labels_override_reviewed_skill_map": False,
        },
        "next_step_summary": {
            "recommended_phase": "region_by_region_correction" if blocked_rows or any(support_gap_counts.values()) else "validation_test_hardening",
            "highest_priority_skill_refs": [
                row["skill_ref"]
                for row in rows
                if row["correction_priority"] in {"P0_blocked_mastery", "P1_missing_core_support"}
            ],
            "note": "Do not create learner content or resolve deferred cases in the matrix pass; use this report to choose the next correction sequence.",
        },
    }


def priority_weight(priority: str) -> int:
    return {
        "P0_blocked_mastery": 0,
        "P1_missing_core_support": 1,
        "P2_missing_practice_support": 2,
        "P3_teacher_review_backlog": 3,
        "P4_polish_or_complete": 4,
    }[priority]


def suggested_region_order(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_region: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_region.setdefault(row["region_id"], []).append(row)
    order: list[dict[str, Any]] = []
    for region_id, region_rows in by_region.items():
        priority_counts = count_by(region_rows, "correction_priority", sorted(CORRECTION_PRIORITY_LABELS))
        highest = min((row["correction_priority"] for row in region_rows), key=priority_weight)
        order.append({
            "region_id": region_id,
            "region_title": region_rows[0]["region_title"],
            "highest_priority": highest,
            "skill_count": len(region_rows),
            "priority_counts": priority_counts,
            "blocked_mastery_skill_count": priority_counts["P0_blocked_mastery"],
            "support_gap_skill_count": sum(1 for row in region_rows if row["support_gaps"]),
        })
    return sorted(
        order,
        key=lambda item: (
            priority_weight(item["highest_priority"]),
            -int(item["blocked_mastery_skill_count"]),
            -int(item["support_gap_skill_count"]),
            str(item["region_id"]),
        ),
    )


def md_escape(value: Any) -> str:
    text = str(value if value is not None else "")
    return text.replace("|", "\\|").replace("\n", " ")


def md_count_list(counts: dict[str, int]) -> str:
    return "\n".join(f"- `{key}`: {counts[key]}" for key in sorted(counts))


def render_markdown(report: dict[str, Any]) -> str:
    rows = report["coverage_rows"]
    status_counts = report["skill_summary"]["coverage_status_counts"]
    priority_counts = report["skill_summary"]["correction_priority_counts"]
    section_counts = report["official_syllabus_section_summary"]["skill_counts"]
    region_titles = report["region_summary"]["region_titles"]
    region_counts = report["region_summary"]["skill_counts"]
    support_gap_counts = report["teaching_support_summary"]["support_gap_counts"]
    blocked_rows = [row for row in rows if row["coverage_status"] == "blocked_for_mastery"]
    deferred_items = report["deferred_evidence_summary"]["items"]

    lines = [
        "# P3 Coverage Matrix",
        "",
        "## Executive Summary",
        "",
        f"This deterministic matrix covers {len(rows)} reviewed CAIE 9709 Paper 3 skills. It separates reviewed skills, official syllabus sections, app regions, teaching support, clean mastery evidence, deferred ambiguous evidence, and correction priority. Deferred ambiguous cases remain visible, practice-allowed where structurally valid, mastery-ineligible, and export-blocked.",
        "",
        "Coverage status counts:",
        "",
        md_count_list(status_counts),
        "",
        "Correction priority counts:",
        "",
        md_count_list(priority_counts),
        "",
        "## Counts By Official Syllabus Section",
        "",
        md_count_list(section_counts),
        "",
        "## Counts By Region",
        "",
        "\n".join(f"- `{region_id}` ({region_titles.get(region_id, region_id)}): {region_counts[region_id]}" for region_id in sorted(region_counts)),
        "",
        "## Priority Buckets",
        "",
    ]

    for priority in sorted(CORRECTION_PRIORITY_LABELS):
        priority_rows = [row for row in rows if row["correction_priority"] == priority]
        refs = ", ".join(f"`{row['skill_ref']}`" for row in priority_rows) or "none"
        lines.extend([f"### {priority}", "", refs, ""])

    lines.extend([
        "## Compact Skill Matrix",
        "",
        "| Skill | Section | Region | Status | Clean Evidence | Deferred Evidence | Support Gaps | Priority | Next Action |",
        "| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |",
    ])
    for row in rows:
        gaps = ", ".join(row["support_gaps"]) if row["support_gaps"] else "none"
        lines.append(
            "| "
            + " | ".join([
                md_escape(row["skill_ref"]),
                md_escape(row["official_syllabus_section"]),
                md_escape(row["region_title"]),
                md_escape(row["coverage_status"]),
                str(row["clean_mastery_evidence_count"]),
                str(row["deferred_evidence_count"]),
                md_escape(gaps),
                md_escape(row["correction_priority"]),
                md_escape(row["recommended_next_action"]),
            ])
            + " |"
        )

    lines.extend(["", "## Blocked Mastery Skills", ""])
    if blocked_rows:
        lines.extend([
            "| Skill | Clean Evidence | Deferred Evidence | Blocking Reasons | Next Action |",
            "| --- | ---: | ---: | --- | --- |",
        ])
        for row in blocked_rows:
            lines.append(
                f"| {md_escape(row['skill_ref'])} | {row['clean_mastery_evidence_count']} | {row['deferred_evidence_count']} | {md_escape(', '.join(row['blocking_reasons']))} | {md_escape(row['recommended_next_action'])} |"
            )
    else:
        lines.append("No skills are currently blocked for mastery.")

    lines.extend(["", "## Deferred Ambiguous Evidence", ""])
    lines.extend([
        f"- Deferred case count: {report['deferred_evidence_summary']['case_count']}",
        f"- Affected skill count: {report['deferred_evidence_summary']['affected_skill_count']}",
        f"- Mastery evidence allowed: {str(report['deferred_evidence_summary']['mastery_evidence_allowed']).lower()}",
        f"- Practice allowed: {str(report['deferred_evidence_summary']['practice_allowed']).lower()}",
        f"- Export allowed: {str(report['deferred_evidence_summary']['export_allowed']).lower()}",
        "",
    ])
    if deferred_items:
        lines.extend([
            "| Skill | Question | App Region | Reviewed Region | Evidence Status |",
            "| --- | --- | --- | --- | --- |",
        ])
        for item in deferred_items:
            lines.append(
                f"| {md_escape(item.get('skill_ref'))} | {md_escape(item.get('question_id'))} | {md_escape(item.get('app_region_id'))} | {md_escape(item.get('reviewed_skill_map_region_id'))} | {md_escape(item.get('evidence_status'))} |"
            )

    lines.extend(["", "## Support Gaps", ""])
    lines.append(md_count_list(support_gap_counts))
    lines.extend(["", "| Support Type | Skills |", "| --- | --- |"])
    for support_type in EXPECTED_TEACHING_SUPPORT_TYPES:
        gap_rows = [row for row in rows if support_type in row["support_gaps"]]
        refs = ", ".join(f"`{row['skill_ref']}`" for row in gap_rows) or "none"
        lines.append(f"| {support_type} | {refs} |")

    lines.extend(["", "## Suggested Region-By-Region Correction Order", ""])
    lines.extend(["| Order | Region | Highest Priority | Blocked Skills | Support Gap Skills |", "| ---: | --- | --- | ---: | ---: |"])
    for index, item in enumerate(report["correction_priority_summary"]["suggested_region_correction_order"], start=1):
        lines.append(
            f"| {index} | {md_escape(item['region_title'])} | {md_escape(item['highest_priority'])} | {item['blocked_mastery_skill_count']} | {item['support_gap_skill_count']} |"
        )

    lines.append("")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the deterministic P3 coverage matrix.")
    parser.add_argument("--skill-map", type=Path, default=DEFAULT_SKILL_MAP)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON_OUTPUT)
    parser.add_argument("--markdown-output", type=Path, default=DEFAULT_MARKDOWN_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        report = build_report(load_json(args.skill_map), load_json(args.inventory))
        markdown = render_markdown(report)
        write_json(args.json_output, report)
        write_text(args.markdown_output, markdown)
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    summary = report["skill_summary"]
    deferred = report["deferred_evidence_summary"]
    print(
        "P3 coverage matrix: "
        f"{summary['reviewed_skill_count']} skills; "
        f"blocked_for_mastery={summary['coverage_status_counts']['blocked_for_mastery']}; "
        f"deferred_cases={deferred['case_count']}"
    )
    print(f"Wrote {args.json_output}")
    print(f"Wrote {args.markdown_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

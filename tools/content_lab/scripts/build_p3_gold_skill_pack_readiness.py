#!/usr/bin/env python3
"""Build the Phase 2A P3 Gold Skill Pack readiness report.

This report is intentionally stricter than the P3 coverage matrix. It does not
create learner-facing content and it does not change mastery policy. It answers
which reviewed P3 skills are MVP-gold ready, which are blocked, and which are
warning-only because their support loop is thin.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from build_p3_skill_coverage import as_record, load_json, non_empty_string, string_list, unique_sorted, validate_skill_map, write_json
from p3_skill_contract import P3_REGION_DISPLAY_NAMES


GENERATED_BY = "tools/content_lab/scripts/build_p3_gold_skill_pack_readiness.py"
GENERATED_LABEL = "deterministic-p3-gold-skill-pack-readiness-v1"
REPORT_SCHEMA_NAME = "asterion_p3_gold_skill_pack_readiness"
REPORT_SCHEMA_VERSION = 1
ARTIFACT_SCOPE = "p3_gold_skill_pack_readiness"

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SKILL_MAP = REPO_ROOT / "tools/content_lab/skill_maps/caie_9709_p3_skill_map.json"
DEFAULT_INVENTORY = REPO_ROOT / "tools/content_lab/reports/p3_content_inventory_report.json"
DEFAULT_MATRIX = REPO_ROOT / "tools/content_lab/reports/p3_coverage_matrix.json"
DEFAULT_SNIPPETS = REPO_ROOT / "public/data/teaching_snippets.json"
DEFAULT_GENERATED_PRACTICE = REPO_ROOT / "public/data/generated_practice_bank.json"
DEFAULT_QUESTION_BANK = REPO_ROOT / "public/assets/exam-bank-data/question_bank.json"
DEFAULT_ROUTE_DECISIONS = REPO_ROOT / "tools/content_lab/reviews/p3_route_evidence_decisions_v1.json"
DEFAULT_JSON_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_gold_skill_pack_readiness.json"
DEFAULT_MARKDOWN_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_gold_skill_pack_readiness.md"

RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}
WARMUP_ROLES = ["first_step", "complete_step", "guardian_prep"]
SOURCE_EVIDENCE_STATUSES = {"clean", "thin", "ambiguous", "blocked", "fallback_only", "missing"}
THIN_REGION_PRIORITY_ORDER = [
    "differential-shrine",
    "numerical-mines",
    "vector-workshop",
    "complex-harbor",
]
SOURCE_PERMISSION_KEYS = (
    "mastery_evidence_allowed",
    "guardian_evidence_allowed",
    "teacher_export_mastery_allowed",
    "content_lab_generation_allowed",
)
EXPLICIT_MARK_SCHEME_NOTE_KEYS = (
    "mark_scheme_move_note",
    "mark_scheme_move",
    "mark_scheme_note",
    "mark_scheme_moves",
)
EXPLICIT_MISCONCEPTION_REPAIR_KEYS = (
    "misconception_repair",
    "misconception_repair_note",
    "repair_note",
    "mistake_repair_note",
)


def write_text(path: Path, payload: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload, encoding="utf-8")


def count_by(rows: list[dict[str, Any]], key: str, labels: list[str] | None = None) -> dict[str, int]:
    keys = labels or sorted({str(row.get(key, "")) for row in rows if row.get(key)})
    return {item: sum(1 for row in rows if row.get(key) == item) for item in keys}


def root_items(data: Any, key: str) -> list[dict[str, Any]]:
    root = as_record(data)
    items = root.get(key)
    return [as_record(item) for item in items if as_record(item)] if isinstance(items, list) else []


def source_assets_from_question_bank(data: Any) -> dict[str, dict[str, set[str]]]:
    index: dict[str, dict[str, set[str]]] = {}
    for question in root_items(data, "questions"):
        question_id = non_empty_string(question.get("question_id") or question.get("id"))
        if not question_id:
            continue
        question_assets = set(string_list(question.get("question_image_paths")))
        mark_scheme_assets = set(string_list(question.get("mark_scheme_image_paths")))
        for key in ("question_image_path", "question_image", "image_path"):
            value = non_empty_string(question.get(key))
            if value:
                question_assets.add(value)
        for key in ("mark_scheme_image_path", "mark_scheme_image", "mark_scheme_path"):
            value = non_empty_string(question.get(key))
            if value:
                mark_scheme_assets.add(value)
        index[question_id] = {
            "question_assets": question_assets,
            "mark_scheme_assets": mark_scheme_assets,
        }
    return index


def route_decision_index(data: Any) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for decision in root_items(data, "decisions"):
        question_id = non_empty_string(decision.get("question_id"))
        if not question_id:
            continue
        evidence_basis = as_record(decision.get("evidence_basis"))
        permissions = as_record(decision.get("use_case_permissions"))
        reviewed_status = (non_empty_string(decision.get("reviewed_status")) or "missing").lower().replace("_", "-")
        index[question_id] = {
            "reviewed_status": reviewed_status,
            "question_asset_path": non_empty_string(evidence_basis.get("question_asset_path")) or "",
            "mark_scheme_asset_path": non_empty_string(evidence_basis.get("mark_scheme_asset_path")) or "",
            "published_source_allowed": reviewed_status == "clean" and all(permissions.get(key) is True for key in SOURCE_PERMISSION_KEYS),
        }
    return index


def worked_example_records(snippet: dict[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    single = as_record(snippet.get("worked_example"))
    if single:
        records.append(single)
    worked_examples = snippet.get("worked_examples")
    if isinstance(worked_examples, list):
        records.extend(as_record(value) for value in worked_examples if as_record(value))
    return records


def is_valid_worked_example(example: dict[str, Any]) -> bool:
    return bool(non_empty_string(example.get("prompt")) and string_list(example.get("steps")) and non_empty_string(example.get("answer")))


def has_any_key(record: dict[str, Any], keys: tuple[str, ...]) -> bool:
    return any(key in record and bool(record.get(key)) for key in keys)


def snippet_skill_refs(snippet: dict[str, Any]) -> set[str]:
    refs = set(string_list(snippet.get("source_skill_target_ids"))) | set(string_list(snippet.get("related_skill_targets")))
    quick_check = as_record(snippet.get("quick_check"))
    quick_check_skill = non_empty_string(quick_check.get("skill_target_id"))
    if quick_check_skill:
        refs.add(quick_check_skill)
    return refs


def empty_snippet_entry() -> dict[str, Any]:
    return {
        "snippet_ids": set(),
        "quick_check_ids": set(),
        "worked_example_ids": set(),
        "worked_examples": [],
        "source_backed_worked_examples": [],
        "misconception_repair_ids": set(),
        "mark_scheme_move_note_ids": set(),
    }


def merge_snippet_entry(target: dict[str, Any], source: dict[str, Any]) -> dict[str, Any]:
    for key in ("snippet_ids", "quick_check_ids", "worked_example_ids", "misconception_repair_ids", "mark_scheme_move_note_ids"):
        target.setdefault(key, set()).update(source.get(key, set()))
    for key in ("worked_examples", "source_backed_worked_examples"):
        seen = {(item[0], item[1]) for item in target.setdefault(key, [])}
        for item in source.get(key, []):
            item_key = (item[0], item[1])
            if item_key not in seen:
                target[key].append(item)
                seen.add(item_key)
    return target


def build_snippet_index(data: Any) -> dict[str, dict[str, Any]]:
    by_skill: dict[str, dict[str, Any]] = {}
    by_snippet: dict[str, dict[str, Any]] = {}
    by_quick_check: dict[str, str] = {}
    for snippet in root_items(data, "snippets"):
        if snippet.get("review_status") not in RUNTIME_REVIEW_STATUSES or snippet.get("paper_family") != "p3":
            continue
        snippet_id = non_empty_string(snippet.get("snippet_id"))
        if not snippet_id:
            continue
        refs = snippet_skill_refs(snippet)
        examples = [example for example in worked_example_records(snippet) if is_valid_worked_example(example)]
        source_backed_examples = [example for example in examples if string_list(example.get("source_question_ids"))]
        quick_check = as_record(snippet.get("quick_check"))
        quick_check_id = non_empty_string(quick_check.get("id")) if quick_check.get("review_status") in RUNTIME_REVIEW_STATUSES else None
        snippet_entry = empty_snippet_entry()
        snippet_entry["snippet_ids"].add(snippet_id)
        if quick_check_id:
            by_quick_check[quick_check_id] = snippet_id
        for index, example in enumerate(examples, start=1):
            example_id = non_empty_string(example.get("id")) or f"{snippet_id}::worked_example_{index}"
            snippet_entry["worked_example_ids"].add(example_id)
            snippet_entry["worked_examples"].append((snippet_id, example_id, example))
        for index, example in enumerate(source_backed_examples, start=1):
            example_id = non_empty_string(example.get("id")) or f"{snippet_id}::worked_example_{index}"
            snippet_entry["source_backed_worked_examples"].append((snippet_id, example_id, example))
        if snippet.get("snippet_type") == "mistake_repair" or has_any_key(snippet, EXPLICIT_MISCONCEPTION_REPAIR_KEYS):
            snippet_entry["misconception_repair_ids"].add(snippet_id)
        if has_any_key(snippet, EXPLICIT_MARK_SCHEME_NOTE_KEYS):
            snippet_entry["mark_scheme_move_note_ids"].add(snippet_id)
        for _, example_id, example in snippet_entry["worked_examples"]:
            if has_any_key(example, EXPLICIT_MARK_SCHEME_NOTE_KEYS):
                snippet_entry["mark_scheme_move_note_ids"].add(example_id)
        by_snippet[snippet_id] = snippet_entry

        for skill_ref in refs:
            entry = by_skill.setdefault(skill_ref, empty_snippet_entry())
            entry["snippet_ids"].add(snippet_id)
            if quick_check_id and quick_check.get("skill_target_id") == skill_ref:
                entry["quick_check_ids"].add(quick_check_id)
            merge_snippet_entry(entry, snippet_entry)
    return {
        "by_skill": by_skill,
        "by_snippet": by_snippet,
        "quick_check_to_snippet": by_quick_check,
    }


def snippet_entry_for_skill(skill: dict[str, Any], snippet_index: dict[str, Any]) -> dict[str, Any]:
    skill_id = str(skill["skill_id"])
    entry = empty_snippet_entry()
    by_skill = as_record(snippet_index.get("by_skill"))
    by_snippet = as_record(snippet_index.get("by_snippet"))
    quick_check_to_snippet = as_record(snippet_index.get("quick_check_to_snippet"))
    merge_snippet_entry(entry, as_record(by_skill.get(skill_id)))
    for snippet_id in string_list(skill.get("supported_by_snippet_ids")):
        merge_snippet_entry(entry, as_record(by_snippet.get(snippet_id)))
    for quick_check_id in string_list(skill.get("supported_by_quick_check_ids")):
        snippet_id = non_empty_string(quick_check_to_snippet.get(quick_check_id))
        if snippet_id and snippet_id in by_snippet:
            entry["quick_check_ids"].add(quick_check_id)
            merge_snippet_entry(entry, as_record(by_snippet.get(snippet_id)))
    return entry


def build_generated_practice_index(data: Any) -> dict[str, Any]:
    by_skill: dict[str, set[str]] = {}
    by_family: dict[str, set[str]] = {}
    practice_ids_by_skill: dict[str, set[str]] = {}
    practice_ids_by_family: dict[str, set[str]] = {}
    for item in root_items(data, "items"):
        verification = as_record(item.get("verification"))
        if item.get("review_status") not in RUNTIME_REVIEW_STATUSES or verification.get("status") != "pass" or item.get("paper_family") != "p3":
            continue
        role = non_empty_string(item.get("sequence_role"))
        practice_id = non_empty_string(item.get("practice_id"))
        if role not in WARMUP_ROLES:
            continue
        skill_ref = non_empty_string(item.get("skill_target_id"))
        family = non_empty_string(item.get("generator_family"))
        if skill_ref:
            by_skill.setdefault(skill_ref, set()).add(role)
            if practice_id:
                practice_ids_by_skill.setdefault(skill_ref, set()).add(practice_id)
        if family:
            by_family.setdefault(family, set()).add(role)
            if practice_id:
                practice_ids_by_family.setdefault(family, set()).add(practice_id)
    return {
        "roles_by_skill": by_skill,
        "roles_by_family": by_family,
        "practice_ids_by_skill": practice_ids_by_skill,
        "practice_ids_by_family": practice_ids_by_family,
    }


def source_evidence_status(matrix_row: dict[str, Any], inventory_row: dict[str, Any]) -> str:
    clean_count = int(matrix_row.get("clean_mastery_evidence_count") or 0)
    deferred_count = int(matrix_row.get("deferred_evidence_count") or 0)
    blockers = set(string_list(matrix_row.get("blocking_reasons")))
    risk_flags = set(string_list(inventory_row.get("risk_flags")))
    blocked_ids = string_list(inventory_row.get("mastery_evidence_blocked_question_ids"))
    canonical_ids = string_list(inventory_row.get("canonical_question_ids"))
    fallback_flags = {flag for flag in risk_flags | blockers if "fallback" in flag}
    if clean_count == 1:
        return "thin"
    if clean_count > 1 and deferred_count == 0 and not blockers:
        return "clean"
    if deferred_count > 0 or risk_flags.intersection({"teacher_review_deferred", "mastery_evidence_deferred"}):
        return "ambiguous"
    if fallback_flags:
        return "fallback_only"
    if blocked_ids or blockers:
        return "blocked"
    if clean_count > 1:
        return "clean"
    if canonical_ids:
        return "blocked"
    return "missing"


def source_backed_example_errors(
    *,
    owner: str,
    example: dict[str, Any],
    source_index: dict[str, dict[str, set[str]]],
    decisions: dict[str, dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    source_question_ids = string_list(example.get("source_question_ids"))
    question_asset_ids = set(string_list(example.get("source_question_asset_ids")))
    mark_scheme_asset_ids = set(string_list(example.get("source_mark_scheme_asset_ids")))
    if not question_asset_ids:
        errors.append(f"{owner} missing source_question_asset_ids")
    if not mark_scheme_asset_ids:
        errors.append(f"{owner} missing source_mark_scheme_asset_ids")
    for question_id in source_question_ids:
        source = source_index.get(question_id)
        decision = decisions.get(question_id)
        if source is None:
            errors.append(f"{owner} has unresolved source_question_id {question_id}")
            continue
        if not source["question_assets"]:
            errors.append(f"{owner} source_question_id {question_id} has no canonical question image asset")
        if not source["mark_scheme_assets"]:
            errors.append(f"{owner} source_question_id {question_id} has no canonical mark-scheme image asset")
        unresolved_question_assets = question_asset_ids - source["question_assets"]
        unresolved_mark_scheme_assets = mark_scheme_asset_ids - source["mark_scheme_assets"]
        for asset in sorted(unresolved_question_assets):
            errors.append(f"{owner} has unresolved source_question_asset_id {asset}")
        for asset in sorted(unresolved_mark_scheme_assets):
            errors.append(f"{owner} has unresolved source_mark_scheme_asset_id {asset}")
        if decision is None:
            errors.append(f"{owner} source_question_id {question_id} is not found in reviewed route evidence")
            continue
        reviewed_status = str(decision.get("reviewed_status") or "missing")
        if decision.get("published_source_allowed") is not True:
            errors.append(f"{owner} source_question_id {question_id} has non-clean reviewed route evidence ({reviewed_status})")
        question_asset = non_empty_string(decision.get("question_asset_path"))
        mark_scheme_asset = non_empty_string(decision.get("mark_scheme_asset_path"))
        if question_asset and question_asset not in question_asset_ids:
            errors.append(f"{owner} is missing reviewed source_question_asset_id {question_asset}")
        if mark_scheme_asset and mark_scheme_asset not in mark_scheme_asset_ids:
            errors.append(f"{owner} is missing reviewed source_mark_scheme_asset_id {mark_scheme_asset}")
    return unique_sorted(errors)


def support_content_status(
    *,
    inventory_row: dict[str, Any],
    snippet_entry: dict[str, Any],
    warmup_practice_ids: set[str],
) -> tuple[str, list[str]]:
    clean_ids = set(string_list(inventory_row.get("mastery_evidence_question_ids")))
    support_ids: set[str] = set()
    support_ids.update(snippet_entry.get("snippet_ids", set()))
    support_ids.update(snippet_entry.get("quick_check_ids", set()))
    support_ids.update(snippet_entry.get("worked_example_ids", set()))
    support_ids.update(warmup_practice_ids)
    support_ids.update(
        str(as_record(ref).get("skill_ref"))
        for ref in inventory_row.get("prerequisite_skill_refs", [])
        if non_empty_string(as_record(ref).get("skill_ref"))
    )
    contaminated = sorted(clean_ids & support_ids)
    if contaminated:
        return "contaminated", contaminated
    return "separated", []


def status_from_count(count: int) -> str:
    return "available" if count > 0 else "missing"


def prerequisite_repair_status(skill: dict[str, Any]) -> str:
    refs = skill.get("prerequisite_skill_refs")
    has_refs = isinstance(refs, list) and bool(refs)
    if not has_refs:
        return "not_applicable"
    return "available" if non_empty_string(skill.get("prerequisite_notes")) else "missing"


def next_action(blockers: list[str], warnings: list[str]) -> str:
    if "support_content_contaminates_mastery_evidence" in blockers:
        return "Remove support-content identifiers from mastery evidence before any gold-pack claim."
    if "invalid_source_backed_worked_example" in blockers:
        return "Fix source-backed worked-example route evidence and asset links before publishing the pack."
    if "no_clean_canonical_question_mark_scheme_pair" in blockers:
        return "Find or review at least one clean canonical P3 question and mark-scheme image pair."
    if "missing_field_guide" in blockers:
        return "Add a reviewed Field Guide teaching snippet for this reviewed P3 skill."
    if "missing_quick_check" in blockers:
        return "Add a reviewed Quick Check linked to this reviewed P3 skill."
    if "missing_all_warmup_support" in blockers:
        return "Add reviewed deterministic warm-up support before claiming MVP gold."
    if blockers:
        return f"Resolve blocker `{blockers[0]}` before claiming MVP gold."
    if warnings:
        return f"Resolve warning `{warnings[0]}` before marking this skill MVP gold ready."
    return "MVP gold ready under the Phase 2A readiness contract."


def build_skill_row(
    *,
    skill: dict[str, Any],
    matrix_row: dict[str, Any],
    inventory_row: dict[str, Any],
    snippet_entry: dict[str, Any],
    generated_index: dict[str, Any],
    source_index: dict[str, dict[str, set[str]]],
    decisions: dict[str, dict[str, Any]],
    mastery_policy_present: bool,
) -> tuple[dict[str, Any], list[str]]:
    skill_id = str(skill["skill_id"])
    generator_families = string_list(skill.get("supported_by_generator_families"))
    roles_present = set(generated_index["roles_by_skill"].get(skill_id, set()))
    warmup_practice_ids = set(generated_index["practice_ids_by_skill"].get(skill_id, set()))
    for family in generator_families:
        roles_present.update(generated_index["roles_by_family"].get(family, set()))
        warmup_practice_ids.update(generated_index["practice_ids_by_family"].get(family, set()))
    warmup_roles_present = [role for role in WARMUP_ROLES if role in roles_present]
    warmup_roles_missing = [role for role in WARMUP_ROLES if role not in roles_present]

    worked_examples = snippet_entry.get("worked_examples", [])
    source_backed_examples = snippet_entry.get("source_backed_worked_examples", [])
    example_contract_errors: list[str] = []
    for snippet_id, example_id, example in source_backed_examples:
        owner = f"{snippet_id}.{example_id}"
        example_contract_errors.extend(source_backed_example_errors(
            owner=owner,
            example=example,
            source_index=source_index,
            decisions=decisions,
        ))

    clean_count = int(matrix_row.get("clean_mastery_evidence_count") or 0)
    evidence_status = source_evidence_status(matrix_row, inventory_row)
    if evidence_status not in SOURCE_EVIDENCE_STATUSES:
        evidence_status = "missing"

    support_status, contaminated_ids = support_content_status(
        inventory_row=inventory_row,
        snippet_entry=snippet_entry,
        warmup_practice_ids=warmup_practice_ids,
    )
    misconception_status = "available" if snippet_entry.get("misconception_repair_ids") else "missing"
    prereq_status = prerequisite_repair_status(skill)
    mark_scheme_status = "available" if snippet_entry.get("mark_scheme_move_note_ids") else "missing"

    blockers: list[str] = []
    warnings: list[str] = []
    if not non_empty_string(skill.get("syllabus_topic")):
        blockers.append("missing_official_syllabus_section")
    if not non_empty_string(skill.get("region_id")):
        blockers.append("missing_region")
    if not mastery_policy_present:
        blockers.append("missing_mastery_policy")
    if clean_count == 0:
        blockers.append("no_clean_canonical_question_mark_scheme_pair")
    if snippet_entry.get("snippet_ids") is None or len(snippet_entry.get("snippet_ids", set())) == 0:
        blockers.append("missing_field_guide")
    if len(snippet_entry.get("quick_check_ids", set())) == 0:
        blockers.append("missing_quick_check")
    if not warmup_roles_present:
        blockers.append("missing_all_warmup_support")
    if support_status == "contaminated":
        blockers.append("support_content_contaminates_mastery_evidence")
    if example_contract_errors:
        blockers.append("invalid_source_backed_worked_example")

    if clean_count == 1:
        warnings.append("thin_evidence_resilience")
    if len(worked_examples) < 2:
        warnings.append("fewer_than_two_worked_examples")
    if len(source_backed_examples) < 2:
        warnings.append("source_backed_worked_examples_sparse")
    if misconception_status == "missing":
        warnings.append("missing_misconception_repair_note")
    if prereq_status == "missing":
        warnings.append("missing_prerequisite_repair_note")
    if mark_scheme_status == "missing":
        warnings.append("missing_mark_scheme_move_note")
    if warmup_roles_present and warmup_roles_missing:
        warnings.append("missing_some_warmup_sequence_roles")

    blockers = unique_sorted(blockers)
    warnings = unique_sorted(warnings)
    row = {
        "skill_id": skill_id,
        "skill_name": skill.get("micro_skill_name"),
        "skill_title": skill.get("micro_skill_name"),
        "region": P3_REGION_DISPLAY_NAMES.get(str(skill.get("region_id")), str(skill.get("region_id") or "")),
        "region_id": skill.get("region_id"),
        "syllabus_section": skill.get("syllabus_topic"),
        "official_syllabus_section": skill.get("syllabus_topic"),
        "reviewed_p3_skill_map_row_status": "exists",
        "mastery_policy_status": "available" if mastery_policy_present else "missing",
        "prerequisite_ref_status": "support_only" if [
            ref
            for ref in skill.get("prerequisite_skill_refs", [])
            if non_empty_string(as_record(ref).get("skill_ref"))
        ] else "not_applicable",
        "evidence_status": evidence_status,
        "clean_evidence_count": clean_count,
        "clean_evidence_question_ids": string_list(matrix_row.get("clean_mastery_evidence_question_ids")),
        "support_content_status": support_status,
        "support_content_contaminating_ids": contaminated_ids,
        "field_guide_status": status_from_count(len(snippet_entry.get("snippet_ids", set()))),
        "field_guide_ids": sorted(snippet_entry.get("snippet_ids", set())),
        "worked_example_count": len(worked_examples),
        "worked_example_ids": sorted(snippet_entry.get("worked_example_ids", set())),
        "source_backed_worked_example_count": len(source_backed_examples),
        "quick_check_status": status_from_count(len(snippet_entry.get("quick_check_ids", set()))),
        "quick_check_ids": sorted(snippet_entry.get("quick_check_ids", set())),
        "warmup_roles_present": warmup_roles_present,
        "warmup_roles_missing": warmup_roles_missing,
        "warmup_practice_count": len(warmup_practice_ids),
        "warmup_practice_ids": sorted(warmup_practice_ids),
        "misconception_repair_status": misconception_status,
        "misconception_repair_ids": sorted(snippet_entry.get("misconception_repair_ids", set())),
        "prerequisite_repair_status": prereq_status,
        "mark_scheme_move_note_status": mark_scheme_status,
        "mark_scheme_move_note_ids": sorted(snippet_entry.get("mark_scheme_move_note_ids", set())),
        "source_backed_worked_example_contract_errors": example_contract_errors,
        "blockers": blockers,
        "warnings": warnings,
        "future_enhancements": [],
        "mvp_gold_ready": not blockers and not warnings,
        "next_action": next_action(blockers, warnings),
    }
    return row, example_contract_errors


def region_summary(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_region: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_region.setdefault(str(row["region_id"]), []).append(row)
    summary: list[dict[str, Any]] = []
    for region_id in sorted(by_region, key=lambda value: P3_REGION_DISPLAY_NAMES.get(value, value)):
        region_rows = by_region[region_id]
        summary.append({
            "region_id": region_id,
            "region": P3_REGION_DISPLAY_NAMES.get(region_id, region_id),
            "skill_count": len(region_rows),
            "mvp_gold_ready_count": sum(1 for row in region_rows if row["mvp_gold_ready"]),
            "blocked_skill_count": sum(1 for row in region_rows if row["blockers"]),
            "warning_only_skill_count": sum(1 for row in region_rows if not row["blockers"] and row["warnings"]),
            "thin_evidence_skill_count": sum(1 for row in region_rows if row["evidence_status"] == "thin"),
            "warmup_role_gap_skill_count": sum(1 for row in region_rows if row["warmup_roles_missing"]),
            "worked_example_gap_skill_count": sum(1 for row in region_rows if row["worked_example_count"] < 2),
            "missing_repair_note_skill_count": sum(
                1
                for row in region_rows
                if row["misconception_repair_status"] == "missing"
                or row["prerequisite_repair_status"] == "missing"
                or row["mark_scheme_move_note_status"] == "missing"
            ),
        })
    return summary


def thin_region_reasons(region_rows: list[dict[str, Any]]) -> list[str]:
    reasons: list[str] = []
    if any(row["warmup_roles_missing"] for row in region_rows):
        reasons.append("missing sequence-role breadth")
    if sum(row["warmup_practice_count"] for row in region_rows) < len(region_rows) * len(WARMUP_ROLES):
        reasons.append("fewer warm-ups")
    if any(row["worked_example_count"] < 2 for row in region_rows):
        reasons.append("fewer worked examples")
    if any(row["source_backed_worked_example_count"] < 2 for row in region_rows):
        reasons.append("source-backed examples sparse")
    if any(row["clean_evidence_count"] <= 1 for row in region_rows):
        reasons.append("low clean evidence count")
    if any(
        row["misconception_repair_status"] == "missing"
        or row["prerequisite_repair_status"] == "missing"
        or row["mark_scheme_move_note_status"] == "missing"
        for row in region_rows
    ):
        reasons.append("missing repair tags")
    return reasons or ["reason unavailable from current artifacts"]


def thin_region_priority_summary(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_region: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_region.setdefault(str(row["region_id"]), []).append(row)
    summary: list[dict[str, Any]] = []
    for rank, region_id in enumerate(THIN_REGION_PRIORITY_ORDER, start=1):
        region_rows = by_region.get(region_id, [])
        summary.append({
            "priority_rank": rank,
            "region_id": region_id,
            "region": P3_REGION_DISPLAY_NAMES.get(region_id, region_id),
            "skill_count": len(region_rows),
            "mvp_gold_ready_count": sum(1 for row in region_rows if row["mvp_gold_ready"]),
            "blocked_skill_count": sum(1 for row in region_rows if row["blockers"]),
            "warning_only_skill_count": sum(1 for row in region_rows if not row["blockers"] and row["warnings"]),
            "warmup_role_gap_skill_count": sum(1 for row in region_rows if row["warmup_roles_missing"]),
            "worked_example_gap_skill_count": sum(1 for row in region_rows if row["worked_example_count"] < 2),
            "source_backed_worked_example_gap_skill_count": sum(1 for row in region_rows if row["source_backed_worked_example_count"] < 2),
            "low_clean_evidence_skill_count": sum(1 for row in region_rows if row["clean_evidence_count"] <= 1),
            "missing_repair_note_skill_count": sum(
                1
                for row in region_rows
                if row["misconception_repair_status"] == "missing"
                or row["prerequisite_repair_status"] == "missing"
                or row["mark_scheme_move_note_status"] == "missing"
            ),
            "reasons": thin_region_reasons(region_rows),
        })
    return summary


def validate_report_contract(report: dict[str, Any], expected_skill_ids: set[str]) -> None:
    errors: list[str] = []
    rows = report.get("skill_rows") if isinstance(report.get("skill_rows"), list) else []
    row_skill_ids = [str(as_record(row).get("skill_id")) for row in rows if non_empty_string(as_record(row).get("skill_id"))]
    if set(row_skill_ids) != expected_skill_ids:
        errors.append("skill_rows must include each reviewed P3 skill exactly once")
    if len(row_skill_ids) != len(set(row_skill_ids)):
        errors.append("skill_rows contains duplicate skill_id values")
    for row in rows:
        record = as_record(row)
        skill_id = non_empty_string(record.get("skill_id")) or "<missing>"
        required = {
            "skill_id",
            "skill_name",
            "region",
            "syllabus_section",
            "evidence_status",
            "clean_evidence_count",
            "support_content_status",
            "field_guide_status",
            "worked_example_count",
            "source_backed_worked_example_count",
            "quick_check_status",
            "warmup_roles_present",
            "warmup_roles_missing",
            "misconception_repair_status",
            "prerequisite_repair_status",
            "mark_scheme_move_note_status",
            "blockers",
            "warnings",
            "next_action",
        }
        missing = sorted(field for field in required if field not in record)
        if missing:
            errors.append(f"skill row {skill_id} missing required fields: {', '.join(missing)}")
        if record.get("evidence_status") not in SOURCE_EVIDENCE_STATUSES:
            errors.append(f"skill row {skill_id} has invalid evidence_status {record.get('evidence_status')}")
        if record.get("support_content_status") not in {"separated", "contaminated"}:
            errors.append(f"skill row {skill_id} has invalid support_content_status")
        for field in ("clean_evidence_count", "worked_example_count", "source_backed_worked_example_count"):
            value = record.get(field)
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                errors.append(f"skill row {skill_id} has invalid non-negative count {field}")
        for field in ("blockers", "warnings", "warmup_roles_present", "warmup_roles_missing"):
            if not isinstance(record.get(field), list):
                errors.append(f"skill row {skill_id}.{field} must be a list")

    skill_summary = as_record(report.get("skill_summary"))
    if skill_summary.get("total_reviewed_p3_skills") != len(rows):
        errors.append("skill_summary.total_reviewed_p3_skills must equal row count")
    if skill_summary.get("mvp_gold_ready_count") != sum(1 for row in rows if as_record(row).get("mvp_gold_ready") is True):
        errors.append("skill_summary.mvp_gold_ready_count mismatch")
    if skill_summary.get("blocked_skill_count") != sum(1 for row in rows if as_record(row).get("blockers")):
        errors.append("skill_summary.blocked_skill_count mismatch")
    if skill_summary.get("warning_only_skill_count") != sum(1 for row in rows if not as_record(row).get("blockers") and as_record(row).get("warnings")):
        errors.append("skill_summary.warning_only_skill_count mismatch")
    if errors:
        raise ValueError("; ".join(errors))


def build_report(
    *,
    skill_map: dict[str, Any],
    inventory: dict[str, Any],
    matrix: dict[str, Any],
    snippets: dict[str, Any],
    generated_practice: dict[str, Any],
    question_bank: dict[str, Any],
    route_decisions: dict[str, Any],
) -> dict[str, Any]:
    skills = sorted(validate_skill_map(skill_map), key=lambda item: str(item["skill_id"]))
    inventory_rows = {
        str(as_record(row).get("skill_ref")): as_record(row)
        for row in inventory.get("per_skill_inventory", [])
        if non_empty_string(as_record(row).get("skill_ref"))
    }
    matrix_rows = {
        str(as_record(row).get("skill_ref") or as_record(row).get("skill_id")): as_record(row)
        for row in matrix.get("coverage_rows", [])
        if non_empty_string(as_record(row).get("skill_ref") or as_record(row).get("skill_id"))
    }
    snippet_index = build_snippet_index(snippets)
    generated_index = build_generated_practice_index(generated_practice)
    source_index = source_assets_from_question_bank(question_bank)
    decisions = route_decision_index(route_decisions)
    mastery_policy = as_record(as_record(skill_map.get("curriculum_targets")).get("mastery_policy"))
    mastery_policy_present = all(non_empty_string(mastery_policy.get(field)) for field in ("p3_mastery_evidence", "p1_prerequisite_use", "reporting_boundary"))

    rows: list[dict[str, Any]] = []
    contract_violations: list[dict[str, Any]] = []
    for skill in skills:
        skill_id = str(skill["skill_id"])
        inventory_row = inventory_rows.get(skill_id, {})
        matrix_row = matrix_rows.get(skill_id, {})
        row, source_errors = build_skill_row(
            skill=skill,
            matrix_row=matrix_row,
            inventory_row=inventory_row,
            snippet_entry=snippet_entry_for_skill(skill, snippet_index),
            generated_index=generated_index,
            source_index=source_index,
            decisions=decisions,
            mastery_policy_present=mastery_policy_present,
        )
        rows.append(row)
        for error in source_errors:
            contract_violations.append({
                "skill_id": skill_id,
                "violation_type": "invalid_source_backed_worked_example",
                "message": error,
            })
        if row["support_content_status"] == "contaminated":
            contract_violations.append({
                "skill_id": skill_id,
                "violation_type": "support_content_contaminates_mastery_evidence",
                "message": f"Support identifiers appear in mastery evidence: {', '.join(row['support_content_contaminating_ids'])}",
            })

    blocker_counts: dict[str, int] = {}
    warning_counts: dict[str, int] = {}
    for row in rows:
        for blocker in row["blockers"]:
            blocker_counts[blocker] = blocker_counts.get(blocker, 0) + 1
        for warning in row["warnings"]:
            warning_counts[warning] = warning_counts.get(warning, 0) + 1

    report = {
        "schema_name": REPORT_SCHEMA_NAME,
        "schema_version": REPORT_SCHEMA_VERSION,
        "generated_by": GENERATED_BY,
        "generated_label": GENERATED_LABEL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "artifact_scope": ARTIFACT_SCOPE,
        "contract": {
            "mvp_gold_ready_definition": "A reviewed P3 skill is MVP-gold ready only when it has no Phase 2A blockers and no Phase 2A warnings.",
            "blocker_semantics": "A blocker means the skill is not MVP gold. Readiness blockers are report states unless they are listed as contract violations.",
            "warning_semantics": "A warning means the skill has support or resilience risk but does not necessarily make the repo invalid.",
            "contract_violations_fail_command": True,
            "support_content_counts_as_mastery_evidence": False,
            "source_evidence_statuses": sorted(SOURCE_EVIDENCE_STATUSES),
            "required_warmup_sequence_roles": WARMUP_ROLES,
        },
        "skill_summary": {
            "total_reviewed_p3_skills": len(rows),
            "mvp_gold_ready_count": sum(1 for row in rows if row["mvp_gold_ready"]),
            "blocked_skill_count": sum(1 for row in rows if row["blockers"]),
            "warning_only_skill_count": sum(1 for row in rows if not row["blockers"] and row["warnings"]),
            "thin_resilience_risk_skill_count": sum(1 for row in rows if row["evidence_status"] == "thin"),
            "blocker_counts": dict(sorted(blocker_counts.items())),
            "warning_counts": dict(sorted(warning_counts.items())),
            "evidence_status_counts": count_by(rows, "evidence_status", sorted(SOURCE_EVIDENCE_STATUSES)),
        },
        "per_region_summary": region_summary(rows),
        "thin_region_priority_summary": thin_region_priority_summary(rows),
        "skill_rows": rows,
        "contract_violation_summary": {
            "violation_count": len(contract_violations),
            "violation_type_counts": count_by(contract_violations, "violation_type") if contract_violations else {},
            "items": contract_violations,
        },
    }
    validate_report_contract(report, {str(skill["skill_id"]) for skill in skills})
    return report


def md_escape(value: Any) -> str:
    return str(value if value is not None else "").replace("|", "\\|").replace("\n", " ")


def render_markdown(report: dict[str, Any]) -> str:
    summary = report["skill_summary"]
    rows = report["skill_rows"]
    lines = [
        "# P3 Gold Skill Pack Readiness",
        "",
        f"Generated at: `{report['generated_at']}`",
        "",
        "## Summary",
        "",
        f"- Artifact scope: `{report['artifact_scope']}`",
        f"- Reviewed P3 skills evaluated: {summary['total_reviewed_p3_skills']}",
        f"- MVP gold ready: {summary['mvp_gold_ready_count']}",
        f"- Blocked: {summary['blocked_skill_count']}",
        f"- Warning-only / thin / resilience-risk: {summary['warning_only_skill_count']}",
        f"- Thin evidence resilience risks: {summary['thin_resilience_risk_skill_count']}",
        f"- Contract violations: {report['contract_violation_summary']['violation_count']}",
        "",
        "MVP gold ready means no blockers and no warnings under the Phase 2A contract. A blocker in this report means the skill is not MVP gold yet; only contract violations fail the command.",
        "",
        "## Blocker Counts",
        "",
    ]
    if summary["blocker_counts"]:
        lines.extend(f"- `{key}`: {value}" for key, value in summary["blocker_counts"].items())
    else:
        lines.append("No readiness blockers.")
    lines.extend(["", "## Warning Counts", ""])
    if summary["warning_counts"]:
        lines.extend(f"- `{key}`: {value}" for key, value in summary["warning_counts"].items())
    else:
        lines.append("No warnings.")

    lines.extend([
        "",
        "## Thin Region Priority",
        "",
        "| Rank | Region | Skills | Ready | Blocked | Warning-Only | Reasons |",
        "| ---: | --- | ---: | ---: | ---: | ---: | --- |",
    ])
    for item in report["thin_region_priority_summary"]:
        lines.append(
            f"| {item['priority_rank']} | {md_escape(item['region'])} | {item['skill_count']} | {item['mvp_gold_ready_count']} | {item['blocked_skill_count']} | {item['warning_only_skill_count']} | {md_escape(', '.join(item['reasons']))} |"
        )

    lines.extend([
        "",
        "## Per-Region Summary",
        "",
        "| Region | Skills | Ready | Blocked | Warning-Only | Thin Evidence | Warm-Up Gaps | Worked-Example Gaps | Repair Gaps |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ])
    for item in report["per_region_summary"]:
        lines.append(
            f"| {md_escape(item['region'])} | {item['skill_count']} | {item['mvp_gold_ready_count']} | {item['blocked_skill_count']} | {item['warning_only_skill_count']} | {item['thin_evidence_skill_count']} | {item['warmup_role_gap_skill_count']} | {item['worked_example_gap_skill_count']} | {item['missing_repair_note_skill_count']} |"
        )

    lines.extend([
        "",
        "## Skill Rows",
        "",
        "| Skill | Region | Syllabus | Evidence | Clean | Field Guide | Examples | Source-Backed | Quick Check | Warm-Up Missing | Repairs | Blockers | Warnings | Next Action |",
        "| --- | --- | --- | --- | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |",
    ])
    for row in rows:
        repairs = ", ".join([
            f"misconception:{row['misconception_repair_status']}",
            f"prerequisite:{row['prerequisite_repair_status']}",
            f"mark_scheme:{row['mark_scheme_move_note_status']}",
        ])
        lines.append(
            "| "
            + " | ".join([
                md_escape(row["skill_id"]),
                md_escape(row["region"]),
                md_escape(row["syllabus_section"]),
                md_escape(row["evidence_status"]),
                str(row["clean_evidence_count"]),
                md_escape(row["field_guide_status"]),
                str(row["worked_example_count"]),
                str(row["source_backed_worked_example_count"]),
                md_escape(row["quick_check_status"]),
                md_escape(", ".join(row["warmup_roles_missing"]) or "none"),
                md_escape(repairs),
                md_escape(", ".join(row["blockers"]) or "none"),
                md_escape(", ".join(row["warnings"]) or "none"),
                md_escape(row["next_action"]),
            ])
            + " |"
        )

    lines.extend(["", "## Contract Violations", ""])
    violations = report["contract_violation_summary"]["items"]
    if violations:
        lines.extend(["| Skill | Type | Message |", "| --- | --- | --- |"])
        for item in violations:
            lines.append(f"| {md_escape(item['skill_id'])} | {md_escape(item['violation_type'])} | {md_escape(item['message'])} |")
    else:
        lines.append("No contract violations.")
    lines.append("")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Phase 2A P3 Gold Skill Pack readiness report.")
    parser.add_argument("--skill-map", type=Path, default=DEFAULT_SKILL_MAP)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--snippets", type=Path, default=DEFAULT_SNIPPETS)
    parser.add_argument("--generated-practice", type=Path, default=DEFAULT_GENERATED_PRACTICE)
    parser.add_argument("--question-bank", type=Path, default=DEFAULT_QUESTION_BANK)
    parser.add_argument("--route-decisions", type=Path, default=DEFAULT_ROUTE_DECISIONS)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON_OUTPUT)
    parser.add_argument("--markdown-output", type=Path, default=DEFAULT_MARKDOWN_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        report = build_report(
            skill_map=load_json(args.skill_map),
            inventory=load_json(args.inventory),
            matrix=load_json(args.matrix),
            snippets=load_json(args.snippets),
            generated_practice=load_json(args.generated_practice),
            question_bank=load_json(args.question_bank),
            route_decisions=load_json(args.route_decisions),
        )
        write_json(args.json_output, report)
        write_text(args.markdown_output, render_markdown(report))
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    summary = report["skill_summary"]
    violation_count = report["contract_violation_summary"]["violation_count"]
    print(
        "P3 Gold Skill Pack readiness: "
        f"{summary['total_reviewed_p3_skills']} skills; "
        f"mvp_gold_ready={summary['mvp_gold_ready_count']}; "
        f"blocked={summary['blocked_skill_count']}; "
        f"warning_only={summary['warning_only_skill_count']}; "
        f"contract_violations={violation_count}"
    )
    print(f"Wrote {args.json_output}")
    print(f"Wrote {args.markdown_output}")
    if violation_count:
        for item in report["contract_violation_summary"]["items"]:
            print(f"ERROR: {item['skill_id']} {item['violation_type']}: {item['message']}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

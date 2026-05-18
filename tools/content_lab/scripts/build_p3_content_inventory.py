#!/usr/bin/env python3
"""Build a deterministic P3 content inventory report.

The inventory is internal only. It validates the reviewed P3 skill map against
runtime support artifacts, app regions, and canonical image-first question
evidence without generating new learner-facing content.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from build_p3_skill_coverage import (
    ALLOWED_CURRICULUM_ROLES,
    RUNTIME_REVIEW_STATUSES,
    as_record,
    image_values,
    load_json,
    non_empty_string,
    string_list,
    training_blockers_for_record,
    unique_sorted,
    validate_skill_map,
    write_json,
)
from p3_skill_contract import P3_TOPIC_ID_TO_REGION_ID


GENERATED_BY = "tools/content_lab/scripts/build_p3_content_inventory.py"
REPORT_SCHEMA_NAME = "asterion_p3_content_inventory_report"
REPORT_SCHEMA_VERSION = 1
GENERATED_LABEL = "deterministic-content-inventory-v1"
ROUTING_AUDIT_SCHEMA_NAME = "asterion_p3_app_region_routing_audit"
ROUTING_AUDIT_SCHEMA_VERSION = 1
ROUTING_AUDIT_STATUSES = {
    "corrected_app_routing",
    "corrected_question_metadata",
    "corrected_skill_map",
    "needs_teacher_review",
    "teacher_review_deferred",
    "validated_skill_map_route",
}
TEACHER_REVIEW_ROUTING_STATUSES = {"needs_teacher_review", "teacher_review_deferred"}
VALIDATED_ROUTING_STATUSES = {"validated_skill_map_route"}
DEFERRED_ROUTING_STATUS = "teacher_review_deferred"
DEFERRED_EVIDENCE_STATUS = "ambiguous_part_level_evidence"
VALIDATED_EVIDENCE_STATUS = "clean_mastery_evidence"
SUPPORT_TYPES = [
    "field_guide",
    "snippet",
    "worked_example",
    "quick_check",
    "warm_up",
    "canonical_question",
    "guardian_candidate",
]
STATUS_LABELS = ["ready", "partial", "missing", "needs_review", "blocked"]
NON_MASTERY_CURRICULUM_ROLES = {"p1_prerequisite", "out_of_scope"}
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SKILL_MAP = REPO_ROOT / "tools/content_lab/skill_maps/caie_9709_p3_skill_map.json"
DEFAULT_QUESTION_BANK = REPO_ROOT / "public/assets/exam-bank-data/question_bank.json"
DEFAULT_SNIPPETS = REPO_ROOT / "public/data/teaching_snippets.json"
DEFAULT_GENERATED_PRACTICE = REPO_ROOT / "public/data/generated_practice_bank.json"
DEFAULT_WORLD_MAP = REPO_ROOT / "src/lib/worldMap.ts"
DEFAULT_FIELD_GUIDES = REPO_ROOT / "src/data/regionFieldGuides.ts"
DEFAULT_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_content_inventory_report.json"
DEFAULT_ROUTING_AUDIT = REPO_ROOT / "tools/content_lab/reviews/p3_app_region_routing_audit.json"
DEFAULT_DEEPSEEK_CANDIDATES = [
    REPO_ROOT / "public/assets/exam-bank-data/question_bank.topic_routing.v1.json",
]


def get_question_array(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [as_record(item) for item in data if as_record(item)]
    root = as_record(data)
    for key in ("questions", "items", "records"):
        value = root.get(key)
        if isinstance(value, list):
            return [as_record(item) for item in value if as_record(item)]
    return []


def build_sidecar_index(data: Any) -> dict[str, Any]:
    index: dict[str, Any] = {}
    for record in get_question_array(data):
        item_id = non_empty_string(record.get("id")) or non_empty_string(record.get("question_id")) or non_empty_string(record.get("questionId")) or non_empty_string(record.get("key"))
        if item_id:
            index[item_id] = record

    root = as_record(data)
    enrichments = as_record(root.get("enrichments"))
    if enrichments:
        for key, value in enrichments.items():
            index[key] = value
    routing_records = as_record(root.get("records"))
    if routing_records:
        for key, value in routing_records.items():
            index[key] = value
    for key, value in root.items():
        if key not in {"schema_name", "schema_version", "record_count", "questions", "items", "records", "enrichments"}:
            index.setdefault(key, value)
    return index


def normalize_label(value: str | None) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", "", re.sub(r"[_/-]+", " ", value or "").lower())).strip()


def canonical_paper_family(value: str | None) -> str:
    normalized = normalize_label(value)
    if normalized in {"p3", "paper 3", "pure 3", "pure mathematics 3"}:
        return "p3"
    if normalized in {"p1", "paper 1", "pure 1", "pure mathematics 1"}:
        return "p1"
    if normalized in {"p4", "paper 4", "mechanics", "m1"}:
        return "p4"
    if normalized in {"p5", "paper 5", "statistics", "s1"}:
        return "p5"
    return normalized or "unknown"


def infer_paper_family(record: dict[str, Any]) -> str:
    explicit = non_empty_string(record.get("paper_family") or record.get("paperFamily") or record.get("family"))
    if explicit:
        return canonical_paper_family(explicit)
    hints = [
        non_empty_string(record.get("paper") or record.get("paper_code") or record.get("session")) or "",
        *image_values(record, ("question_image_paths", "question_images", "questionImagePaths", "question_image_path", "question_image", "image_path", "image")),
    ]
    normalized_hints = [hint.lower() for hint in hints if hint]
    if any(re.search(r"(^|[/_\-\s])p3([/_\-\s]|$)", hint) or re.search(r"paper\s*3", hint) for hint in normalized_hints):
        return "p3"
    if any(re.search(r"(^|[/_\-\s])p1([/_\-\s]|$)", hint) or re.search(r"paper\s*1", hint) for hint in normalized_hints):
        return "p1"
    return "unknown"


def string_literals(array_source: str) -> list[str]:
    return re.findall(r"'([^']*)'", array_source)


def matching_bracket_index(text: str, start_index: int, opener: str = "[", closer: str = "]") -> int:
    depth = 0
    in_string = False
    escaped = False
    for index in range(start_index, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "'":
                in_string = False
            continue
        if char == "'":
            in_string = True
            continue
        if char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                return index
    raise ValueError("Could not find matching bracket while parsing world regions")


def parse_region_source(path: Path, marker: str) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    marker_index = text.find(marker)
    array_start = text.find("[", marker_index)
    if marker_index == -1 or array_start == -1:
        return []
    array_end = matching_bracket_index(text, array_start)
    region_source = text[array_start + 1:array_end]
    regions: list[dict[str, Any]] = []
    pattern = re.compile(r"\{\s*id:\s*'(?P<id>[^']+)'(?P<body>.*?)matchTerms:\s*\[(?P<terms>.*?)\],\s*\}", re.S)
    for match in pattern.finditer(region_source):
        body = match.group("body")
        name_match = re.search(r"name:\s*'([^']+)'", body)
        description_match = re.search(r"description:\s*'([^']+)'", body)
        active_match = re.search(r"activeByDefault:\s*(true|false)", body)
        subtopics_match = re.search(r"subtopics:\s*\[(.*?)\]", body, re.S)
        region_id = match.group("id")
        regions.append({
            "region_id": region_id,
            "region_title": name_match.group(1) if name_match else region_id,
            "description": description_match.group(1) if description_match else "",
            "active_by_default": active_match.group(1) == "true" if active_match else False,
            "subtopics": string_literals(subtopics_match.group(1)) if subtopics_match else [],
            "match_terms": string_literals(match.group("terms")),
        })
    return regions


def parse_world_regions(world_map_path: Path) -> list[dict[str, Any]]:
    regions = parse_region_source(world_map_path, "regions:")
    if regions:
        return regions

    contract_path = world_map_path.with_name("p3SkillContract.ts")
    if contract_path.exists():
        regions = parse_region_source(contract_path, "P3_REGION_DEFINITIONS")
        if regions:
            return regions

    raise ValueError(f"No P3 regions could be parsed from {world_map_path}")


def parse_field_guide_region_ids(field_guides_path: Path) -> set[str]:
    text = field_guides_path.read_text(encoding="utf-8")
    guides_match = re.search(r"const guides:.*?=\s*\{(?P<body>.*)\n\};", text, re.S)
    if not guides_match:
        raise ValueError(f"No explicit Field Guide map could be parsed from {field_guides_path}")
    return set(re.findall(r"'([a-z0-9-]+)':\s*\{", guides_match.group("body")))


def match_region_for_labels(labels: list[str | None], regions: list[dict[str, Any]]) -> str | None:
    normalized_labels = [normalize_label(label) for label in labels if normalize_label(label)]
    best_region_id: str | None = None
    best_score = 0.0
    for region in regions:
        terms = [region["region_title"], *region["subtopics"], *region["match_terms"]]
        normalized_terms = [normalize_label(term) for term in terms if normalize_label(term)]
        score = 0.0
        for label in normalized_labels:
            term_score = 0.0
            for term in normalized_terms:
                if label == term:
                    term_score = max(term_score, 12.0)
                elif term and term in label:
                    term_score = max(term_score, min(10.0, len(term) / 2))
                elif label and label in term:
                    term_score = max(term_score, min(7.0, len(label) / 2))
            score += term_score
        if score > best_score:
            best_score = score
            best_region_id = str(region["region_id"])
    return best_region_id if best_score else None


def deepseek_labels(record: dict[str, Any], sidecar_index: dict[str, Any]) -> list[str]:
    item_id = question_id(record)
    deepseek = as_record(sidecar_index.get(item_id or "")) or as_record(record.get("deepseek")) or as_record(record.get("enrichment"))
    labels: list[str] = []
    for source in (deepseek,):
        labels.extend([
            non_empty_string(source.get("topic") or source.get("deepseek_topic") or source.get("predicted_topic")) or "",
            non_empty_string(source.get("deepseek_topic_normalized") or source.get("topic_normalized") or source.get("normalized_topic")) or "",
            non_empty_string(source.get("subtopic") or source.get("deepseek_subtopic") or source.get("predicted_subtopic")) or "",
            non_empty_string(source.get("primary_topic_id")) or "",
        ])
    return [label for label in labels if label]


def routed_region_id(record: dict[str, Any], sidecar_index: dict[str, Any]) -> str | None:
    item_id = question_id(record)
    routing = as_record(sidecar_index.get(item_id or ""))
    primary_topic_id = non_empty_string(routing.get("primary_topic_id"))
    if primary_topic_id:
        return P3_TOPIC_ID_TO_REGION_ID.get(primary_topic_id)
    return None


def question_id(record: dict[str, Any]) -> str | None:
    return non_empty_string(record.get("question_id")) or non_empty_string(record.get("id")) or non_empty_string(record.get("questionId"))


def question_details_index(data: Any, sidecar_data: Any, regions: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    sidecar_index = build_sidecar_index(sidecar_data)
    index: dict[str, dict[str, Any]] = {}
    for record in get_question_array(data):
        item_id = question_id(record)
        if not item_id:
            continue
        notes = as_record(record.get("notes"))
        labels = [
            non_empty_string(record.get("topic") or record.get("local_topic") or record.get("localTopic")),
            non_empty_string(record.get("subtopic") or record.get("local_subtopic") or record.get("localSubtopic")),
            non_empty_string(notes.get("subtopic")),
            *deepseek_labels(record, sidecar_index),
        ]
        app_region_id = routed_region_id(record, sidecar_index) or match_region_for_labels(labels, regions)
        blockers = training_blockers_for_record(record)
        index[item_id] = {
            "app_region_id": app_region_id,
            "paper": non_empty_string(record.get("paper") or record.get("paper_code") or record.get("session")) or "",
            "paper_family": infer_paper_family(record),
            "question_id": item_id,
            "question_number": non_empty_string(record.get("question_number") or record.get("questionNumber") or record.get("number") or record.get("question_no")) or "",
            "label_sources": {
                "local_topic": non_empty_string(record.get("topic") or record.get("local_topic") or record.get("localTopic")) or "",
                "local_subtopic": non_empty_string(record.get("subtopic") or record.get("local_subtopic") or record.get("localSubtopic")) or "",
                "notes_subtopic": non_empty_string(notes.get("subtopic")) or "",
                "deepseek_labels": deepseek_labels(record, sidecar_index),
                "topic_routing_region_id": routed_region_id(record, sidecar_index) or "",
            },
            "topic": non_empty_string(record.get("topic") or record.get("local_topic") or record.get("localTopic")) or "",
            "subtopic": non_empty_string(record.get("subtopic") or record.get("local_subtopic") or record.get("localSubtopic") or notes.get("subtopic")) or "",
            "trainable": not blockers,
            "training_blockers": blockers,
        }
    return index


def worked_example_records(snippet: dict[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    single = as_record(snippet.get("worked_example"))
    if single:
        records.append(single)
    if isinstance(snippet.get("worked_examples"), list):
        records.extend(as_record(value) for value in snippet["worked_examples"] if as_record(value))
    return records


def is_valid_worked_example(record: dict[str, Any]) -> bool:
    return bool(
        non_empty_string(record.get("prompt"))
        and string_list(record.get("steps"))
        and non_empty_string(record.get("answer"))
    )


def validate_region_ref(region_id: str | None, owner: str, known_region_ids: set[str], errors: list[str]) -> None:
    if region_id and region_id not in known_region_ids:
        errors.append(f"{owner} references unknown P3 region_id {region_id}")


def snippet_support_index(data: Any, known_region_ids: set[str], errors: list[str]) -> dict[str, Any]:
    root = as_record(data)
    snippets = root.get("snippets") if isinstance(root.get("snippets"), list) else []
    snippet_ids: set[str] = set()
    quick_check_ids: set[str] = set()
    worked_example_ids_by_snippet: dict[str, list[str]] = {}
    guardian_recommended_question_ids: set[str] = set()

    for value in snippets:
        snippet = as_record(value)
        if snippet.get("review_status") not in RUNTIME_REVIEW_STATUSES:
            continue
        if canonical_paper_family(non_empty_string(snippet.get("paper_family"))) != "p3":
            continue
        snippet_id = non_empty_string(snippet.get("snippet_id"))
        if not snippet_id:
            continue
        for region_id in string_list(snippet.get("region_ids")):
            validate_region_ref(region_id, f"snippet {snippet_id}", known_region_ids, errors)
        snippet_ids.add(snippet_id)

        examples: list[str] = []
        for index, example in enumerate(worked_example_records(snippet), start=1):
            if is_valid_worked_example(example):
                examples.append(non_empty_string(example.get("id")) or f"{snippet_id}::worked_example_{index}")
        worked_example_ids_by_snippet[snippet_id] = unique_sorted(examples)

        quick_check = as_record(snippet.get("quick_check"))
        if quick_check and quick_check.get("review_status") in RUNTIME_REVIEW_STATUSES:
            validate_region_ref(non_empty_string(quick_check.get("region_id")), f"quick_check for snippet {snippet_id}", known_region_ids, errors)
            quick_check_id = non_empty_string(quick_check.get("id"))
            if quick_check_id:
                quick_check_ids.add(quick_check_id)

        guardian = as_record(snippet.get("guardian_readiness"))
        guardian_recommended_question_ids.update(string_list(guardian.get("recommended_before_question_ids")))

    return {
        "guardian_recommended_question_ids": guardian_recommended_question_ids,
        "quick_check_ids": quick_check_ids,
        "snippet_ids": snippet_ids,
        "worked_example_ids_by_snippet": worked_example_ids_by_snippet,
    }


def generated_practice_index(data: Any, known_region_ids: set[str], errors: list[str]) -> dict[str, Any]:
    root = as_record(data)
    items = root.get("items") if isinstance(root.get("items"), list) else []
    family_counts: dict[str, int] = {}
    practice_ids_by_family: dict[str, list[str]] = {}
    for index, value in enumerate(items, start=1):
        item = as_record(value)
        verification = as_record(item.get("verification"))
        if item.get("review_status") not in RUNTIME_REVIEW_STATUSES or verification.get("status") != "pass":
            continue
        if canonical_paper_family(non_empty_string(item.get("paper_family"))) != "p3":
            continue
        family = non_empty_string(item.get("generator_family"))
        if not family:
            continue
        for region_id in string_list(item.get("region_ids")):
            validate_region_ref(region_id, f"generated practice {non_empty_string(item.get('practice_id')) or index}", known_region_ids, errors)
        practice_id = non_empty_string(item.get("practice_id")) or f"{family}::{index}"
        family_counts[family] = family_counts.get(family, 0) + 1
        practice_ids_by_family.setdefault(family, []).append(practice_id)
    return {
        "generator_families": set(family_counts),
        "generator_family_counts": family_counts,
        "practice_ids_by_family": {family: unique_sorted(ids) for family, ids in practice_ids_by_family.items()},
    }


def load_routing_audit(
    routing_audit_path: Path | None,
    skills: list[dict[str, Any]],
    question_index: dict[str, dict[str, Any]],
    known_region_ids: set[str],
    errors: list[str],
) -> dict[str, Any]:
    if routing_audit_path is None:
        return {
            "review_label": "none",
            "entries": [],
            "index": {},
        }

    root = as_record(load_json(routing_audit_path))
    if root.get("schema_name") != ROUTING_AUDIT_SCHEMA_NAME:
        errors.append(f"{routing_audit_path} schema_name must be {ROUTING_AUDIT_SCHEMA_NAME}")
    if root.get("schema_version") != ROUTING_AUDIT_SCHEMA_VERSION:
        errors.append(f"{routing_audit_path} schema_version must be {ROUTING_AUDIT_SCHEMA_VERSION}")

    entries_value = root.get("entries")
    entries = entries_value if isinstance(entries_value, list) else []
    if not isinstance(entries_value, list):
        errors.append(f"{routing_audit_path} entries must be a list")

    known_skill_refs = {str(skill["skill_id"]) for skill in skills}
    audit_index: dict[tuple[str, str], dict[str, Any]] = {}
    normalized_entries: list[dict[str, Any]] = []

    for index, value in enumerate(entries, start=1):
        entry = as_record(value)
        skill_ref = non_empty_string(entry.get("skill_ref"))
        question_ref = non_empty_string(entry.get("question_id"))
        owner = f"routing audit entry {index}"
        if not skill_ref:
            errors.append(f"{owner} is missing skill_ref")
            continue
        if not question_ref:
            errors.append(f"{owner} is missing question_id")
            continue
        if skill_ref not in known_skill_refs:
            errors.append(f"{owner} references unknown reviewed skill_ref {skill_ref}")
        if question_ref not in question_index:
            errors.append(f"{owner} references unknown canonical question_id {question_ref}")

        status = non_empty_string(entry.get("resolution_status"))
        if status not in ROUTING_AUDIT_STATUSES:
            errors.append(f"{owner} has invalid resolution_status {status}")

        original_region = non_empty_string(entry.get("original_app_region_id"))
        reviewed_region = non_empty_string(entry.get("reviewed_skill_map_region_id"))
        validate_region_ref(original_region, owner, known_region_ids, errors)
        validate_region_ref(reviewed_region, owner, known_region_ids, errors)

        for field in ("source_of_conflicting_label", "recommended_resolution", "rationale"):
            if not non_empty_string(entry.get(field)):
                errors.append(f"{owner} is missing {field}")

        evidence_status = non_empty_string(entry.get("evidence_status"))
        mastery_evidence_allowed = entry.get("mastery_evidence_allowed")
        practice_allowed = entry.get("practice_allowed")
        export_allowed = entry.get("export_allowed")
        if status == DEFERRED_ROUTING_STATUS:
            if evidence_status != DEFERRED_EVIDENCE_STATUS:
                errors.append(f"{owner} teacher_review_deferred entries must set evidence_status to {DEFERRED_EVIDENCE_STATUS}")
            if mastery_evidence_allowed is not False:
                errors.append(f"{owner} teacher_review_deferred entries must set mastery_evidence_allowed to false")
            if practice_allowed is not True:
                errors.append(f"{owner} teacher_review_deferred entries must set practice_allowed to true")
            if export_allowed is not False:
                errors.append(f"{owner} teacher_review_deferred entries must set export_allowed to false")
        if status in VALIDATED_ROUTING_STATUSES:
            if evidence_status != VALIDATED_EVIDENCE_STATUS:
                errors.append(f"{owner} validated route entries must set evidence_status to {VALIDATED_EVIDENCE_STATUS}")
            if mastery_evidence_allowed is not True:
                errors.append(f"{owner} validated route entries must set mastery_evidence_allowed to true")
            if practice_allowed is not True:
                errors.append(f"{owner} validated route entries must set practice_allowed to true")
            if export_allowed is not True:
                errors.append(f"{owner} validated route entries must set export_allowed to true")

        key = (skill_ref, question_ref)
        if key in audit_index:
            errors.append(f"{owner} duplicates routing audit pair {skill_ref}/{question_ref}")
        normalized = {
            "evidence_status": evidence_status or "",
            "export_allowed": export_allowed if isinstance(export_allowed, bool) else None,
            "mastery_evidence_allowed": mastery_evidence_allowed if isinstance(mastery_evidence_allowed, bool) else None,
            "practice_allowed": practice_allowed if isinstance(practice_allowed, bool) else None,
            "question_id": question_ref,
            "rationale": non_empty_string(entry.get("rationale")) or "",
            "recommended_resolution": non_empty_string(entry.get("recommended_resolution")) or "",
            "resolution_status": status or "",
            "reviewed_skill_map_region_id": reviewed_region or "",
            "original_app_region_id": original_region or "",
            "skill_ref": skill_ref,
            "source_of_conflicting_label": non_empty_string(entry.get("source_of_conflicting_label")) or "",
        }
        audit_index[key] = normalized
        normalized_entries.append(normalized)

    return {
        "review_label": non_empty_string(root.get("review_label")) or "",
        "entries": normalized_entries,
        "index": audit_index,
    }


def validate_mastery_evidence(
    skills: list[dict[str, Any]],
    question_index: dict[str, dict[str, Any]],
    errors: list[str],
) -> None:
    for skill in skills:
        skill_id = str(skill["skill_id"])
        if skill.get("mastery_eligible") is not True:
            continue
        for field, label in (
            ("canonical_source_question_ids", "canonical mastery evidence"),
            ("supported_by_guardian_candidates", "guardian candidate evidence"),
        ):
            for item_id in string_list(skill.get(field)):
                question = question_index.get(item_id)
                if not question:
                    errors.append(f"{skill_id} has unknown {label} question id {item_id}")
                    continue
                if question["paper_family"] != "p3":
                    errors.append(f"{skill_id} has unsafe {label} {item_id}: paper_family is {question['paper_family']}, expected p3")
                if question["trainable"] is not True:
                    blockers = ", ".join(question["training_blockers"]) or "not trainable"
                    errors.append(f"{skill_id} has unsafe {label} {item_id}: {blockers}")


def support_status(skill: dict[str, Any], missing_support_types: list[str], available_support_types: list[str]) -> str:
    if skill["curriculum_role"] in NON_MASTERY_CURRICULUM_ROLES or skill["mastery_eligible"] is False:
        return "blocked"
    if skill["needs_teacher_review"] or skill["curriculum_role"] == "ambiguous":
        return "needs_review"
    if not missing_support_types:
        return "ready"
    if not available_support_types:
        return "missing"
    return "partial"


def support_status_for_row(row: dict[str, Any]) -> str:
    if row["curriculum_role"] in NON_MASTERY_CURRICULUM_ROLES or row["mastery_eligible"] is False:
        return "blocked"
    if (
        row["needs_teacher_review"]
        or row["curriculum_role"] == "ambiguous"
        or row.get("teacher_review_app_region_mismatch_question_ids")
        or row.get("unreviewed_app_region_mismatch_question_ids")
    ):
        return "needs_review"
    if not row["missing_support_types"]:
        return "ready"
    if not row["available_support_types"]:
        return "missing"
    return "partial"


def set_support_type(row: dict[str, Any], support_type: str, present: bool) -> None:
    available = set(row["available_support_types"])
    missing = set(row["missing_support_types"])
    if present:
        available.add(support_type)
        missing.discard(support_type)
    else:
        available.discard(support_type)
        missing.add(support_type)
    row["available_support_types"] = [item for item in SUPPORT_TYPES if item in available]
    row["missing_support_types"] = [item for item in SUPPORT_TYPES if item in missing]


def skill_inventory_row(
    skill: dict[str, Any],
    field_guide_region_ids: set[str],
    question_index: dict[str, dict[str, Any]],
    snippet_index: dict[str, Any],
    generated_index: dict[str, Any],
) -> dict[str, Any]:
    canonical_ids = string_list(skill.get("canonical_source_question_ids"))
    snippet_ids = string_list(skill.get("supported_by_snippet_ids"))
    quick_check_ids = string_list(skill.get("supported_by_quick_check_ids"))
    generator_families = string_list(skill.get("supported_by_generator_families"))
    guardian_candidate_ids = string_list(skill.get("supported_by_guardian_candidates"))

    resolved_snippet_ids = [item_id for item_id in snippet_ids if item_id in snippet_index["snippet_ids"]]
    resolved_worked_example_ids = unique_sorted([
        example_id
        for snippet_id in resolved_snippet_ids
        for example_id in snippet_index["worked_example_ids_by_snippet"].get(snippet_id, [])
    ])
    resolved_quick_check_ids = [item_id for item_id in quick_check_ids if item_id in snippet_index["quick_check_ids"]]
    resolved_generator_families = [family for family in generator_families if family in generated_index["generator_families"]]
    warm_up_practice_ids = unique_sorted([
        practice_id
        for family in resolved_generator_families
        for practice_id in generated_index["practice_ids_by_family"].get(family, [])
    ])
    trainable_p3_question_ids = [
        item_id
        for item_id in canonical_ids
        if question_index.get(item_id, {}).get("paper_family") == "p3" and question_index.get(item_id, {}).get("trainable") is True
    ]
    resolved_guardian_candidates = [
        item_id
        for item_id in guardian_candidate_ids
        if question_index.get(item_id, {}).get("paper_family") == "p3" and question_index.get(item_id, {}).get("trainable") is True
    ]
    app_region_mismatch_question_ids = [
        item_id
        for item_id in trainable_p3_question_ids
        if question_index.get(item_id, {}).get("app_region_id") and question_index[item_id]["app_region_id"] != skill["region_id"]
    ]
    p1_prerequisite_refs = [
        ref
        for ref in skill.get("prerequisite_skill_refs", [])
        if as_record(ref).get("syllabus_id") == "caie_9709_p1_2026_2027"
    ]

    support_presence = {
        "field_guide": skill["region_id"] in field_guide_region_ids,
        "snippet": bool(resolved_snippet_ids),
        "worked_example": bool(resolved_worked_example_ids),
        "quick_check": bool(resolved_quick_check_ids),
        "warm_up": bool(warm_up_practice_ids),
        "canonical_question": bool(trainable_p3_question_ids),
        "guardian_candidate": bool(resolved_guardian_candidates),
    }
    available_support_types = [support_type for support_type in SUPPORT_TYPES if support_presence[support_type]]
    missing_support_types = [support_type for support_type in SUPPORT_TYPES if not support_presence[support_type]]
    status = support_status(skill, missing_support_types, available_support_types)

    return {
        "available_support_types": available_support_types,
        "canonical_question_ids": canonical_ids,
        "canonical_question_ids_routed_to_skill": trainable_p3_question_ids,
        "canonical_question_count": len(trainable_p3_question_ids),
        "curriculum_role": skill["curriculum_role"],
        "field_guide_count": 1 if support_presence["field_guide"] else 0,
        "field_guide_region_id": skill["region_id"] if support_presence["field_guide"] else None,
        "guardian_candidate_count": len(resolved_guardian_candidates),
        "guardian_candidate_question_ids": resolved_guardian_candidates,
        "instructional_status": status,
        "mastery_evidence_blocked_question_ids": [],
        "mastery_evidence_question_count": len(trainable_p3_question_ids),
        "mastery_evidence_question_ids": trainable_p3_question_ids,
        "mastery_eligible": skill["mastery_eligible"],
        "micro_skill_name": skill["micro_skill_name"],
        "missing_support_types": missing_support_types,
        "needs_teacher_review": skill["needs_teacher_review"],
        "official_curriculum_section": skill["syllabus_topic"],
        "p1_prerequisite_refs": p1_prerequisite_refs,
        "prerequisite_notes": skill["prerequisite_notes"],
        "prerequisite_skill_refs": skill["prerequisite_skill_refs"],
        "quick_check_count": len(resolved_quick_check_ids),
        "quick_check_ids": resolved_quick_check_ids,
        "region_id": skill["region_id"],
        "risk_flags": unique_sorted([
            *(["app_region_routing_mismatch"] if app_region_mismatch_question_ids else []),
            *(["needs_teacher_review"] if skill["needs_teacher_review"] else []),
            *(["non_mastery_curriculum_role"] if status == "blocked" else []),
        ]),
        "skill_ref": skill["skill_id"],
        "snippet_count": len(resolved_snippet_ids),
        "snippet_ids": resolved_snippet_ids,
        "unresolved_generator_families": [family for family in generator_families if family not in generated_index["generator_families"]],
        "unresolved_quick_check_ids": [item_id for item_id in quick_check_ids if item_id not in snippet_index["quick_check_ids"]],
        "unresolved_snippet_ids": [item_id for item_id in snippet_ids if item_id not in snippet_index["snippet_ids"]],
        "app_region_mismatch_question_ids": app_region_mismatch_question_ids,
        "practice_allowed_question_ids": trainable_p3_question_ids,
        "practice_allowed_deferred_question_ids": [],
        "export_blocked_deferred_question_ids": [],
        "teacher_review_deferred_question_ids": [],
        "warmup_support_count": len(warm_up_practice_ids),
        "warmup_generator_families": resolved_generator_families,
        "warmup_practice_ids": warm_up_practice_ids,
        "worked_example_count": len(resolved_worked_example_ids),
        "worked_example_ids": resolved_worked_example_ids,
    }


def gap_entries(skill_rows: list[dict[str, Any]], support_type: str) -> list[dict[str, Any]]:
    return [
        {
            "skill_ref": row["skill_ref"],
            "region_id": row["region_id"],
            "official_curriculum_section": row["official_curriculum_section"],
            "micro_skill_name": row["micro_skill_name"],
        }
        for row in skill_rows
        if support_type in row["missing_support_types"]
    ]


def region_inventory_rows(
    regions: list[dict[str, Any]],
    skill_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    by_region: dict[str, list[dict[str, Any]]] = {}
    for row in skill_rows:
        by_region.setdefault(row["region_id"], []).append(row)

    rows: list[dict[str, Any]] = []
    for region in regions:
        region_id = region["region_id"]
        skills = sorted(by_region.get(region_id, []), key=lambda item: item["skill_ref"])
        missing_flags = unique_sorted([
            f"missing_{support_type}"
            for support_type in SUPPORT_TYPES
            if any(support_type in row["missing_support_types"] for row in skills)
        ])
        statuses = {row["instructional_status"] for row in skills}
        if "blocked" in statuses:
            status = "blocked"
        elif "needs_review" in statuses:
            status = "needs_review"
        elif statuses == {"ready"}:
            status = "ready"
        elif statuses == {"missing"}:
            status = "missing"
        else:
            status = "partial"
        rows.append({
            "active_by_default": region["active_by_default"],
            "canonical_question_count": len({item for row in skills for item in row["canonical_question_ids_routed_to_skill"]}),
            "field_guide_count": 1 if any(row["field_guide_count"] for row in skills) else 0,
            "guardian_candidate_count": len({item for row in skills for item in row["guardian_candidate_question_ids"]}),
            "instructional_status": status,
            "missing_support_flags": missing_flags,
            "quick_check_count": len({item for row in skills for item in row["quick_check_ids"]}),
            "region_id": region_id,
            "region_title": region["region_title"],
            "reviewed_skill_refs": [row["skill_ref"] for row in skills],
            "skill_count": len(skills),
            "snippet_count": len({item for row in skills for item in row["snippet_ids"]}),
            "warmup_support_count": len({item for row in skills for item in row["warmup_practice_ids"]}),
            "worked_example_count": len({item for row in skills for item in row["worked_example_ids"]}),
        })
    return rows


def question_routing_summary(
    regions: list[dict[str, Any]],
    question_index: dict[str, dict[str, Any]],
    skill_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    p3_questions = [question for question in question_index.values() if question["paper_family"] == "p3"]
    trainable_p3_questions = [question for question in p3_questions if question["trainable"]]
    referenced_canonical_ids = {item for row in skill_rows for item in row["canonical_question_ids"]}
    referenced_trainable_ids = {item for row in skill_rows for item in row["canonical_question_ids_routed_to_skill"]}
    app_routed_ids = {question["question_id"] for question in p3_questions if question["app_region_id"]}
    by_region = []
    for region in regions:
        region_id = region["region_id"]
        by_region.append({
            "app_routed_p3_question_count": sum(1 for question in p3_questions if question["app_region_id"] == region_id),
            "canonical_question_count": len({
                item
                for row in skill_rows
                if row["region_id"] == region_id
                for item in row["canonical_question_ids_routed_to_skill"]
            }),
            "region_id": region_id,
            "region_title": region["region_title"],
            "skill_count": sum(1 for row in skill_rows if row["region_id"] == region_id),
        })
    return {
        "app_region_routed_p3_question_count": len(app_routed_ids),
        "app_region_unrouted_p3_question_count": len(p3_questions) - len(app_routed_ids),
        "by_region": by_region,
        "referenced_canonical_question_count": len(referenced_canonical_ids),
        "referenced_trainable_p3_question_count": len(referenced_trainable_ids),
        "total_question_count": len(question_index),
        "trainable_p3_question_count": len(trainable_p3_questions),
        "unreferenced_trainable_p3_question_count": max(0, len({question["question_id"] for question in trainable_p3_questions}) - len(referenced_trainable_ids)),
        "p3_question_count": len(p3_questions),
    }


def routing_mismatch_detail(
    *,
    row: dict[str, Any],
    question: dict[str, Any],
    audit_entry: dict[str, Any] | None,
    resolution_status: str,
) -> dict[str, Any]:
    label_sources = as_record(question.get("label_sources"))
    source_summary = audit_entry.get("source_of_conflicting_label") if audit_entry else ""
    if not source_summary:
        deepseek = ", ".join(string_list(label_sources.get("deepseek_labels")))
        source_summary = (
            "No routing-audit entry; current labels are "
            f"topic={label_sources.get('local_topic') or 'unknown'}, "
            f"subtopic={label_sources.get('local_subtopic') or label_sources.get('notes_subtopic') or 'unknown'}, "
            f"deepseek={deepseek or 'none'}."
        )
    detail = {
        "app_region_id": question.get("app_region_id"),
        "evidence_status": audit_entry.get("evidence_status") if audit_entry else "",
        "export_allowed": audit_entry.get("export_allowed") if audit_entry else None,
        "mastery_evidence_allowed": audit_entry.get("mastery_evidence_allowed") if audit_entry else None,
        "practice_allowed": audit_entry.get("practice_allowed") if audit_entry else None,
        "question_id": question["question_id"],
        "rationale": audit_entry.get("rationale") if audit_entry else "Active app-region mismatch has not been reviewed in the routing audit.",
        "recommended_resolution": audit_entry.get("recommended_resolution") if audit_entry else "Review the app label route against the reviewed P3 skill map before using this question as route evidence.",
        "resolution_status": resolution_status,
        "reviewed_skill_map_region_id": row["region_id"],
        "skill_ref": row["skill_ref"],
        "source_of_conflicting_label": source_summary,
    }
    if resolution_status == DEFERRED_ROUTING_STATUS and not detail["evidence_status"]:
        detail["evidence_status"] = DEFERRED_EVIDENCE_STATUS
    return detail


def deferred_backlog_summary(items: list[dict[str, Any]]) -> dict[str, Any]:
    affected_region_ids = unique_sorted({
        str(value)
        for item in items
        for value in (item.get("app_region_id"), item.get("reviewed_skill_map_region_id"))
        if value
    })
    affected_reviewed_region_ids = unique_sorted([
        str(item["reviewed_skill_map_region_id"])
        for item in items
        if item.get("reviewed_skill_map_region_id")
    ])
    affected_app_region_ids = unique_sorted([
        str(item["app_region_id"])
        for item in items
        if item.get("app_region_id")
    ])
    return {
        "affected_app_region_ids": affected_app_region_ids,
        "affected_region_ids": affected_region_ids,
        "affected_reviewed_region_ids": affected_reviewed_region_ids,
        "affected_skill_refs": unique_sorted([str(item["skill_ref"]) for item in items]),
        "case_count": len(items),
        "evidence_status": DEFERRED_EVIDENCE_STATUS,
        "export_allowed": False if items else None,
        "export_blocked_case_count": sum(1 for item in items if item.get("export_allowed") is False),
        "items": items,
        "mastery_evidence_allowed": False if items else None,
        "mastery_evidence_blocked_case_count": sum(1 for item in items if item.get("mastery_evidence_allowed") is False),
        "practice_allowed": True if items else None,
        "practice_allowed_case_count": sum(1 for item in items if item.get("practice_allowed") is True),
        "resolution_status": DEFERRED_ROUTING_STATUS,
    }


def routing_audit_summary(
    routing_audit: dict[str, Any],
    skill_rows: list[dict[str, Any]],
    question_index: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    audit_index: dict[tuple[str, str], dict[str, Any]] = routing_audit["index"]
    active_pairs = {
        (row["skill_ref"], question_id): row
        for row in skill_rows
        for question_id in row["app_region_mismatch_question_ids"]
    }

    teacher_review_mismatches: list[dict[str, Any]] = []
    unreviewed_mismatches: list[dict[str, Any]] = []
    resolved_mismatches: list[dict[str, Any]] = []
    inactive_teacher_review_entries: list[dict[str, Any]] = []

    for key in sorted(active_pairs):
        row = active_pairs[key]
        question = question_index[key[1]]
        audit_entry = audit_index.get(key)
        if audit_entry and audit_entry["resolution_status"] in TEACHER_REVIEW_ROUTING_STATUSES:
            teacher_review_mismatches.append(routing_mismatch_detail(
                row=row,
                question=question,
                audit_entry=audit_entry,
                resolution_status=audit_entry["resolution_status"],
            ))
        elif audit_entry and audit_entry["resolution_status"] in VALIDATED_ROUTING_STATUSES:
            resolved_mismatches.append(routing_mismatch_detail(
                row=row,
                question=question,
                audit_entry=audit_entry,
                resolution_status=audit_entry["resolution_status"],
            ))
        else:
            status = (
                "corrected_status_still_active"
                if audit_entry and audit_entry["resolution_status"].startswith("corrected_")
                else "unreviewed"
            )
            unreviewed_mismatches.append(routing_mismatch_detail(
                row=row,
                question=question,
                audit_entry=audit_entry,
                resolution_status=status,
            ))

    for entry in routing_audit["entries"]:
        key = (entry["skill_ref"], entry["question_id"])
        if entry["resolution_status"] in VALIDATED_ROUTING_STATUSES:
            continue
        if entry["resolution_status"] in TEACHER_REVIEW_ROUTING_STATUSES:
            if key not in active_pairs:
                inactive_teacher_review_entries.append(entry)
        elif key not in active_pairs:
            resolved_mismatches.append(entry)

    deferred_teacher_review_mismatches = [
        item for item in teacher_review_mismatches if item["resolution_status"] == DEFERRED_ROUTING_STATUS
    ]
    return {
        "active_mismatch_count": len(teacher_review_mismatches) + len(unreviewed_mismatches),
        "active_skill_warning_count": len({item["skill_ref"] for item in teacher_review_mismatches + unreviewed_mismatches}),
        "deferred_ambiguous_case_count": len(deferred_teacher_review_mismatches),
        "deferred_review_backlog": deferred_backlog_summary(deferred_teacher_review_mismatches),
        "deferred_teacher_review_count": len(deferred_teacher_review_mismatches),
        "deferred_teacher_review_mismatches": deferred_teacher_review_mismatches,
        "deferred_teacher_review_skill_warning_count": len({item["skill_ref"] for item in deferred_teacher_review_mismatches}),
        "inactive_teacher_review_entry_count": len(inactive_teacher_review_entries),
        "inactive_teacher_review_entries": inactive_teacher_review_entries,
        "original_reviewed_mismatch_count": len(routing_audit["entries"]),
        "resolved_mismatch_count": len(resolved_mismatches),
        "resolved_mismatches": resolved_mismatches,
        "resolved_skill_warning_count": len({item["skill_ref"] for item in resolved_mismatches}),
        "review_label": routing_audit["review_label"],
        "teacher_review_mismatch_count": len(teacher_review_mismatches),
        "teacher_review_mismatches": teacher_review_mismatches,
        "teacher_review_skill_warning_count": len({item["skill_ref"] for item in teacher_review_mismatches}),
        "unreviewed_mismatch_count": len(unreviewed_mismatches),
        "unreviewed_mismatches": unreviewed_mismatches,
        "unreviewed_skill_warning_count": len({item["skill_ref"] for item in unreviewed_mismatches}),
    }


def apply_routing_audit_to_skill_rows(
    skill_rows: list[dict[str, Any]],
    routing_audit: dict[str, Any],
) -> None:
    teacher_by_skill: dict[str, list[str]] = {}
    deferred_by_skill: dict[str, list[str]] = {}
    unreviewed_by_skill: dict[str, list[str]] = {}
    for item in routing_audit["teacher_review_mismatches"]:
        teacher_by_skill.setdefault(item["skill_ref"], []).append(item["question_id"])
    for item in routing_audit["deferred_teacher_review_mismatches"]:
        deferred_by_skill.setdefault(item["skill_ref"], []).append(item["question_id"])
    for item in routing_audit["unreviewed_mismatches"]:
        unreviewed_by_skill.setdefault(item["skill_ref"], []).append(item["question_id"])

    for row in skill_rows:
        teacher_ids = unique_sorted(teacher_by_skill.get(row["skill_ref"], []))
        deferred_ids = unique_sorted(deferred_by_skill.get(row["skill_ref"], []))
        unreviewed_ids = unique_sorted(unreviewed_by_skill.get(row["skill_ref"], []))
        mastery_blocked_ids = unique_sorted(set(teacher_ids) | set(unreviewed_ids))
        practice_allowed_ids = unique_sorted(row["practice_allowed_question_ids"])
        mastery_evidence_ids = [
            item_id
            for item_id in row["practice_allowed_question_ids"]
            if item_id not in mastery_blocked_ids
        ]
        guardian_candidate_ids = [
            item_id
            for item_id in row["guardian_candidate_question_ids"]
            if item_id not in mastery_blocked_ids
        ]

        row["teacher_review_app_region_mismatch_question_ids"] = teacher_ids
        row["teacher_review_deferred_question_ids"] = deferred_ids
        row["unreviewed_app_region_mismatch_question_ids"] = unreviewed_ids
        row["mastery_evidence_blocked_question_ids"] = mastery_blocked_ids
        row["mastery_evidence_question_ids"] = mastery_evidence_ids
        row["mastery_evidence_question_count"] = len(mastery_evidence_ids)
        row["canonical_question_ids_routed_to_skill"] = mastery_evidence_ids
        row["canonical_question_count"] = len(mastery_evidence_ids)
        row["guardian_candidate_question_ids"] = guardian_candidate_ids
        row["guardian_candidate_count"] = len(guardian_candidate_ids)
        row["practice_allowed_question_ids"] = practice_allowed_ids
        row["practice_allowed_deferred_question_ids"] = deferred_ids
        row["export_blocked_deferred_question_ids"] = deferred_ids
        set_support_type(row, "canonical_question", bool(mastery_evidence_ids))
        set_support_type(row, "guardian_candidate", bool(guardian_candidate_ids))

        risk_flags = set(row["risk_flags"])
        risk_flags.discard("app_region_routing_mismatch")
        if teacher_ids:
            risk_flags.add("teacher_review_app_region_mismatch")
        if deferred_ids:
            risk_flags.add("teacher_review_deferred")
            risk_flags.add("mastery_evidence_deferred")
        if unreviewed_ids:
            risk_flags.add("unreviewed_app_region_routing_mismatch")
        row["risk_flags"] = unique_sorted(risk_flags)
        row["instructional_status"] = support_status_for_row(row)


def teacher_review_export_tag_summary(skill_rows: list[dict[str, Any]]) -> dict[str, Any]:
    p1_refs = sorted({
        ref["skill_ref"]
        for row in skill_rows
        for ref in row["p1_prerequisite_refs"]
        if non_empty_string(ref.get("skill_ref"))
    })
    return {
        "available_export_tag_fields": [
            "skill_ref",
            "official_curriculum_section",
            "region_id",
            "curriculum_role",
            "mastery_eligible",
            "needs_teacher_review",
            "prerequisite_skill_refs",
            "prerequisite_notes",
            "available_support_types",
            "missing_support_types",
            "canonical_question_ids_routed_to_skill",
            "mastery_evidence_question_ids",
            "mastery_evidence_blocked_question_ids",
            "practice_allowed_question_ids",
            "teacher_review_deferred_question_ids",
        ],
        "curriculum_roles": {
            role: sum(1 for row in skill_rows if row["curriculum_role"] == role)
            for role in sorted(ALLOWED_CURRICULUM_ROLES)
        },
        "mastery_eligible_skill_count": sum(1 for row in skill_rows if row["mastery_eligible"]),
        "needs_teacher_review_skill_count": sum(1 for row in skill_rows if row["needs_teacher_review"]),
        "p1_prerequisite_ref_count": sum(len(row["p1_prerequisite_refs"]) for row in skill_rows),
        "p1_prerequisite_skill_refs": p1_refs,
        "skills_with_p1_prerequisite_refs": sum(1 for row in skill_rows if row["p1_prerequisite_refs"]),
    }


def status_summary(rows: list[dict[str, Any]]) -> dict[str, int]:
    return {
        status: sum(1 for row in rows if row["instructional_status"] == status)
        for status in STATUS_LABELS
    }


def risk_summary(
    skill_rows: list[dict[str, Any]],
    routing_summary: dict[str, Any],
    routing_audit: dict[str, Any],
    structural_warning_count: int,
) -> list[dict[str, Any]]:
    risks = [
        ("missing_snippet", len(gap_entries(skill_rows, "snippet")), "ordinary_gap", None),
        ("missing_worked_example", len(gap_entries(skill_rows, "worked_example")), "ordinary_gap", None),
        ("missing_quick_check", len(gap_entries(skill_rows, "quick_check")), "ordinary_gap", None),
        ("missing_warm_up", len(gap_entries(skill_rows, "warm_up")), "ordinary_gap", None),
        ("missing_trainable_canonical_question", len(gap_entries(skill_rows, "canonical_question")), "ordinary_gap", None),
        ("missing_guardian_candidate", len(gap_entries(skill_rows, "guardian_candidate")), "ordinary_gap", None),
        ("app_region_unrouted_p3_questions", routing_summary["app_region_unrouted_p3_question_count"], "review_risk", None),
        ("teacher_review_deferred_ambiguous_cases", routing_audit["deferred_teacher_review_count"], "review_risk", None),
        ("mastery_blocked_deferred_ambiguous_cases", routing_audit["deferred_review_backlog"]["mastery_evidence_blocked_case_count"], "mastery_safety", None),
        ("teacher_review_app_region_mismatches", routing_audit["teacher_review_mismatch_count"], "review_risk", None),
        ("unreviewed_app_region_mismatches", routing_audit["unreviewed_mismatch_count"], "structural_warning", None),
        ("resolved_app_region_mismatches", routing_audit["resolved_mismatch_count"], "audit_result", "resolved" if routing_audit["resolved_mismatch_count"] else "clear"),
        ("inactive_teacher_review_routing_audit_entries", routing_audit["inactive_teacher_review_entry_count"], "review_risk", None),
        ("needs_teacher_review", sum(1 for row in skill_rows if row["needs_teacher_review"]), "review_risk", None),
        ("structural_warnings", structural_warning_count, "structural_warning", None),
    ]
    return [
        {
            "risk_id": risk_id,
            "risk_type": risk_type,
            "count": count,
            "status": explicit_status or ("clear" if count == 0 else "open"),
        }
        for risk_id, count, risk_type, explicit_status in risks
    ]


def actionable_next_steps(skill_rows: list[dict[str, Any]], region_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    missing_by_type = {
        support_type: gap_entries(skill_rows, support_type)
        for support_type in SUPPORT_TYPES
    }
    prioritized = sorted(
        [(support_type, len(entries)) for support_type, entries in missing_by_type.items()],
        key=lambda item: (-item[1], item[0]),
    )
    steps = []
    for support_type, count in prioritized:
        if count == 0:
            continue
        affected_regions = unique_sorted([entry["region_id"] for entry in missing_by_type[support_type]])
        steps.append({
            "action_id": f"fill_{support_type}_gaps",
            "affected_region_ids": affected_regions,
            "affected_skill_count": count,
            "summary": f"Add reviewed {support_type.replace('_', ' ')} support for {count} reviewed P3 skill(s).",
        })
    incomplete_regions = [row["region_id"] for row in region_rows if row["instructional_status"] != "ready"]
    if incomplete_regions:
        steps.append({
            "action_id": "prioritize_incomplete_regions",
            "affected_region_ids": incomplete_regions,
            "affected_skill_count": sum(row["skill_count"] for row in region_rows if row["instructional_status"] != "ready"),
            "summary": "Use the inventory to choose the next content-generation or page-redesign phase; this pass does not create new content.",
        })
    return steps


def display_path(path: Path | None) -> str | None:
    if path is None:
        return None
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def default_deepseek_path() -> Path | None:
    for path in DEFAULT_DEEPSEEK_CANDIDATES:
        if path.exists():
            return path
    return None


def build_report(
    *,
    skill_map_path: Path,
    question_bank_path: Path,
    snippets_path: Path,
    generated_practice_path: Path,
    world_map_path: Path,
    field_guides_path: Path,
    deepseek_sidecar_path: Path | None,
    routing_audit_path: Path | None,
) -> dict[str, Any]:
    skill_map_data = load_json(skill_map_path)
    skills = validate_skill_map(skill_map_data)
    regions = parse_world_regions(world_map_path)
    known_region_ids = {region["region_id"] for region in regions}
    field_guide_region_ids = parse_field_guide_region_ids(field_guides_path)
    errors: list[str] = []

    for region_id in field_guide_region_ids:
        validate_region_ref(region_id, "Field Guide map", known_region_ids, errors)
    for skill in skills:
        validate_region_ref(non_empty_string(skill.get("region_id")), f"skill {skill.get('skill_id')}", known_region_ids, errors)

    sidecar_data = load_json(deepseek_sidecar_path) if deepseek_sidecar_path and deepseek_sidecar_path.exists() else {}
    question_index = question_details_index(load_json(question_bank_path), sidecar_data, regions)
    routing_audit = load_routing_audit(routing_audit_path, skills, question_index, known_region_ids, errors)
    snippet_index = snippet_support_index(load_json(snippets_path), known_region_ids, errors)
    generated_index = generated_practice_index(load_json(generated_practice_path), known_region_ids, errors)
    validate_mastery_evidence(skills, question_index, errors)
    if errors:
        raise ValueError("; ".join(errors))

    skill_rows = [
        skill_inventory_row(skill, field_guide_region_ids, question_index, snippet_index, generated_index)
        for skill in sorted(skills, key=lambda item: str(item["skill_id"]))
    ]
    route_audit_summary = routing_audit_summary(routing_audit, skill_rows, question_index)
    apply_routing_audit_to_skill_rows(skill_rows, route_audit_summary)
    routing = question_routing_summary(regions, question_index, skill_rows)
    region_rows = region_inventory_rows(regions, skill_rows)
    missing_support = {
        "skills_missing_canonical_question": gap_entries(skill_rows, "canonical_question"),
        "skills_missing_field_guide": gap_entries(skill_rows, "field_guide"),
        "skills_missing_guardian_candidate": gap_entries(skill_rows, "guardian_candidate"),
        "skills_missing_quick_check": gap_entries(skill_rows, "quick_check"),
        "skills_missing_snippet": gap_entries(skill_rows, "snippet"),
        "skills_missing_warmup_support": gap_entries(skill_rows, "warm_up"),
        "skills_missing_worked_example": gap_entries(skill_rows, "worked_example"),
    }
    structural_warnings = [
        {
            "skill_ref": row["skill_ref"],
            "unresolved_snippet_ids": row["unresolved_snippet_ids"],
            "unresolved_quick_check_ids": row["unresolved_quick_check_ids"],
            "unresolved_generator_families": row["unresolved_generator_families"],
            "unreviewed_app_region_mismatch_question_ids": row["unreviewed_app_region_mismatch_question_ids"],
        }
        for row in skill_rows
        if row["unresolved_snippet_ids"]
        or row["unresolved_quick_check_ids"]
        or row["unresolved_generator_families"]
        or row["unreviewed_app_region_mismatch_question_ids"]
    ]
    teacher_summary = teacher_review_export_tag_summary(skill_rows)
    region_status_counts = status_summary(region_rows)
    skill_status_counts = status_summary(skill_rows)
    ready_for_instructional_loop = (
        skill_status_counts["ready"] == len(skill_rows)
        and not structural_warnings
    )

    curriculum_targets = as_record(as_record(skill_map_data).get("curriculum_targets"))
    return {
        "actionable_next_step_summary": actionable_next_steps(skill_rows, region_rows),
        "curriculum_target_summary": {
            "primary": curriculum_targets.get("primary"),
            "supporting_prerequisites": curriculum_targets.get("supporting_prerequisites"),
            "mastery_policy": curriculum_targets.get("mastery_policy"),
        },
        "generated_by": GENERATED_BY,
        "generated_label": GENERATED_LABEL,
        "inputs": {
            "deepseek_sidecar": display_path(deepseek_sidecar_path),
            "field_guides": display_path(field_guides_path),
            "generated_practice": display_path(generated_practice_path),
            "question_bank": display_path(question_bank_path),
            "routing_audit": display_path(routing_audit_path),
            "skill_map": display_path(skill_map_path),
            "snippets": display_path(snippets_path),
            "world_map": display_path(world_map_path),
        },
        "missing_support_summary": {
            **missing_support,
            "ordinary_gap_skill_count": sum(1 for row in skill_rows if row["missing_support_types"]),
        },
        "per_region_inventory": region_rows,
        "per_skill_inventory": skill_rows,
        "question_routing_summary": routing,
        "region_summary": {
            "region_count": len(region_rows),
            "regions_with_explicit_field_guides": len(field_guide_region_ids.intersection(known_region_ids)),
            "status_counts": region_status_counts,
        },
        "reviewed_skill_summary": {
            "available_support_type_counts": {
                support_type: sum(1 for row in skill_rows if support_type in row["available_support_types"])
                for support_type in SUPPORT_TYPES
            },
            "ready_for_region_learning_loop": ready_for_instructional_loop,
            "skill_count": len(skill_rows),
            "status_counts": skill_status_counts,
        },
        "risk_summary": risk_summary(skill_rows, routing, route_audit_summary, len(structural_warnings)),
        "routing_audit_summary": route_audit_summary,
        "schema_name": REPORT_SCHEMA_NAME,
        "schema_version": REPORT_SCHEMA_VERSION,
        "settings": {
            "support_types": SUPPORT_TYPES,
            "status_labels": STATUS_LABELS,
            "ordinary_missing_content_is_non_blocking": True,
            "unsafe_mastery_evidence_is_blocking": True,
        },
        "structural_reference_warnings": structural_warnings,
        "teacher_review_export_tag_summary": teacher_summary,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a deterministic P3 content inventory report for Content Lab.")
    parser.add_argument("--skill-map", type=Path, default=DEFAULT_SKILL_MAP)
    parser.add_argument("--question-bank", type=Path, default=DEFAULT_QUESTION_BANK)
    parser.add_argument("--deepseek-sidecar", type=Path, default=None)
    parser.add_argument("--snippets", type=Path, default=DEFAULT_SNIPPETS)
    parser.add_argument("--generated-practice", type=Path, default=DEFAULT_GENERATED_PRACTICE)
    parser.add_argument("--world-map", type=Path, default=DEFAULT_WORLD_MAP)
    parser.add_argument("--field-guides", type=Path, default=DEFAULT_FIELD_GUIDES)
    parser.add_argument("--routing-audit", type=Path, default=DEFAULT_ROUTING_AUDIT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    deepseek_sidecar_path = args.deepseek_sidecar if args.deepseek_sidecar is not None else default_deepseek_path()
    try:
        report = build_report(
            skill_map_path=args.skill_map,
            question_bank_path=args.question_bank,
            snippets_path=args.snippets,
            generated_practice_path=args.generated_practice,
            world_map_path=args.world_map,
            field_guides_path=args.field_guides,
            deepseek_sidecar_path=deepseek_sidecar_path,
            routing_audit_path=args.routing_audit,
        )
        write_json(args.output, report)
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    skill_summary = report["reviewed_skill_summary"]
    missing = report["missing_support_summary"]
    print(
        "P3 content inventory: "
        f"{skill_summary['skill_count']} skills; "
        f"ready_for_region_learning_loop={str(skill_summary['ready_for_region_learning_loop']).lower()}"
    )
    print(
        "Gaps: "
        f"snippet={len(missing['skills_missing_snippet'])}, "
        f"worked_example={len(missing['skills_missing_worked_example'])}, "
        f"quick_check={len(missing['skills_missing_quick_check'])}, "
        f"warm_up={len(missing['skills_missing_warmup_support'])}, "
        f"canonical_question={len(missing['skills_missing_canonical_question'])}, "
        f"guardian_candidate={len(missing['skills_missing_guardian_candidate'])}"
    )
    routing_audit = report["routing_audit_summary"]
    print(
        "Routing audit: "
        f"resolved_pairs={routing_audit['resolved_mismatch_count']}, "
        f"deferred_pairs={routing_audit['deferred_teacher_review_count']}, "
        f"teacher_review_pairs={routing_audit['teacher_review_mismatch_count']}, "
        f"unreviewed_pairs={routing_audit['unreviewed_mismatch_count']}"
    )
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

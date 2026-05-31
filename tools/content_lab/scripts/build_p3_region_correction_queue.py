#!/usr/bin/env python3
"""Build the deterministic P3 region-correction queue.

The queue is a planning artifact only. It does not mutate the question bank,
skill map, routing sidecar, snippets, generated practice, or runtime app data.
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

from build_p3_content_inventory import get_question_array, match_region_for_labels, normalize_label, parse_world_regions
from build_p3_skill_coverage import as_record, load_json, non_empty_string, string_list, unique_sorted, validate_skill_map
from p3_skill_contract import P3_REGION_DISPLAY_NAMES, P3_TOPIC_ID_TO_REGION_ID


GENERATED_BY = "tools/content_lab/scripts/build_p3_region_correction_queue.py"
GENERATED_LABEL = "deterministic-p3-region-correction-queue-v1"
REPORT_SCHEMA_NAME = "asterion_p3_region_correction_queue"
REPORT_SCHEMA_VERSION = 1

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SKILL_MAP = REPO_ROOT / "tools/content_lab/skill_maps/caie_9709_p3_skill_map.json"
DEFAULT_PROJECTED_BANK = REPO_ROOT / "public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json"
DEFAULT_RAW_BANK = REPO_ROOT / "public/assets/exam-bank-data/question_bank.json"
DEFAULT_TOPIC_ROUTING = REPO_ROOT / "public/assets/exam-bank-data/question_bank.topic_routing.v1.json"
DEFAULT_ROUTING_AUDIT = REPO_ROOT / "tools/content_lab/reviews/p3_app_region_routing_audit.json"
DEFAULT_ROUTE_DECISIONS = REPO_ROOT / "tools/content_lab/reviews/p3_route_evidence_decisions_v1.json"
DEFAULT_INVENTORY = REPO_ROOT / "tools/content_lab/reports/p3_content_inventory_report.json"
DEFAULT_MATRIX = REPO_ROOT / "tools/content_lab/reports/p3_coverage_matrix.json"
DEFAULT_WORLD_MAP = REPO_ROOT / "src/lib/worldMap.ts"
DEFAULT_PROJECT_AUDIT = REPO_ROOT / "docs/reports/asterion_project_audit_2026-05-14.md"
DEFAULT_JSON_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_region_correction_queue.json"
DEFAULT_MARKDOWN_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_region_correction_queue.md"

WORKSTREAMS = [
    "route_correction",
    "text_review",
    "mark_scheme_subpart_review",
    "support_content_gaps",
]
ROUTE_CATEGORIES = [
    "missing_p3_routes",
    "ambiguous_multi_topic_routes",
    "review_needed_routes",
    "fallback_display_only_region_placements",
    "audited_route_decisions",
]
TEXT_CATEGORIES = ["routing_text_or_visual_blockers"]
MARK_SCHEME_CATEGORIES = ["deferred_evidence_cases"]
SUPPORT_CATEGORIES = ["weak_or_missing_skill_support"]
TEXT_REVIEW_TOKENS = (
    "schema_validation_error",
    "ocr",
    "poor",
    "text insufficient",
    "without image",
    "visual-dependent",
    "visual dependence",
    "no ocr",
)
P3_ROUTE_REVIEW_LABELS = {
    "safe_p3_route": "Safe P3 route",
    "review_needed_route": "Review-needed route",
    "ambiguous_multi_topic_route": "Ambiguous multi-topic route",
    "missing_p3_route": "Missing P3 route",
}
DECISION_STATUSES = [
    "clean",
    "thin",
    "ambiguous",
    "fallback_only",
    "blocked",
    "deferred",
    "review_needed",
    "still_needs_review",
]


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_text(path: Path, payload: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload, encoding="utf-8")


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def question_id(record: dict[str, Any]) -> str | None:
    return (
        non_empty_string(record.get("question_id"))
        or non_empty_string(record.get("id"))
        or non_empty_string(record.get("questionId"))
    )


def question_index(data: Any) -> dict[str, dict[str, Any]]:
    return {
        item_id: record
        for record in get_question_array(data)
        if (item_id := question_id(record))
    }


def route_records(data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    records = as_record(data.get("records"))
    return {str(key): as_record(value) for key, value in records.items() if as_record(value)}


def region_title(region_id: str | None) -> str:
    if not region_id:
        return "Unmapped"
    return P3_REGION_DISPLAY_NAMES.get(region_id, region_id)


def mapped_region_id(routing: dict[str, Any]) -> str | None:
    return P3_TOPIC_ID_TO_REGION_ID.get(non_empty_string(routing.get("primary_topic_id")) or "")


def topic_distribution(routing: dict[str, Any]) -> list[dict[str, Any]]:
    raw_distribution = routing.get("topic_distribution")
    if not isinstance(raw_distribution, list):
        return []
    distribution: list[dict[str, Any]] = []
    for raw_item in raw_distribution:
        item = as_record(raw_item)
        topic_id = non_empty_string(item.get("topic_id"))
        if not topic_id:
            continue
        distribution.append({
            "topic_id": topic_id,
            "fit_percent": item.get("fit_percent") if isinstance(item.get("fit_percent"), (int, float)) else None,
            "mapped_region_id": P3_TOPIC_ID_TO_REGION_ID.get(topic_id, ""),
            "mapped_region_title": region_title(P3_TOPIC_ID_TO_REGION_ID.get(topic_id, "")),
        })
    return distribution


def multi_topic_regions(routing: dict[str, Any]) -> list[str]:
    return unique_sorted([
        str(item["mapped_region_id"])
        for item in topic_distribution(routing)
        if item.get("mapped_region_id")
    ])


def route_review_reasons(routing: dict[str, Any]) -> list[str]:
    return string_list(routing.get("review_reasons"))


def has_text_review_signal(reasons: list[str]) -> bool:
    normalized = " ".join(reasons).lower()
    return any(token in normalized for token in TEXT_REVIEW_TOKENS)


def question_labels(record: dict[str, Any]) -> list[str]:
    notes = as_record(record.get("notes"))
    labels = [
        non_empty_string(record.get("topic") or record.get("local_topic") or record.get("localTopic")),
        non_empty_string(record.get("subtopic") or record.get("local_subtopic") or record.get("localSubtopic")),
        non_empty_string(notes.get("subtopic")),
        non_empty_string(notes.get("topic") or notes.get("topic_normalized")),
    ]
    return [label for label in labels if label]


def fallback_region_for_question(record: dict[str, Any], regions: list[dict[str, Any]]) -> str | None:
    labels = question_labels(record)
    return match_region_for_labels(labels, regions) if labels else None


def question_base(
    question_ref: str,
    *,
    raw_questions: dict[str, dict[str, Any]],
    projected_questions: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    raw = raw_questions.get(question_ref, {})
    projected = projected_questions.get(question_ref, {})
    source = projected or raw
    quality_gate = as_record(projected.get("quality_gate")) or as_record(raw.get("quality_gate"))
    notes = as_record(raw.get("notes"))
    return {
        "question_id": question_ref,
        "paper": non_empty_string(source.get("paper") or raw.get("paper")) or "",
        "paper_family": non_empty_string(source.get("paper_family") or raw.get("paper_family")) or "",
        "question_number": non_empty_string(source.get("question_number") or raw.get("question_number")) or "",
        "local_topic": non_empty_string(raw.get("topic") or raw.get("local_topic") or raw.get("localTopic")) or "",
        "local_subtopic": non_empty_string(raw.get("subtopic") or raw.get("local_subtopic") or raw.get("localSubtopic") or notes.get("subtopic")) or "",
        "quality_reason_codes": string_list(quality_gate.get("reason_codes")),
        "text_only_display_allowed": quality_gate.get("text_only_display_allowed") if isinstance(quality_gate.get("text_only_display_allowed"), bool) else None,
        "visual_required": quality_gate.get("visual_required") if isinstance(quality_gate.get("visual_required"), bool) else None,
    }


def route_item(
    *,
    question_ref: str,
    routing: dict[str, Any],
    category: str,
    route_status: str,
    raw_questions: dict[str, dict[str, Any]],
    projected_questions: dict[str, dict[str, Any]],
    regions: list[dict[str, Any]],
) -> dict[str, Any]:
    base = question_base(question_ref, raw_questions=raw_questions, projected_questions=projected_questions)
    raw = raw_questions.get(question_ref, {})
    primary_region = mapped_region_id(routing)
    fallback_region = fallback_region_for_question(raw, regions)
    reasons = route_review_reasons(routing)
    queue_region_id = primary_region or fallback_region or ""
    blocked_reason = {
        "missing_p3_routes": "No mapped P3 primary topic exists in the topic-routing sidecar.",
        "ambiguous_multi_topic_routes": "A single whole-question route hides multiple P3 topic signals.",
        "review_needed_routes": "The topic-routing sidecar has a primary P3 route but marks the route as review-needed or evidence-limited.",
        "fallback_display_only_region_placements": "The app can infer a display region from labels, but this is not a validated P3 route.",
    }.get(category, "Route needs review before future correction.")
    return {
        **base,
        "blocked_or_risky_reason": blocked_reason,
        "blocked_use_cases": [
            "mastery_evidence",
            "guardian_evidence",
            "content_generation",
            "route_correction_without_review",
        ],
        "category": category,
        "fallback_region_id": fallback_region or "",
        "fallback_region_title": region_title(fallback_region),
        "primary_topic_id": non_empty_string(routing.get("primary_topic_id")) or "",
        "primary_region_id": primary_region or "",
        "primary_region_title": region_title(primary_region),
        "queue_id": f"route:{category}:{question_ref}",
        "region_id": queue_region_id,
        "region_title": region_title(queue_region_id),
        "recommended_action": "Review the question image and mark scheme, then write a validated P3 route or explicitly leave the item display-only.",
        "review_required": routing.get("review_required") is True,
        "review_reasons": reasons,
        "route_confidence": non_empty_string(routing.get("confidence")) or "",
        "route_status": route_status,
        "topic_distribution": topic_distribution(routing),
        "workstream": "route_correction",
    }


def text_review_item(route: dict[str, Any]) -> dict[str, Any]:
    return {
        **route,
        "blocked_or_risky_reason": "Route correction depends on weak, missing, or visual-dependent text evidence.",
        "blocked_use_cases": [
            "text_only_display",
            "content_generation",
            "route_correction_without_image_review",
            "mastery_evidence",
        ],
        "category": "routing_text_or_visual_blockers",
        "queue_id": f"text:routing_text_or_visual_blockers:{route['question_id']}",
        "recommended_action": "Review against the canonical question image and mark-scheme image before trusting extracted text or route labels.",
        "workstream": "text_review",
    }


def skill_info(skill_by_ref: dict[str, dict[str, Any]], skill_ref: str | None) -> dict[str, str]:
    skill = skill_by_ref.get(skill_ref or "")
    if not skill:
        return {"skill_ref": skill_ref or "", "skill_title": "", "region_id": "", "region_title": "Unmapped"}
    region_id = non_empty_string(skill.get("region_id")) or ""
    return {
        "skill_ref": non_empty_string(skill.get("skill_id")) or skill_ref or "",
        "skill_title": non_empty_string(skill.get("micro_skill_name")) or "",
        "region_id": region_id,
        "region_title": region_title(region_id),
    }


def audit_decision_item(entry: dict[str, Any], skill_by_ref: dict[str, dict[str, Any]]) -> dict[str, Any]:
    info = skill_info(skill_by_ref, non_empty_string(entry.get("skill_ref")))
    question_ref = non_empty_string(entry.get("question_id")) or ""
    return {
        **info,
        "app_region_id": non_empty_string(entry.get("original_app_region_id")) or "",
        "app_region_title": region_title(non_empty_string(entry.get("original_app_region_id"))),
        "blocked_or_risky_reason": non_empty_string(entry.get("source_of_conflicting_label")) or "Routing audit found an app-region mismatch.",
        "blocked_use_cases": ["content_correction_without_audit_check", "mastery_evidence"],
        "category": "audited_route_decisions",
        "queue_id": f"route:audited_route_decisions:{info['skill_ref']}:{question_ref}",
        "question_id": question_ref,
        "rationale": non_empty_string(entry.get("rationale")) or "",
        "recommended_action": non_empty_string(entry.get("recommended_resolution")) or "Verify the audited route decision before editing metadata.",
        "resolution_status": non_empty_string(entry.get("resolution_status")) or "",
        "reviewed_skill_map_region_id": non_empty_string(entry.get("reviewed_skill_map_region_id")) or "",
        "reviewed_skill_map_region_title": region_title(non_empty_string(entry.get("reviewed_skill_map_region_id"))),
        "workstream": "route_correction",
    }


def deferred_evidence_item(item: dict[str, Any], skill_by_ref: dict[str, dict[str, Any]]) -> dict[str, Any]:
    info = skill_info(skill_by_ref, non_empty_string(item.get("skill_ref")))
    question_ref = non_empty_string(item.get("question_id")) or ""
    return {
        **info,
        "app_region_id": non_empty_string(item.get("app_region_id")) or "",
        "app_region_title": region_title(non_empty_string(item.get("app_region_id"))),
        "blocked_or_risky_reason": non_empty_string(item.get("rationale")) or "Evidence is ambiguous at part/subpart level.",
        "blocked_use_cases": ["mastery_evidence", "teacher_export", "guardian_clearance"],
        "category": "deferred_evidence_cases",
        "evidence_status": non_empty_string(item.get("evidence_status")) or "",
        "export_allowed": item.get("export_allowed") if isinstance(item.get("export_allowed"), bool) else None,
        "mastery_evidence_allowed": item.get("mastery_evidence_allowed") if isinstance(item.get("mastery_evidence_allowed"), bool) else None,
        "practice_allowed": item.get("practice_allowed") if isinstance(item.get("practice_allowed"), bool) else None,
        "question_id": question_ref,
        "queue_id": f"mark_scheme:deferred_evidence_cases:{info['skill_ref']}:{question_ref}",
        "recommended_action": non_empty_string(item.get("recommended_resolution")) or "Review the canonical mark scheme and subparts before using this as skill evidence.",
        "resolution_status": non_empty_string(item.get("resolution_status")) or "",
        "reviewed_skill_map_region_id": non_empty_string(item.get("reviewed_skill_map_region_id")) or "",
        "reviewed_skill_map_region_title": region_title(non_empty_string(item.get("reviewed_skill_map_region_id"))),
        "source_of_conflicting_label": non_empty_string(item.get("source_of_conflicting_label")) or "",
        "workstream": "mark_scheme_subpart_review",
    }


def support_gap_item(row: dict[str, Any]) -> dict[str, Any]:
    support_gaps = string_list(row.get("support_gaps"))
    blocking_reasons = string_list(row.get("blocking_reasons"))
    region_id = non_empty_string(row.get("region_id")) or ""
    skill_ref = non_empty_string(row.get("skill_ref")) or ""
    gap_parts: list[str] = []
    if support_gaps:
        gap_parts.append(f"missing support: {', '.join(support_gaps)}")
    if blocking_reasons:
        gap_parts.append(f"blocking reasons: {', '.join(blocking_reasons)}")
    if int(row.get("clean_mastery_evidence_count") or 0) == 0:
        gap_parts.append("no clean mastery evidence")
    return {
        "blocked_or_risky_reason": "; ".join(gap_parts) or "Skill support is incomplete.",
        "blocked_use_cases": ["region_completion_claims", "content_correction_signoff", "mastery_evidence"],
        "category": "weak_or_missing_skill_support",
        "clean_mastery_evidence_count": int(row.get("clean_mastery_evidence_count") or 0),
        "coverage_status": non_empty_string(row.get("coverage_status")) or "",
        "correction_priority": non_empty_string(row.get("correction_priority")) or "",
        "deferred_evidence_count": int(row.get("deferred_evidence_count") or 0),
        "queue_id": f"support:weak_or_missing_skill_support:{skill_ref}",
        "recommended_action": non_empty_string(row.get("recommended_next_action")) or "Fill support gaps before marking the skill ready.",
        "region_id": region_id,
        "region_title": non_empty_string(row.get("region_title")) or region_title(region_id),
        "skill_ref": skill_ref,
        "skill_title": non_empty_string(row.get("skill_title")) or "",
        "support_gaps": support_gaps,
        "workstream": "support_content_gaps",
    }


def classify_p3_routes(
    *,
    routing_records: dict[str, dict[str, Any]],
    raw_questions: dict[str, dict[str, Any]],
    projected_questions: dict[str, dict[str, Any]],
    regions: list[dict[str, Any]],
) -> dict[str, Any]:
    missing: list[dict[str, Any]] = []
    ambiguous: list[dict[str, Any]] = []
    review_needed: list[dict[str, Any]] = []
    fallback_only: list[dict[str, Any]] = []
    text_review: list[dict[str, Any]] = []
    safe_count = 0

    p3_refs = sorted(
        question_ref
        for question_ref, routing in routing_records.items()
        if non_empty_string(routing.get("paper_family")) == "p3"
    )
    for question_ref in p3_refs:
        routing = routing_records[question_ref]
        primary_region = mapped_region_id(routing)
        reasons = route_review_reasons(routing)
        multi_regions = multi_topic_regions(routing)
        is_multi = len(multi_regions) > 1
        is_review_required = routing.get("review_required") is True

        if not primary_region:
            item = route_item(
                question_ref=question_ref,
                routing=routing,
                category="missing_p3_routes",
                route_status="missing_p3_route",
                raw_questions=raw_questions,
                projected_questions=projected_questions,
                regions=regions,
            )
            missing.append(item)
            if item["fallback_region_id"]:
                fallback_only.append({
                    **item,
                    "category": "fallback_display_only_region_placements",
                    "queue_id": f"route:fallback_display_only_region_placements:{question_ref}",
                    "route_status": "fallback_display_only",
                })
            if has_text_review_signal(reasons) or not reasons:
                text_review.append(text_review_item(item))
            continue

        if is_multi and not is_review_required:
            ambiguous.append(route_item(
                question_ref=question_ref,
                routing=routing,
                category="ambiguous_multi_topic_routes",
                route_status="ambiguous_multi_topic_route",
                raw_questions=raw_questions,
                projected_questions=projected_questions,
                regions=regions,
            ))
            continue

        if is_review_required or reasons:
            item = route_item(
                question_ref=question_ref,
                routing=routing,
                category="review_needed_routes",
                route_status="review_needed_route",
                raw_questions=raw_questions,
                projected_questions=projected_questions,
                regions=regions,
            )
            review_needed.append(item)
            if has_text_review_signal(reasons):
                text_review.append(text_review_item(item))
            continue

        safe_count += 1

    return {
        "missing_p3_routes": missing,
        "ambiguous_multi_topic_routes": ambiguous,
        "review_needed_routes": review_needed,
        "fallback_display_only_region_placements": fallback_only,
        "routing_text_or_visual_blockers": text_review,
        "source_route_counts": {
            "safe_p3_route": safe_count,
            "review_needed_route": len(review_needed),
            "ambiguous_multi_topic_route": len(ambiguous),
            "missing_p3_route": len(missing),
            "total_p3_route_records": len(p3_refs),
        },
    }


def count_by(items: list[dict[str, Any]], field: str) -> dict[str, int]:
    labels = sorted({str(item.get(field) or "") for item in items if item.get(field)})
    return {label: sum(1 for item in items if item.get(field) == label) for label in labels}


def route_decision_records(route_decisions: dict[str, Any]) -> list[dict[str, Any]]:
    decisions = route_decisions.get("decisions")
    if not isinstance(decisions, list):
        return []
    return [as_record(decision) for decision in decisions if as_record(decision)]


def decision_status(decision: dict[str, Any]) -> str:
    status = non_empty_string(decision.get("reviewed_status")) or "still_needs_review"
    return status if status in DECISION_STATUSES else "still_needs_review"


def route_decision_summary(
    route_items: list[dict[str, Any]],
    route_decisions: dict[str, Any],
) -> dict[str, Any]:
    decisions = route_decision_records(route_decisions)
    route_question_ids = {
        str(item.get("question_id"))
        for item in route_items
        if item.get("workstream") == "route_correction"
        and item.get("category") in {
            "missing_p3_routes",
            "ambiguous_multi_topic_routes",
            "review_needed_routes",
            "fallback_display_only_region_placements",
        }
        and item.get("question_id")
    }
    decided_question_ids = {
        str(decision.get("question_id"))
        for decision in decisions
        if non_empty_string(decision.get("question_id"))
    }
    counts = {status: 0 for status in DECISION_STATUSES}
    for decision in decisions:
        counts[decision_status(decision)] += 1
    still_needs_review_ids = sorted(route_question_ids - decided_question_ids)
    counts["still_needs_review"] = len(still_needs_review_ids)
    return {
        "decision_source_schema": route_decisions.get("schema_name"),
        "review_label": route_decisions.get("review_label"),
        "reviewer": route_decisions.get("reviewer"),
        "reviewed_at": route_decisions.get("reviewed_at"),
        "counts_by_status": counts,
        "total_recorded_decision_count": len(decisions),
        "decided_question_count": len(decided_question_ids),
        "still_needs_review_count": len(still_needs_review_ids),
        "still_needs_review_question_ids": still_needs_review_ids,
        "decisions": sorted([
            {
                "question_id": non_empty_string(decision.get("question_id")) or "",
                "paper": non_empty_string(decision.get("paper")) or "",
                "question_number": non_empty_string(decision.get("question_number")) or "",
                "previous_route_status": non_empty_string(decision.get("previous_route_status")) or "",
                "reviewed_status": decision_status(decision),
                "reviewed_region_id": non_empty_string(decision.get("reviewed_region_id")) or "",
                "reviewed_region_title": region_title(non_empty_string(decision.get("reviewed_region_id"))),
                "reviewed_source_skill_ids": string_list(decision.get("reviewed_source_skill_ids")),
                "mastery_evidence_allowed": as_record(decision.get("use_case_permissions")).get("mastery_evidence_allowed"),
                "content_lab_generation_allowed": as_record(decision.get("use_case_permissions")).get("content_lab_generation_allowed"),
                "candidate_promotion_allowed": as_record(decision.get("use_case_permissions")).get("candidate_promotion_allowed"),
                "reason": non_empty_string(decision.get("reason")) or "",
            }
            for decision in decisions
        ], key=lambda item: (str(item["reviewed_status"]), str(item["question_id"]))),
    }


def empty_queue() -> dict[str, dict[str, list[dict[str, Any]]]]:
    return {
        "route_correction": {category: [] for category in ROUTE_CATEGORIES},
        "text_review": {category: [] for category in TEXT_CATEGORIES},
        "mark_scheme_subpart_review": {category: [] for category in MARK_SCHEME_CATEGORIES},
        "support_content_gaps": {category: [] for category in SUPPORT_CATEGORIES},
    }


def sorted_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        items,
        key=lambda item: (
            str(item.get("region_id") or ""),
            str(item.get("skill_ref") or ""),
            str(item.get("question_id") or ""),
            str(item.get("queue_id") or ""),
        ),
    )


def queue_counts(queue: dict[str, dict[str, list[dict[str, Any]]]]) -> dict[str, dict[str, int]]:
    return {
        workstream: {category: len(items) for category, items in categories.items()}
        for workstream, categories in queue.items()
    }


def flatten_queue(queue: dict[str, dict[str, list[dict[str, Any]]]]) -> list[dict[str, Any]]:
    return [item for categories in queue.values() for items in categories.values() for item in items]


def build_region_summary(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for item in items:
        region_id = str(item.get("region_id") or "unmapped")
        grouped.setdefault(region_id, []).append(item)
    rows: list[dict[str, Any]] = []
    for region_id, region_items in grouped.items():
        rows.append({
            "categories": count_by(region_items, "category"),
            "issue_count": len(region_items),
            "region_id": "" if region_id == "unmapped" else region_id,
            "region_title": region_title(None if region_id == "unmapped" else region_id),
            "skill_refs": unique_sorted([str(item.get("skill_ref") or "") for item in region_items]),
            "workstreams": count_by(region_items, "workstream"),
        })
    return sorted(rows, key=lambda row: (-int(row["issue_count"]), str(row["region_id"])))


def build_skill_summary(items: list[dict[str, Any]], skill_by_ref: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for item in items:
        skill_ref = non_empty_string(item.get("skill_ref"))
        if skill_ref:
            grouped.setdefault(skill_ref, []).append(item)
    rows: list[dict[str, Any]] = []
    for skill_ref, skill_items in grouped.items():
        info = skill_info(skill_by_ref, skill_ref)
        rows.append({
            **info,
            "categories": count_by(skill_items, "category"),
            "issue_count": len(skill_items),
            "question_ids": unique_sorted([str(item.get("question_id") or "") for item in skill_items]),
            "workstreams": count_by(skill_items, "workstream"),
        })
    return sorted(rows, key=lambda row: (-int(row["issue_count"]), str(row["region_id"]), str(row["skill_ref"])))


def build_report(
    *,
    skill_map: dict[str, Any],
    projected_bank: dict[str, Any],
    raw_bank: dict[str, Any],
    topic_routing: dict[str, Any],
    routing_audit: dict[str, Any],
    route_decisions: dict[str, Any],
    inventory: dict[str, Any],
    matrix: dict[str, Any],
    world_map_path: Path,
    source_paths: dict[str, Path],
) -> dict[str, Any]:
    skills = validate_skill_map(skill_map)
    skill_by_ref = {str(skill["skill_id"]): skill for skill in skills}
    raw_questions = question_index(raw_bank)
    projected_questions = question_index(projected_bank)
    routing_records = route_records(topic_routing)
    regions = parse_world_regions(world_map_path)
    route_classification = classify_p3_routes(
        routing_records=routing_records,
        raw_questions=raw_questions,
        projected_questions=projected_questions,
        regions=regions,
    )

    queue = empty_queue()
    for category in ("missing_p3_routes", "ambiguous_multi_topic_routes", "review_needed_routes", "fallback_display_only_region_placements"):
        queue["route_correction"][category] = sorted_items(route_classification[category])
    queue["text_review"]["routing_text_or_visual_blockers"] = sorted_items(route_classification["routing_text_or_visual_blockers"])

    audit_entries = routing_audit.get("entries") if isinstance(routing_audit.get("entries"), list) else []
    queue["route_correction"]["audited_route_decisions"] = sorted_items([
        audit_decision_item(as_record(entry), skill_by_ref)
        for entry in audit_entries
        if non_empty_string(as_record(entry).get("resolution_status")) != "teacher_review_deferred"
    ])

    deferred_summary = as_record(matrix.get("deferred_evidence_summary"))
    deferred_items = deferred_summary.get("items") if isinstance(deferred_summary.get("items"), list) else []
    queue["mark_scheme_subpart_review"]["deferred_evidence_cases"] = sorted_items([
        deferred_evidence_item(as_record(item), skill_by_ref)
        for item in deferred_items
    ])

    coverage_rows = matrix.get("coverage_rows") if isinstance(matrix.get("coverage_rows"), list) else []
    support_items = [
        support_gap_item(as_record(row))
        for row in coverage_rows
        if string_list(as_record(row).get("support_gaps"))
        or string_list(as_record(row).get("blocking_reasons"))
        or int(as_record(row).get("clean_mastery_evidence_count") or 0) == 0
    ]
    queue["support_content_gaps"]["weak_or_missing_skill_support"] = sorted_items(support_items)

    all_items = flatten_queue(queue)
    decision_summary = route_decision_summary(all_items, route_decisions)
    report = {
        "schema_name": REPORT_SCHEMA_NAME,
        "schema_version": REPORT_SCHEMA_VERSION,
        "generated_by": GENERATED_BY,
        "generated_label": GENERATED_LABEL,
        "source_reports": {
            name: rel(path)
            for name, path in sorted(source_paths.items())
        },
        "source_route_summary": {
            "classification_policy": {
                "missing_p3_route": "P3 routing sidecar record has no primary topic ID mapped to an active P3 region.",
                "review_needed_route": "P3 record has a mapped primary region plus review_required=true, or single-topic review reasons.",
                "ambiguous_multi_topic_route": "P3 record has multiple mapped topic regions and is not already review-required.",
                "safe_p3_route": "P3 record has one mapped route and no route review reasons.",
            },
            "counts": route_classification["source_route_counts"],
            "labels": P3_ROUTE_REVIEW_LABELS,
        },
        "queue_summary": {
            "queue_counts": queue_counts(queue),
            "total_queue_item_count": len(all_items),
            "unique_question_count": len({item["question_id"] for item in all_items if item.get("question_id")}),
            "unique_skill_count": len({item["skill_ref"] for item in all_items if item.get("skill_ref")}),
        },
        "route_decision_summary": decision_summary,
        "region_summary": build_region_summary(all_items),
        "skill_summary": build_skill_summary(all_items, skill_by_ref),
        "queue": queue,
        "next_step_policy": {
            "content_mutation_allowed_in_this_pass": False,
            "route_correction": "Review missing, fallback-only, review-needed, and ambiguous route items before changing metadata.",
            "text_review": "Use canonical question and mark-scheme images before trusting extracted text or OCR for route correction.",
            "mark_scheme_subpart_review": "Resolve deferred evidence at part/subpart level before allowing mastery or teacher export.",
            "support_content_gaps": "Fill reviewed support gaps only after route and evidence blockers for the skill are understood.",
        },
        "inventory_bridge_summary": {
            "inventory_schema": inventory.get("schema_name"),
            "matrix_schema": matrix.get("schema_name"),
            "deferred_case_count": deferred_summary.get("case_count"),
            "support_gap_counts": as_record(as_record(matrix.get("teaching_support_summary")).get("support_gap_counts")),
        },
    }
    validate_report(report)
    return report


def validate_report(report: dict[str, Any]) -> None:
    errors: list[str] = []
    if report.get("schema_name") != REPORT_SCHEMA_NAME:
        errors.append("invalid schema_name")
    if report.get("schema_version") != REPORT_SCHEMA_VERSION:
        errors.append("invalid schema_version")

    queue = as_record(report.get("queue"))
    for workstream in WORKSTREAMS:
        if workstream not in queue:
            errors.append(f"missing queue workstream {workstream}")
    expected_categories = {
        "route_correction": ROUTE_CATEGORIES,
        "text_review": TEXT_CATEGORIES,
        "mark_scheme_subpart_review": MARK_SCHEME_CATEGORIES,
        "support_content_gaps": SUPPORT_CATEGORIES,
    }
    summary_counts = as_record(as_record(report.get("queue_summary")).get("queue_counts"))
    for workstream, categories in expected_categories.items():
        category_map = as_record(queue.get(workstream))
        summary_map = as_record(summary_counts.get(workstream))
        for category in categories:
            items = category_map.get(category)
            if not isinstance(items, list):
                errors.append(f"queue.{workstream}.{category} must be a list")
                continue
            ids = [non_empty_string(as_record(item).get("queue_id")) for item in items]
            if len(set(ids)) != len(ids):
                errors.append(f"queue.{workstream}.{category} has duplicate queue_id values")
            if summary_map.get(category) != len(items):
                errors.append(f"queue summary mismatch for {workstream}.{category}")
            for raw_item in items:
                item = as_record(raw_item)
                if item.get("workstream") != workstream:
                    errors.append(f"{item.get('queue_id')} has wrong workstream")
                if item.get("category") != category:
                    errors.append(f"{item.get('queue_id')} has wrong category")
                if not non_empty_string(item.get("blocked_or_risky_reason")):
                    errors.append(f"{item.get('queue_id')} is missing blocked_or_risky_reason")
                if not non_empty_string(item.get("recommended_action")):
                    errors.append(f"{item.get('queue_id')} is missing recommended_action")

    missing_routes = as_record(queue.get("route_correction")).get("missing_p3_routes", [])
    for raw_item in missing_routes if isinstance(missing_routes, list) else []:
        item = as_record(raw_item)
        if item.get("primary_region_id"):
            errors.append(f"{item.get('queue_id')} is not actually missing primary_region_id")
    fallback_items = as_record(queue.get("route_correction")).get("fallback_display_only_region_placements", [])
    missing_ids = {as_record(item).get("question_id") for item in missing_routes if as_record(item)}
    for raw_item in fallback_items if isinstance(fallback_items, list) else []:
        item = as_record(raw_item)
        if item.get("question_id") not in missing_ids:
            errors.append(f"{item.get('queue_id')} fallback item is not backed by a missing route")
        if not item.get("fallback_region_id"):
            errors.append(f"{item.get('queue_id')} fallback item has no fallback_region_id")

    deferred_items = as_record(queue.get("mark_scheme_subpart_review")).get("deferred_evidence_cases", [])
    for raw_item in deferred_items if isinstance(deferred_items, list) else []:
        item = as_record(raw_item)
        if item.get("mastery_evidence_allowed") is not False:
            errors.append(f"{item.get('queue_id')} deferred case must block mastery evidence")
        if item.get("practice_allowed") is not True:
            errors.append(f"{item.get('queue_id')} deferred case must remain practice allowed")
        if item.get("export_allowed") is not False:
            errors.append(f"{item.get('queue_id')} deferred case must block export")

    support_items = as_record(queue.get("support_content_gaps")).get("weak_or_missing_skill_support", [])
    for raw_item in support_items if isinstance(support_items, list) else []:
        item = as_record(raw_item)
        if not item.get("support_gaps") and not item.get("blocked_or_risky_reason"):
            errors.append(f"{item.get('queue_id')} support item has no gap or reason")

    total = sum(
        len(items)
        for categories in queue.values()
        if isinstance(categories, dict)
        for items in categories.values()
        if isinstance(items, list)
    )
    if as_record(report.get("queue_summary")).get("total_queue_item_count") != total:
        errors.append("total queue item count does not match queue details")

    decision_summary = as_record(report.get("route_decision_summary"))
    decision_counts = as_record(decision_summary.get("counts_by_status"))
    for status in DECISION_STATUSES:
        if isinstance(decision_counts.get(status), bool) or not isinstance(decision_counts.get(status), int):
            errors.append(f"route_decision_summary.counts_by_status missing integer {status}")
    decisions = decision_summary.get("decisions")
    if not isinstance(decisions, list):
        errors.append("route_decision_summary.decisions must be a list")
    else:
        for decision in decisions:
            row = as_record(decision)
            status = non_empty_string(row.get("reviewed_status"))
            if status not in DECISION_STATUSES:
                errors.append(f"route decision {row.get('question_id')} has invalid status {status}")
            if not non_empty_string(row.get("question_id")):
                errors.append("route decision row is missing question_id")
            if not non_empty_string(row.get("reason")):
                errors.append(f"route decision {row.get('question_id')} is missing reason")

    if errors:
        raise ValueError("; ".join(errors))


def md_escape(value: Any) -> str:
    if isinstance(value, list):
        text = ", ".join(str(item) for item in value)
    elif isinstance(value, dict):
        text = json.dumps(value, sort_keys=True)
    else:
        text = str(value if value is not None else "")
    return text.replace("|", "\\|").replace("\n", " ")


def md_count_list(counts: dict[str, int]) -> str:
    if not counts:
        return "- none"
    return "\n".join(f"- `{key}`: {counts[key]}" for key in sorted(counts))


def route_table(items: list[dict[str, Any]], columns: list[tuple[str, str]], limit: int | None = None) -> list[str]:
    rows = items if limit is None else items[:limit]
    lines = [
        "| " + " | ".join(label for label, _ in columns) + " |",
        "| " + " | ".join("---" for _ in columns) + " |",
    ]
    for item in rows:
        lines.append("| " + " | ".join(md_escape(item.get(field, "")) for _, field in columns) + " |")
    if limit is not None and len(items) > limit:
        lines.append(f"| ... | {len(items) - limit} more items in JSON report |" + " |" * max(0, len(columns) - 2))
    return lines


def render_region_issue_list(region_summary: list[dict[str, Any]]) -> list[str]:
    lines = ["| Region | Issues | Workstreams | Categories |", "| --- | ---: | --- | --- |"]
    for row in region_summary:
        workstreams = ", ".join(f"{key}:{value}" for key, value in as_record(row.get("workstreams")).items())
        categories = ", ".join(f"{key}:{value}" for key, value in as_record(row.get("categories")).items())
        lines.append(
            f"| {md_escape(row.get('region_title'))} | {row.get('issue_count')} | {md_escape(workstreams)} | {md_escape(categories)} |"
        )
    return lines


def render_support_by_region(items: list[dict[str, Any]]) -> list[str]:
    lines = ["| Region | Skill | Priority | Status | Gaps / Blockers |", "| --- | --- | --- | --- | --- |"]
    for item in items:
        gaps = ", ".join(string_list(item.get("support_gaps"))) or item.get("blocked_or_risky_reason", "")
        lines.append(
            f"| {md_escape(item.get('region_title'))} | {md_escape(item.get('skill_ref'))} | {md_escape(item.get('correction_priority'))} | {md_escape(item.get('coverage_status'))} | {md_escape(gaps)} |"
        )
    return lines


def render_markdown(report: dict[str, Any]) -> str:
    queue = report["queue"]
    counts = report["queue_summary"]["queue_counts"]
    route_counts = report["source_route_summary"]["counts"]
    missing = queue["route_correction"]["missing_p3_routes"]
    ambiguous = queue["route_correction"]["ambiguous_multi_topic_routes"]
    review_needed = queue["route_correction"]["review_needed_routes"]
    fallback = queue["route_correction"]["fallback_display_only_region_placements"]
    audited = queue["route_correction"]["audited_route_decisions"]
    text_items = queue["text_review"]["routing_text_or_visual_blockers"]
    deferred = queue["mark_scheme_subpart_review"]["deferred_evidence_cases"]
    support = queue["support_content_gaps"]["weak_or_missing_skill_support"]
    decision_summary = as_record(report.get("route_decision_summary"))
    decision_counts = as_record(decision_summary.get("counts_by_status"))
    decision_rows = decision_summary.get("decisions") if isinstance(decision_summary.get("decisions"), list) else []

    lines = [
        "# P3 Region-Correction Queue",
        "",
        "This deterministic queue plans future content correction only. It does not correct the question bank, route sidecar, skill map, snippets, generated practice, or runtime data.",
        "",
        "## Source Route Summary",
        "",
        md_count_list(route_counts),
        "",
        "## Queue Counts",
        "",
    ]
    for workstream in WORKSTREAMS:
        lines.extend([f"### {workstream}", "", md_count_list(counts[workstream]), ""])

    lines.extend([
        "## Reviewed Route Decision Summary",
        "",
        f"- review label: `{md_escape(decision_summary.get('review_label'))}`",
        f"- recorded decisions: {decision_summary.get('total_recorded_decision_count')}",
        f"- decided questions: {decision_summary.get('decided_question_count')}",
        f"- still-needs-review route questions: {decision_summary.get('still_needs_review_count')}",
        "",
        md_count_list(decision_counts),
        "",
        *route_table(decision_rows, [
            ("Question", "question_id"),
            ("Previous", "previous_route_status"),
            ("Decision", "reviewed_status"),
            ("Reviewed Region", "reviewed_region_title"),
            ("Mastery", "mastery_evidence_allowed"),
            ("Generation", "content_lab_generation_allowed"),
            ("Reason", "reason"),
        ], limit=80),
        "",
        "## Region Summary",
        "",
        *render_region_issue_list(report["region_summary"]),
        "",
        "## Route Correction",
        "",
        "### Missing P3 Routes",
        "",
        *route_table(missing, [
            ("Question", "question_id"),
            ("Fallback Region", "fallback_region_title"),
            ("Confidence", "route_confidence"),
            ("Review Reasons", "review_reasons"),
        ], limit=80),
        "",
        "### Fallback Display-Only Region Placements",
        "",
        *route_table(fallback, [
            ("Question", "question_id"),
            ("Fallback Region", "fallback_region_title"),
            ("Local Topic", "local_topic"),
            ("Why Risky", "blocked_or_risky_reason"),
        ], limit=80),
        "",
        "### Ambiguous Multi-Topic Routes",
        "",
        *route_table(ambiguous, [
            ("Question", "question_id"),
            ("Primary Region", "primary_region_title"),
            ("Review Reasons", "review_reasons"),
            ("Why Risky", "blocked_or_risky_reason"),
        ], limit=80),
        "",
        "### Review-Needed Routes",
        "",
        *route_table(review_needed, [
            ("Question", "question_id"),
            ("Primary Region", "primary_region_title"),
            ("Confidence", "route_confidence"),
            ("Review Reasons", "review_reasons"),
        ], limit=80),
        "",
        "### Audited Route Decisions",
        "",
        *route_table(audited, [
            ("Skill", "skill_ref"),
            ("Question", "question_id"),
            ("Audit Status", "resolution_status"),
            ("Reviewed Region", "reviewed_skill_map_region_title"),
            ("Recommended Action", "recommended_action"),
        ], limit=80),
        "",
        "## Text Review",
        "",
        *route_table(text_items, [
            ("Question", "question_id"),
            ("Region", "region_title"),
            ("Confidence", "route_confidence"),
            ("Review Reasons", "review_reasons"),
            ("Recommended Action", "recommended_action"),
        ], limit=100),
        "",
        "## Mark-Scheme And Subpart Review",
        "",
        *route_table(deferred, [
            ("Skill", "skill_ref"),
            ("Question", "question_id"),
            ("App Region", "app_region_title"),
            ("Reviewed Region", "reviewed_skill_map_region_title"),
            ("Recommended Action", "recommended_action"),
        ], limit=100),
        "",
        "## Support-Content Gaps",
        "",
        *render_support_by_region(support),
        "",
        "## Policy",
        "",
        f"- Content mutation allowed in this pass: `{str(report['next_step_policy']['content_mutation_allowed_in_this_pass']).lower()}`",
        "- Fallback display routes are browsing hints only, not mastery or generation evidence.",
        "- Deferred evidence remains practice-allowed only where structurally valid, mastery-blocked, and export-blocked.",
        "",
    ])
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the deterministic P3 region-correction queue.")
    parser.add_argument("--skill-map", type=Path, default=DEFAULT_SKILL_MAP)
    parser.add_argument(
        "--projected-bank",
        type=Path,
        default=DEFAULT_PROJECTED_BANK,
        help="Full exam-bank catalog used for audit reporting. The option name is retained for older scripts.",
    )
    parser.add_argument("--raw-bank", type=Path, default=DEFAULT_RAW_BANK)
    parser.add_argument("--topic-routing", type=Path, default=DEFAULT_TOPIC_ROUTING)
    parser.add_argument("--routing-audit", type=Path, default=DEFAULT_ROUTING_AUDIT)
    parser.add_argument("--route-decisions", type=Path, default=DEFAULT_ROUTE_DECISIONS)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--world-map", type=Path, default=DEFAULT_WORLD_MAP)
    parser.add_argument("--project-audit", type=Path, default=DEFAULT_PROJECT_AUDIT)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON_OUTPUT)
    parser.add_argument("--markdown-output", type=Path, default=DEFAULT_MARKDOWN_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_paths = {
        "skill_map": args.skill_map,
        "projected_bank": args.projected_bank,
        "raw_bank": args.raw_bank,
        "topic_routing_sidecar": args.topic_routing,
        "routing_audit": args.routing_audit,
        "route_evidence_decisions": args.route_decisions,
        "content_inventory": args.inventory,
        "coverage_matrix": args.matrix,
        "world_map": args.world_map,
        "project_audit_findings": args.project_audit,
    }
    try:
        report = build_report(
            skill_map=load_json(args.skill_map),
            projected_bank=load_json(args.projected_bank),
            raw_bank=load_json(args.raw_bank),
            topic_routing=load_json(args.topic_routing),
            routing_audit=load_json(args.routing_audit),
            route_decisions=load_json(args.route_decisions) if args.route_decisions.exists() else {},
            inventory=load_json(args.inventory),
            matrix=load_json(args.matrix),
            world_map_path=args.world_map,
            source_paths=source_paths,
        )
        markdown = render_markdown(report)
        write_json(args.json_output, report)
        write_text(args.markdown_output, markdown)
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    route_counts = report["source_route_summary"]["counts"]
    queue_summary = report["queue_summary"]
    print(
        "P3 region correction queue: "
        f"missing_routes={route_counts['missing_p3_route']}; "
        f"review_needed_routes={route_counts['review_needed_route']}; "
        f"ambiguous_routes={route_counts['ambiguous_multi_topic_route']}; "
        f"queue_items={queue_summary['total_queue_item_count']}"
    )
    print(f"Wrote {args.json_output}")
    print(f"Wrote {args.markdown_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build a deterministic P3 route-evidence status report.

This is a Phase 1 visibility artifact. It mirrors the runtime route-evidence
stamping policy without mutating the question bank or routing sidecar.
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

from build_p3_content_inventory import get_question_array, match_region_for_labels, parse_world_regions
from build_p3_region_correction_queue import classify_p3_routes, question_index, route_records
from build_p3_skill_coverage import as_record, load_json, non_empty_string, string_list, unique_sorted
from p3_skill_contract import P3_REGION_DISPLAY_NAMES, P3_TOPIC_ID_TO_REGION_ID


GENERATED_BY = "tools/content_lab/scripts/build_p3_route_evidence_report.py"
REPORT_SCHEMA_NAME = "asterion_p3_route_evidence_status_report"
REPORT_SCHEMA_VERSION = 1
GENERATED_LABEL = "deterministic-p3-route-evidence-status-v1"

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_PROJECTED_BANK = REPO_ROOT / "public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json"
DEFAULT_RAW_BANK = REPO_ROOT / "public/assets/exam-bank-data/question_bank.json"
DEFAULT_TOPIC_ROUTING = REPO_ROOT / "public/assets/exam-bank-data/question_bank.topic_routing.v1.json"
DEFAULT_WORLD_MAP = REPO_ROOT / "src/lib/worldMap.ts"
DEFAULT_ROUTE_QUEUE = REPO_ROOT / "tools/content_lab/reports/p3_region_correction_queue.json"
DEFAULT_JSON_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_route_evidence_status_report.json"
DEFAULT_MARKDOWN_OUTPUT = REPO_ROOT / "tools/content_lab/reports/p3_route_evidence_status_report.md"

STATUS_ORDER = [
    "clean",
    "missing-route",
    "ambiguous-route",
    "review-only",
    "fallback-display-only",
    "prerequisite-only",
    "not-P3",
    "hard-failure",
]

STATUS_ALIASES = {
    "clean": "clean",
    "validated": "clean",
    "validated_curriculum_route": "clean",
    "validated_curriculum_routing": "clean",
    "missing_route": "missing-route",
    "missingroute": "missing-route",
    "no_route": "missing-route",
    "unmatched": "missing-route",
    "ambiguous_route": "ambiguous-route",
    "ambiguousroute": "ambiguous-route",
    "ambiguous": "ambiguous-route",
    "review_only": "review-only",
    "reviewonly": "review-only",
    "review": "review-only",
    "fallback_display_only": "fallback-display-only",
    "fallbackdisplayonly": "fallback-display-only",
    "fallback": "fallback-display-only",
    "display_only": "fallback-display-only",
    "displayonly": "fallback-display-only",
    "prerequisite_only": "prerequisite-only",
    "prerequisiteonly": "prerequisite-only",
    "prerequisite": "prerequisite-only",
    "not_p3": "not-P3",
    "notp3": "not-P3",
    "non_p3": "not-P3",
    "nonp3": "not-P3",
    "hard_failure": "hard-failure",
    "hardfailure": "hard-failure",
    "hard_fail": "hard-failure",
    "hardfail": "hard-failure",
}


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


def normalize_status_token(value: str) -> str:
    split_camel = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value.strip())
    return re.sub(r"[\s-]+", "_", split_camel.lower())


def route_evidence_status(*records: dict[str, Any] | None) -> str | None:
    keys = [
        "route_evidence_status",
        "routeEvidenceStatus",
        "routing_evidence_status",
        "routingEvidenceStatus",
        "curriculum_route_status",
        "curriculumRouteStatus",
        "evidence_status",
        "evidenceStatus",
        "status",
    ]
    for record in records:
        if not record:
            continue
        for key in keys:
            value = record.get(key)
            if isinstance(value, str) and value.strip():
                if value in STATUS_ORDER:
                    return value
                status = STATUS_ALIASES.get(normalize_status_token(value))
                if status:
                    return status
    return None


def question_id(record: dict[str, Any]) -> str | None:
    return non_empty_string(record.get("question_id")) or non_empty_string(record.get("id")) or non_empty_string(record.get("questionId"))


def question_labels(record: dict[str, Any]) -> list[str]:
    notes = as_record(record.get("notes"))
    return [
        label for label in [
            non_empty_string(record.get("topic") or record.get("local_topic") or record.get("localTopic")),
            non_empty_string(record.get("subtopic") or record.get("local_subtopic") or record.get("localSubtopic")),
            non_empty_string(notes.get("subtopic")),
            non_empty_string(notes.get("topic") or notes.get("topic_normalized")),
        ] if label
    ]


def fallback_region_for_question(record: dict[str, Any], regions: list[dict[str, Any]]) -> str | None:
    labels = question_labels(record)
    return match_region_for_labels(labels, regions) if labels else None


def topic_distribution_regions(routing: dict[str, Any]) -> list[str]:
    distribution = routing.get("topic_distribution")
    if not isinstance(distribution, list):
        return []
    return unique_sorted([
        region_id
        for item in distribution
        if (region_id := P3_TOPIC_ID_TO_REGION_ID.get(non_empty_string(as_record(item).get("topic_id")) or ""))
    ])


def review_reason_looks_ambiguous(reason: str) -> bool:
    return re.search(r"ambiguous|multiple|conflict|uncertain|mixed|split", reason, re.I) is not None


def normalized_token(value: str | None) -> str:
    return re.sub(r"[\s-]+", "_", (value or "").strip().lower())


def route_explicitly_approved(record: dict[str, Any]) -> bool:
    truthy_keys = [
        "route_approved",
        "routeApproved",
        "review_approved",
        "reviewApproved",
        "validated_route_approved",
        "validatedRouteApproved",
        "approved_for_validated_evidence",
        "approvedForValidatedEvidence",
    ]
    if any(record.get(key) is True for key in truthy_keys):
        return True
    status = normalized_token(non_empty_string(record.get("route_review_status"))
                              or non_empty_string(record.get("routeReviewStatus"))
                              or non_empty_string(record.get("route_resolution_status"))
                              or non_empty_string(record.get("routeResolutionStatus"))
                              or non_empty_string(record.get("approval_status"))
                              or non_empty_string(record.get("approvalStatus")))
    return status in {"approved", "route_approved", "validated_route_approved", "clean_approved", "resolved_approved"}


def review_blocker_reason_codes(record: dict[str, Any]) -> list[str]:
    if route_explicitly_approved(record):
        return []
    blockers: list[str] = []
    review_reasons = string_list(record.get("review_reasons"))
    resolution_status = normalized_token(non_empty_string(record.get("resolution_status")) or non_empty_string(record.get("resolutionStatus")))
    route_decision = normalized_token(non_empty_string(record.get("route_decision")) or non_empty_string(record.get("routeDecision")) or non_empty_string(record.get("decision")))
    evidence_status = normalized_token(non_empty_string(record.get("evidence_status")) or non_empty_string(record.get("evidenceStatus")))
    if review_reasons:
        blockers.append("topic-routing-review-reasons-unresolved")
    if record.get("review_required") is True or record.get("reviewRequired") is True:
        blockers.append("topic-routing-review-required")
    if record.get("deferred") is True or record.get("is_deferred") is True or record.get("isDeferred") is True or record.get("teacher_review_deferred") is True or record.get("teacherReviewDeferred") is True:
        blockers.append("topic-routing-deferred-evidence")
    if resolution_status:
        if any(token in resolution_status for token in ["deferred", "review_required", "unresolved"]):
            blockers.append("topic-routing-deferred-evidence")
        elif resolution_status not in {"approved", "route_approved", "validated_route_approved", "clean_approved", "resolved_approved"}:
            blockers.append("topic-routing-audit-not-approved")
    if any(token in evidence_status for token in ["ambiguous", "deferred", "blocked"]):
        blockers.append("topic-routing-evidence-blocker")
    if route_decision and route_decision not in {"approved", "route_approved", "validated_route_approved", "clean_approved"}:
        blockers.append("topic-routing-deferred-evidence" if "defer" in route_decision else "topic-routing-audit-not-approved")
    falsey_keys = [
        "mastery_evidence_allowed",
        "masteryEvidenceAllowed",
        "mapping_reviewed",
        "mappingReviewed",
        "subpart_mapping_reviewed",
        "subpartMappingReviewed",
    ]
    if any(record.get(key) is False for key in falsey_keys):
        blockers.append("topic-routing-mastery-evidence-blocked")
    return unique_sorted(blockers)


def infer_route_evidence(question_ref: str, routing: dict[str, Any] | None, projected_question: dict[str, Any], regions: list[dict[str, Any]]) -> dict[str, Any]:
    routing = routing or {}
    primary_topic_id = non_empty_string(routing.get("primary_topic_id"))
    routed_region = P3_TOPIC_ID_TO_REGION_ID.get(primary_topic_id or "")
    candidate_region_ids = unique_sorted([region for region in [routed_region, *topic_distribution_regions(routing)] if region])
    fallback_region = fallback_region_for_question(projected_question, regions)
    explicit_unsafe_status = route_evidence_status(as_record(routing.get("route_evidence")), as_record(routing.get("routeEvidence")), routing)
    if explicit_unsafe_status == "clean":
        explicit_unsafe_status = None
    review_reasons = string_list(routing.get("review_reasons"))

    status = "missing-route"
    source = "topic-routing" if routing else "none"
    reason_codes = ["no-topic-routing-record"]

    if routing:
        if explicit_unsafe_status == "hard-failure":
            status = "hard-failure"
            reason_codes = ["topic-routing-evidence-status"]
        elif len(candidate_region_ids) > 1:
            status = "ambiguous-route"
            reason_codes = ["multiple-p3-candidate-regions"]
        elif routing.get("review_required") is True:
            status = "ambiguous-route" if any(review_reason_looks_ambiguous(reason) for reason in review_reasons) else "review-only"
            reason_codes = ["topic-routing-review-required"]
        elif (review_blockers := review_blocker_reason_codes(routing)):
            status = "ambiguous-route" if any(review_reason_looks_ambiguous(reason) for reason in review_reasons) else "review-only"
            reason_codes = review_blockers
        elif explicit_unsafe_status:
            status = explicit_unsafe_status
            reason_codes = ["topic-routing-evidence-status"]
        elif routed_region:
            status = "clean"
            reason_codes = ["validated-topic-routing"]
        elif primary_topic_id:
            if re.match(r"^9709_p[12]_topic_", primary_topic_id, re.I):
                status = "prerequisite-only"
            elif re.match(r"^9709_p3_topic_", primary_topic_id, re.I):
                status = "missing-route"
            else:
                status = "not-P3"
            reason_codes = ["unmapped-topic-routing-id"]
        else:
            status = "missing-route"
            reason_codes = ["topic-routing-missing-primary-topic"]
    elif fallback_region:
        status = "fallback-display-only"
        source = "fallback-label"
        reason_codes = ["fallback-label-match"]

    display_region = routed_region or fallback_region
    validated_region = routed_region if status == "clean" and source == "topic-routing" else None
    return {
        "question_id": question_ref,
        "status": status,
        "source": source,
        "primary_topic_id": primary_topic_id or "",
        "validated_region_id": validated_region or "",
        "validated_region_title": P3_REGION_DISPLAY_NAMES.get(validated_region or "", ""),
        "display_region_id": display_region or "",
        "display_region_title": P3_REGION_DISPLAY_NAMES.get(display_region or "", ""),
        "fallback_region_id": fallback_region or "",
        "reason_codes": reason_codes,
        "review_reasons": review_reasons,
        "candidate_region_ids": candidate_region_ids,
    }


def route_report_category(routing: dict[str, Any] | None) -> str:
    routing = routing or {}
    primary_region = P3_TOPIC_ID_TO_REGION_ID.get(non_empty_string(routing.get("primary_topic_id")) or "")
    review_reasons = string_list(routing.get("review_reasons"))
    multi_regions = topic_distribution_regions(routing)
    is_multi = len(multi_regions) > 1
    is_review_required = routing.get("review_required") is True
    if not primary_region:
        return "missing_p3_route"
    if is_multi and not is_review_required:
        return "ambiguous_multi_topic_route"
    if is_review_required or review_reasons:
        return "review_needed_route"
    return "safe_p3_route"


def count_by(items: list[dict[str, Any]], field: str) -> dict[str, int]:
    labels = sorted({str(item.get(field) or "") for item in items if item.get(field)})
    return {label: sum(1 for item in items if item.get(field) == label) for label in labels}


def build_report(
    *,
    projected_bank: dict[str, Any],
    raw_bank: dict[str, Any],
    topic_routing: dict[str, Any],
    world_map_path: Path,
    route_queue: dict[str, Any] | None,
    source_paths: dict[str, Path],
) -> dict[str, Any]:
    projected_questions = question_index(projected_bank)
    raw_questions = question_index(raw_bank)
    routing_records = route_records(topic_routing)
    regions = parse_world_regions(world_map_path)
    p3_refs = sorted(
        question_ref
        for question_ref, record in projected_questions.items()
        if non_empty_string(record.get("paper_family")) == "p3"
    )
    items = [
        {
            **infer_route_evidence(question_ref, routing_records.get(question_ref), projected_questions.get(question_ref, {}), regions),
            "route_report_category": route_report_category(routing_records.get(question_ref)),
        }
        for question_ref in p3_refs
    ]
    status_counts = {status: count_by(items, "status").get(status, 0) for status in STATUS_ORDER if count_by(items, "status").get(status, 0)}
    validated_region_count = sum(1 for item in items if item["validated_region_id"])
    fallback_display_only_count = sum(1 for item in items if item["status"] == "fallback-display-only")
    display_region_only_count = sum(1 for item in items if item["display_region_id"] and not item["validated_region_id"] and item["status"] != "fallback-display-only")
    no_display_region_count = sum(1 for item in items if not item["display_region_id"])

    route_classification = classify_p3_routes(
        routing_records=routing_records,
        raw_questions=raw_questions,
        projected_questions=projected_questions,
        regions=regions,
    )
    route_report_counts = route_classification["source_route_counts"]
    if route_queue:
        existing_counts = as_record(as_record(route_queue.get("source_route_summary")).get("counts"))
        route_report_counts = {**route_report_counts, **{key: value for key, value in existing_counts.items() if isinstance(value, int)}}
    route_decision_summary = as_record(route_queue.get("route_decision_summary")) if route_queue else {}
    missing_count = int(route_report_counts.get("missing_p3_route", 0))

    return {
        "schema_name": REPORT_SCHEMA_NAME,
        "schema_version": REPORT_SCHEMA_VERSION,
        "generated_by": GENERATED_BY,
        "generated_label": GENERATED_LABEL,
        "source_reports": {name: rel(path) for name, path in sorted(source_paths.items())},
        "runtime_route_evidence_policy": {
            "clean": "A P3 topic-routing sidecar record maps to exactly one active P3 region and has no unresolved review blockers.",
            "review-only": "A mapped route has review_required=true, review reasons, or unresolved audit/review blockers that do not look ambiguous.",
            "ambiguous-route": "The route has multiple mapped P3 candidate regions, or review reasons that look ambiguous.",
            "missing-route": "The route lacks a mapped active P3 primary topic. A display fallback may still exist.",
            "fallback-display-only": "Only legacy/local labels produce a display region. Current P3 records have sidecar authority, so this should remain 0 unless routing records are absent.",
        },
        "route_report_policy": {
            "safe_p3_route": "The deterministic queue source report counts one mapped sidecar route with no review_required flag or review reasons.",
            "review_needed_route": "The deterministic queue groups every mapped sidecar route with review_required=true or any review reasons.",
            "ambiguous_multi_topic_route": "The deterministic queue counts multiple mapped topic regions only when the record is not already review-required.",
            "missing_p3_route": "The deterministic queue counts any P3 sidecar record whose primary topic is not mapped to an active P3 region.",
        },
        "mapping_notes": [
            "Runtime clean and route-report safe now align exactly.",
            f"The {missing_count} route-report missing_p3_route records are not runtime missing-route records after route stamping because their sidecar review reasons make them review-only; in the projected normalized bank they have no displayRegionId.",
            "Runtime ambiguous-route is broader than route-report ambiguous_multi_topic_route because ambiguous review reasons are stamped ambiguous even when the queue category is missing_p3_route or review_needed_route.",
            "Runtime review-only is broader than route-report review_needed_route because unresolved review reasons on missing primary routes are preserved as review-only instead of being downgraded to fallback display.",
            f"The route-correction queue still lists raw-bank fallback placements for the {missing_count} missing routes as correction aids; those are not runtime fallback-display-only routeEvidence records.",
            "Queue item totals are not route-status totals because the queue also includes text review, deferred mark-scheme evidence, and support-content gaps.",
        ],
        "normalized_distribution": {
            "total_p3_questions": len(items),
            "status_counts": status_counts,
            "validated_region_id_count": validated_region_count,
            "display_region_id_only_count": display_region_only_count,
            "fallback_display_only_count": fallback_display_only_count,
            "no_display_region_id_count": no_display_region_count,
            "display_region_id_only_by_status": count_by([item for item in items if item["display_region_id"] and not item["validated_region_id"]], "status"),
            "fallback_display_only_by_region": count_by([item for item in items if item["status"] == "fallback-display-only"], "display_region_id"),
            "display_region_id_only_by_region": count_by([item for item in items if item["display_region_id"] and not item["validated_region_id"] and item["status"] != "fallback-display-only"], "display_region_id"),
        },
        "route_report_distribution": {
            "source_route_counts": route_report_counts,
            "normalized_status_by_route_report_category": {
                category: count_by([item for item in items if item["route_report_category"] == category], "status")
                for category in ["safe_p3_route", "missing_p3_route", "ambiguous_multi_topic_route", "review_needed_route"]
            },
            "route_queue_fallback_display_only_items": len(as_record(as_record(route_queue.get("queue")).get("route_correction")).get("fallback_display_only_region_placements", [])) if route_queue else None,
            "queue_items": as_record(route_queue.get("queue_summary")).get("total_queue_item_count") if route_queue else None,
        },
        "route_decision_summary": route_decision_summary,
        "differences": {
            "clean_minus_safe_routes": status_counts.get("clean", 0) - int(route_report_counts.get("safe_p3_route", 0)),
            "missing_route_minus_missing_routes": status_counts.get("missing-route", 0) - int(route_report_counts.get("missing_p3_route", 0)),
            "ambiguous_route_minus_ambiguous_routes": status_counts.get("ambiguous-route", 0) - int(route_report_counts.get("ambiguous_multi_topic_route", 0)),
            "review_only_minus_review_needed_routes": status_counts.get("review-only", 0) - int(route_report_counts.get("review_needed_route", 0)),
        },
        "examples": {
            status: [item for item in items if item["status"] == status][:8]
            for status in STATUS_ORDER
            if any(item["status"] == status for item in items)
        },
    }


def render_markdown(report: dict[str, Any]) -> str:
    normalized = as_record(report.get("normalized_distribution"))
    route_report = as_record(report.get("route_report_distribution"))
    route_counts = as_record(route_report.get("source_route_counts"))
    cross_tab = as_record(route_report.get("normalized_status_by_route_report_category"))
    differences = as_record(report.get("differences"))
    route_decisions = as_record(report.get("route_decision_summary"))
    lines = [
        "# P3 Route Evidence Status Report",
        "",
        "Phase 1 verification artifact. This report does not mutate route metadata or begin region correction.",
        "",
        "## Normalized Runtime Distribution",
        "",
        f"- Total P3 questions: {normalized.get('total_p3_questions')}",
        f"- routeEvidence.status counts: `{json.dumps(normalized.get('status_counts'), sort_keys=True)}`",
        f"- validatedRegionId count: {normalized.get('validated_region_id_count')}",
        f"- displayRegionId-only count: {normalized.get('display_region_id_only_count')}",
        f"- fallback-display-only count: {normalized.get('fallback_display_only_count')}",
        f"- no displayRegionId count: {normalized.get('no_display_region_id_count')}",
        "",
        "## Route Report Distribution",
        "",
        f"- source route counts: `{json.dumps(route_counts, sort_keys=True)}`",
        f"- normalized status by route-report category: `{json.dumps(cross_tab, sort_keys=True)}`",
        f"- route-queue fallback display-only items: {route_report.get('route_queue_fallback_display_only_items')}",
        f"- queue items: {route_report.get('queue_items')}",
        f"- route decision counts: `{json.dumps(route_decisions.get('counts_by_status'), sort_keys=True)}`",
        f"- still-needs-review route questions: {route_decisions.get('still_needs_review_count')}",
        "",
        "## Count Differences",
        "",
        f"- clean minus safe routes: {differences.get('clean_minus_safe_routes')}",
        f"- missing-route minus missing routes: {differences.get('missing_route_minus_missing_routes')}",
        f"- ambiguous-route minus ambiguous routes: {differences.get('ambiguous_route_minus_ambiguous_routes')}",
        f"- review-only minus review-needed routes: {differences.get('review_only_minus_review_needed_routes')}",
        "",
        "## Explanation",
        "",
        *[f"- {note}" for note in report.get("mapping_notes", [])],
        "",
        "## Display-Only Breakdown",
        "",
        f"- displayRegionId-only by status: `{json.dumps(normalized.get('display_region_id_only_by_status'), sort_keys=True)}`",
        f"- displayRegionId-only by region: `{json.dumps(normalized.get('display_region_id_only_by_region'), sort_keys=True)}`",
        f"- fallback-display-only by region: `{json.dumps(normalized.get('fallback_display_only_by_region'), sort_keys=True)}`",
        "",
    ]
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the deterministic P3 route-evidence status report.")
    parser.add_argument(
        "--projected-bank",
        type=Path,
        default=DEFAULT_PROJECTED_BANK,
        help="Full exam-bank catalog used for audit reporting. The option name is retained for older scripts.",
    )
    parser.add_argument("--raw-bank", type=Path, default=DEFAULT_RAW_BANK)
    parser.add_argument("--topic-routing", type=Path, default=DEFAULT_TOPIC_ROUTING)
    parser.add_argument("--world-map", type=Path, default=DEFAULT_WORLD_MAP)
    parser.add_argument("--route-queue", type=Path, default=DEFAULT_ROUTE_QUEUE)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON_OUTPUT)
    parser.add_argument("--markdown-output", type=Path, default=DEFAULT_MARKDOWN_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    route_queue = load_json(args.route_queue) if args.route_queue.exists() else None
    source_paths = {
        "projected_bank": args.projected_bank,
        "raw_bank": args.raw_bank,
        "topic_routing_sidecar": args.topic_routing,
        "world_map": args.world_map,
        "route_queue": args.route_queue,
    }
    report = build_report(
        projected_bank=load_json(args.projected_bank),
        raw_bank=load_json(args.raw_bank),
        topic_routing=load_json(args.topic_routing),
        world_map_path=args.world_map,
        route_queue=route_queue,
        source_paths=source_paths,
    )
    write_json(args.json_output, report)
    write_text(args.markdown_output, render_markdown(report))
    normalized = report["normalized_distribution"]
    print(
        "P3 route evidence status: "
        f"total={normalized['total_p3_questions']}; "
        f"statuses={json.dumps(normalized['status_counts'], sort_keys=True)}; "
        f"validatedRegionId={normalized['validated_region_id_count']}; "
        f"displayRegionIdOnly={normalized['display_region_id_only_count']}; "
        f"fallbackDisplayOnly={normalized['fallback_display_only_count']}"
    )
    print(f"Wrote {args.json_output}")
    print(f"Wrote {args.markdown_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build deterministic Content Lab skill-target candidates from question_bank.json.

This script is intentionally conservative. It does not generate runtime content,
does not mutate the exam bank, and does not copy question text into outputs.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


SUPPORTED_TOPICS: dict[str, dict[str, Any]] = {
    "binomial_expansion": {
        "title": "Binomial expansion structure",
        "student_goal": "Recognize binomial expansion prompts and choose the right term or coefficient strategy.",
        "micro_skills": [
            "Identify the power and variable part of a binomial expression.",
            "Use the correct binomial coefficient for a requested term.",
            "Track signs and powers when combining two expansions.",
        ],
    },
    "quadratics": {
        "title": "Quadratic forms and roots",
        "student_goal": "Move between quadratic forms and use the form that makes the exam task shortest.",
        "micro_skills": [
            "Choose between factorising, completing the square, and the formula.",
            "Connect discriminant conditions to root information.",
            "Interpret roots or intersections from the algebraic form.",
        ],
    },
    "logarithms_and_exponentials": {
        "title": "Logarithms and exponentials",
        "student_goal": "Convert, simplify, and solve log or exponential equations while checking domains.",
        "micro_skills": [
            "Convert between exponential and logarithmic form.",
            "Use log laws to expand or combine expressions.",
            "Reject answers that make a log argument non-positive.",
        ],
    },
    "trigonometry": {
        "title": "Trigonometric equations and identities",
        "student_goal": "Recognize trig structures, choose identities, and keep solutions inside the required interval.",
        "micro_skills": [
            "Use compound-angle, double-angle, and reciprocal identities when useful.",
            "Solve transformed trig equations over a specified range.",
            "Check extra solutions created by rearranging or squaring.",
        ],
    },
    "differentiation": {
        "title": "Differentiation decisions",
        "student_goal": "Choose the right differentiation method and interpret the derivative in context.",
        "micro_skills": [
            "Choose between product, quotient, chain, implicit, and parametric differentiation.",
            "Use derivatives to find gradients, stationary points, or rates of change.",
            "Check whether the question asks for a value, equation, or classification.",
        ],
    },
    "partial_fractions": {
        "title": "Partial fractions setup",
        "student_goal": "Decompose rational expressions into usable partial fractions.",
        "micro_skills": [
            "Select the correct numerator form for each denominator factor.",
            "Use substitution or coefficient comparison efficiently.",
            "Check restrictions and repeated-factor terms.",
        ],
    },
    "complex_numbers": {
        "title": "Complex number forms",
        "student_goal": "Move between Cartesian, modulus-argument, and geometric views of complex numbers.",
        "micro_skills": [
            "Find modulus and argument with quadrant awareness.",
            "Use polar form for multiplication, division, powers, or roots.",
            "Interpret loci or roots on an Argand diagram.",
        ],
    },
    "vectors": {
        "title": "Vector lines and products",
        "student_goal": "Use vector equations, scalar products, and geometry to solve 3D line problems.",
        "micro_skills": [
            "Form or compare vector equations of lines.",
            "Use scalar product to find angles or perpendicular conditions.",
            "Solve intersections by matching parameters carefully.",
        ],
    },
    "momentum_impulse": {
        "title": "Momentum and impulse",
        "student_goal": "Track direction, impulse, and conservation equations in mechanics problems.",
        "micro_skills": [
            "Choose a sign convention before writing momentum equations.",
            "Use impulse as change in momentum over a stated direction.",
            "Separate conservation of momentum from energy or restitution assumptions.",
        ],
    },
}

HIGH_OR_MEDIUM = {"high", "medium"}
TEXT_READY_OR_REVIEW = {"ready", "review"}
TEXT_BLOCKED = {"low", "unusable"}

SEVERE_FLAG_PATTERNS = (
    "severe_math_corruption",
    "math_corruption",
    "text_order_unreliable",
    "text_order_unreliability",
    "question_scope_incomplete",
    "incomplete_question_scope",
    "question_subparts_incomplete",
    "mark_total_mismatch",
    "mark-total_mismatch",
    "paper_total_mismatch",
    "question_mark_total_mismatch",
)

REVIEW_RISK_FLAG_PATTERNS = (
    "flattened_math",
    "topic_uncertain",
    "weak_question_text",
    "degraded",
    "text_figure_overlap",
    "question_scope_contaminated",
    "possible_next_question_contamination",
    "mixed_topic_possible",
)

RUNTIME_REVIEW_STATUSES = {"teacher_reviewed", "published"}


def normalize_flag(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value).lower()).strip("_")


def as_record(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def non_empty_string(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def nested_value(record: dict[str, Any], key: str) -> Any:
    notes = as_record(record.get("notes"))
    return notes.get(key, record.get(key))


def record_id(record: dict[str, Any]) -> str:
    return non_empty_string(record.get("question_id")) or non_empty_string(record.get("id")) or "unknown_question"


def record_flags(record: dict[str, Any]) -> list[str]:
    notes = as_record(record.get("notes"))
    flags: list[str] = []
    for key in ("review_flags", "validation_flags", "text_fidelity_flags", "visual_reason_flags"):
        values = notes.get(key, record.get(key, []))
        if isinstance(values, list):
            flags.extend(str(value) for value in values)
    return flags


def has_pattern(flags: list[str], patterns: tuple[str, ...]) -> bool:
    normalized = [normalize_flag(flag) for flag in flags]
    return any(any(pattern in flag for pattern in patterns) for flag in normalized)


def source_eligibility(record: dict[str, Any]) -> dict[str, Any]:
    """Return auto_eligible, review_only, or blocked with deterministic reasons."""

    notes = as_record(record.get("notes"))
    validation_status = non_empty_string(notes.get("validation_status")) or non_empty_string(record.get("validation_status"))
    mapping_status = non_empty_string(notes.get("mapping_status")) or non_empty_string(record.get("mapping_status"))
    question_text_trust = non_empty_string(record.get("question_text_trust")) or non_empty_string(notes.get("question_text_trust"))
    topic = non_empty_string(record.get("topic"))
    topic_confidence = non_empty_string(notes.get("topic_confidence")) or non_empty_string(record.get("topic_confidence"))
    text_only_status = non_empty_string(record.get("text_only_status")) or non_empty_string(notes.get("text_only_status"))
    visual_curation_status = non_empty_string(record.get("visual_curation_status")) or non_empty_string(notes.get("visual_curation_status"))
    mark_scheme_text = non_empty_string(record.get("mark_scheme_text"))
    visual_required = bool(record.get("visual_required") or notes.get("visual_required"))
    text_fidelity_status = non_empty_string(nested_value(record, "text_fidelity_status"))
    flags = record_flags(record)

    blocked_reasons: list[str] = []
    review_reasons: list[str] = []

    if validation_status == "fail":
        blocked_reasons.append("validation_status_fail")
    if mapping_status == "fail":
        blocked_reasons.append("mapping_status_fail")
    if question_text_trust in TEXT_BLOCKED:
        blocked_reasons.append(f"question_text_trust_{question_text_trust}")
    if text_only_status == "fail":
        blocked_reasons.append("text_only_status_fail")
    if visual_curation_status == "fail":
        blocked_reasons.append("visual_curation_status_fail")
    if not mark_scheme_text:
        blocked_reasons.append("missing_mark_scheme_text")
    if has_pattern(flags, SEVERE_FLAG_PATTERNS):
        blocked_reasons.append("severe_review_flag")

    if blocked_reasons:
        return {
            "eligibility": "blocked",
            "reasons": sorted(set(blocked_reasons)),
        }

    if validation_status != "pass":
        review_reasons.append(f"validation_status_{validation_status or 'missing'}")
    if mapping_status != "pass":
        review_reasons.append(f"mapping_status_{mapping_status or 'missing'}")
    if question_text_trust not in HIGH_OR_MEDIUM:
        review_reasons.append(f"question_text_trust_{question_text_trust or 'missing'}")
    if not topic:
        review_reasons.append("missing_topic")
    if topic_confidence and topic_confidence not in HIGH_OR_MEDIUM:
        review_reasons.append(f"topic_confidence_{topic_confidence}")
    if text_only_status not in TEXT_READY_OR_REVIEW:
        review_reasons.append(f"text_only_status_{text_only_status or 'missing'}")
    if visual_required:
        review_reasons.append("visual_required")
    if visual_curation_status and visual_curation_status != "ready":
        review_reasons.append(f"visual_curation_status_{visual_curation_status}")
    if text_fidelity_status and text_fidelity_status != "clean":
        review_reasons.append(f"text_fidelity_status_{text_fidelity_status}")
    if has_pattern(flags, REVIEW_RISK_FLAG_PATTERNS):
        review_reasons.append("review_risk_flag")

    if review_reasons:
        return {
            "eligibility": "review_only",
            "reasons": sorted(set(review_reasons)),
        }

    return {
        "eligibility": "auto_eligible",
        "reasons": ["trusted_text_and_mapping"],
    }


def load_question_records(input_path: Path) -> list[dict[str, Any]]:
    data = json.loads(input_path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        raw_records = data
    elif isinstance(data, dict):
        raw_records = data.get("questions") or data.get("records") or []
    else:
        raw_records = []
    return [record for record in raw_records if isinstance(record, dict)]


def paper_family(record: dict[str, Any]) -> str:
    return non_empty_string(record.get("paper_family")) or "unknown"


def target_id(paper: str, topic: str) -> str:
    return f"{paper}_{topic}".lower().replace("/", "_")


def confidence_for_source_count(count: int) -> str:
    if count >= 5:
        return "high"
    if count >= 2:
        return "medium"
    return "low"


def build_skill_targets(records: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    eligible_records: list[dict[str, Any]] = []
    review_records: list[dict[str, Any]] = []

    for record in records:
        eligibility = source_eligibility(record)
        topic = non_empty_string(record.get("topic"))
        paper = paper_family(record)
        queue_entry = {
            "question_id": record_id(record),
            "paper_family": paper,
            "topic": topic or "unknown",
            "eligibility": eligibility["eligibility"],
            "reasons": eligibility["reasons"],
            "question_text_trust": non_empty_string(record.get("question_text_trust")) or non_empty_string(as_record(record.get("notes")).get("question_text_trust")),
            "text_only_status": non_empty_string(record.get("text_only_status")) or non_empty_string(as_record(record.get("notes")).get("text_only_status")),
            "validation_status": non_empty_string(as_record(record.get("notes")).get("validation_status")) or non_empty_string(record.get("validation_status")),
            "mapping_status": non_empty_string(as_record(record.get("notes")).get("mapping_status")) or non_empty_string(record.get("mapping_status")),
            "visual_required": bool(record.get("visual_required") or as_record(record.get("notes")).get("visual_required")),
        }

        if eligibility["eligibility"] == "auto_eligible":
            eligible_records.append(record)
        else:
            review_records.append(queue_entry)

    groups: dict[tuple[str, str], list[str]] = {}
    for record in eligible_records:
        topic = non_empty_string(record.get("topic"))
        if topic not in SUPPORTED_TOPICS:
            continue
        key = (paper_family(record), topic)
        groups.setdefault(key, []).append(record_id(record))

    skill_targets = []
    for (paper, topic), ids in sorted(groups.items()):
        topic_template = SUPPORTED_TOPICS[topic]
        unique_ids = sorted(set(ids))
        skill_targets.append({
            "skill_target_id": target_id(paper, topic),
            "paper_family": paper,
            "topic": topic,
            "title": topic_template["title"],
            "student_goal": topic_template["student_goal"],
            "micro_skills": topic_template["micro_skills"],
            "source_question_ids": unique_ids,
            "confidence": confidence_for_source_count(len(unique_ids)),
            "review_status": "needs_review",
        })

    review_queue_records = sorted(
        review_records,
        key=lambda item: (item["paper_family"], item["topic"], item["question_id"]),
    )

    return (
        {
            "schema_name": "asterion_skill_targets",
            "schema_version": 1,
            "generated_by": "tools/content_lab/scripts/build_skill_targets.py",
            "supported_topics": sorted(SUPPORTED_TOPICS),
            "skill_targets": skill_targets,
        },
        {
            "schema_name": "asterion_content_lab_review_queue",
            "schema_version": 1,
            "generated_by": "tools/content_lab/scripts/build_skill_targets.py",
            "source_record_count": len(records),
            "records": review_queue_records,
        },
    )


def reviewed_snippet_topic_keys(snippets_path: Path) -> set[tuple[str, str]]:
    try:
        data = json.loads(snippets_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return set()
    except json.JSONDecodeError:
        return set()

    snippets = data.get("snippets") if isinstance(data, dict) else []
    if not isinstance(snippets, list):
        return set()

    keys: set[tuple[str, str]] = set()
    for snippet in snippets:
        if not isinstance(snippet, dict):
            continue
        if snippet.get("review_status") not in RUNTIME_REVIEW_STATUSES:
            continue
        paper = non_empty_string(snippet.get("paper_family"))
        topics = snippet.get("topics")
        if not paper or not isinstance(topics, list):
            continue
        for topic_value in topics:
            topic = non_empty_string(topic_value)
            if topic:
                keys.add((paper, topic))
    return keys


def build_content_lab_report(
    records: list[dict[str, Any]],
    skill_targets: dict[str, Any],
    review_queue: dict[str, Any],
    snippets_path: Path,
) -> dict[str, Any]:
    eligibility_counts = {
        "auto_eligible": 0,
        "review_only": 0,
        "blocked": 0,
    }
    source_topic_counts: dict[tuple[str, str], int] = {}
    for record in records:
        eligibility = source_eligibility(record)["eligibility"]
        eligibility_counts[eligibility] = eligibility_counts.get(eligibility, 0) + 1
        topic = non_empty_string(record.get("topic")) or "unknown"
        key = (paper_family(record), topic)
        source_topic_counts[key] = source_topic_counts.get(key, 0) + 1

    skill_target_counts: dict[str, dict[str, int]] = {}
    skill_target_ids_by_key: dict[tuple[str, str], list[str]] = {}
    raw_skill_targets = skill_targets.get("skill_targets")
    skill_target_items = raw_skill_targets if isinstance(raw_skill_targets, list) else []
    for target in skill_target_items:
        if not isinstance(target, dict):
            continue
        paper = non_empty_string(target.get("paper_family"))
        topic = non_empty_string(target.get("topic"))
        skill_target_id = non_empty_string(target.get("skill_target_id"))
        if not paper or not topic:
            continue
        skill_target_counts.setdefault(paper, {})
        skill_target_counts[paper][topic] = skill_target_counts[paper].get(topic, 0) + 1
        if skill_target_id:
            skill_target_ids_by_key.setdefault((paper, topic), []).append(skill_target_id)

    review_reason_counts: dict[str, int] = {}
    raw_review_records = review_queue.get("records")
    review_record_items = raw_review_records if isinstance(raw_review_records, list) else []
    for record in review_record_items:
        if not isinstance(record, dict):
            continue
        reasons = record.get("reasons")
        if not isinstance(reasons, list):
            continue
        for reason_value in reasons:
            reason = non_empty_string(reason_value)
            if reason:
                review_reason_counts[reason] = review_reason_counts.get(reason, 0) + 1

    skill_target_keys = set(skill_target_ids_by_key)
    topics_with_source_records_but_no_skill_targets = [
        {
            "paper_family": paper,
            "topic": topic,
            "source_record_count": source_topic_counts[(paper, topic)],
        }
        for paper, topic in sorted(source_topic_counts)
        if (paper, topic) not in skill_target_keys
    ]

    reviewed_topic_keys = reviewed_snippet_topic_keys(snippets_path)
    topics_with_skill_targets_but_no_reviewed_snippets = [
        {
            "paper_family": paper,
            "topic": topic,
            "skill_target_ids": sorted(skill_target_ids_by_key[(paper, topic)]),
        }
        for paper, topic in sorted(skill_target_keys)
        if (paper, topic) not in reviewed_topic_keys
    ]

    return {
        "schema_name": "asterion_content_lab_report",
        "schema_version": 1,
        "generated_by": "tools/content_lab/scripts/build_skill_targets.py",
        "total_records_read": len(records),
        "auto_eligible": eligibility_counts.get("auto_eligible", 0),
        "review_only": eligibility_counts.get("review_only", 0),
        "blocked": eligibility_counts.get("blocked", 0),
        "skill_targets_created_by_paper_family_topic": skill_target_counts,
        "review_queue_counts_by_reason": review_reason_counts,
        "topics_with_source_records_but_no_skill_targets": topics_with_source_records_but_no_skill_targets,
        "topics_with_skill_targets_but_no_reviewed_snippets": topics_with_skill_targets_but_no_reviewed_snippets,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Content Lab skill-target candidates.")
    parser.add_argument("--input", default="public/data/question_bank.json", help="Path to question_bank.json")
    parser.add_argument("--output-dir", default="tools/content_lab/outputs", help="Directory for generated JSON outputs")
    parser.add_argument("--snippets", default="public/data/teaching_snippets.json", help="Path to reviewed teaching snippets")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    snippets_path = Path(args.snippets)
    records = load_question_records(input_path)
    skill_targets, review_queue = build_skill_targets(records)
    report = build_content_lab_report(records, skill_targets, review_queue, snippets_path)

    write_json(output_dir / "skill_targets.json", skill_targets)
    write_json(output_dir / "review_queue.json", review_queue)
    write_json(output_dir / "content_lab_report.json", report)

    print(f"Wrote {len(skill_targets['skill_targets'])} skill targets.")
    print(f"Wrote {len(review_queue['records'])} review queue records.")
    print(
        "Content Lab report: "
        f"{report['total_records_read']} records read; "
        f"{report['auto_eligible']} auto eligible; "
        f"{report['review_only']} review only; "
        f"{report['blocked']} blocked."
    )
    print("Wrote content_lab_report.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

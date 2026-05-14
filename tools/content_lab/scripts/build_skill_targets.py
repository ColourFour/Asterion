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
    "algebra": {
        "title": "Algebraic structure and rearrangement",
        "student_goal": "Spot the algebraic structure before choosing a rearrangement or simplification route.",
        "micro_skills": [
            "Identify factors, powers, fractions, and hidden substitutions.",
            "Choose whether to expand, factorise, or rearrange first.",
            "Check that each transformation preserves the original equation.",
        ],
        "likely_prerequisites": [
            "Confident expansion and factorisation.",
            "Solving linear and quadratic equations.",
        ],
        "common_misconceptions": [
            "Expanding too early when factor form is more useful.",
            "Cancelling terms across addition or subtraction.",
            "Forgetting restrictions introduced by denominators.",
        ],
    },
    "binomial_expansion": {
        "title": "Binomial expansion structure",
        "student_goal": "Recognize binomial expansion prompts and choose the right term or coefficient strategy.",
        "micro_skills": [
            "Identify the power and variable part of a binomial expression.",
            "Use the correct binomial coefficient for a requested term.",
            "Track signs and powers when combining two expansions.",
        ],
        "likely_prerequisites": [
            "Index laws.",
            "Binomial coefficients and simple combinations.",
        ],
        "common_misconceptions": [
            "Treating the requested power of x as the term number.",
            "Dropping the sign inside a negative binomial term.",
            "Expanding more of the expression than the question needs.",
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
        "likely_prerequisites": [
            "Factorising simple quadratics.",
            "Using the discriminant.",
        ],
        "common_misconceptions": [
            "Solving a whole quadratic when a discriminant condition is enough.",
            "Using the wrong inequality for repeated or real roots.",
            "Forgetting that tangency usually means one repeated root.",
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
        "likely_prerequisites": [
            "Index laws.",
            "Solving linear and quadratic equations.",
            "Understanding that logarithm arguments must be positive.",
        ],
        "common_misconceptions": [
            "Splitting a sum inside a logarithm.",
            "Cancelling logs before combining them correctly.",
            "Keeping algebraic roots that break the original log domain.",
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
        "likely_prerequisites": [
            "Exact trig values.",
            "Quadrant signs and interval notation.",
        ],
        "common_misconceptions": [
            "Giving only the calculator angle.",
            "Mixing degrees and radians.",
            "Forgetting extra solutions after substituting a double angle.",
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
        "likely_prerequisites": [
            "Basic differentiation rules.",
            "Algebraic simplification.",
        ],
        "common_misconceptions": [
            "Applying a rule before checking for a simpler rewrite.",
            "Forgetting the inner derivative in a chain-rule step.",
            "Stopping at a derivative when the question asks for a tangent, normal, or classification.",
        ],
    },
    "integration": {
        "title": "Integration method choice",
        "student_goal": "Choose a direct rule, substitution, parts, or algebraic rewrite from the structure of the integrand.",
        "micro_skills": [
            "Look for a hidden derivative before substituting.",
            "Use integration by parts when a product is not directly integrable.",
            "Handle constants, limits, and plus C carefully.",
        ],
        "likely_prerequisites": [
            "Standard integration rules.",
            "Differentiating common functions.",
        ],
        "common_misconceptions": [
            "Changing variables in a definite integral but keeping old limits.",
            "Forgetting the constant in an indefinite integral.",
            "Choosing a method from habit instead of the expression structure.",
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
        "likely_prerequisites": [
            "Factorising denominators.",
            "Comparing coefficients.",
        ],
        "common_misconceptions": [
            "Using a constant numerator over an irreducible quadratic factor.",
            "Missing the extra term for a repeated factor.",
            "Substituting values before multiplying through by the denominator.",
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
        "likely_prerequisites": [
            "Pythagoras and trigonometric ratios.",
            "Algebra with real and imaginary parts.",
        ],
        "common_misconceptions": [
            "Using polar form for addition.",
            "Taking the calculator argument without checking the quadrant.",
            "Forgetting all roots in a roots-of-complex-numbers question.",
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
        "likely_prerequisites": [
            "Vector addition and scalar multiples.",
            "Solving simultaneous equations.",
        ],
        "common_misconceptions": [
            "Using the same parameter for two different lines.",
            "Checking only two coordinates for a 3D intersection.",
            "Confusing a point on a line with the direction vector.",
        ],
    },
    "series_and_sequences": {
        "title": "Series and sequences",
        "student_goal": "Identify the sequence type and use the correct term or sum formula.",
        "micro_skills": [
            "Distinguish arithmetic and geometric structures.",
            "Use term and sum formulae with the correct first term and common difference or ratio.",
            "Interpret sigma notation and limiting sums.",
        ],
        "likely_prerequisites": [
            "Substitution into formulae.",
            "Solving simple equations.",
        ],
        "common_misconceptions": [
            "Using a sum formula when the question asks for a term.",
            "Confusing common difference with common ratio.",
            "Forgetting the convergence condition for an infinite geometric series.",
        ],
    },
    "numerical_methods": {
        "title": "Numerical methods evidence",
        "student_goal": "Show the calculation evidence that justifies a root interval or iterative approximation.",
        "micro_skills": [
            "Use sign changes to justify a root interval.",
            "Apply the stated iteration formula consistently.",
            "Keep enough accuracy before rounding the final answer.",
        ],
        "likely_prerequisites": [
            "Function evaluation.",
            "Calculator accuracy and rounding.",
        ],
        "common_misconceptions": [
            "Rounding every iteration too early.",
            "Changing the iteration formula halfway through.",
            "Claiming a root interval without showing opposite signs.",
        ],
    },
    "differential_equations": {
        "title": "Differential equations by separation",
        "student_goal": "Separate variables, integrate in order, and use conditions only after the general solution is formed.",
        "micro_skills": [
            "Identify separable variables.",
            "Integrate both sides with a constant.",
            "Apply an initial condition after integration.",
        ],
        "likely_prerequisites": [
            "Basic integration.",
            "Rearranging equations with fractions.",
        ],
        "common_misconceptions": [
            "Integrating before variables are separated.",
            "Dropping the constant of integration.",
            "Substituting the condition into the differential equation instead of the solution.",
        ],
    },
    "parametric_equations": {
        "title": "Parametric calculus",
        "student_goal": "Use parameter derivatives and convert back only when the question needs it.",
        "micro_skills": [
            "Differentiate x and y with respect to the parameter.",
            "Use dy/dx = (dy/dt)/(dx/dt).",
            "Substitute parameter values at the correct stage.",
        ],
        "likely_prerequisites": [
            "Chain rule.",
            "Basic parametric notation.",
        ],
        "common_misconceptions": [
            "Differentiating y with respect to x directly when both use a parameter.",
            "Forgetting to divide by dx/dt.",
            "Substituting a point before finding the needed derivative.",
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
        "likely_prerequisites": [
            "Signed velocity.",
            "Momentum equals mass times velocity.",
        ],
        "common_misconceptions": [
            "Changing positive direction halfway through.",
            "Treating a negative velocity as impossible.",
            "Using speed when velocity is required.",
        ],
    },
    "kinematics_constant_acceleration": {
        "title": "Constant-acceleration kinematics",
        "student_goal": "Choose a suvat equation from the known and wanted quantities.",
        "micro_skills": [
            "List known and unknown quantities with signs.",
            "Choose the suvat equation that uses only needed variables.",
            "Interpret negative displacement or velocity using the sign convention.",
        ],
        "likely_prerequisites": [
            "Solving linear and quadratic equations.",
            "Using units consistently.",
        ],
        "common_misconceptions": [
            "Mixing speed and velocity.",
            "Using acceleration with the wrong sign.",
            "Choosing an equation before listing known values.",
        ],
    },
    "work_energy_power": {
        "title": "Work, energy, and power",
        "student_goal": "Connect work done, energy changes, and power with a clear sign convention.",
        "micro_skills": [
            "Write the energy balance before substituting.",
            "Include work done against resistance or gravity.",
            "Use power as rate of work done where needed.",
        ],
        "likely_prerequisites": [
            "Resolving forces.",
            "Kinetic and potential energy formulae.",
        ],
        "common_misconceptions": [
            "Ignoring work done against resistance.",
            "Using distance where vertical height change is needed.",
            "Mixing energy and force equations without units checks.",
        ],
    },
}

HIGH_OR_MEDIUM = {"high", "medium"}
TEXT_READY_OR_REVIEW = {"ready", "review"}
TEXT_BLOCKED = {"unusable"}
TEXT_REVIEW_ONLY = {"low"}

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
SEQUENCE_ROLES = {"first_step", "complete_step", "guardian_prep"}

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
    },
    "logarithm-grove": {
        "primary_topic": "logarithms_and_exponentials",
        "topics": {"logarithms_and_exponentials", "logarithms", "exponentials"},
    },
    "trig-observatory": {
        "primary_topic": "trigonometry",
        "topics": {"trigonometry", "trigonometric_identities", "trigonometric_equations"},
    },
    "complex-harbor": {
        "primary_topic": "complex_numbers",
        "topics": {"complex_numbers", "argand_diagrams", "modulus_and_argument"},
    },
    "calculus-cliffs": {
        "primary_topic": "differentiation",
        "topics": {"differentiation", "parametric_equations"},
    },
    "integration-gardens": {
        "primary_topic": "integration",
        "topics": {"integration", "partial_fractions"},
    },
    "vector-workshop": {
        "primary_topic": "vectors",
        "topics": {"vectors"},
    },
    "numerical-mines": {
        "primary_topic": "numerical_methods",
        "topics": {"numerical_methods", "numerical_solution_of_equations", "iteration"},
    },
    "differential-shrine": {
        "primary_topic": "differential_equations",
        "topics": {"differential_equations", "separation_of_variables"},
    },
}

MARK_SCHEME_PATTERN_RULES: tuple[dict[str, Any], ...] = (
    {
        "pattern_id": "log_laws_before_solving",
        "summary": "Use product, quotient, or power laws before removing logarithms.",
        "topics": {"logarithms_and_exponentials"},
        "regex": re.compile(r"logarithm|log law|ln|remove logarithms|without logs", re.I),
    },
    {
        "pattern_id": "domain_or_positive_argument",
        "summary": "Check positive arguments or positive exponential substitutions.",
        "topics": {"logarithms_and_exponentials"},
        "regex": re.compile(r"positive|ignore any negative|domain|argument", re.I),
    },
    {
        "pattern_id": "binomial_terms_and_coefficients",
        "summary": "Use low-order terms or coefficient matching instead of full expansion.",
        "topics": {"binomial_expansion"},
        "regex": re.compile(r"coefficient|terms required|binomial|x\^?2|x\^{2}", re.I),
    },
    {
        "pattern_id": "discriminant_or_root_condition",
        "summary": "Use root conditions such as discriminants, tangency, or intersections.",
        "topics": {"quadratics"},
        "regex": re.compile(r"discriminant|repeated root|real roots|tangent|intersect", re.I),
    },
    {
        "pattern_id": "trig_identity_or_interval",
        "summary": "Use identities or interval checks to keep all valid trigonometric solutions.",
        "topics": {"trigonometry"},
        "regex": re.compile(r"double angle|compound angle|identity|interval|range|radian|degree", re.I),
    },
    {
        "pattern_id": "differentiate_then_interpret",
        "summary": "Differentiate with the appropriate rule, then use the derivative for the requested result.",
        "topics": {"differentiation", "parametric_equations"},
        "regex": re.compile(r"derivative|differentiate|dy|dx|stationary|tangent|normal|product rule|chain rule|quotient rule", re.I),
    },
    {
        "pattern_id": "integration_method_and_limits",
        "summary": "Choose substitution, parts, or algebra first, then handle limits or constants.",
        "topics": {"integration"},
        "regex": re.compile(r"integrat|substitut|by parts|limits|constant|partial fraction", re.I),
    },
    {
        "pattern_id": "partial_fraction_form",
        "summary": "Set up the correct partial-fraction form before solving constants.",
        "topics": {"partial_fractions"},
        "regex": re.compile(r"partial fraction|constant|coefficient|denominator|factor", re.I),
    },
    {
        "pattern_id": "complex_form_or_argand",
        "summary": "Choose Cartesian, modulus-argument, or Argand form to match the operation.",
        "topics": {"complex_numbers"},
        "regex": re.compile(r"modulus|argument|argand|complex|conjugate|polar|root", re.I),
    },
    {
        "pattern_id": "vector_equation_or_scalar_product",
        "summary": "Use vector equations, component comparison, or scalar products.",
        "topics": {"vectors"},
        "regex": re.compile(r"vector|scalar product|direction|component|line|parameter|perpendicular", re.I),
    },
    {
        "pattern_id": "sequence_formula_choice",
        "summary": "Choose the correct term or sum formula for the sequence structure.",
        "topics": {"series_and_sequences"},
        "regex": re.compile(r"arithmetic|geometric|sequence|series|sum|term|ratio", re.I),
    },
    {
        "pattern_id": "numerical_evidence",
        "summary": "Show sign-change, iteration, graph, or rounding evidence.",
        "topics": {"numerical_methods"},
        "regex": re.compile(r"iteration|iterative|sign change|root|sketch|graph|round|decimal|approx", re.I),
    },
    {
        "pattern_id": "separate_variables",
        "summary": "Separate variables before integrating and applying conditions.",
        "topics": {"differential_equations"},
        "regex": re.compile(r"separate variables|differential equation|condition|constant|integrat", re.I),
    },
    {
        "pattern_id": "mechanics_sign_convention",
        "summary": "Choose directions and keep signed quantities consistent.",
        "topics": {"momentum_impulse", "kinematics_constant_acceleration", "work_energy_power"},
        "regex": re.compile(r"momentum|impulse|velocity|acceleration|direction|work|energy|power|resistance", re.I),
    },
)


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
    if question_text_trust in TEXT_REVIEW_ONLY:
        review_reasons.append(f"question_text_trust_{question_text_trust}")
    if not topic:
        review_reasons.append("missing_topic")
    if topic_confidence and topic_confidence not in HIGH_OR_MEDIUM:
        review_reasons.append(f"topic_confidence_{topic_confidence}")
    if text_only_status not in TEXT_READY_OR_REVIEW:
        review_reasons.append(f"text_only_status_{text_only_status or 'missing'}")
    if text_only_status == "fail":
        review_reasons.append("text_only_status_fail")
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


def confidence_for_source_count(count: int, trusted_count: int = 0) -> str:
    if trusted_count >= 3:
        return "high"
    if trusted_count >= 1 or count >= 5:
        return "medium"
    return "low"


def skill_target_review_status(eligibility_counts: dict[str, int]) -> str:
    if eligibility_counts.get("auto_eligible", 0) >= 2:
        return "teacher_reviewed"
    return "needs_review"


def mark_scheme_patterns(topic: str, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    patterns: list[dict[str, Any]] = []
    for rule in MARK_SCHEME_PATTERN_RULES:
        if topic not in rule["topics"]:
            continue
        matched_ids = sorted({
            record_id(record)
            for record in records
            if rule["regex"].search(non_empty_string(record.get("mark_scheme_text")) or "")
        })
        if matched_ids:
            patterns.append({
                "pattern_id": rule["pattern_id"],
                "summary": rule["summary"],
                "source_question_ids": matched_ids[:8],
                "source_count": len(matched_ids),
            })
    return sorted(patterns, key=lambda item: (-int(item["source_count"]), str(item["pattern_id"])))


def normalize_label(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    normalized = value.lower().replace("_", " ")
    normalized = re.sub(r"[/_-]+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9 ]+", "", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def topic_key(record: dict[str, Any]) -> tuple[str, str] | None:
    topic = non_empty_string(record.get("topic"))
    if topic and topic in SUPPORTED_TOPICS:
        return (paper_family(record), topic)
    return None


def usable_for_curriculum_map(record: dict[str, Any], eligibility: dict[str, Any]) -> bool:
    if eligibility["eligibility"] in {"auto_eligible", "review_only"}:
        return True
    if not topic_key(record):
        return False
    if not non_empty_string(record.get("mark_scheme_text")):
        return False
    notes = as_record(record.get("notes"))
    question_text_trust = non_empty_string(record.get("question_text_trust")) or non_empty_string(notes.get("question_text_trust"))
    mapping_status = non_empty_string(notes.get("mapping_status")) or non_empty_string(record.get("mapping_status"))
    return question_text_trust != "unusable" and mapping_status != "fail"


def p3_region_topic_map() -> dict[str, dict[str, Any]]:
    return {
        region_id: {
            "primary_topic": support["primary_topic"],
            "topics": sorted(support["topics"]),
        }
        for region_id, support in sorted(ACTIVE_P3_REGION_SUPPORT.items())
    }


def build_skill_targets(records: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    target_records: list[tuple[dict[str, Any], dict[str, Any]]] = []
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

        if usable_for_curriculum_map(record, eligibility):
            target_records.append((record, eligibility))
        if eligibility["eligibility"] == "auto_eligible":
            pass
        elif eligibility["eligibility"] == "review_only" and topic in SUPPORTED_TOPICS:
            review_records.append(queue_entry)
        else:
            review_records.append(queue_entry)

    groups: dict[tuple[str, str], list[tuple[dict[str, Any], dict[str, Any]]]] = {}
    for record, eligibility in target_records:
        key = topic_key(record)
        if not key:
            continue
        groups.setdefault(key, []).append((record, eligibility))

    skill_targets = []
    for (paper, topic), grouped_records in sorted(groups.items()):
        topic_template = SUPPORTED_TOPICS[topic]
        ids = [record_id(record) for record, _eligibility in grouped_records]
        unique_ids = sorted(set(ids))
        eligibility_counts = {
            "auto_eligible": sum(1 for _record, eligibility in grouped_records if eligibility["eligibility"] == "auto_eligible"),
            "review_only": sum(1 for _record, eligibility in grouped_records if eligibility["eligibility"] == "review_only"),
            "blocked_review_evidence": sum(1 for _record, eligibility in grouped_records if eligibility["eligibility"] == "blocked"),
        }
        skill_targets.append({
            "skill_target_id": target_id(paper, topic),
            "paper_family": paper,
            "topic": topic,
            "title": topic_template["title"],
            "student_goal": topic_template["student_goal"],
            "micro_skills": topic_template["micro_skills"],
            "likely_prerequisites": topic_template["likely_prerequisites"],
            "common_misconceptions": topic_template["common_misconceptions"],
            "source_question_ids": unique_ids,
            "assessed_by_source_question_ids": unique_ids,
            "source_mark_scheme_patterns": mark_scheme_patterns(topic, [record for record, _eligibility in grouped_records]),
            "source_eligibility_counts": eligibility_counts,
            "confidence": confidence_for_source_count(len(unique_ids), eligibility_counts["auto_eligible"]),
            "review_status": skill_target_review_status(eligibility_counts),
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


def load_json_optional(path: Path | None) -> dict[str, Any]:
    if path is None or not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return sorted({item.strip() for item in value if isinstance(item, str) and item.strip()})


def runtime_reviewed_snippets(snippets_path: Path) -> list[dict[str, Any]]:
    data = load_json_optional(snippets_path)
    snippets = data.get("snippets")
    if not isinstance(snippets, list):
        return []
    return [
        snippet for snippet in snippets
        if isinstance(snippet, dict) and snippet.get("review_status") in RUNTIME_REVIEW_STATUSES
    ]


def practice_items(generated_practice_path: Path | None) -> list[dict[str, Any]]:
    data = load_json_optional(generated_practice_path)
    items = data.get("items")
    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, dict)]


EXAMPLE_REQUIRED_SNIPPET_TYPES = {"concept", "method", "mistake_repair"}
PRIORITY_REGION_IDS = {"algebra-forge", "logarithm-grove", "trig-observatory"}


def valid_worked_example(value: Any) -> bool:
    record = as_record(value)
    if not record:
        return False
    return (
        bool(non_empty_string(record.get("prompt")))
        and bool(non_empty_string(record.get("answer")))
        and bool(string_list(record.get("steps")))
    )


def worked_example_count(snippet: dict[str, Any]) -> int:
    count = 1 if valid_worked_example(snippet.get("worked_example")) else 0
    worked_examples = snippet.get("worked_examples")
    if isinstance(worked_examples, list):
        count += sum(1 for example in worked_examples if valid_worked_example(example))
    return count


def snippet_coverage(snippets: list[dict[str, Any]]) -> dict[str, Any]:
    snippets_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_SUPPORT}
    quick_checks_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_SUPPORT}
    snippets_with_examples_by_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_SUPPORT}
    method_snippets_missing_examples: list[dict[str, Any]] = []
    guardian_topic_keys: set[tuple[str, str]] = set()
    topic_keys: set[tuple[str, str]] = set()

    for snippet in snippets:
        paper = non_empty_string(snippet.get("paper_family"))
        topics = string_list(snippet.get("topics"))
        region_ids = string_list(snippet.get("region_ids"))
        quick_check = as_record(snippet.get("quick_check"))
        guardian = as_record(snippet.get("guardian_readiness"))
        snippet_id = non_empty_string(snippet.get("snippet_id")) or "unknown"
        snippet_type = non_empty_string(snippet.get("snippet_type"))
        example_count = worked_example_count(snippet)
        if paper:
            for topic in topics:
                topic_keys.add((paper, topic))
                if guardian:
                    guardian_topic_keys.add((paper, topic))
        for region_id in region_ids:
            if region_id in snippets_per_region:
                snippets_per_region[region_id] += 1
                if quick_check:
                    quick_checks_per_region[region_id] += 1
                if example_count > 0:
                    snippets_with_examples_by_region[region_id] += 1
        if snippet_type in EXAMPLE_REQUIRED_SNIPPET_TYPES and example_count == 0:
            method_snippets_missing_examples.append({
                "paper_family": paper,
                "region_ids": region_ids,
                "snippet_id": snippet_id,
                "snippet_type": snippet_type,
                "title": non_empty_string(snippet.get("title")) or "",
                "topic": non_empty_string(snippet.get("topic")) or (topics[0] if topics else "unknown"),
            })

    return {
        "snippets_per_region": snippets_per_region,
        "quick_checks_per_region": quick_checks_per_region,
        "snippets_with_examples_by_region": snippets_with_examples_by_region,
        "method_snippets_missing_examples": method_snippets_missing_examples,
        "snippet_topic_keys": topic_keys,
        "guardian_topic_keys": guardian_topic_keys,
    }


def generated_practice_coverage(items: list[dict[str, Any]]) -> dict[str, Any]:
    warmups_per_region = {region_id: 0 for region_id in ACTIVE_P3_REGION_SUPPORT}
    generator_family_counts: dict[str, int] = {}
    verification_failure_counts: dict[str, int] = {}
    warmups_linked_to_examples: list[dict[str, Any]] = []
    warmups_without_example_model: list[str] = []
    practice_topic_keys: set[tuple[str, str]] = set()

    for item in items:
        generator_family = non_empty_string(item.get("generator_family")) or "unknown"
        generator_family_counts[generator_family] = generator_family_counts.get(generator_family, 0) + 1
        verification = as_record(item.get("verification"))
        verification_status = non_empty_string(verification.get("status")) if verification else "missing"
        if verification_status != "pass":
            verification_failure_counts[generator_family] = verification_failure_counts.get(generator_family, 0) + 1

        paper = non_empty_string(item.get("paper_family"))
        topic = non_empty_string(item.get("topic"))
        if paper and topic:
            practice_topic_keys.add((paper, topic))
        practice_id = non_empty_string(item.get("practice_id")) or "unknown"
        source_snippet_id = non_empty_string(item.get("source_snippet_id"))
        example_model_id = non_empty_string(item.get("example_model_id"))
        if source_snippet_id or example_model_id:
            warmups_linked_to_examples.append({
                "example_model_id": example_model_id,
                "practice_id": practice_id,
                "sequence_role": non_empty_string(item.get("sequence_role")),
                "source_snippet_id": source_snippet_id,
            })
        else:
            warmups_without_example_model.append(practice_id)
        sequence_role = non_empty_string(item.get("sequence_role"))
        if item.get("review_status") in RUNTIME_REVIEW_STATUSES and verification_status == "pass" and sequence_role in SEQUENCE_ROLES:
            for region_id in string_list(item.get("region_ids")):
                if region_id in warmups_per_region:
                    warmups_per_region[region_id] += 1

    return {
        "generated_warmups_per_region": warmups_per_region,
        "generator_family_counts": dict(sorted(generator_family_counts.items())),
        "verification_failure_counts": dict(sorted(verification_failure_counts.items())),
        "warmups_linked_to_examples": sorted(warmups_linked_to_examples, key=lambda item: item["practice_id"]),
        "warmups_without_example_model": sorted(warmups_without_example_model),
        "practice_topic_keys": practice_topic_keys,
    }


def build_content_lab_report(
    records: list[dict[str, Any]],
    skill_targets: dict[str, Any],
    review_queue: dict[str, Any],
    snippets_path: Path,
    generated_practice_path: Path | None = None,
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

    snippets = runtime_reviewed_snippets(snippets_path)
    snippet_report = snippet_coverage(snippets)
    practice_report = generated_practice_coverage(practice_items(generated_practice_path))
    reviewed_topic_keys = snippet_report["snippet_topic_keys"]
    practice_topic_keys = practice_report["practice_topic_keys"]
    guardian_topic_keys = snippet_report["guardian_topic_keys"]

    topics_with_skill_targets_but_no_reviewed_snippets = [
        {
            "paper_family": paper,
            "topic": topic,
            "skill_target_ids": sorted(skill_target_ids_by_key[(paper, topic)]),
        }
        for paper, topic in sorted(skill_target_keys)
        if (paper, topic) not in reviewed_topic_keys
    ]

    topics_with_snippets_but_no_warmups = [
        {
            "paper_family": paper,
            "topic": topic,
        }
        for paper, topic in sorted(reviewed_topic_keys)
        if (paper, topic) not in practice_topic_keys
    ]

    topics_with_warmups_but_no_guardian_readiness_metadata = [
        {
            "paper_family": paper,
            "topic": topic,
        }
        for paper, topic in sorted(practice_topic_keys)
        if (paper, topic) not in guardian_topic_keys
    ]

    missing_region_coverage = [
        region_id
        for region_id, count in snippet_report["snippets_per_region"].items()
        if count == 0
    ]

    active_regions = [
        {
            "region_id": region_id,
            "primary_topic": support["primary_topic"],
            "snippets": snippet_report["snippets_per_region"][region_id],
            "snippets_with_examples": snippet_report["snippets_with_examples_by_region"][region_id],
            "quick_checks": snippet_report["quick_checks_per_region"][region_id],
            "generated_warmups": practice_report["generated_warmups_per_region"][region_id],
        }
        for region_id, support in sorted(ACTIVE_P3_REGION_SUPPORT.items())
    ]
    priority_region_example_coverage = [
        {
            "region_id": region_id,
            "snippets": snippet_report["snippets_per_region"][region_id],
            "snippets_with_examples": snippet_report["snippets_with_examples_by_region"][region_id],
            "method_snippets_missing_examples": [
                item["snippet_id"]
                for item in snippet_report["method_snippets_missing_examples"]
                if region_id in item["region_ids"]
            ],
            "warmups": practice_report["generated_warmups_per_region"][region_id],
        }
        for region_id in sorted(PRIORITY_REGION_IDS)
    ]

    return {
        "schema_name": "asterion_content_lab_report",
        "schema_version": 1,
        "generated_by": "tools/content_lab/scripts/build_skill_targets.py",
        "total_records_read": len(records),
        "auto_eligible": eligibility_counts.get("auto_eligible", 0),
        "review_only": eligibility_counts.get("review_only", 0),
        "blocked": eligibility_counts.get("blocked", 0),
        "blocked_or_review_only_source_counts": {
            "blocked": eligibility_counts.get("blocked", 0),
            "review_only": eligibility_counts.get("review_only", 0),
        },
        "active_regions": active_regions,
        "active_region_topic_map": p3_region_topic_map(),
        "snippets_per_region": snippet_report["snippets_per_region"],
        "quick_checks_per_region": snippet_report["quick_checks_per_region"],
        "snippets_with_examples_by_region": snippet_report["snippets_with_examples_by_region"],
        "method_snippets_missing_examples": snippet_report["method_snippets_missing_examples"],
        "generated_warmups_per_region": practice_report["generated_warmups_per_region"],
        "warmups_linked_to_examples": practice_report["warmups_linked_to_examples"],
        "warmups_without_example_model": practice_report["warmups_without_example_model"],
        "priority_region_example_coverage": priority_region_example_coverage,
        "generator_family_counts": practice_report["generator_family_counts"],
        "verification_failure_counts": practice_report["verification_failure_counts"],
        "skill_targets_created_by_paper_family_topic": skill_target_counts,
        "skill_targets_per_topic": skill_target_counts,
        "review_queue_counts_by_reason": review_reason_counts,
        "missing_active_region_snippet_coverage": missing_region_coverage,
        "topics_with_source_records_but_no_skill_targets": topics_with_source_records_but_no_skill_targets,
        "topics_with_no_snippets": topics_with_skill_targets_but_no_reviewed_snippets,
        "topics_with_skill_targets_but_no_reviewed_snippets": topics_with_skill_targets_but_no_reviewed_snippets,
        "topics_with_snippets_but_no_warmups": topics_with_snippets_but_no_warmups,
        "topics_with_warmups_but_no_guardian_readiness_metadata": topics_with_warmups_but_no_guardian_readiness_metadata,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Content Lab skill-target candidates.")
    parser.add_argument("--input", default="public/assets/exam-bank-data/question_bank.json", help="Path to question_bank.json")
    parser.add_argument("--output-dir", default="tools/content_lab/outputs", help="Directory for generated JSON outputs")
    parser.add_argument("--output", help="Path for skill_targets.json; overrides --output-dir")
    parser.add_argument("--review-output", help="Path for review_queue.json; overrides --output-dir")
    parser.add_argument("--report-output", help="Path for content_lab_report.json; overrides --output-dir")
    parser.add_argument("--snippets", default="public/data/teaching_snippets.json", help="Path to reviewed teaching snippets")
    parser.add_argument("--generated-practice", default="tools/content_lab/outputs/generated_practice_bank.json", help="Path to generated practice output for coverage reporting")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    snippets_path = Path(args.snippets)
    output_path = Path(args.output) if args.output else output_dir / "skill_targets.json"
    review_output_path = Path(args.review_output) if args.review_output else output_dir / "review_queue.json"
    report_output_path = Path(args.report_output) if args.report_output else output_dir / "content_lab_report.json"
    generated_practice_path = Path(args.generated_practice) if args.generated_practice else None
    records = load_question_records(input_path)
    skill_targets, review_queue = build_skill_targets(records)
    report = build_content_lab_report(records, skill_targets, review_queue, snippets_path, generated_practice_path)

    write_json(output_path, skill_targets)
    write_json(review_output_path, review_queue)
    write_json(report_output_path, report)

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

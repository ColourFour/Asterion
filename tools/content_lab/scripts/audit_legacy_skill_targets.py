#!/usr/bin/env python3
"""Audit and optionally contain legacy Content Lab skill_target_id values.

Reviewed P3 skill-map IDs are required before support content can become future
skill-level mastery or generation evidence. Legacy IDs may remain as diagnostic
metadata, but unresolved IDs must be explicit and must not be counted as ready.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from p3_skill_contract import load_p3_skill_map, p3_skill_ids_from_skill_map


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_GENERATED_PRACTICE = REPO_ROOT / "public/data/generated_practice_bank.json"
DEFAULT_SNIPPETS = REPO_ROOT / "public/data/teaching_snippets.json"
DEFAULT_JSON_OUTPUT = REPO_ROOT / "tools/content_lab/reports/legacy_skill_target_audit.json"
DEFAULT_MARKDOWN_OUTPUT = REPO_ROOT / "tools/content_lab/reports/legacy_skill_target_audit.md"

RESOLVED_STATUS = "reviewed_p3_skill_map_id"
UNRESOLVED_STATUS = "legacy_unresolved"

# These mappings are deliberately artifact-specific. Broad legacy labels such as
# p3_trigonometry are not mapped globally because they can cover several reviewed
# P3 micro-skills.
GENERATED_PRACTICE_ID_MAPPINGS = {
    "gen_log_equation_basic_0001": "p3_log_exponential_equations",
    "gen_log_equation_basic_0002": "p3_log_exponential_equations",
    "gen_log_equation_basic_0003": "p3_log_exponential_equations",
    "gen_binomial_first_terms_and_coefficient_0001": "p3_alg_binomial_terms_coefficients",
    "gen_binomial_first_terms_and_coefficient_0002": "p3_alg_binomial_terms_coefficients",
    "gen_binomial_first_terms_and_coefficient_0003": "p3_alg_binomial_terms_coefficients",
    "gen_partial_fractions_distinct_linear_0001": "p3_alg_partial_fraction_form",
    "gen_partial_fractions_distinct_linear_0002": "p3_alg_partial_fraction_form",
    "gen_partial_fractions_distinct_linear_0003": "p3_alg_partial_fraction_form",
    "gen_partial_fractions_repeated_linear_0001": "p3_alg_partial_fraction_form",
    "gen_partial_fractions_repeated_linear_0002": "p3_alg_partial_fraction_form",
    "gen_partial_fractions_repeated_linear_0003": "p3_alg_partial_fraction_form",
    "gen_modulus_equation_basic_0001": "p3_alg_modulus_cases",
    "gen_modulus_equation_basic_0002": "p3_alg_modulus_cases",
    "gen_modulus_equation_basic_0003": "p3_alg_modulus_cases",
    "gen_binomial_validity_range_0001": "p3_alg_binomial_validity",
    "gen_binomial_validity_range_0002": "p3_alg_binomial_validity",
    "gen_binomial_validity_range_0003": "p3_alg_binomial_validity",
    "gen_trig_identity_rewrite_basic_0001": "p3_trig_reciprocal_double_angle",
    "gen_trig_identity_rewrite_basic_0002": "p3_trig_identity_selection",
    "gen_trig_identity_rewrite_basic_0003": "p3_trig_reciprocal_double_angle",
    "gen_trig_double_angle_basic_0001": "p3_trig_reciprocal_double_angle",
    "gen_trig_double_angle_basic_0002": "p3_trig_reciprocal_double_angle",
    "gen_trig_double_angle_basic_0003": "p3_trig_reciprocal_double_angle",
    "gen_trig_solve_equation_interval_basic_0001": "p3_trig_equation_interval",
    "gen_trig_solve_equation_interval_basic_0002": "p3_trig_equation_interval",
    "gen_trig_solve_equation_interval_basic_0003": "p3_trig_equation_interval",
    "gen_trig_r_form_basic_0001": "p3_trig_r_form_compound_angles",
    "gen_trig_r_form_basic_0002": "p3_trig_r_form_compound_angles",
    "gen_trig_r_form_basic_0003": "p3_trig_r_form_compound_angles",
}

SNIPPET_ID_MAPPINGS = {
    "p3-algebra-rearrangement-001": ["p3_alg_structure_rearrangement"],
    "p3-binomial-term-001": ["p3_alg_binomial_terms_coefficients"],
    "p3-binomial-validity-range-001": ["p3_alg_binomial_validity"],
    "p3-partial-fractions-form-001": ["p3_alg_partial_fraction_form"],
    "p3-partial-fractions-repeated-linear-001": ["p3_alg_partial_fraction_form"],
    "p3-modulus-cases-001": ["p3_alg_modulus_cases"],
    "p3-polynomial-theorem-001": ["p3_alg_polynomial_remainder_factor"],
    "p3-quadratics-discriminant-001": ["p3_alg_discriminant_root_conditions"],
    "p3-log-exp-convert-001": ["p3_log_convert_forms"],
    "p3-log-laws-001": ["p3_log_laws_equations"],
    "p3-exp-equations-001": ["p3_log_exponential_equations"],
    "p3-log-domain-001": ["p3_log_domain_validation"],
    "p3-log-linearisation-001": ["p3_log_linearisation"],
    "p3-log-invalid-operations-001": ["p3_log_laws_equations"],
    "p3-ln-e-inverse-001": ["p3_log_exponential_equations"],
    "p3-trig-identity-selection-001": ["p3_trig_identity_selection"],
    "p3-trig-interval-001": ["p3_trig_equation_interval"],
    "p3-trig-reciprocal-rform-001": ["p3_trig_r_form_compound_angles", "p3_trig_reciprocal_double_angle"],
    "p3-trig-quadrant-discipline-001": ["p3_trig_quadrant_solutions"],
    "p3-trig-lost-solutions-001": ["p3_trig_equation_interval"],
    "p3-differentiation-method-001": ["p3_diff_method_selection"],
    "p3-differentiation-follow-through-001": ["p3_diff_stationary_tangent_normal"],
    "p3-parametric-derivative-001": ["p3_diff_parametric_gradients"],
    "p3-integration-method-choice-001": ["p3_int_method_choice"],
    "p3-integration-parts-substitution-001": ["p3_int_parts_substitution"],
    "p3-complex-form-001": ["p3_complex_modulus_argument_form"],
    "p3-complex-locus-argument-001": ["p3_complex_argand_loci_regions"],
    "p3-differential-separation-001": ["p3_de_separation_setup"],
    "p3-differential-initial-condition-001": ["p3_de_initial_condition"],
    "p3-numerical-method-evidence-001": ["p3_num_sign_change_graph_evidence"],
    "p3-iteration-formula-discipline-001": ["p3_num_iteration_formula"],
    "p3-vectors-lines-001": ["p3_vec_line_equations_intersections"],
    "p3-vectors-scalar-product-001": ["p3_vec_scalar_product_angles"],
}

QUICK_CHECK_ID_MAPPINGS = {
    "p3-trig-reciprocal-rform-001-qc": "p3_trig_r_form_compound_angles",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def non_empty_string(value: Any) -> str | None:
    return value.strip() if isinstance(value, str) and value.strip() else None


def string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def unique_preserving_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            result.append(value)
            seen.add(value)
    return result


def region_key(record: dict[str, Any]) -> str:
    return ",".join(string_list(record.get("region_ids"))) or "(none)"


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def add_legacy_marker(record: dict[str, Any], legacy_id: str) -> None:
    legacy_ids = unique_preserving_order(string_list(record.get("legacy_skill_target_ids")) + [legacy_id])
    record["legacy_skill_target_ids"] = legacy_ids


def audit_entry(
    *,
    file_path: Path,
    region: str,
    legacy_skill_target_id: str,
    item_id: str,
    field: str,
    proposed_mapping: str | list[str] | None,
) -> dict[str, Any]:
    return {
        "file": display_path(file_path),
        "field": field,
        "region": region,
        "legacy_skill_target_id": legacy_skill_target_id,
        "item_id": item_id,
        "proposed_mapping": proposed_mapping,
        "resolution_status": RESOLVED_STATUS if proposed_mapping else UNRESOLVED_STATUS,
    }


def update_skill_list(values: list[str], mapping: list[str], legacy_id: str) -> list[str]:
    next_values: list[str] = []
    for value in values:
        if value == legacy_id:
            next_values.extend(mapping)
        else:
            next_values.append(value)
    return unique_preserving_order(next_values)


def audit_generated_practice(path: Path, valid_skill_ids: set[str], *, apply: bool) -> tuple[list[dict[str, Any]], bool]:
    data = load_json(path)
    items = data.get("items") if isinstance(data, dict) else []
    entries: list[dict[str, Any]] = []
    changed = False
    if not isinstance(items, list):
        return entries, changed

    for item in items:
        if not isinstance(item, dict):
            continue
        practice_id = non_empty_string(item.get("practice_id")) or "(missing practice_id)"
        skill_id = non_empty_string(item.get("skill_target_id"))
        legacy_marker = non_empty_string(item.get("legacy_skill_target_id"))
        if legacy_marker and skill_id and legacy_marker != skill_id:
            entries.append(audit_entry(
                file_path=path,
                region=region_key(item),
                legacy_skill_target_id=legacy_marker,
                item_id=practice_id,
                field="legacy_skill_target_id",
                proposed_mapping=skill_id if skill_id in valid_skill_ids else None,
            ))
        if not skill_id or skill_id in valid_skill_ids:
            continue
        proposed = GENERATED_PRACTICE_ID_MAPPINGS.get(practice_id)
        entries.append(audit_entry(
            file_path=path,
            region=region_key(item),
            legacy_skill_target_id=skill_id,
            item_id=practice_id,
            field="skill_target_id",
            proposed_mapping=proposed,
        ))
        if not apply:
            continue
        item["legacy_skill_target_id"] = skill_id
        item["skill_target_resolution_status"] = RESOLVED_STATUS if proposed else UNRESOLVED_STATUS
        if proposed:
            item["skill_target_id"] = proposed
        changed = True

    if changed:
        write_json(path, data)
    return entries, changed


def audit_snippets(path: Path, valid_skill_ids: set[str], *, apply: bool) -> tuple[list[dict[str, Any]], bool]:
    data = load_json(path)
    snippets = data.get("snippets") if isinstance(data, dict) else []
    entries: list[dict[str, Any]] = []
    changed = False
    if not isinstance(snippets, list):
        return entries, changed

    for snippet in snippets:
        if not isinstance(snippet, dict):
            continue
        snippet_id = non_empty_string(snippet.get("snippet_id")) or "(missing snippet_id)"
        proposed = SNIPPET_ID_MAPPINGS.get(snippet_id)
        current_reviewed_ids = unique_preserving_order([
            value
            for value in string_list(snippet.get("source_skill_target_ids")) + string_list(snippet.get("related_skill_targets"))
            if value in valid_skill_ids
        ])
        for legacy_id in string_list(snippet.get("legacy_skill_target_ids")):
            if current_reviewed_ids:
                entries.append(audit_entry(
                    file_path=path,
                    region=region_key(snippet),
                    legacy_skill_target_id=legacy_id,
                    item_id=snippet_id,
                    field="legacy_skill_target_ids",
                    proposed_mapping=current_reviewed_ids,
                ))
        for field in ("source_skill_target_ids", "related_skill_targets"):
            values = string_list(snippet.get(field))
            legacy_values = [value for value in values if value not in valid_skill_ids]
            for legacy_id in legacy_values:
                entries.append(audit_entry(
                    file_path=path,
                    region=region_key(snippet),
                    legacy_skill_target_id=legacy_id,
                    item_id=snippet_id,
                    field=field,
                    proposed_mapping=proposed,
                ))
            if apply and legacy_values:
                for legacy_id in legacy_values:
                    add_legacy_marker(snippet, legacy_id)
                snippet["skill_target_resolution_status"] = RESOLVED_STATUS if proposed else UNRESOLVED_STATUS
                if proposed:
                    next_values = values
                    for legacy_id in legacy_values:
                        next_values = update_skill_list(next_values, proposed, legacy_id)
                    snippet[field] = next_values
                changed = True

        quick_check = snippet.get("quick_check")
        if isinstance(quick_check, dict):
            quick_check_id = non_empty_string(quick_check.get("id"))
            quick_check_skill_id = non_empty_string(quick_check.get("skill_target_id"))
            quick_check_legacy_id = non_empty_string(quick_check.get("legacy_skill_target_id"))
            if quick_check_legacy_id and quick_check_skill_id and quick_check_legacy_id != quick_check_skill_id:
                entries.append(audit_entry(
                    file_path=path,
                    region=region_key(snippet),
                    legacy_skill_target_id=quick_check_legacy_id,
                    item_id=f"{snippet_id}.quick_check",
                    field="quick_check.legacy_skill_target_id",
                    proposed_mapping=quick_check_skill_id if quick_check_skill_id in valid_skill_ids else None,
                ))
            if quick_check_skill_id and quick_check_skill_id not in valid_skill_ids:
                quick_check_mapping = QUICK_CHECK_ID_MAPPINGS.get(quick_check_id or "") or (proposed[0] if proposed and len(proposed) == 1 else None)
                entries.append(audit_entry(
                    file_path=path,
                    region=region_key(snippet),
                    legacy_skill_target_id=quick_check_skill_id,
                    item_id=f"{snippet_id}.quick_check",
                    field="quick_check.skill_target_id",
                    proposed_mapping=quick_check_mapping,
                ))
                if apply:
                    quick_check["legacy_skill_target_id"] = quick_check_skill_id
                    quick_check["skill_target_resolution_status"] = RESOLVED_STATUS if quick_check_mapping else UNRESOLVED_STATUS
                    if quick_check_mapping:
                        quick_check["skill_target_id"] = quick_check_mapping
                    add_legacy_marker(snippet, quick_check_skill_id)
                    snippet["skill_target_resolution_status"] = RESOLVED_STATUS if proposed else UNRESOLVED_STATUS
                    changed = True

    if changed:
        write_json(path, data)
    return entries, changed


def grouped_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    for entry in entries:
        mapping = entry["proposed_mapping"]
        mapping_key = ",".join(mapping) if isinstance(mapping, list) else str(mapping or "")
        key = (entry["file"], entry["region"], entry["legacy_skill_target_id"], mapping_key)
        group = groups.setdefault(key, {
            "file": entry["file"],
            "region": entry["region"],
            "legacy_skill_target_id": entry["legacy_skill_target_id"],
            "proposed_mapping": mapping,
            "resolution_status": entry["resolution_status"],
            "item_count": 0,
            "items": [],
            "fields": [],
        })
        group["item_count"] += 1
        group["items"].append(entry["item_id"])
        group["fields"].append(entry["field"])

    result = []
    for group in groups.values():
        group["items"] = sorted(set(group["items"]))
        group["fields"] = sorted(set(group["fields"]))
        result.append(group)
    return sorted(result, key=lambda row: (
        row["file"],
        row["region"],
        row["legacy_skill_target_id"],
        ",".join(row["proposed_mapping"]) if isinstance(row["proposed_mapping"], list) else str(row["proposed_mapping"] or ""),
    ))


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Legacy skill target audit",
        "",
        "Reviewed `p3_*` skill-map IDs are required for future skill-level mastery and generation workflows. Legacy IDs preserved as `legacy_*` metadata are diagnostic only.",
        "",
        f"- Total legacy references found: {payload['summary']['legacy_reference_count']}",
        f"- Resolved references: {payload['summary']['resolved_reference_count']}",
        f"- Unresolved references: {payload['summary']['unresolved_reference_count']}",
        "",
        "| File | Region | Legacy ID | Count | Proposed reviewed mapping | Status |",
        "| --- | --- | ---: | ---: | --- | --- |",
    ]
    for row in payload["groups"]:
        mapping = row["proposed_mapping"]
        if isinstance(mapping, list):
            mapping_text = ", ".join(mapping)
        else:
            mapping_text = mapping or ""
        lines.append(
            f"| `{row['file']}` | `{row['region']}` | `{row['legacy_skill_target_id']}` | "
            f"{row['item_count']} | `{mapping_text}` | `{row['resolution_status']}` |"
        )
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit legacy generated-practice and snippet skill target IDs.")
    parser.add_argument("--generated-practice", default=str(DEFAULT_GENERATED_PRACTICE))
    parser.add_argument("--snippets", default=str(DEFAULT_SNIPPETS))
    parser.add_argument("--json-output", default=str(DEFAULT_JSON_OUTPUT))
    parser.add_argument("--markdown-output", default=str(DEFAULT_MARKDOWN_OUTPUT))
    parser.add_argument("--apply", action="store_true", help="Rewrite deterministic mappings and mark unresolved legacy IDs.")
    args = parser.parse_args()

    valid_skill_ids = p3_skill_ids_from_skill_map(load_p3_skill_map())
    generated_path = Path(args.generated_practice)
    snippets_path = Path(args.snippets)

    entries: list[dict[str, Any]] = []
    generated_entries, generated_changed = audit_generated_practice(generated_path, valid_skill_ids, apply=args.apply)
    snippet_entries, snippets_changed = audit_snippets(snippets_path, valid_skill_ids, apply=args.apply)
    entries.extend(generated_entries)
    entries.extend(snippet_entries)

    resolved_count = sum(1 for entry in entries if entry["resolution_status"] == RESOLVED_STATUS)
    unresolved_count = sum(1 for entry in entries if entry["resolution_status"] == UNRESOLVED_STATUS)
    by_legacy_id: dict[str, int] = defaultdict(int)
    for entry in entries:
        by_legacy_id[entry["legacy_skill_target_id"]] += 1

    payload = {
        "schema_name": "asterion_legacy_skill_target_audit",
        "schema_version": 1,
        "generated_by": "tools/content_lab/scripts/audit_legacy_skill_targets.py",
        "applied": bool(args.apply),
        "summary": {
            "legacy_reference_count": len(entries),
            "legacy_skill_id_count": len(by_legacy_id),
            "resolved_reference_count": resolved_count,
            "unresolved_reference_count": unresolved_count,
            "changed_files": [
                display_path(path)
                for path, changed in ((generated_path, generated_changed), (snippets_path, snippets_changed))
                if changed
            ],
            "legacy_ids": dict(sorted(by_legacy_id.items())),
        },
        "groups": grouped_entries(entries),
        "entries": sorted(entries, key=lambda row: (row["file"], row["item_id"], row["field"], row["legacy_skill_target_id"])),
    }

    write_json(Path(args.json_output), payload)
    write_markdown(Path(args.markdown_output), payload)
    print(
        f"Audited {len(entries)} legacy skill target reference(s): "
        f"{resolved_count} resolved, {unresolved_count} unresolved."
    )
    if args.apply:
        print("Applied deterministic mappings and legacy/unresolved markers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

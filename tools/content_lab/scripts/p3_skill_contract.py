"""Shared P3 region, topic, and skill validation for Content Lab scripts.

The Python contract reads the reviewed P3 skill map directly so reporting and
generation checks stay aligned with the runtime TypeScript contract.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SKILL_MAP = REPO_ROOT / "tools/content_lab/skill_maps/caie_9709_p3_skill_map.json"

P3_TOPIC_ID_TO_REGION_ID = {
    "9709_p3_topic_algebra": "algebra-forge",
    "9709_p3_topic_logarithmic_and_exponential_functions": "logarithm-grove",
    "9709_p3_topic_trigonometry": "trig-observatory",
    "9709_p3_topic_complex_numbers": "complex-harbor",
    "9709_p3_topic_differentiation": "calculus-cliffs",
    "9709_p3_topic_integration": "integration-gardens",
    "9709_p3_topic_vectors": "vector-workshop",
    "9709_p3_topic_numerical_solution_of_equations": "numerical-mines",
    "9709_p3_topic_differential_equations": "differential-shrine",
}

P3_REGION_DISPLAY_NAMES = {
    "algebra-forge": "Algebra Vault",
    "logarithm-grove": "Logarithm Observatory",
    "trig-observatory": "Trigonometry Spire",
    "complex-harbor": "Argand Atrium",
    "calculus-cliffs": "Calculus Cliffs",
    "integration-gardens": "Integral Terraces",
    "vector-workshop": "Vectors Gate",
    "numerical-mines": "Iteration Forge",
    "differential-shrine": "Differential Shrine",
}

PRIORITY_P3_REGION_IDS = {"algebra-forge", "logarithm-grove", "trig-observatory"}


def load_p3_skill_map(path: Path = DEFAULT_SKILL_MAP) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def p3_skill_records(skill_map: dict[str, Any]) -> list[dict[str, Any]]:
    skills = skill_map.get("skills")
    return [skill for skill in skills if isinstance(skill, dict)] if isinstance(skills, list) else []


def p3_region_ids_from_skill_map(skill_map: dict[str, Any]) -> set[str]:
    return {
        str(skill["region_id"])
        for skill in p3_skill_records(skill_map)
        if isinstance(skill.get("region_id"), str) and skill["region_id"].strip()
    }


def p3_syllabus_topics_from_skill_map(skill_map: dict[str, Any]) -> set[str]:
    return {
        str(skill["syllabus_topic"])
        for skill in p3_skill_records(skill_map)
        if isinstance(skill.get("syllabus_topic"), str) and skill["syllabus_topic"].strip()
    }


def p3_skill_ids_from_skill_map(skill_map: dict[str, Any]) -> set[str]:
    return {
        str(skill["skill_id"])
        for skill in p3_skill_records(skill_map)
        if isinstance(skill.get("skill_id"), str) and skill["skill_id"].strip()
    }


def p3_region_id_for_topic_id(topic_id: str | None) -> str | None:
    return P3_TOPIC_ID_TO_REGION_ID.get(topic_id or "")


def require_valid_p3_region_ids(region_ids: list[str], owner: str, errors: list[str], skill_map: dict[str, Any]) -> None:
    allowed = p3_region_ids_from_skill_map(skill_map)
    for region_id in region_ids:
        if region_id not in allowed:
            errors.append(f"{owner} contains unknown P3 region_id {region_id}")


def require_valid_p3_skill_ids(skill_ids: list[str], owner: str, errors: list[str], skill_map: dict[str, Any]) -> None:
    allowed = p3_skill_ids_from_skill_map(skill_map)
    for skill_id in skill_ids:
        if skill_id not in allowed:
            errors.append(f"{owner} contains unknown P3 skill_id {skill_id}")


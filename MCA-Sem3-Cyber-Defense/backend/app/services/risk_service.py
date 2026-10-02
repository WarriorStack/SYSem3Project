"""
Centralized risk-scoring logic so it is never duplicated across routes.

Risk score is a normalized 0-100 value derived from:
  - model confidence
  - attack category base severity weight
  - whether the prediction is malicious at all
"""

from app.models.detection import SeverityLevel


ATTACK_BASE_WEIGHT = {
    "benign": 0,
    "dos": 85,
    "port_scan": 55,
    "brute_force": 65,
    "botnet": 90,
    "web_attack": 75,
}

DEFAULT_ATTACK_WEIGHT = 60


def calculate_risk_score(attack_type: str, confidence: float) -> float:
    base_weight = ATTACK_BASE_WEIGHT.get(
        attack_type.lower(),
        DEFAULT_ATTACK_WEIGHT,
    )

    if attack_type.lower() == "benign":
        return round(base_weight * confidence, 2)

    # Malicious predictions: combine base severity weight with model confidence
    score = base_weight * 0.7 + (confidence * 100) * 0.3

    return round(min(score, 100.0), 2)


def determine_severity(risk_score: float) -> SeverityLevel:
    if risk_score >= 80:
        return SeverityLevel.CRITICAL

    if risk_score >= 60:
        return SeverityLevel.HIGH

    if risk_score >= 30:
        return SeverityLevel.MEDIUM

    return SeverityLevel.LOW
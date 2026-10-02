"""
Seeds reference data: MITRE ATT&CK techniques, threat categories, and
registers the trained ML model(s) found under settings.MODEL_PATH.

Run after migrations:
    python -m scripts.seed_data
"""
import os
import sys

sys.path.insert(0, os.getcwd())

import joblib  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.mitre import MitreTechnique  # noqa: E402
from app.models.model import MLModel, ModelStatus  # noqa: E402
from app.models.threat import Threat  # noqa: E402

MITRE_TECHNIQUES = [
    {"technique_id": "T1498", "name": "Network Denial of Service", "tactic": "Impact",
     "description": "Adversaries may perform network DoS attacks to degrade or block availability."},
    {"technique_id": "T1046", "name": "Network Service Discovery", "tactic": "Discovery",
     "description": "Adversaries may scan for services running on remote hosts, including port scans."},
    {"technique_id": "T1110", "name": "Brute Force", "tactic": "Credential Access",
     "description": "Adversaries may use brute force techniques to gain access to accounts."},
    {"technique_id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control",
     "description": "Adversaries may communicate using application layer protocols for command and control."},
    {"technique_id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access",
     "description": "Adversaries may exploit weaknesses in internet-facing applications."},
]

THREATS = [
    {"name": "Denial of Service", "category": "dos", "severity": "high",
     "description": "Traffic flood intended to exhaust target resources.",
     "mitigation": "Rate limiting, upstream filtering, autoscaling."},
    {"name": "Port Scanning", "category": "port_scan", "severity": "medium",
     "description": "Reconnaissance activity probing for open services.",
     "mitigation": "Network segmentation, IDS alerting, firewall hardening."},
    {"name": "Brute Force Login", "category": "brute_force", "severity": "high",
     "description": "Repeated authentication attempts to guess credentials.",
     "mitigation": "Account lockout policies, MFA, rate limiting."},
    {"name": "Botnet Command & Control", "category": "botnet", "severity": "critical",
     "description": "Compromised hosts communicating with a C2 server.",
     "mitigation": "Egress filtering, DNS monitoring, endpoint detection."},
    {"name": "Web Application Attack", "category": "web_attack", "severity": "high",
     "description": "Exploitation of public-facing web application vulnerabilities.",
     "mitigation": "WAF deployment, input validation, patch management."},
]


def seed_mitre(db) -> None:
    for item in MITRE_TECHNIQUES:
        exists = db.query(MitreTechnique).filter_by(technique_id=item["technique_id"]).first()
        if not exists:
            db.add(MitreTechnique(**item))
    db.commit()
    print(f"Seeded {len(MITRE_TECHNIQUES)} MITRE techniques (skipping existing).")


def seed_threats(db) -> None:
    for item in THREATS:
        exists = db.query(Threat).filter_by(name=item["name"]).first()
        if not exists:
            db.add(Threat(**item))
    db.commit()
    print(f"Seeded {len(THREATS)} threat categories (skipping existing).")


def register_model(db, algorithm: str) -> None:
    artifact_path = os.path.join(settings.MODEL_PATH, f"{algorithm}_threat_classifier.joblib")
    if not os.path.exists(artifact_path):
        print(f"Skipping {algorithm}: artifact not found at {artifact_path}. Train it first.")
        return

    artifact = joblib.load(artifact_path)
    metrics = artifact.get("metrics", {})
    name = f"{algorithm}_threat_classifier"

    existing = db.query(MLModel).filter_by(name=name).first()
    if existing:
        existing.accuracy = metrics.get("accuracy")
        existing.precision = metrics.get("precision")
        existing.recall = metrics.get("recall")
        existing.f1_score = metrics.get("f1_score")
        existing.model_path = artifact_path
    else:
        db.add(
            MLModel(
                name=name,
                algorithm=algorithm,
                version="1.0.0",
                status=ModelStatus.INACTIVE,
                model_path=artifact_path,
                accuracy=metrics.get("accuracy"),
                precision=metrics.get("precision"),
                recall=metrics.get("recall"),
                f1_score=metrics.get("f1_score"),
            )
        )
    db.commit()
    print(f"Registered model metadata for {name}.")


def activate_default_model(db) -> None:
    """Marks the configured ACTIVE_MODEL_NAME as the active model, deactivating others."""
    target = db.query(MLModel).filter_by(name=settings.ACTIVE_MODEL_NAME).first()
    if not target:
        print(f"Cannot activate {settings.ACTIVE_MODEL_NAME}: not registered yet.")
        return
    for m in db.query(MLModel).all():
        m.status = ModelStatus.ACTIVE if m.id == target.id else ModelStatus.INACTIVE
    db.commit()
    print(f"Activated model: {settings.ACTIVE_MODEL_NAME}")


def main() -> None:
    db = SessionLocal()
    try:
        seed_mitre(db)
        seed_threats(db)
        for algo in ["logistic_regression", "random_forest", "xgboost"]:
            register_model(db, algo)
        activate_default_model(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()

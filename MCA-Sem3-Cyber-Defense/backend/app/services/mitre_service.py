"""
Centralized attack-category -> MITRE ATT&CK technique mapping.

This mapping is distinct from, and only loosely related to, the ML model's
raw prediction label - the ML model predicts an attack category, and this
service separately maps that category to a relevant published technique.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.mitre import MitreTechnique

ATTACK_TO_TECHNIQUE = {
    "dos": "T1498",  # Network Denial of Service
    "port_scan": "T1046",  # Network Service Discovery
    "brute_force": "T1110",  # Brute Force
    "botnet": "T1071",  # Application Layer Protocol (C2)
    "web_attack": "T1190",  # Exploit Public-Facing Application
}


def map_attack_to_technique(db: Session, attack_type: str) -> Optional[MitreTechnique]:
    technique_id = ATTACK_TO_TECHNIQUE.get(attack_type.lower())
    if not technique_id:
        return None
    return db.query(MitreTechnique).filter(MitreTechnique.technique_id == technique_id).first()

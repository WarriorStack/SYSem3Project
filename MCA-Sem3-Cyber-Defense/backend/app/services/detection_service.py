from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.detection import Detection, DetectionStatus
from app.schemas.detection import NetworkFlowFeatures
from app.services import mitre_service, ml_service, preprocessing_service, risk_service
from app.services.alert_service import create_alert_for_detection
from app.services.feature_service import features_to_dict

logger = get_logger(__name__)


def _build_explanation(attack_type: str, confidence: float, risk_score: float,
                        feature_importances: Optional[Dict[str, float]]) -> str:
    parts = [
        f"Model predicted '{attack_type}' with {confidence * 100:.1f}% confidence.",
        f"Calculated risk score is {risk_score:.1f}/100 based on attack severity and confidence.",
    ]
    if feature_importances:
        top_features = sorted(feature_importances.items(), key=lambda kv: kv[1], reverse=True)[:3]
        feature_text = ", ".join(f"{name} ({weight:.2f})" for name, weight in top_features)
        parts.append(f"Most influential features for this model: {feature_text}.")
    return " ".join(parts)


def process_single_detection(
    db: Session,
    features: NetworkFlowFeatures,
    requested_model_name: Optional[str],
    user_id: Optional[int],
) -> Detection:
    raw = features_to_dict(features)
    feature_matrix = preprocessing_service.preprocess_records([raw])
    model_record, predictions = ml_service.run_inference(db, feature_matrix, requested_model_name)
    prediction = predictions[0]

    attack_type = prediction.label
    is_malicious = attack_type.lower() != "benign"
    risk_score = risk_service.calculate_risk_score(attack_type, prediction.confidence)
    severity = risk_service.determine_severity(risk_score)
    technique = mitre_service.map_attack_to_technique(db, attack_type)
    explanation = _build_explanation(attack_type, prediction.confidence, risk_score, prediction.feature_importances)

    detection = Detection(
        source_ip=raw.get("source_ip"),
        source_port=raw.get("source_port"),
        destination_ip=raw.get("destination_ip"),
        destination_port=raw.get("destination_port"),
        protocol=raw.get("protocol"),
        prediction="malicious" if is_malicious else "benign",
        attack_type=attack_type,
        confidence=prediction.confidence,
        severity=severity,
        risk_score=risk_score,
        explanation=explanation,
        mitre_technique_id=technique.id if technique else None,
        model_id=model_record.id,
        created_by=user_id,
        status=DetectionStatus.NEW,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    return detection


def process_batch_detections(
    db: Session,
    records: List[NetworkFlowFeatures],
    requested_model_name: Optional[str],
    user_id: Optional[int],
) -> Tuple[List[Detection], List[dict]]:
    results: List[Detection] = []
    errors: List[dict] = []
    for idx, record in enumerate(records):
        try:
            detection = process_single_detection(db, record, requested_model_name, user_id)
            results.append(detection)
        except Exception as exc:  # noqa: BLE001
            logger.error("Batch detection failed for record %s: %s", idx, exc)
            errors.append({"index": idx, "error": str(exc)})
    return results, errors


def maybe_create_alert(db: Session, detection: Detection):
    return create_alert_for_detection(db, detection)

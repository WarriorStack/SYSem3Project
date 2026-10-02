from datetime import datetime, timezone
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertStatus
from app.models.detection import Detection, SeverityLevel

# Business rule: only create an alert automatically when the detection is
# malicious AND its severity meets at least MEDIUM.
ALERT_WORTHY_SEVERITIES = {SeverityLevel.MEDIUM, SeverityLevel.HIGH, SeverityLevel.CRITICAL}


def should_create_alert(detection: Detection) -> bool:
    return detection.prediction == "malicious" and detection.severity in ALERT_WORTHY_SEVERITIES


def create_alert_for_detection(db: Session, detection: Detection) -> Optional[Alert]:
    # Avoid duplicate alerts for the same detection
    existing = db.query(Alert).filter(Alert.detection_id == detection.id).first()
    if existing:
        return existing

    if not should_create_alert(detection):
        return None

    alert = Alert(
        detection_id=detection.id,
        title=f"{detection.attack_type.replace('_', ' ').title()} detected from {detection.source_ip or 'unknown source'}",
        description=detection.explanation,
        severity=detection.severity,
        risk_score=detection.risk_score,
        status=AlertStatus.OPEN,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def resolve_alert(db: Session, alert: Alert, resolved_by_user_id: int) -> Alert:
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = resolved_by_user_id
    db.commit()
    db.refresh(alert)
    return alert


def get_alert_or_404(db: Session, alert_id: int) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.detection import Detection
from app.models.incident import Incident
from app.services.analytics_service import apply_date_range


def generate_report(
    db: Session,
    start_date: Optional[datetime],
    end_date: Optional[datetime],
    severity: Optional[str],
    attack_type: Optional[str],
) -> dict:
    detection_query = db.query(Detection)
    detection_query = apply_date_range(detection_query, Detection.timestamp, start_date, end_date)
    if severity:
        detection_query = detection_query.filter(Detection.severity == severity)
    if attack_type:
        detection_query = detection_query.filter(Detection.attack_type == attack_type)

    total_detections = detection_query.count()

    severity_rows = (
        detection_query.with_entities(Detection.severity, func.count(Detection.id))
        .group_by(Detection.severity)
        .all()
    )
    attack_rows = (
        detection_query.with_entities(Detection.attack_type, func.count(Detection.id))
        .group_by(Detection.attack_type)
        .all()
    )
    avg_risk = detection_query.with_entities(func.avg(Detection.risk_score)).scalar() or 0.0

    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "severity": severity,
            "attack_type": attack_type,
        },
        "total_detections": total_detections,
        "total_alerts": total_alerts,
        "total_incidents": total_incidents,
        "severity_breakdown": {r[0].value if hasattr(r[0], "value") else str(r[0]): r[1] for r in severity_rows},
        "attack_type_breakdown": {r[0]: r[1] for r in attack_rows},
        "average_risk_score": round(float(avg_risk), 2),
    }

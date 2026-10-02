from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertStatus
from app.models.detection import Detection, SeverityLevel
from app.models.incident import Incident, IncidentStatus


def get_dashboard_summary(db: Session) -> dict:
    total_detections = db.query(func.count(Detection.id)).scalar() or 0

    active_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED]))
        .scalar()
        or 0
    )
    critical_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.severity == SeverityLevel.CRITICAL, Alert.status != AlertStatus.RESOLVED)
        .scalar()
        or 0
    )
    high_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.severity == SeverityLevel.HIGH, Alert.status != AlertStatus.RESOLVED)
        .scalar()
        or 0
    )
    active_incidents = (
        db.query(func.count(Incident.id))
        .filter(Incident.status.notin_([IncidentStatus.RESOLVED, IncidentStatus.CLOSED]))
        .scalar()
        or 0
    )

    avg_risk = db.query(func.avg(Detection.risk_score)).scalar() or 0.0
    max_risk = db.query(func.max(Detection.risk_score)).scalar() or 0.0

    return {
        "total_detections": total_detections,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "high_alerts": high_alerts,
        "active_incidents": active_incidents,
        "average_risk_score": round(float(avg_risk), 2),
        "highest_risk_score": round(float(max_risk), 2),
    }


def get_detection_trends(db: Session, days: int = 14) -> list:
    day_expr = func.date_trunc("day", Detection.timestamp)
    rows = (
        db.query(day_expr.label("day"), func.count(Detection.id), func.avg(Detection.risk_score))
        .group_by(day_expr)
        .order_by(day_expr.desc())
        .limit(days)
        .all()
    )
    points = [
        {
            "date": row[0].date().isoformat() if row[0] else "",
            "count": row[1],
            "average_risk_score": round(float(row[2] or 0), 2),
        }
        for row in rows
    ]
    return list(reversed(points))


def get_attack_distribution(db: Session) -> list:
    rows = (
        db.query(Detection.attack_type, func.count(Detection.id))
        .group_by(Detection.attack_type)
        .order_by(func.count(Detection.id).desc())
        .all()
    )
    total = sum(r[1] for r in rows) or 1
    return [
        {
            "attack_type": row[0],
            "count": row[1],
            "percentage": round((row[1] / total) * 100, 2),
        }
        for row in rows
    ]


def get_analytics_overview(db: Session) -> dict:
    total_detections = db.query(func.count(Detection.id)).scalar() or 0
    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0
    malicious_count = db.query(func.count(Detection.id)).filter(Detection.prediction == "malicious").scalar() or 0
    avg_confidence = db.query(func.avg(Detection.confidence)).scalar() or 0.0
    avg_risk = db.query(func.avg(Detection.risk_score)).scalar() or 0.0

    return {
        "total_detections": total_detections,
        "total_alerts": total_alerts,
        "total_incidents": total_incidents,
        "malicious_ratio": round((malicious_count / total_detections) * 100, 2) if total_detections else 0.0,
        "average_confidence": round(float(avg_confidence), 4),
        "average_risk_score": round(float(avg_risk), 2),
    }


def get_attack_analytics(db: Session) -> dict:
    frequency_rows = (
        db.query(Detection.attack_type, func.count(Detection.id))
        .group_by(Detection.attack_type)
        .order_by(func.count(Detection.id).desc())
        .all()
    )
    severity_rows = db.query(Detection.severity, func.count(Detection.id)).group_by(Detection.severity).all()

    return {
        "frequency": [{"attack_type": r[0], "count": r[1]} for r in frequency_rows],
        "severity_distribution": {r[0].value if hasattr(r[0], "value") else str(r[0]): r[1] for r in severity_rows},
    }


def get_risk_analytics(db: Session, days: int = 14) -> dict:
    day_expr = func.date_trunc("day", Detection.timestamp)
    rows = (
        db.query(day_expr.label("day"), func.avg(Detection.risk_score), func.max(Detection.risk_score))
        .group_by(day_expr)
        .order_by(day_expr.desc())
        .limit(days)
        .all()
    )
    trend = [
        {
            "date": row[0].date().isoformat() if row[0] else "",
            "average_risk_score": round(float(row[1] or 0), 2),
            "max_risk_score": round(float(row[2] or 0), 2),
        }
        for row in rows
    ]
    trend.reverse()
    current_avg = db.query(func.avg(Detection.risk_score)).scalar() or 0.0
    return {"trend": trend, "current_average_risk": round(float(current_avg), 2)}


def apply_date_range(query, model_attr, start_date: Optional[datetime], end_date: Optional[datetime]):
    if start_date:
        query = query.filter(model_attr >= start_date)
    if end_date:
        query = query.filter(model_attr <= end_date)
    return query

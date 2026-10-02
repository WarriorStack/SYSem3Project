from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.incident import Incident, IncidentAlert, IncidentStatus
from app.schemas.incident import IncidentCreateRequest, IncidentUpdateRequest


def get_incident_or_404(db: Session, incident_id: int) -> Incident:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


def _link_alerts(db: Session, incident: Incident, alert_ids: List[int]) -> None:
    if not alert_ids:
        return
    valid_alerts = db.query(Alert.id).filter(Alert.id.in_(alert_ids)).all()
    valid_ids = {a.id for a in valid_alerts}
    missing = set(alert_ids) - valid_ids
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown alert IDs: {sorted(missing)}",
        )
    # Clear existing links, then re-create (simple, predictable behavior)
    db.query(IncidentAlert).filter(IncidentAlert.incident_id == incident.id).delete()
    for alert_id in alert_ids:
        db.add(IncidentAlert(incident_id=incident.id, alert_id=alert_id))


def create_incident(db: Session, payload: IncidentCreateRequest) -> Incident:
    incident = Incident(
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        assigned_to=payload.assigned_to,
        status=IncidentStatus.OPEN,
    )
    db.add(incident)
    db.flush()  # obtain incident.id before linking alerts
    _link_alerts(db, incident, payload.alert_ids)
    db.commit()
    db.refresh(incident)
    return incident


def update_incident(db: Session, incident: Incident, payload: IncidentUpdateRequest) -> Incident:
    update_data = payload.model_dump(exclude_unset=True, exclude={"alert_ids"})
    for field, value in update_data.items():
        setattr(incident, field, value)

    if payload.status == IncidentStatus.RESOLVED and incident.resolved_at is None:
        incident.resolved_at = datetime.now(timezone.utc)

    if payload.alert_ids is not None:
        _link_alerts(db, incident, payload.alert_ids)

    db.commit()
    db.refresh(incident)
    return incident


def get_incident_alert_ids(db: Session, incident_id: int) -> List[int]:
    links = db.query(IncidentAlert.alert_id).filter(IncidentAlert.incident_id == incident_id).all()
    return [l.alert_id for l in links]

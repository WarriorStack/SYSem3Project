from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.incident import Incident
from app.models.user import User
from app.schemas.incident import (
    IncidentCreateRequest,
    IncidentOut,
    IncidentUpdateRequest,
    PaginatedIncidents,
)
from app.services import audit_service, incident_service
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def _to_incident_out(db: Session, incident: Incident) -> IncidentOut:
    data = IncidentOut.model_validate(incident).model_dump()
    data["alert_ids"] = incident_service.get_incident_alert_ids(db, incident.id)
    return IncidentOut(**data)


@router.get("", response_model=PaginatedIncidents)
def list_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    query = query.order_by(Incident.created_at.desc())

    items, total, total_pages = paginate_query(query, page, page_size)
    return PaginatedIncidents(
        items=[_to_incident_out(db, i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = incident_service.create_incident(db, payload)
    audit_service.record_audit_log(db, current_user.id, "INCIDENT_CREATE", "incident", incident.id)
    return _to_incident_out(db, incident)


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    incident = incident_service.get_incident_or_404(db, incident_id)
    return _to_incident_out(db, incident)


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    payload: IncidentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = incident_service.get_incident_or_404(db, incident_id)
    incident = incident_service.update_incident(db, incident, payload)
    audit_service.record_audit_log(db, current_user.id, "INCIDENT_UPDATE", "incident", incident.id)
    return _to_incident_out(db, incident)

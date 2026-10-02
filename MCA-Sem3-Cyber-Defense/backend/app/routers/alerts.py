from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertOut, AlertResolveRequest, AlertUpdateRequest, PaginatedAlerts
from app.services import audit_service
from app.services.alert_service import get_alert_or_404, resolve_alert
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=PaginatedAlerts)
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    query = query.order_by(Alert.created_at.desc())

    items, total, total_pages = paginate_query(query, page, page_size)
    return PaginatedAlerts(
        items=[AlertOut.model_validate(a) for a in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_alert_or_404(db, alert_id)


@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int,
    payload: AlertUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = get_alert_or_404(db, alert_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alert, field, value)
    db.commit()
    db.refresh(alert)

    audit_service.record_audit_log(db, current_user.id, "ALERT_UPDATE", "alert", alert.id)
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert_endpoint(
    alert_id: int,
    payload: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = get_alert_or_404(db, alert_id)
    alert = resolve_alert(db, alert, current_user.id)

    audit_service.record_audit_log(
        db, current_user.id, "ALERT_RESOLVE", "alert", alert.id,
        metadata={"resolution_note": payload.resolution_note} if payload.resolution_note else None,
    )
    return alert

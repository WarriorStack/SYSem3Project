from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.detection import Detection
from app.models.user import User
from app.schemas.detection import (
    DetectionAnalyzeRequest,
    DetectionAnalyzeResponse,
    DetectionBatchRequest,
    DetectionBatchResponse,
    DetectionOut,
    PaginatedDetections,
)
from app.services import audit_service, detection_service, notification_service
from app.utils.pagination import paginate_query
from app.utils.validators import parse_date_param

router = APIRouter(prefix="/api/detection", tags=["Detection"])


@router.post("/analyze", response_model=DetectionAnalyzeResponse, status_code=status.HTTP_201_CREATED)
async def analyze(
    payload: DetectionAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    detection = detection_service.process_single_detection(
        db, payload.features, payload.model_name, current_user.id
    )
    alert = detection_service.maybe_create_alert(db, detection)

    event = notification_service.build_event(
        "detection_created",
        detection_id=detection.id,
        alert_id=alert.id if alert else None,
        severity=detection.severity.value,
        risk_score=detection.risk_score,
        attack_type=detection.attack_type,
        summary=f"{detection.attack_type} detected (risk {detection.risk_score})",
    )
    await notification_service.publish_dashboard_event(event)
    if alert:
        await notification_service.publish_alert_event(event)

    audit_service.record_audit_log(
        db, current_user.id, "DETECTION_ANALYZE", "detection", detection.id
    )

    return DetectionAnalyzeResponse(
        detection=DetectionOut.model_validate(detection),
        alert_created=alert is not None,
        alert_id=alert.id if alert else None,
    )


@router.post("/batch", response_model=DetectionBatchResponse, status_code=status.HTTP_201_CREATED)
async def analyze_batch(
    payload: DetectionBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(payload.records) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch must contain at least one record")

    results, errors = detection_service.process_batch_detections(
        db, payload.records, payload.model_name, current_user.id
    )

    for detection in results:
        alert = detection_service.maybe_create_alert(db, detection)
        event = notification_service.build_event(
            "detection_created",
            detection_id=detection.id,
            alert_id=alert.id if alert else None,
            severity=detection.severity.value,
            risk_score=detection.risk_score,
            attack_type=detection.attack_type,
            summary=f"{detection.attack_type} detected (risk {detection.risk_score})",
        )
        await notification_service.publish_dashboard_event(event)
        if alert:
            await notification_service.publish_alert_event(event)

    audit_service.record_audit_log(
        db, current_user.id, "DETECTION_BATCH", "detection", None,
        metadata={"processed": len(results), "failed": len(errors)},
    )

    return DetectionBatchResponse(
        processed=len(results),
        failed=len(errors),
        results=[DetectionOut.model_validate(d) for d in results],
        errors=errors,
    )


@router.get("", response_model=PaginatedDetections)
def list_detections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    severity: Optional[str] = None,
    attack_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Detection)
    if severity:
        query = query.filter(Detection.severity == severity)
    if attack_type:
        query = query.filter(Detection.attack_type == attack_type)
    if status_filter:
        query = query.filter(Detection.status == status_filter)

    start_dt = parse_date_param(start_date, "start_date")
    end_dt = parse_date_param(end_date, "end_date")
    if start_dt:
        query = query.filter(Detection.timestamp >= start_dt)
    if end_dt:
        query = query.filter(Detection.timestamp <= end_dt)

    query = query.order_by(Detection.timestamp.desc())
    items, total, total_pages = paginate_query(query, page, page_size)

    return PaginatedDetections(
        items=[DetectionOut.model_validate(d) for d in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/{detection_id}", response_model=DetectionOut)
def get_detection(
    detection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detection not found")
    return detection

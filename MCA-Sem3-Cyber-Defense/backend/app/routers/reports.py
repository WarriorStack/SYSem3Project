from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.analytics import ReportResponse
from app.services.report_service import generate_report
from app.utils.validators import parse_date_param

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("", response_model=ReportResponse)
def get_reports(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    severity: Optional[str] = None,
    attack_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_dt = parse_date_param(start_date, "start_date")
    end_dt = parse_date_param(end_date, "end_date")
    return generate_report(db, start_dt, end_dt, severity, attack_type)

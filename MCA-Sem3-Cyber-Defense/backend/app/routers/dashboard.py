from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.analytics import DashboardAttackDistribution, DashboardSummary, DashboardTrends
from app.services import analytics_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_dashboard_summary(db)


@router.get("/trends", response_model=DashboardTrends)
def dashboard_trends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    points = analytics_service.get_detection_trends(db)
    return DashboardTrends(points=points)


@router.get("/attack-distribution", response_model=DashboardAttackDistribution)
def attack_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = analytics_service.get_attack_distribution(db)
    return DashboardAttackDistribution(items=items)

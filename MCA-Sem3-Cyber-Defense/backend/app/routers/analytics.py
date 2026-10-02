from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsAttacks, AnalyticsOverview, AnalyticsRisk
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_analytics_overview(db)


@router.get("/attacks", response_model=AnalyticsAttacks)
def attacks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_attack_analytics(db)


@router.get("/risk", response_model=AnalyticsRisk)
def risk(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_risk_analytics(db)

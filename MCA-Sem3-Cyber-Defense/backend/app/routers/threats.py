from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.threat import Threat
from app.models.user import User
from app.schemas.threat import ThreatOut

router = APIRouter(prefix="/api/threats", tags=["Threats"])


@router.get("", response_model=list[ThreatOut])
def list_threats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Threat).order_by(Threat.name).all()


@router.get("/{threat_id}", response_model=ThreatOut)
def get_threat(threat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    threat = db.query(Threat).filter(Threat.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Threat not found")
    return threat

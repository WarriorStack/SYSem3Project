from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.mitre import MitreTechnique
from app.models.user import User
from app.schemas.mitre import MitreTechniqueOut

router = APIRouter(prefix="/api/mitre", tags=["MITRE ATT&CK"])


@router.get("/techniques", response_model=list[MitreTechniqueOut])
def list_techniques(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MitreTechnique).order_by(MitreTechnique.technique_id).all()


@router.get("/{technique_id}", response_model=MitreTechniqueOut)
def get_technique(
    technique_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    technique = db.query(MitreTechnique).filter(MitreTechnique.technique_id == technique_id).first()
    if not technique:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MITRE technique not found")
    return technique

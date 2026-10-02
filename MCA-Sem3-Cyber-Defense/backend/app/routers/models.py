from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.model import MLModel
from app.models.user import User
from app.schemas.model import MLModelOut

router = APIRouter(prefix="/api/models", tags=["ML Models"])


@router.get("", response_model=list[MLModelOut])
def list_models(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MLModel).order_by(MLModel.created_at.desc()).all()


@router.get("/{model_id}", response_model=MLModelOut)
def get_model(model_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    model_record = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
    return model_record

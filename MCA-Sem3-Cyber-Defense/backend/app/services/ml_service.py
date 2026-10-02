from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.inference.predictor import ModelUnavailableError, Prediction, predict
from app.models.model import MLModel, ModelStatus


def resolve_active_model(db: Session, requested_name: Optional[str] = None) -> MLModel:
    """
    Resolves which registered model record to use for inference. Falls back
    to the single ACTIVE model when no explicit name is requested.
    """
    query = db.query(MLModel)
    if requested_name:
        model_record = query.filter(MLModel.name == requested_name).first()
    else:
        model_record = query.filter(MLModel.status == ModelStatus.ACTIVE).first()

    if not model_record:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No active machine learning model is configured. Contact an administrator.",
        )
    return model_record


def run_inference(db: Session, feature_matrix, requested_name: Optional[str] = None) -> tuple[MLModel, List[Prediction]]:
    model_record = resolve_active_model(db, requested_name)
    try:
        predictions = predict(settings.MODEL_PATH, model_record.name, feature_matrix)
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    return model_record, predictions

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.model import ModelStatus


class MLModelOut(BaseModel):
    id: int
    name: str
    algorithm: str
    version: str
    status: ModelStatus
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    created_at: datetime
    # Note: model_path is intentionally excluded from the public response.

    model_config = ConfigDict(from_attributes=True)

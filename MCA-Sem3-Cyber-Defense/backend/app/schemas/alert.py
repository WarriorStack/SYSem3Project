from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.alert import AlertStatus
from app.models.detection import SeverityLevel


class AlertOut(BaseModel):
    id: int
    detection_id: int
    title: str
    description: Optional[str]
    severity: SeverityLevel
    risk_score: float
    status: AlertStatus
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    resolved_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class AlertUpdateRequest(BaseModel):
    status: Optional[AlertStatus] = None
    description: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = None


class PaginatedAlerts(BaseModel):
    items: List[AlertOut]
    page: int
    page_size: int
    total: int
    total_pages: int

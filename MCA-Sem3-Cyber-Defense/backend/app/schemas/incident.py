from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.detection import SeverityLevel
from app.models.incident import IncidentStatus


class IncidentCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    severity: SeverityLevel
    assigned_to: Optional[int] = None
    alert_ids: List[int] = []


class IncidentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[SeverityLevel] = None
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[int] = None
    alert_ids: Optional[List[int]] = None


class IncidentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    severity: SeverityLevel
    status: IncidentStatus
    assigned_to: Optional[int]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    alert_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedIncidents(BaseModel):
    items: List[IncidentOut]
    page: int
    page_size: int
    total: int
    total_pages: int

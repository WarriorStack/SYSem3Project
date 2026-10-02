from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MitreTechniqueOut(BaseModel):
    id: int
    technique_id: str
    name: str
    description: Optional[str]
    tactic: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from typing import Optional

from pydantic import BaseModel, ConfigDict


class ThreatOut(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    severity: str
    mitigation: Optional[str]

    model_config = ConfigDict(from_attributes=True)

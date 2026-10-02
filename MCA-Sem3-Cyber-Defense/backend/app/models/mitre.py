from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class MitreTechnique(Base):
    __tablename__ = "mitre_techniques"

    id = Column(Integer, primary_key=True, index=True)
    technique_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. T1110
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tactic = Column(String(120), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    detections = relationship("Detection", back_populates="mitre_technique")

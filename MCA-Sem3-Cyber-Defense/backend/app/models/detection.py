from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class SeverityLevel(str, PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DetectionStatus(str, PyEnum):
    NEW = "new"
    REVIEWED = "reviewed"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )

    source_ip = Column(
        String(64),
        nullable=True,
        index=True,
    )

    source_port = Column(
        Integer,
        nullable=True,
    )

    destination_ip = Column(
        String(64),
        nullable=True,
        index=True,
    )

    destination_port = Column(
        Integer,
        nullable=True,
    )

    protocol = Column(
        String(20),
        nullable=True,
    )

    prediction = Column(
        String(20),
        nullable=False,
    )  # "benign" | "malicious"

    attack_type = Column(
        String(100),
        nullable=False,
        index=True,
    )

    confidence = Column(
        Float,
        nullable=False,
    )

    severity = Column(
    SAEnum(
        SeverityLevel,
        values_callable=lambda enum_class: [member.value for member in enum_class],
    ),
    nullable=False,
    index=True,
)

    risk_score = Column(
        Float,
        nullable=False,
        index=True,
    )

    explanation = Column(
        Text,
        nullable=True,
    )

    mitre_technique_id = Column(
        Integer,
        ForeignKey("mitre_techniques.id"),
        nullable=True,
    )

    model_id = Column(
        Integer,
        ForeignKey("models.id"),
        nullable=True,
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    status = Column(
    SAEnum(
        DetectionStatus,
        values_callable=lambda enum_class: [member.value for member in enum_class],
    ),
    nullable=False,
    default=DetectionStatus.NEW,
    index=True,
)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    mitre_technique = relationship(
        "MitreTechnique",
        back_populates="detections",
    )

    model = relationship(
        "MLModel",
        back_populates="detections",
    )

    created_by_user = relationship(
        "User",
        back_populates="detections",
    )

    alert = relationship(
        "Alert",
        back_populates="detection",
        uselist=False,
    )
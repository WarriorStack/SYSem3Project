import enum

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.detection import SeverityLevel


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    detection_id = Column(
        Integer,
        ForeignKey("detections.id"),
        unique=True,
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    severity = Column(
        Enum(
            SeverityLevel,
            name="severitylevel",
            values_callable=lambda enum_cls: [
                member.value for member in enum_cls
            ],
            create_type=False,
        ),
        nullable=False,
        index=True,
    )

    risk_score = Column(Float, nullable=False)

    status = Column(
        Enum(
            AlertStatus,
            name="alertstatus",
            values_callable=lambda enum_cls: [
                member.value for member in enum_cls
            ],
            create_type=False,
        ),
        nullable=False,
        default=AlertStatus.OPEN,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    resolved_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    detection = relationship(
        "Detection",
        back_populates="alert",
    )

    incident_links = relationship(
        "IncidentAlert",
        back_populates="alert",
    )
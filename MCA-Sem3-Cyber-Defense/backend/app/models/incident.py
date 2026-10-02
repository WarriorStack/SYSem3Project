import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.detection import SeverityLevel


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(
        String(255),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

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

    status = Column(
        Enum(
            IncidentStatus,
            name="incidentstatus",
            values_callable=lambda enum_cls: [
                member.value for member in enum_cls
            ],
            create_type=False,
        ),
        nullable=False,
        default=IncidentStatus.OPEN,
        index=True,
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
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

    assignee = relationship(
        "User",
        back_populates="assigned_incidents",
        foreign_keys=[assigned_to],
    )

    alert_links = relationship(
        "IncidentAlert",
        back_populates="incident",
        cascade="all, delete-orphan",
    )


class IncidentAlert(Base):
    """Association table linking incidents to the alerts that compose them."""

    __tablename__ = "incident_alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    incident_id = Column(
        Integer,
        ForeignKey("incidents.id"),
        nullable=False,
        index=True,
    )

    alert_id = Column(
        Integer,
        ForeignKey("alerts.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    incident = relationship(
        "Incident",
        back_populates="alert_links",
    )

    alert = relationship(
        "Alert",
        back_populates="incident_links",
    )
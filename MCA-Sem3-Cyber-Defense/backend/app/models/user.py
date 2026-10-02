import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    ANALYST = "analyst"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
    Enum(
        UserRole,
        name="userrole",
        values_callable=lambda enum_cls: [member.value for member in enum_cls],
        create_type=False,
    ),
    nullable=False,
    default=UserRole.ANALYST,
    index=True,
)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    detections = relationship("Detection", back_populates="created_by_user")
    assigned_incidents = relationship(
        "Incident", back_populates="assignee", foreign_keys="Incident.assigned_to"
    )
    audit_logs = relationship("AuditLog", back_populates="user")

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(120), nullable=False, index=True)  # e.g. "LOGIN", "ALERT_RESOLVE"
    resource = Column(String(80), nullable=False)  # e.g. "alert", "incident", "user"
    resource_id = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    log_metadata = Column(JSON, nullable=True)

    user = relationship("User", back_populates="audit_logs")

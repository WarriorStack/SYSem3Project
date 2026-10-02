from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def record_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> AuditLog:
    """Persist a security-sensitive action to the audit trail. Never include secrets."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=str(resource_id) if resource_id is not None else None,
        log_metadata=metadata or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

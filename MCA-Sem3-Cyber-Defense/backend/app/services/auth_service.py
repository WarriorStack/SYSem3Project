from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.audit_service import record_audit_log


def register_user(db: Session, payload: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.ANALYST,  # Default role; elevated roles require admin action, not self-registration
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_audit_log(db, user_id=user.id, action="REGISTER", resource="user", resource_id=user.id)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    record_audit_log(db, user_id=user.id, action="LOGIN", resource="user", resource_id=user.id)
    return user


def issue_token_for_user(user: User) -> str:
    return create_access_token(subject=str(user.id), role=user.role.value)

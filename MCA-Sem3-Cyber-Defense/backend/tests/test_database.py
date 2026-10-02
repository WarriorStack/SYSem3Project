from app.models.detection import Detection, SeverityLevel
from app.models.alert import Alert, AlertStatus
from app.models.user import User, UserRole
from app.core.security import hash_password


def test_user_email_uniqueness_enforced_at_service_layer(client):
    payload = {"name": "Ann", "email": "unique@example.com", "password": "StrongPass123"}
    r1 = client.post("/api/auth/register", json=payload)
    r2 = client.post("/api/auth/register", json=payload)
    assert r1.status_code == 201
    assert r2.status_code == 409


def test_detection_alert_relationship(db_session):
    user = User(name="U", email="u@example.com", password_hash=hash_password("x"), role=UserRole.ANALYST)
    db_session.add(user)
    db_session.commit()

    detection = Detection(
        prediction="malicious",
        attack_type="dos",
        confidence=0.95,
        severity=SeverityLevel.CRITICAL,
        risk_score=92.0,
        created_by=user.id,
    )
    db_session.add(detection)
    db_session.commit()
    db_session.refresh(detection)

    alert = Alert(
        detection_id=detection.id,
        title="Test alert",
        severity=SeverityLevel.CRITICAL,
        risk_score=92.0,
        status=AlertStatus.OPEN,
    )
    db_session.add(alert)
    db_session.commit()

    db_session.refresh(detection)
    assert detection.alert is not None
    assert detection.alert.title == "Test alert"


def test_password_never_stored_plaintext(db_session):
    user = User(name="U2", email="u2@example.com", password_hash=hash_password("SuperSecret1"), role=UserRole.ANALYST)
    db_session.add(user)
    db_session.commit()
    assert user.password_hash != "SuperSecret1"
    assert user.password_hash.startswith("$2b$")

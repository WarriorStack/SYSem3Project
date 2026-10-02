import os
import sys

sys.path.insert(0, os.getcwd())

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite DB for fast, isolated tests. The application code
# uses portable SQLAlchemy constructs, so it runs against SQLite in tests
# and PostgreSQL in production.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

TEST_MODEL_DIR = os.path.join(os.path.dirname(__file__), "tmp_models")
os.environ["MODEL_PATH"] = TEST_MODEL_DIR

from app.core.database import Base, get_db  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.models.model import MLModel, ModelStatus  # noqa: E402
from app.ml.training.train_model import train_and_save  # noqa: E402

settings.MODEL_PATH = TEST_MODEL_DIR

_TRAINED_ARTIFACT = None


def _ensure_trained_model():
    """Trains a small model once per test session and caches the artifact path."""
    global _TRAINED_ARTIFACT
    if _TRAINED_ARTIFACT is None:
        os.makedirs(TEST_MODEL_DIR, exist_ok=True)
        result = train_and_save(algorithm="xgboost", output_dir=TEST_MODEL_DIR)
        _TRAINED_ARTIFACT = result
    return _TRAINED_ARTIFACT

TEST_ENGINE = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    yield session
    session.close()


def register_and_login(client, email="analyst@example.com", password="StrongPass123"):
    client.post(
        "/api/auth/register",
        json={"name": "Test Analyst", "email": email, "password": password},
    )
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_headers(client):
    return register_and_login(client)


@pytest.fixture()
def active_model(db_session):
    """Ensures a trained model artifact exists and registers/activates it in the DB."""
    _ensure_trained_model()
    model_record = MLModel(
        name="xgboost_threat_classifier",
        algorithm="xgboost",
        version="1.0.0",
        status=ModelStatus.ACTIVE,
        model_path=os.path.join(TEST_MODEL_DIR, "xgboost_threat_classifier.joblib"),
    )
    db_session.add(model_record)
    db_session.commit()
    db_session.refresh(model_record)
    return model_record

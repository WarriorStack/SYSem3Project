# AI-Powered Cyber Defense and Security Analytics Platform — Backend

FastAPI + PostgreSQL + SQLAlchemy + scikit-learn/XGBoost backend implementing
the API contract required by the React/TypeScript frontend (built separately
via Lovable).

## Stack

Python 3.11, FastAPI, PostgreSQL, SQLAlchemy 2.0, Alembic, Pydantic v2,
Pandas, NumPy, Scikit-learn, XGBoost, Joblib, JWT (python-jose), bcrypt
(passlib), WebSockets, Redis (optional pub/sub), Uvicorn.

## 1. Setup

```bash
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET_KEY, etc.
```

### With Docker

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, and the API on `http://localhost:8000`.

## 2. Database migrations

```bash
alembic upgrade head
```

## 3. Train and register an ML model

Training and inference are fully separated — the API never trains a model on
a live request. A bundled synthetic-data bootstrap trainer is included so the
project runs end-to-end without requiring the full CIC-IDS2017/UNSW-NB15
downloads; swap in `--csv path/to/real_dataset.csv` (pre-mapped to the
feature schema in `app/ml/preprocessing/feature_pipeline.py`) for real
training.

```bash
python -m app.ml.training.train_model --algorithm xgboost
python -m app.ml.training.train_model --algorithm random_forest
python -m app.ml.training.train_model --algorithm logistic_regression

# Seed MITRE techniques, threat categories, and register+activate the model:
python -m scripts.seed_data
```

`scripts/seed_data.py` activates the model named by `ACTIVE_MODEL_NAME` in
`.env` (default: `xgboost_threat_classifier`). The detection API returns
`503 Service Unavailable` — never a fabricated result — if no model is active.

## 4. Run the API

```bash
uvicorn app.main:app --reload
```

- Docs: http://localhost:8000/docs
- Base URL: http://localhost:8000/api

## 5. Run tests

```bash
pytest
```

Tests run against an in-memory SQLite database for speed/isolation and train
a small real XGBoost model into `tests/tmp_models/` the first time a test
needs it. Production runs against PostgreSQL.

> Note: `GET /api/dashboard/trends` and `GET /api/analytics/risk` use
> PostgreSQL's `date_trunc`, which SQLite does not support, so those two
> endpoints are exercised manually against Postgres rather than in the
> SQLite-backed test suite.

## 6. Project layout

See `app/` for the modular structure: `core/` (config, db, security,
logging), `models/` (SQLAlchemy ORM), `schemas/` (Pydantic), `routers/`
(FastAPI endpoints), `services/` (business logic), `ml/` (preprocessing,
training, inference), `utils/`.

## 7. API contract

All endpoints are served under `/api` and match the frontend contract
exactly — see the project prompt / `app/main.py` router includes. WebSocket
channels: `/api/ws/alerts`, `/api/ws/dashboard`.

## 8. Security notes

- Passwords hashed with bcrypt, never stored/returned in plaintext.
- JWT-based auth; roles (`analyst`, `admin`) are read from the verified
  token/DB record only — never trusted from client-supplied fields.
- `model_path`, password hashes, and JWT secret are never exposed via the API.
- Audit log entries are written for auth events and sensitive mutations
  (alert resolution, incident changes, profile updates).

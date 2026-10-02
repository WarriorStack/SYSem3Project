"""
Initial database schema.

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# ---------------------------------------------------------------------------
# Alembic revision identifiers
# ---------------------------------------------------------------------------

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


# ---------------------------------------------------------------------------
# PostgreSQL ENUM definitions
#
# IMPORTANT:
# create_type=False prevents SQLAlchemy from trying to automatically create
# these PostgreSQL ENUM types when tables are created.
# ---------------------------------------------------------------------------

user_role_enum = postgresql.ENUM(
    "analyst",
    "admin",
    name="userrole",
    create_type=False,
)

severity_enum = postgresql.ENUM(
    "low",
    "medium",
    "high",
    "critical",
    name="severitylevel",
    create_type=False,
)

detection_status_enum = postgresql.ENUM(
    "new",
    "reviewed",
    "confirmed",
    "false_positive",
    name="detectionstatus",
    create_type=False,
)

alert_status_enum = postgresql.ENUM(
    "open",
    "acknowledged",
    "resolved",
    "dismissed",
    name="alertstatus",
    create_type=False,
)

incident_status_enum = postgresql.ENUM(
    "open",
    "investigating",
    "contained",
    "resolved",
    "closed",
    name="incidentstatus",
    create_type=False,
)

model_status_enum = postgresql.ENUM(
    "active",
    "inactive",
    "training",
    "deprecated",
    name="modelstatus",
    create_type=False,
)


# ---------------------------------------------------------------------------
# Helper: safely create PostgreSQL ENUM types
# ---------------------------------------------------------------------------

def create_enum_type(name: str, values: list[str]) -> None:
    """
    Create a PostgreSQL ENUM type if it does not already exist.

    Using a PostgreSQL DO block makes this migration safe even if the
    migration is retried after a previous partial database operation.
    """

    values_sql = ", ".join(
        "'" + value.replace("'", "''") + "'"
        for value in values
    )

    op.execute(
        sa.text(
            f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = '{name}'
                ) THEN
                    CREATE TYPE {name} AS ENUM ({values_sql});
                END IF;
            END
            $$;
            """
        )
    )


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    """
    Create the initial database schema.
    """

    # -----------------------------------------------------------------------
    # Create ENUM types first
    # -----------------------------------------------------------------------

    create_enum_type(
        "userrole",
        ["analyst", "admin"],
    )

    create_enum_type(
        "severitylevel",
        ["low", "medium", "high", "critical"],
    )

    create_enum_type(
        "detectionstatus",
        ["new", "reviewed", "confirmed", "false_positive"],
    )

    create_enum_type(
        "alertstatus",
        ["open", "acknowledged", "resolved", "dismissed"],
    )

    create_enum_type(
        "incidentstatus",
        [
            "open",
            "investigating",
            "contained",
            "resolved",
            "closed",
        ],
    )

    create_enum_type(
        "modelstatus",
        [
            "active",
            "inactive",
            "training",
            "deprecated",
        ],
    )

    # -----------------------------------------------------------------------
    # USERS
    # -----------------------------------------------------------------------

    op.create_table(
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "name",
            sa.String(120),
            nullable=False,
        ),

        sa.Column(
            "email",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "password_hash",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "role",
            user_role_enum,
            nullable=False,
            server_default="analyst",
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    # -----------------------------------------------------------------------
    # MITRE TECHNIQUES
    # -----------------------------------------------------------------------

    op.create_table(
        "mitre_techniques",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "technique_id",
            sa.String(20),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "tactic",
            sa.String(120),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_mitre_techniques_technique_id",
        "mitre_techniques",
        ["technique_id"],
        unique=True,
    )

    op.create_index(
        "ix_mitre_techniques_tactic",
        "mitre_techniques",
        ["tactic"],
    )

    # -----------------------------------------------------------------------
    # THREATS
    # -----------------------------------------------------------------------

    op.create_table(
        "threats",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "name",
            sa.String(150),
            nullable=False,
        ),

        sa.Column(
            "category",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "severity",
            sa.String(20),
            nullable=False,
            server_default="medium",
        ),

        sa.Column(
            "mitigation",
            sa.Text(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_threats_name",
        "threats",
        ["name"],
    )

    op.create_index(
        "ix_threats_category",
        "threats",
        ["category"],
    )

    # -----------------------------------------------------------------------
    # MODELS
    # -----------------------------------------------------------------------

    op.create_table(
        "models",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "name",
            sa.String(150),
            nullable=False,
        ),

        sa.Column(
            "algorithm",
            sa.String(80),
            nullable=False,
        ),

        sa.Column(
            "version",
            sa.String(30),
            nullable=False,
            server_default="1.0.0",
        ),

        sa.Column(
            "status",
            model_status_enum,
            nullable=False,
            server_default="inactive",
        ),

        sa.Column(
            "model_path",
            sa.String(500),
            nullable=False,
        ),

        sa.Column(
            "accuracy",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "precision",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "recall",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "f1_score",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_models_name",
        "models",
        ["name"],
    )

    op.create_index(
        "ix_models_status",
        "models",
        ["status"],
    )

    # -----------------------------------------------------------------------
    # DETECTIONS
    # -----------------------------------------------------------------------

    op.create_table(
        "detections",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "source_ip",
            sa.String(64),
            nullable=True,
        ),

        sa.Column(
            "source_port",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "destination_ip",
            sa.String(64),
            nullable=True,
        ),

        sa.Column(
            "destination_port",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "protocol",
            sa.String(20),
            nullable=True,
        ),

        sa.Column(
            "prediction",
            sa.String(20),
            nullable=False,
        ),

        sa.Column(
            "attack_type",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "confidence",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "severity",
            severity_enum,
            nullable=False,
        ),

        sa.Column(
            "risk_score",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "explanation",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "mitre_technique_id",
            sa.Integer(),
            sa.ForeignKey("mitre_techniques.id"),
            nullable=True,
        ),

        sa.Column(
            "model_id",
            sa.Integer(),
            sa.ForeignKey("models.id"),
            nullable=True,
        ),

        sa.Column(
            "created_by",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),

        sa.Column(
            "status",
            detection_status_enum,
            nullable=False,
            server_default="new",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_detections_timestamp",
        "detections",
        ["timestamp"],
    )

    op.create_index(
        "ix_detections_source_ip",
        "detections",
        ["source_ip"],
    )

    op.create_index(
        "ix_detections_destination_ip",
        "detections",
        ["destination_ip"],
    )

    op.create_index(
        "ix_detections_attack_type",
        "detections",
        ["attack_type"],
    )

    op.create_index(
        "ix_detections_severity",
        "detections",
        ["severity"],
    )

    op.create_index(
        "ix_detections_risk_score",
        "detections",
        ["risk_score"],
    )

    op.create_index(
        "ix_detections_status",
        "detections",
        ["status"],
    )

    # -----------------------------------------------------------------------
    # ALERTS
    # -----------------------------------------------------------------------

    op.create_table(
        "alerts",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "detection_id",
            sa.Integer(),
            sa.ForeignKey("detections.id"),
            nullable=False,
            unique=True,
        ),

        sa.Column(
            "title",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "severity",
            severity_enum,
            nullable=False,
        ),

        sa.Column(
            "risk_score",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "status",
            alert_status_enum,
            nullable=False,
            server_default="open",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "resolved_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "resolved_by",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_alerts_severity",
        "alerts",
        ["severity"],
    )

    op.create_index(
        "ix_alerts_status",
        "alerts",
        ["status"],
    )

    # -----------------------------------------------------------------------
    # INCIDENTS
    # -----------------------------------------------------------------------

    op.create_table(
        "incidents",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "title",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "severity",
            severity_enum,
            nullable=False,
        ),

        sa.Column(
            "status",
            incident_status_enum,
            nullable=False,
            server_default="open",
        ),

        sa.Column(
            "assigned_to",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "resolved_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_incidents_severity",
        "incidents",
        ["severity"],
    )

    op.create_index(
        "ix_incidents_status",
        "incidents",
        ["status"],
    )

    # -----------------------------------------------------------------------
    # INCIDENT ALERTS
    # -----------------------------------------------------------------------

    op.create_table(
        "incident_alerts",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "incident_id",
            sa.Integer(),
            sa.ForeignKey("incidents.id"),
            nullable=False,
        ),

        sa.Column(
            "alert_id",
            sa.Integer(),
            sa.ForeignKey("alerts.id"),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_incident_alerts_incident_id",
        "incident_alerts",
        ["incident_id"],
    )

    op.create_index(
        "ix_incident_alerts_alert_id",
        "incident_alerts",
        ["alert_id"],
    )

    # -----------------------------------------------------------------------
    # AUDIT LOGS
    # -----------------------------------------------------------------------

    op.create_table(
        "audit_logs",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),

        sa.Column(
            "action",
            sa.String(120),
            nullable=False,
        ),

        sa.Column(
            "resource",
            sa.String(80),
            nullable=False,
        ),

        sa.Column(
            "resource_id",
            sa.String(50),
            nullable=True,
        ),

        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),

        sa.Column(
            "log_metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_audit_logs_user_id",
        "audit_logs",
        ["user_id"],
    )

    op.create_index(
        "ix_audit_logs_action",
        "audit_logs",
        ["action"],
    )

    op.create_index(
        "ix_audit_logs_timestamp",
        "audit_logs",
        ["timestamp"],
    )


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    """
    Remove the complete initial database schema.
    """

    op.drop_table("audit_logs")
    op.drop_table("incident_alerts")
    op.drop_table("incidents")
    op.drop_table("alerts")
    op.drop_table("detections")
    op.drop_table("models")
    op.drop_table("threats")
    op.drop_table("mitre_techniques")
    op.drop_table("users")

    # Drop ENUM types safely.
    op.execute("DROP TYPE IF EXISTS modelstatus")
    op.execute("DROP TYPE IF EXISTS incidentstatus")
    op.execute("DROP TYPE IF EXISTS alertstatus")
    op.execute("DROP TYPE IF EXISTS detectionstatus")
    op.execute("DROP TYPE IF EXISTS severitylevel")
    op.execute("DROP TYPE IF EXISTS userrole")
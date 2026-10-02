import enum

from sqlalchemy import Column, DateTime, Enum, Float, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ModelStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRAINING = "training"
    DEPRECATED = "deprecated"


class MLModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    algorithm = Column(String(80), nullable=False)  # logistic_regression | random_forest | xgboost
    version = Column(String(30), nullable=False, default="1.0.0")
    status = Column(
    Enum(
        ModelStatus,
        name="modelstatus",
        values_callable=lambda enum_cls: [member.value for member in enum_cls],
        create_type=False,
    ),
    nullable=False,
    default=ModelStatus.INACTIVE,
    index=True,
    )
    model_path = Column(String(500), nullable=False)

    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    detections = relationship("Detection", back_populates="model")

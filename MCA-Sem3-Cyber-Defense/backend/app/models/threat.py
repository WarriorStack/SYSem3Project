from sqlalchemy import Column, Integer, String, Text

from app.core.database import Base


class Threat(Base):
    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="medium")
    mitigation = Column(Text, nullable=True)

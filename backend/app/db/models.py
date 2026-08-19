"""SQLAlchemy ORM models. Kept dialect-agnostic (no SQLite-only types) so the
same models work if DATABASE swaps to Postgres later - only the engine URL
in database.py would need to change.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class CheckResult(Base):
    """Stores one completed website check, used both as history and as cache."""

    __tablename__ = "check_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    verdict = Column(String, nullable=False)  # Safe / Suspicious / Dangerous
    breakdown = Column(JSON, nullable=False)  # per-check pass/fail/unknown details
    ai_explanation = Column(Text, nullable=True)
    ai_explanation_available = Column(Integer, nullable=False, default=1)  # 0/1 bool
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

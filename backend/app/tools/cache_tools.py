"""SQLite-backed cache so repeat checks within CACHE_TTL_HOURS skip re-running
every tool + the LLM call entirely.
"""
import os
from datetime import datetime, timedelta, timezone

from app.db.database import SessionLocal
from app.db.models import CheckResult
from app.tools.url_utils import extract_domain

CACHE_TTL_HOURS = float(os.getenv("CACHE_TTL_HOURS", "24"))


def cache_lookup(url: str) -> dict | None:
    """Plain Python function (used internally by the pipeline, not just as an
    agent tool) that returns the most recent cached result for this domain if
    it's within the TTL window, else None.
    """
    domain = extract_domain(url)
    session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)
        row = (
            session.query(CheckResult)
            .filter(CheckResult.domain == domain)
            .filter(CheckResult.created_at >= cutoff)
            .order_by(CheckResult.created_at.desc())
            .first()
        )
        if row is None:
            return None
        return {
            "risk_score": row.risk_score,
            "verdict": row.verdict,
            "breakdown": row.breakdown,
            "ai_explanation": row.ai_explanation,
            "ai_explanation_available": bool(row.ai_explanation_available),
            "checked_at": row.created_at.isoformat(),
        }
    except Exception:  # noqa: BLE001 - cache must never break a check
        return None
    finally:
        session.close()


def cache_save(url: str, result: dict, user_id: int | None = None) -> None:
    """Persists a completed check result. Also serves as the /history data source.

    user_id is optional and defaults to None (anonymous) - passing it is
    purely additive and never changes behavior for callers that omit it.
    """
    domain = extract_domain(url)
    session = SessionLocal()
    try:
        row = CheckResult(
            url=url,
            domain=domain,
            risk_score=result["risk_score"],
            verdict=result["verdict"],
            breakdown=result["breakdown"],
            ai_explanation=result.get("ai_explanation"),
            ai_explanation_available=1 if result.get("ai_explanation_available") else 0,
            user_id=user_id,
        )
        session.add(row)
        session.commit()
    except Exception:  # noqa: BLE001
        session.rollback()
    finally:
        session.close()

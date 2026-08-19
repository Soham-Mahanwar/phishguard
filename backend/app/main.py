import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import init_db, get_session
from app.db.models import CheckResult
from app.agents.pipeline import run_pipeline

app = FastAPI(title="Offline Phishing Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


class CheckRequest(BaseModel):
    url: str


class CheckResponse(BaseModel):
    url: str
    risk_score: float
    verdict: str
    breakdown: dict
    ai_explanation: str | None
    ai_explanation_available: bool
    from_cache: bool


@app.post("/check", response_model=CheckResponse)
def check_url(payload: CheckRequest):
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="url must not be empty")
    try:
        result = run_pipeline(url)
    except Exception as e:  # noqa: BLE001 - pipeline should never crash the API
        raise HTTPException(status_code=500, detail=f"pipeline failed: {e}")

    return CheckResponse(
        url=url,
        risk_score=result["risk_score"],
        verdict=result["verdict"],
        breakdown=result["breakdown"],
        ai_explanation=result.get("ai_explanation"),
        ai_explanation_available=result.get("ai_explanation_available", False),
        from_cache=result.get("from_cache", False),
    )


@app.get("/history")
def get_history(limit: int = 50, session: Session = Depends(get_session)):
    rows = (
        session.query(CheckResult)
        .order_by(CheckResult.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": row.id,
            "url": row.url,
            "domain": row.domain,
            "risk_score": row.risk_score,
            "verdict": row.verdict,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


@app.get("/health")
def health():
    return {"status": "ok"}

import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import init_db, get_session
from app.db.models import CheckResult, UserProfile, BreachSignal, Prediction, ShadowScoreHistory, User
from app.agents.pipeline import run_pipeline
from app.tools.qr_decode_tool import decode_qr_image
from app.tools.text_scan_tool import extract_urls, scan_text_urgency
from app.shadow.pwned_passwords import check_password_breach
from app.shadow.shadow_scoring import compute_shadow_score, shadow_risk_label
from app.shadow.predict_rules import generate_predictions, RULE_BASED_DISCLAIMER
from app.shadow.shadow_explain import generate_shadow_summary
from app.auth import router as auth_router, get_current_user_optional

app = FastAPI(title="Offline Phishing Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.on_event("startup")
def on_startup():
    init_db()


class CheckRequest(BaseModel):
    url: str
    # SHADOW Protect layer: optional predicted threat type, e.g. "phishing",
    # "credential_stuffing", "account_takeover". Nullable/omittable - when
    # absent, /check behaves exactly as it did before this field existed.
    threat_context: str | None = None
    # Optional: associates this /check with a SHADOW user_profile so a
    # threat_context boost can be logged into shadow_score_history.
    user_profile_id: int | None = None


class CheckResponse(BaseModel):
    url: str
    risk_score: float
    verdict: str
    breakdown: dict
    ai_explanation: str | None
    ai_explanation_available: bool
    from_cache: bool
    boosted_signals: list[str] | None = None
    threat_context_applied: str | None = None


@app.post("/check", response_model=CheckResponse)
def check_url(
    payload: CheckRequest,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
):
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="url must not be empty")
    try:
        result = run_pipeline(
            url,
            threat_context=payload.threat_context,
            user_id=current_user.id if current_user else None,
        )
    except Exception as e:  # noqa: BLE001 - pipeline should never crash the API
        raise HTTPException(status_code=500, detail=f"pipeline failed: {e}")

    boosted_signals = result.get("boosted_signals") or []

    # Best-effort logging into shadow_score_history: only when the caller
    # supplied a user_profile_id AND a boost actually happened. Skipped
    # silently (never raises) when there's no clean user association.
    if payload.threat_context and boosted_signals and payload.user_profile_id:
        try:
            session.add(ShadowScoreHistory(
                user_profile_id=payload.user_profile_id,
                score=result["risk_score"],
                note=f"/check boost applied for threat_context={payload.threat_context} "
                     f"(signals: {', '.join(boosted_signals)}) url={url}",
            ))
            session.commit()
        except Exception:  # noqa: BLE001 - logging must never break /check
            session.rollback()

    return CheckResponse(
        url=url,
        risk_score=result["risk_score"],
        verdict=result["verdict"],
        breakdown=result["breakdown"],
        ai_explanation=result.get("ai_explanation"),
        ai_explanation_available=result.get("ai_explanation_available", False),
        from_cache=result.get("from_cache", False),
        boosted_signals=boosted_signals or None,
        threat_context_applied=payload.threat_context if boosted_signals else None,
    )


class TextCheckRequest(BaseModel):
    text: str


@app.post("/check-qr")
async def check_qr(
    file: UploadFile = File(...),
    current_user: User | None = Depends(get_current_user_optional),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="uploaded file is empty")

    decoded = decode_qr_image(image_bytes)
    if decoded.get("error"):
        raise HTTPException(status_code=400, detail=decoded["error"])

    decoded_text = decoded["decoded_text"]
    urls = extract_urls(decoded_text)
    target_url = urls[0] if urls else decoded_text

    try:
        result = run_pipeline(target_url, user_id=current_user.id if current_user else None)
    except Exception as e:  # noqa: BLE001 - pipeline should never crash the API
        raise HTTPException(status_code=500, detail=f"pipeline failed: {e}")

    return {
        "decoded_text": decoded_text,
        "url": target_url,
        "risk_score": result["risk_score"],
        "verdict": result["verdict"],
        "breakdown": result["breakdown"],
        "ai_explanation": result.get("ai_explanation"),
        "ai_explanation_available": result.get("ai_explanation_available", False),
        "from_cache": result.get("from_cache", False),
    }


@app.post("/check-text")
def check_text(
    payload: TextCheckRequest,
    current_user: User | None = Depends(get_current_user_optional),
):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")

    urls = extract_urls(text)
    urgency = scan_text_urgency(text)

    url_results = []
    for u in urls:
        try:
            result = run_pipeline(u, user_id=current_user.id if current_user else None)
        except Exception as e:  # noqa: BLE001 - pipeline should never crash the API
            url_results.append({"url": u, "error": f"pipeline failed: {e}"})
            continue
        url_results.append({
            "url": u,
            "risk_score": result["risk_score"],
            "verdict": result["verdict"],
            "breakdown": result["breakdown"],
            "ai_explanation": result.get("ai_explanation"),
            "ai_explanation_available": result.get("ai_explanation_available", False),
            "from_cache": result.get("from_cache", False),
        })

    return {
        "urls_found": urls,
        "url_results": url_results,
        "text_urgency_keywords_found": urgency["urgency_keywords_found"],
    }


@app.get("/history")
def get_history(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
):
    query = session.query(CheckResult)
    if current_user is not None:
        query = query.filter(CheckResult.user_id == current_user.id)
    rows = (
        query
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



# --- SHADOW module: Map / Predict / Protect --------------------------------

class ShadowMapRequest(BaseModel):
    email: str
    has_2fa: bool
    reuses_password: bool
    has_old_accounts: bool
    password: str | None = None  # used ONLY to hash locally for k-anonymity check; never stored/logged


@app.post("/shadow/map")
def shadow_map(
    payload: ShadowMapRequest,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
):
    email = payload.email.strip()
    if not email:
        raise HTTPException(status_code=400, detail="email must not be empty")

    if current_user is not None:
        # Logged-in users upsert: reuse their most recent profile instead of
        # inserting a new anonymous-style row every time.
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == current_user.id)
            .order_by(UserProfile.created_at.desc())
            .first()
        )
        if profile is not None:
            profile.email = email
            profile.has_2fa = 1 if payload.has_2fa else 0
            profile.reuses_password = 1 if payload.reuses_password else 0
            profile.has_old_accounts = 1 if payload.has_old_accounts else 0
            session.commit()
            session.refresh(profile)
        else:
            profile = UserProfile(
                email=email,
                has_2fa=1 if payload.has_2fa else 0,
                reuses_password=1 if payload.reuses_password else 0,
                has_old_accounts=1 if payload.has_old_accounts else 0,
                user_id=current_user.id,
            )
            session.add(profile)
            session.commit()
            session.refresh(profile)
    else:
        # Anonymous: identical to prior behavior - always insert a new row.
        profile = UserProfile(
            email=email,
            has_2fa=1 if payload.has_2fa else 0,
            reuses_password=1 if payload.reuses_password else 0,
            has_old_accounts=1 if payload.has_old_accounts else 0,
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)

    breach_count = None
    breach_error = None
    if payload.password:
        breach_result = check_password_breach(payload.password)
        breach_count = breach_result["breach_count"]
        breach_error = breach_result["error"]
        session.add(BreachSignal(
            user_profile_id=profile.id,
            password_hash_prefix=breach_result["hash_prefix"],
            breach_count=breach_count,
        ))
        session.commit()
    # payload.password itself is never stored, logged, or referenced again below.

    signals = {
        "breach_count": breach_count,
        "has_2fa": payload.has_2fa,
        "reuses_password": payload.reuses_password,
        "has_old_accounts": payload.has_old_accounts,
    }
    scoring = compute_shadow_score(signals)
    risk_label = shadow_risk_label(scoring["score"])

    session.add(ShadowScoreHistory(
        user_profile_id=profile.id,
        score=scoring["score"],
        note="initial /shadow/map score",
    ))
    session.commit()

    return {
        "user_profile_id": profile.id,
        "email": email,
        "shadow_score": scoring["score"],
        "risk_label": risk_label,
        "contributions": scoring["contributions"],
        "breach_count": breach_count,
        "breach_check_error": breach_error,
        "breach_check_skipped": payload.password is None,
    }


class ShadowPredictRequest(BaseModel):
    user_profile_id: int


@app.post("/shadow/predict")
def shadow_predict(payload: ShadowPredictRequest, session: Session = Depends(get_session)):
    profile = session.query(UserProfile).filter(UserProfile.id == payload.user_profile_id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="user_profile not found")

    latest_breach = (
        session.query(BreachSignal)
        .filter(BreachSignal.user_profile_id == profile.id)
        .order_by(BreachSignal.checked_at.desc())
        .first()
    )
    signals = {
        "breach_count": latest_breach.breach_count if latest_breach else None,
        "has_2fa": bool(profile.has_2fa) if profile.has_2fa is not None else None,
        "reuses_password": bool(profile.reuses_password) if profile.reuses_password is not None else None,
        "has_old_accounts": bool(profile.has_old_accounts) if profile.has_old_accounts is not None else None,
    }

    predictions = generate_predictions(signals)

    stored = []
    for p in predictions:
        row = Prediction(
            user_profile_id=profile.id,
            prediction_text=p["prediction_text"],
            confidence_label=p["confidence_label"],
        )
        session.add(row)
        stored.append(p)
    session.commit()

    return {
        "user_profile_id": profile.id,
        "method": "rule_based",
        "disclaimer": RULE_BASED_DISCLAIMER,
        "predictions": stored,
    }


@app.get("/shadow/summary/{user_profile_id}")
def shadow_summary(user_profile_id: int, session: Session = Depends(get_session)):
    profile = session.query(UserProfile).filter(UserProfile.id == user_profile_id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="user_profile not found")

    latest_breach = (
        session.query(BreachSignal)
        .filter(BreachSignal.user_profile_id == profile.id)
        .order_by(BreachSignal.checked_at.desc())
        .first()
    )
    signals = {
        "breach_count": latest_breach.breach_count if latest_breach else None,
        "has_2fa": bool(profile.has_2fa) if profile.has_2fa is not None else None,
        "reuses_password": bool(profile.reuses_password) if profile.reuses_password is not None else None,
        "has_old_accounts": bool(profile.has_old_accounts) if profile.has_old_accounts is not None else None,
    }
    scoring = compute_shadow_score(signals)
    risk_label = shadow_risk_label(scoring["score"])

    recent_predictions = (
        session.query(Prediction)
        .filter(Prediction.user_profile_id == profile.id)
        .order_by(Prediction.created_at.desc())
        .limit(10)
        .all()
    )
    predictions = [
        {"prediction_text": p.prediction_text, "confidence_label": p.confidence_label}
        for p in recent_predictions
    ] or generate_predictions(signals)

    summary_text, summary_available = generate_shadow_summary(
        signals, scoring["score"], risk_label, predictions
    )

    return {
        "user_profile_id": profile.id,
        "shadow_score": scoring["score"],
        "risk_label": risk_label,
        "ai_summary": summary_text,
        "ai_summary_available": summary_available,
    }


@app.get("/shadow/activity")
def shadow_activity(
    user_profile_id: int | None = None,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Real merged Shadow activity timeline (score-history checkups/boosts +
    predictions), replacing the old generic /history-based feed. Resolves the
    profile from the logged-in user first; falls back to an explicit
    user_profile_id query param for anonymous callers who just ran
    /shadow/map in this session. Returns {"events": []} (not an error) when
    neither resolves.
    """
    profile_id = None
    if current_user is not None:
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == current_user.id)
            .order_by(UserProfile.created_at.desc())
            .first()
        )
        if profile is not None:
            profile_id = profile.id
    elif user_profile_id is not None:
        profile_id = user_profile_id

    if profile_id is None:
        return {"events": []}

    events = []

    score_rows = (
        session.query(ShadowScoreHistory)
        .filter(ShadowScoreHistory.user_profile_id == profile_id)
        .order_by(ShadowScoreHistory.created_at.desc())
        .limit(30)
        .all()
    )
    for row in score_rows:
        note = row.note or ""
        note_lower = note.lower()
        if "boost applied" in note_lower:
            event_type = "threat_blocked"
        elif "initial" in note_lower or "checkup" in note_lower:
            event_type = "checkup"
        else:
            event_type = "checkup"
        events.append({
            "event_type": event_type,
            "description": f"Shadow score {row.score:.0f} - {note}" if note else f"Shadow score updated to {row.score:.0f}",
            "timestamp": row.created_at.isoformat(),
            "meta": {"score": row.score, "note": note},
        })

    prediction_rows = (
        session.query(Prediction)
        .filter(Prediction.user_profile_id == profile_id)
        .order_by(Prediction.created_at.desc())
        .limit(30)
        .all()
    )
    for row in prediction_rows:
        events.append({
            "event_type": "prediction",
            "description": f"{row.prediction_text} ({row.confidence_label} confidence)",
            "timestamp": row.created_at.isoformat(),
            "meta": {"confidence_label": row.confidence_label},
        })

    events.sort(key=lambda e: e["timestamp"], reverse=True)
    return {"events": events[:30]}


@app.get("/health")
def health():
    return {"status": "ok"}

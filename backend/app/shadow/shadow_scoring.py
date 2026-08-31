"""Deterministic weighted point-system for the SHADOW "Shadow Score" (0-100,
higher = more exposed/at-risk). Mirrors the pattern used in app/scoring.py
(WEIGHTS dict of (points, description), plain function building a
contributions list) but is kept in its own module/file since it scores a
different kind of signal (personal digital-hygiene exposure, not a single
URL's phishing risk).
"""
from typing import Any

WEIGHTS = {
    "password_breached": (35, "Password found in known data breaches"),
    "password_breached_many": (15, "Password found in a very large number of breaches (>=100)"),
    "no_2fa": (20, "Two-factor authentication is not enabled"),
    "reuses_password": (20, "Password is reused across multiple accounts"),
    "has_old_accounts": (10, "Old/unused accounts still exist and increase attack surface"),
}


def compute_shadow_score(signals: dict[str, Any]) -> dict:
    """signals: {
        "breach_count": int | None,
        "has_2fa": bool | None,
        "reuses_password": bool | None,
        "has_old_accounts": bool | None,
    }
    Returns {"score": float, "contributions": [{"signal", "points", "reason"}]}
    """
    contributions = []
    total = 0.0

    breach_count = signals.get("breach_count")
    if isinstance(breach_count, (int, float)) and breach_count > 0:
        pts = WEIGHTS["password_breached"][0]
        total += pts
        contributions.append({
            "signal": "password_breached", "points": pts,
            "reason": f"{WEIGHTS['password_breached'][1]} ({int(breach_count)} times)",
        })
        if breach_count >= 100:
            pts2 = WEIGHTS["password_breached_many"][0]
            total += pts2
            contributions.append({
                "signal": "password_breached_many", "points": pts2,
                "reason": WEIGHTS["password_breached_many"][1],
            })

    if signals.get("has_2fa") is False:
        pts = WEIGHTS["no_2fa"][0]
        total += pts
        contributions.append({"signal": "no_2fa", "points": pts, "reason": WEIGHTS["no_2fa"][1]})

    if signals.get("reuses_password") is True:
        pts = WEIGHTS["reuses_password"][0]
        total += pts
        contributions.append({"signal": "reuses_password", "points": pts, "reason": WEIGHTS["reuses_password"][1]})

    if signals.get("has_old_accounts") is True:
        pts = WEIGHTS["has_old_accounts"][0]
        total += pts
        contributions.append({"signal": "has_old_accounts", "points": pts, "reason": WEIGHTS["has_old_accounts"][1]})

    score = max(0.0, min(100.0, total))
    return {"score": score, "contributions": contributions}


def shadow_risk_label(score: float) -> str:
    if score >= 60:
        return "High Exposure"
    if score >= 30:
        return "Moderate Exposure"
    return "Low Exposure"

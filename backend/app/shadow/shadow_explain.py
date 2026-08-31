"""Plain-English "Digital Shadow Summary" generation.

Reuses the exact same client setup, timeout handling, and fallback-on-failure
behavior as app/agents/llm_explain.py (single direct HTTP call to a local
Ollama model, `requests.post(..., timeout=...)` so a slow/unavailable server
fails fast rather than hanging).
"""
import os
import json

import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "10"))

FALLBACK_MESSAGE = "AI summary unavailable, showing raw analysis."

PROMPT_TEMPLATE = """You are a cybersecurity assistant. Based on the following digital-exposure checkup for a user, write a 2-3 sentence plain-English "Digital Shadow Summary" for a non-technical user. Reference the specific findings below, do not invent information not present in the data.

Findings:
- Password breach status: {breach_result}
- Two-factor authentication enabled: {has_2fa}
- Password reused across accounts: {reuses_password}
- Old/unused accounts present: {has_old_accounts}
- Shadow Score: {shadow_score}/100
- Risk label: {risk_label}
- Rule-based predictions: {predictions}

Summary:"""


def _summarize_breach(breach_count: int | None) -> str:
    if breach_count is None:
        return "not checked"
    if breach_count == 0:
        return "not found in known breaches"
    return f"found in {breach_count} known breach(es)"


def build_prompt(signals: dict, shadow_score: float, risk_label: str, predictions: list[dict]) -> str:
    pred_text = "; ".join(p["prediction_text"] for p in predictions) if predictions else "none"
    return PROMPT_TEMPLATE.format(
        breach_result=_summarize_breach(signals.get("breach_count")),
        has_2fa=signals.get("has_2fa"),
        reuses_password=signals.get("reuses_password"),
        has_old_accounts=signals.get("has_old_accounts"),
        shadow_score=round(shadow_score),
        risk_label=risk_label,
        predictions=pred_text,
    )


def generate_shadow_summary(signals: dict, shadow_score: float, risk_label: str, predictions: list[dict]) -> tuple[str, bool]:
    """Returns (summary_text, ai_summary_available)."""
    prompt = build_prompt(signals, shadow_score, risk_label, predictions)

    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2},
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
        summary = data.get("response", "").strip()
        if not summary:
            return FALLBACK_MESSAGE, False
        return summary, True
    except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError):
        return FALLBACK_MESSAGE, False

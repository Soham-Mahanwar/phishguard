"""Single-call AI explanation step.

Replaces the earlier 3-agent CrewAI pipeline (Recon -> Analyst -> Reporter)
with one direct HTTP call to a local Ollama model. All detection and scoring
happens beforehand in deterministic Python (see recon.py and scoring.py) -
the model's only job is to turn already-computed findings into a short,
plain-English explanation.

Using `requests.post(..., timeout=...)` instead of a thread pool means a
slow/unavailable Ollama server fails fast and predictably: the HTTP call
itself is aborted at the OS/socket level after OLLAMA_TIMEOUT_SECONDS,
rather than leaving an orphaned worker thread running in the background
(which is what caused check requests to hang well past the configured
timeout under the previous CrewAI-based design).
"""
import os
import json

import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "10"))

FALLBACK_MESSAGE = "AI explanation unavailable, showing raw analysis."

PROMPT_TEMPLATE = """You are a cybersecurity assistant. Based on the following automated security scan results for the URL "{url}", write a 2-3 sentence plain-English explanation of the risk verdict for a non-technical user. Reference the specific findings below, do not invent information not present in the data.

Findings:
- SSL: {ssl_result}
- Domain age: {whois_result}
- Page analysis: {scraper_result}
- Redirect behavior: {redirect_result}
- Typosquat check: {typosquat_result}
- Computed risk score: {risk_score}/100
- Verdict: {verdict}

Explanation:"""


def _summarize_ssl(ssl_r: dict) -> str:
    if ssl_r.get("error") and not ssl_r.get("https_available"):
        return "unknown (check failed)"
    if not ssl_r.get("https_available"):
        return "no HTTPS available"
    if not ssl_r.get("cert_valid"):
        return f"HTTPS present but certificate invalid ({ssl_r.get('error') or 'untrusted'})"
    return f"valid certificate issued by {ssl_r.get('issuer', 'unknown issuer')}, expires in {ssl_r.get('days_until_expiry')} days"


def _summarize_whois(whois_r: dict) -> str:
    age = whois_r.get("domain_age_days")
    if age in (None, "unknown"):
        return "unknown (WHOIS lookup failed or was redacted)"
    return f"registered {age} days ago via {whois_r.get('registrar', 'unknown registrar')}"


def _summarize_scrape(scrape_r: dict) -> str:
    if scrape_r.get("error"):
        return "unknown (page could not be fetched)"
    parts = []
    if scrape_r.get("has_login_form"):
        parts.append("has a login form" + (" submitting over plain HTTP" if scrape_r.get("form_submits_over_http") else ""))
    if scrape_r.get("has_meta_refresh_redirect"):
        parts.append("uses a meta-refresh auto-redirect")
    if scrape_r.get("urgency_keywords_found"):
        parts.append(f"contains urgency language ({', '.join(scrape_r['urgency_keywords_found'])})")
    if not parts:
        parts.append("no suspicious page content detected")
    return "; ".join(parts)


def _summarize_redirect(redirect_r: dict) -> str:
    if redirect_r.get("error"):
        return "unknown (redirect check failed)"
    if redirect_r.get("final_domain_differs"):
        return f"redirects to a different domain ({redirect_r.get('final_domain')})"
    return "no suspicious redirects"


def _summarize_typosquat(typo_r: dict) -> str:
    if typo_r.get("error"):
        return "unknown (check failed)"
    if typo_r.get("flagged_as_typosquat"):
        return f"closely resembles known brand domain '{typo_r.get('closest_brand')}'"
    return "no typosquat match found"


def build_prompt(url: str, tool_outputs: dict, risk_score: float, verdict: str) -> str:
    return PROMPT_TEMPLATE.format(
        url=url,
        ssl_result=_summarize_ssl(tool_outputs.get("ssl_check", {})),
        whois_result=_summarize_whois(tool_outputs.get("whois", {})),
        scraper_result=_summarize_scrape(tool_outputs.get("page_scrape", {})),
        redirect_result=_summarize_redirect(tool_outputs.get("redirect_chain", {})),
        typosquat_result=_summarize_typosquat(tool_outputs.get("typosquat", {})),
        risk_score=round(risk_score),
        verdict=verdict,
    )


def generate_explanation(url: str, tool_outputs: dict, risk_score: float, verdict: str) -> tuple[str, bool]:
    """Returns (explanation_text, ai_explanation_available)."""
    prompt = build_prompt(url, tool_outputs, risk_score, verdict)

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
        explanation = data.get("response", "").strip()
        if not explanation:
            return FALLBACK_MESSAGE, False
        return explanation, True
    except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError):
        return FALLBACK_MESSAGE, False

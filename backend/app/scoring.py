"""Deterministic weighted risk-scoring formula.

This is intentionally NOT left to the LLM to compute - the Analyst agent
is instructed to use this exact function so the score is reproducible,
auditable, and explainable to judges. The LLM's job is to *interpret* and
*explain* the score, not to invent it.

Each signal contributes points toward a 0-100 risk score (higher = more
risky). A signal that could not be determined ("unknown") contributes 0 -
it is neither rewarded nor penalized, per spec.
"""
from typing import Any

# (max_points, description) - documented here so the weighting is transparent.
WEIGHTS = {
    "no_https": (15, "Site does not support HTTPS at all"),
    "invalid_cert": (20, "HTTPS available but certificate is invalid/expired/self-signed"),
    "domain_very_new": (20, "Domain registered less than 30 days ago"),
    "domain_new": (10, "Domain registered less than 180 days ago"),
    "login_form_over_http": (20, "Login/password form submits over plain HTTP"),
    "urgency_language": (10, "Urgency/pressure language detected on page (max, scales with hits)"),
    "meta_refresh_redirect": (5, "Page uses meta-refresh auto-redirect"),
    "redirect_domain_mismatch": (15, "Final redirect landed on a different domain"),
    "typosquat_match": (25, "Domain is a close Levenshtein match to a known brand domain"),
    "external_scripts_many": (5, "Page loads scripts from several external domains"),
}


def compute_risk_score(signals: dict[str, Any]) -> dict:
    """signals is a dict of booleans/values derived from tool outputs, e.g.:
    {
      "https_available": bool | None,
      "cert_valid": bool | None,
      "domain_age_days": int | "unknown" | None,
      "has_login_form": bool | None,
      "form_submits_over_http": bool | None,
      "urgency_keywords_found": list | None,
      "has_meta_refresh_redirect": bool | None,
      "final_domain_differs": bool | None,
      "flagged_as_typosquat": bool | None,
      "external_script_domains": list | None,
    }
    Returns {"score": float, "contributions": [{"signal", "points", "reason"}]}
    """
    contributions = []
    total = 0.0

    https_available = signals.get("https_available")
    if https_available is False:
        pts = WEIGHTS["no_https"][0]
        total += pts
        contributions.append({"signal": "no_https", "points": pts, "reason": WEIGHTS["no_https"][1]})
    elif https_available is True and signals.get("cert_valid") is False:
        pts = WEIGHTS["invalid_cert"][0]
        total += pts
        contributions.append({"signal": "invalid_cert", "points": pts, "reason": WEIGHTS["invalid_cert"][1]})

    age = signals.get("domain_age_days")
    if isinstance(age, (int, float)):
        if age < 30:
            pts = WEIGHTS["domain_very_new"][0]
            total += pts
            contributions.append({"signal": "domain_very_new", "points": pts, "reason": WEIGHTS["domain_very_new"][1]})
        elif age < 180:
            pts = WEIGHTS["domain_new"][0]
            total += pts
            contributions.append({"signal": "domain_new", "points": pts, "reason": WEIGHTS["domain_new"][1]})

    if signals.get("has_login_form") and signals.get("form_submits_over_http"):
        pts = WEIGHTS["login_form_over_http"][0]
        total += pts
        contributions.append({"signal": "login_form_over_http", "points": pts, "reason": WEIGHTS["login_form_over_http"][1]})

    urgency = signals.get("urgency_keywords_found")
    if isinstance(urgency, list) and urgency:
        max_pts = WEIGHTS["urgency_language"][0]
        pts = min(max_pts, len(urgency) * 3)
        total += pts
        contributions.append({
            "signal": "urgency_language", "points": pts,
            "reason": f"{WEIGHTS['urgency_language'][1]}: {', '.join(urgency)}",
        })

    if signals.get("has_meta_refresh_redirect"):
        pts = WEIGHTS["meta_refresh_redirect"][0]
        total += pts
        contributions.append({"signal": "meta_refresh_redirect", "points": pts, "reason": WEIGHTS["meta_refresh_redirect"][1]})

    if signals.get("final_domain_differs"):
        pts = WEIGHTS["redirect_domain_mismatch"][0]
        total += pts
        contributions.append({"signal": "redirect_domain_mismatch", "points": pts, "reason": WEIGHTS["redirect_domain_mismatch"][1]})

    if signals.get("flagged_as_typosquat"):
        pts = WEIGHTS["typosquat_match"][0]
        total += pts
        closest = signals.get("closest_brand")
        reason = WEIGHTS["typosquat_match"][1]
        if closest:
            reason += f" (closest: {closest})"
        contributions.append({"signal": "typosquat_match", "points": pts, "reason": reason})

    ext_scripts = signals.get("external_script_domains")
    if isinstance(ext_scripts, list) and len(ext_scripts) >= 4:
        pts = WEIGHTS["external_scripts_many"][0]
        total += pts
        contributions.append({"signal": "external_scripts_many", "points": pts, "reason": WEIGHTS["external_scripts_many"][1]})

    score = min(100.0, total)
    return {"score": score, "contributions": contributions}


def verdict_from_score(score: float) -> str:
    if score >= 60:
        return "Dangerous"
    if score >= 30:
        return "Suspicious"
    return "Safe"

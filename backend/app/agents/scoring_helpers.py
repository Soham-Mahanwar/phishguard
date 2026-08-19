"""Flattens raw tool outputs into the deterministic risk score and the
per-check pass/fail/unknown breakdown returned by the API.

No AI/agent framework involved here - this is plain Python using the exact
same weighted formula in scoring.py.
"""
from app.scoring import compute_risk_score, verdict_from_score


def compute_scoring_payload(tool_outputs: dict) -> dict:
    """Flattens tool outputs into the signal dict compute_risk_score expects."""
    ssl_r = tool_outputs.get("ssl_check", {})
    whois_r = tool_outputs.get("whois", {})
    scrape_r = tool_outputs.get("page_scrape", {})
    redirect_r = tool_outputs.get("redirect_chain", {})
    typo_r = tool_outputs.get("typosquat", {})

    signals = {
        "https_available": ssl_r.get("https_available") if not ssl_r.get("error") or ssl_r.get("https_available") else None,
        "cert_valid": ssl_r.get("cert_valid") if ssl_r.get("https_available") else None,
        "domain_age_days": whois_r.get("domain_age_days") if whois_r.get("domain_age_days") != "unknown" else None,
        "has_login_form": scrape_r.get("has_login_form") if not scrape_r.get("error") else None,
        "form_submits_over_http": scrape_r.get("form_submits_over_http") if not scrape_r.get("error") else None,
        "urgency_keywords_found": scrape_r.get("urgency_keywords_found") if not scrape_r.get("error") else None,
        "has_meta_refresh_redirect": scrape_r.get("has_meta_refresh_redirect") if not scrape_r.get("error") else None,
        "final_domain_differs": redirect_r.get("final_domain_differs") if not redirect_r.get("error") else None,
        "flagged_as_typosquat": typo_r.get("flagged_as_typosquat") if not typo_r.get("error") else None,
        "closest_brand": typo_r.get("closest_brand"),
        "external_script_domains": scrape_r.get("external_script_domains") if not scrape_r.get("error") else None,
    }
    scoring = compute_risk_score(signals)
    scoring["verdict"] = verdict_from_score(scoring["score"])
    return scoring


def build_breakdown(tool_outputs: dict) -> dict:
    """Per-check pass/fail/unknown breakdown for the API response."""
    breakdown = {}

    ssl_r = tool_outputs.get("ssl_check", {})
    if ssl_r.get("error") and not ssl_r.get("https_available"):
        breakdown["ssl_check"] = {"status": "unknown", "details": ssl_r}
    else:
        status = "pass" if ssl_r.get("https_available") and ssl_r.get("cert_valid") else "fail"
        breakdown["ssl_check"] = {"status": status, "details": ssl_r}

    whois_r = tool_outputs.get("whois", {})
    if whois_r.get("domain_age_days") in (None, "unknown"):
        breakdown["whois"] = {"status": "unknown", "details": whois_r}
    else:
        status = "fail" if whois_r["domain_age_days"] < 180 else "pass"
        breakdown["whois"] = {"status": status, "details": whois_r}

    scrape_r = tool_outputs.get("page_scrape", {})
    if scrape_r.get("error"):
        breakdown["page_scrape"] = {"status": "unknown", "details": scrape_r}
    else:
        risky = scrape_r.get("form_submits_over_http") or scrape_r.get("has_meta_refresh_redirect") or scrape_r.get("urgency_keywords_found")
        breakdown["page_scrape"] = {"status": "fail" if risky else "pass", "details": scrape_r}

    redirect_r = tool_outputs.get("redirect_chain", {})
    if redirect_r.get("error"):
        breakdown["redirect_chain"] = {"status": "unknown", "details": redirect_r}
    else:
        breakdown["redirect_chain"] = {
            "status": "fail" if redirect_r.get("final_domain_differs") else "pass",
            "details": redirect_r,
        }

    typo_r = tool_outputs.get("typosquat", {})
    if typo_r.get("error"):
        breakdown["typosquat"] = {"status": "unknown", "details": typo_r}
    else:
        breakdown["typosquat"] = {
            "status": "fail" if typo_r.get("flagged_as_typosquat") else "pass",
            "details": typo_r,
        }

    return breakdown

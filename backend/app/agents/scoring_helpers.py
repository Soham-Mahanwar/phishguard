"""Flattens raw tool outputs into the deterministic risk score and the
per-check pass/fail/unknown breakdown returned by the API.

No AI/agent framework involved here - this is plain Python using the exact
same weighted formula in scoring.py.
"""
from app.scoring import compute_risk_score, verdict_from_score

# SHADOW Protect-layer integration: when a caller supplies `threat_context`
# on /check, certain signal weights are boosted. This dict is applied
# strictly additively/multiplicatively on top of the already-computed
# contribution points - the base compute_risk_score() call and its output
# are completely unchanged when no threat_context is given (default None),
# which is what keeps plain POST /check byte-for-byte identical to before.
THREAT_CONTEXT_BOOSTS = {
    "phishing": {"typosquat_match": 1.2, "redirect_domain_mismatch": 1.2},
    "credential_stuffing": {"login_form_over_http": 1.2, "typosquat_match": 1.15},
    "account_takeover": {"login_form_over_http": 1.25},
}


def compute_scoring_payload(tool_outputs: dict, threat_context: str | None = None) -> dict:
    """Flattens tool outputs into the signal dict compute_risk_score expects.

    threat_context is optional and defaults to None. When None (the default,
    used by every existing caller), behavior is identical to before this
    parameter was added.
    """
    ssl_r = tool_outputs.get("ssl_check", {})
    whois_r = tool_outputs.get("whois", {})
    scrape_r = tool_outputs.get("page_scrape", {})
    redirect_r = tool_outputs.get("redirect_chain", {})
    typo_r = tool_outputs.get("typosquat", {})
    mx_r = tool_outputs.get("mx_check", {})

    signals = {
        # _ssl_check() always returns a definitive True/False for
        # https_available (it defaults to False and every failure path
        # leaves it False; only a successful/invalid-cert HTTPS connection
        # sets it True) - so this is never "unknown" and must not be nulled
        # out just because `error` is also set. Previously this collapsed to
        # None whenever a plain-HTTP-only site's connection attempt failed
        # (https_available=False + error="connection failed: ..."), which
        # silently dropped the "no_https" scoring signal (15 pts) for the
        # single most basic phishing indicator - a site with no HTTPS at all.
        "https_available": ssl_r.get("https_available"),
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
        "days_since_issued": ssl_r.get("days_since_issued") if ssl_r.get("https_available") else None,
        "has_mx_records": mx_r.get("has_mx_records") if not mx_r.get("error") else None,
    }
    scoring = compute_risk_score(signals)

    boosted_signals = []
    if threat_context:
        boost_map = THREAT_CONTEXT_BOOSTS.get(threat_context)
        if boost_map:
            new_total = 0.0
            for contribution in scoring["contributions"]:
                multiplier = boost_map.get(contribution["signal"])
                if multiplier:
                    original_points = contribution["points"]
                    boosted_points = round(original_points * multiplier, 2)
                    contribution["points"] = boosted_points
                    contribution["boosted"] = True
                    contribution["threat_context"] = threat_context
                    boosted_signals.append(contribution["signal"])
                new_total += contribution["points"]
            scoring["score"] = min(100.0, new_total)

    scoring["verdict"] = verdict_from_score(scoring["score"])
    scoring["boosted_signals"] = boosted_signals
    return scoring


def build_breakdown(tool_outputs: dict) -> dict:
    """Per-check pass/fail/unknown breakdown for the API response."""
    breakdown = {}

    ssl_r = tool_outputs.get("ssl_check", {})
    # ssl_check always yields a definitive https_available/cert_valid result
    # (see the https_available comment above) even when `error` is set, so
    # this is a real pass/fail, not "unknown" - reporting "unknown" here
    # previously hid genuine no-HTTPS/invalid-cert failures from the UI.
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

    mx_r = tool_outputs.get("mx_check", {})
    if mx_r.get("has_mx_records") is None:
        breakdown["mx_check"] = {"status": "unknown", "details": mx_r}
    else:
        breakdown["mx_check"] = {
            "status": "fail" if not mx_r.get("has_mx_records") else "pass",
            "details": mx_r,
        }

    return breakdown

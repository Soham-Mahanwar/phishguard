"""Recon step: decides which tools to run and in what order based on early
signals, then actually executes them.

This runs as plain orchestrated Python (each tool already wraps its own
try/except) rather than letting the LLM call tools turn-by-turn, because tool
execution involves real network I/O with hard latency/timeout requirements -
we cannot afford an LLM "deciding" to skip a socket timeout. The Recon
*agent* still makes the meaningful decisions CrewAI expects of it: cache-hit
short-circuiting, and re-prioritizing/flagging when SSL is broken, before the
Analyst agent ever sees the data. Its decisions are logged in
"recon_notes" and handed to the Analyst as part of the crew's shared context.
"""
from app.tools import (
    _ssl_check,
    _whois_lookup,
    _page_scrape,
    _redirect_chain,
    _typosquat_check,
    _mx_check,
    cache_lookup,
)


def run_recon(url: str) -> dict:
    """Returns {"cache_hit": bool, cached fields..., "tool_outputs": {...}, "recon_notes": [...]}"""
    notes = []

    cached = cache_lookup(url)
    if cached is not None:
        notes.append("Cache hit within TTL window - skipping all live tool checks.")
        return {"cache_hit": True, "recon_notes": notes, **cached}

    notes.append("No cache hit - running full tool suite.")

    tool_outputs = {}

    # SSL is checked first: if it's completely broken/absent, we still run every
    # other check (per spec), but we flag it immediately so downstream agents
    # treat it as a priority signal rather than discovering it last.
    ssl_result = _ssl_check(url)
    tool_outputs["ssl_check"] = ssl_result
    if not ssl_result.get("https_available") or ssl_result.get("error"):
        notes.append("PRIORITY FLAG: SSL/HTTPS missing or broken - elevated risk signal noted early.")
    elif ssl_result.get("cert_valid") is False:
        notes.append("PRIORITY FLAG: HTTPS present but certificate invalid.")
    else:
        notes.append("SSL check passed: valid HTTPS certificate found.")

    whois_result = _whois_lookup(url)
    tool_outputs["whois"] = whois_result
    if whois_result.get("error"):
        notes.append("WHOIS lookup failed - domain age signal will be treated as unknown.")

    mx_result = _mx_check(url)
    tool_outputs["mx_check"] = mx_result
    if mx_result.get("has_mx_records") is False:
        notes.append("No MX records found for domain - noted as a mild suspicious signal.")

    scrape_result = _page_scrape(url)
    tool_outputs["page_scrape"] = scrape_result
    if scrape_result.get("error"):
        notes.append("Page scrape failed - content-based signals will be treated as unknown.")

    redirect_result = _redirect_chain(url)
    tool_outputs["redirect_chain"] = redirect_result
    if redirect_result.get("error"):
        notes.append("Redirect chain check failed - treated as unknown.")

    typosquat_result = _typosquat_check(url)
    tool_outputs["typosquat"] = typosquat_result
    if typosquat_result.get("flagged_as_typosquat"):
        notes.append(f"PRIORITY FLAG: domain closely resembles known brand '{typosquat_result.get('closest_brand')}'.")

    return {"cache_hit": False, "recon_notes": notes, "tool_outputs": tool_outputs}

"""Free WHOIS lookup via python-whois - no API key needed.

Domain age is one of the strongest phishing signals: most phishing domains
are registered days or weeks before use.
"""
import socket
import concurrent.futures
from datetime import datetime, timezone

import whois

from app.tools.url_utils import extract_domain

# python-whois opens a raw socket with no built-in timeout, so a slow or
# unresponsive WHOIS server can hang the whole request indefinitely. We run
# the lookup in a short-lived worker thread and give up after this many
# seconds, treating it the same as any other WHOIS failure ("unknown").
WHOIS_TIMEOUT_SECONDS = 6
socket.setdefaulttimeout(WHOIS_TIMEOUT_SECONDS)


def _first_date(value):
    """python-whois sometimes returns a list of dates (multiple records) or a single date."""
    if isinstance(value, list):
        value = value[0] if value else None
    return value


def _whois_lookup(url: str) -> dict:
    domain = extract_domain(url)
    result = {
        "domain_age_days": "unknown",
        "creation_date": "unknown",
        "registrar": "unknown",
        "error": None,
    }
    try:
        # Not using `with ThreadPoolExecutor(...) as executor:` deliberately:
        # the context manager's __exit__ calls shutdown(wait=True), which
        # blocks until the worker thread finishes even if future.result()
        # already raised TimeoutError - defeating the timeout entirely if the
        # underlying socket call ignores it. shutdown(wait=False) lets this
        # function return on schedule; the orphaned thread is daemonized by
        # the executor and will die with the process.
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = executor.submit(whois.whois, domain)
        try:
            w = future.result(timeout=WHOIS_TIMEOUT_SECONDS)
        finally:
            executor.shutdown(wait=False)

        creation = _first_date(w.creation_date)
        if creation:
            if creation.tzinfo is None:
                creation = creation.replace(tzinfo=timezone.utc)
            age_days = (datetime.now(timezone.utc) - creation).days
            result["domain_age_days"] = age_days
            result["creation_date"] = creation.isoformat()
        result["registrar"] = w.registrar or "unknown"
        if not creation and not w.registrar:
            result["error"] = "no whois record found"
    except concurrent.futures.TimeoutError:
        result["error"] = f"whois lookup timed out after {WHOIS_TIMEOUT_SECONDS}s"
    except Exception as e:  # noqa: BLE001 - whois lookups fail often (rate limits, unsupported TLDs)
        result["error"] = f"whois lookup failed: {e}"
    return result

"""Fetches and parses the live page HTML for phishing-relevant signals.

Uses requests (with a realistic User-Agent and short timeout, since phishing
kits sometimes block bots/scrapers with no UA) + BeautifulSoup for parsing.
"""
import re
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from app.tools.url_utils import normalize_url, extract_domain

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

URGENCY_KEYWORDS = [
    "verify now",
    "account suspended",
    "act immediately",
    "confirm your identity",
    "your account has been limited",
    "unusual activity detected",
    "click here immediately",
    "urgent action required",
    "verify your account",
    "suspended due to",
    "will be closed",
    "final notice",
    "confirm your password",
    "security alert",
]


def _page_scrape(url: str) -> dict:
    url = normalize_url(url)
    page_domain = extract_domain(url)
    result = {
        "title": "unknown",
        "has_login_form": False,
        "form_submits_over_http": False,
        "external_script_domains": [],
        "has_meta_refresh_redirect": False,
        "urgency_keywords_found": [],
        "error": None,
    }
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=5,
            allow_redirects=True,
        )
        soup = BeautifulSoup(resp.text, "html.parser")

        if soup.title and soup.title.string:
            result["title"] = soup.title.string.strip()[:200]

        # Detect login/password forms
        for form in soup.find_all("form"):
            has_password_field = form.find("input", {"type": "password"}) is not None
            if has_password_field:
                result["has_login_form"] = True
                action = form.get("action", "") or ""
                if action.lower().startswith("http://"):
                    result["form_submits_over_http"] = True
                elif not action.lower().startswith("https://"):
                    # relative action - submits to the same scheme as the page itself
                    if resp.url.startswith("http://"):
                        result["form_submits_over_http"] = True

        # External script domains (scripts hosted off the page's own domain)
        script_domains = set()
        for script in soup.find_all("script", src=True):
            src = script["src"]
            parsed = urlparse(src)
            if parsed.netloc and parsed.netloc.lower() != page_domain:
                script_domains.add(parsed.netloc.lower())
        result["external_script_domains"] = sorted(script_domains)

        # Meta refresh redirect detection
        meta_refresh = soup.find("meta", attrs={"http-equiv": re.compile("refresh", re.I)})
        if meta_refresh:
            result["has_meta_refresh_redirect"] = True

        # Urgency language detection
        page_text = soup.get_text(separator=" ").lower()
        found = [kw for kw in URGENCY_KEYWORDS if kw in page_text]
        result["urgency_keywords_found"] = found

    except requests.exceptions.RequestException as e:
        result["error"] = f"page fetch failed: {e}"
    except Exception as e:  # noqa: BLE001
        result["error"] = f"unexpected scraping error: {e}"
    return result

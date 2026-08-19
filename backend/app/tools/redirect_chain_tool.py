"""Follows the HTTP redirect chain and flags domain mismatches at the end.

Phishing pages frequently live behind shorteners or open redirects that land
the user on a completely different domain than the one they typed/clicked.
"""
import requests

from app.tools.url_utils import normalize_url, extract_domain

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

MAX_REDIRECTS = 5


def _redirect_chain(url: str) -> dict:
    original_url = normalize_url(url)
    original_domain = extract_domain(original_url)
    result = {
        "redirect_count": 0,
        "chain": [original_url],
        "final_domain": original_domain,
        "final_domain_differs": False,
        "error": None,
    }
    try:
        session = requests.Session()
        session.max_redirects = MAX_REDIRECTS
        resp = session.get(
            original_url,
            headers={"User-Agent": USER_AGENT},
            timeout=5,
            allow_redirects=True,
        )
        chain = [r.url for r in resp.history] + [resp.url]
        result["chain"] = chain
        result["redirect_count"] = len(resp.history)
        final_domain = extract_domain(resp.url)
        result["final_domain"] = final_domain
        result["final_domain_differs"] = final_domain != original_domain
    except requests.exceptions.TooManyRedirects as e:
        result["error"] = f"too many redirects: {e}"
    except requests.exceptions.RequestException as e:
        result["error"] = f"redirect check failed: {e}"
    except Exception as e:  # noqa: BLE001
        result["error"] = f"unexpected error: {e}"
    return result

"""Raw email/SMS text scanning: extract URLs and check urgency language
directly against the pasted text (no page fetch needed for the urgency
signal - it reuses the same keyword list the page scraper uses).
"""
import re

from app.tools.page_scraper_tool import URGENCY_KEYWORDS

URL_REGEX = re.compile(
    r"""(?xi)
    \b
    (
        (?:https?://|www\.)
        [^\s<>"'\)\]]+
    )
    """
)


def extract_urls(text: str) -> list[str]:
    matches = URL_REGEX.findall(text or "")
    # de-dupe while preserving order, strip common trailing punctuation
    seen = []
    for m in matches:
        cleaned = m.rstrip(".,;:!?")
        if cleaned not in seen:
            seen.append(cleaned)
    return seen


def scan_text_urgency(text: str) -> dict:
    """Runs the same urgency-keyword detector page_scraper_tool uses, directly
    on raw pasted text rather than a scraped page body."""
    lowered = (text or "").lower()
    found = [kw for kw in URGENCY_KEYWORDS if kw in lowered]
    return {"urgency_keywords_found": found}

"""Shared URL parsing helpers used across multiple tools."""
from urllib.parse import urlparse


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.lower().startswith(("http://", "https://")):
        url = "http://" + url
    return url


def extract_domain(url: str) -> str:
    parsed = urlparse(normalize_url(url))
    domain = parsed.netloc.lower()
    if domain.startswith("www."):
        domain = domain[4:]
    # strip port if present
    domain = domain.split(":")[0]
    return domain

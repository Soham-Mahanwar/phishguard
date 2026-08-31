"""MX record lookup via dnspython - no external API needed.

Legitimate domains that send/receive mail almost always have MX records.
A total absence of MX records (while still serving a website) is a mild
but useful phishing signal, especially combined with a very new domain.
"""
import dns.resolver

from app.tools.url_utils import extract_domain

MX_LOOKUP_TIMEOUT_SECONDS = 5


def check_mx_records(domain: str) -> dict:
    result = {
        "has_mx_records": None,
        "mx_hosts": [],
        "error": None,
    }
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = MX_LOOKUP_TIMEOUT_SECONDS
        resolver.lifetime = MX_LOOKUP_TIMEOUT_SECONDS
        answers = resolver.resolve(domain, "MX")
        hosts = sorted(str(r.exchange).rstrip(".") for r in answers)
        result["has_mx_records"] = len(hosts) > 0
        result["mx_hosts"] = hosts
    except dns.resolver.NXDOMAIN:
        result["has_mx_records"] = False
        result["error"] = "domain does not exist"
    except dns.resolver.NoAnswer:
        result["has_mx_records"] = False
    except Exception as e:  # noqa: BLE001 - tool must never crash the pipeline
        result["error"] = f"mx lookup failed: {e}"
    return result


def _mx_check(url: str) -> dict:
    domain = extract_domain(url)
    return check_mx_records(domain)

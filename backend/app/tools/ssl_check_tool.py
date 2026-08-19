"""Checks TLS/SSL certificate health for a domain via raw socket + ssl module.

No external services used - this connects directly to the target host on
port 443 and inspects the certificate the server presents.
"""
import socket
import ssl
from datetime import datetime

from app.tools.url_utils import extract_domain


def _ssl_check(url: str) -> dict:
    domain = extract_domain(url)
    result = {
        "https_available": False,
        "cert_valid": False,
        "issuer": "unknown",
        "expires_at": "unknown",
        "days_until_expiry": None,
        "error": None,
    }
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                result["https_available"] = True
                result["cert_valid"] = True  # wrap_socket would have raised otherwise

                issuer_parts = dict(x[0] for x in cert.get("issuer", []))
                result["issuer"] = issuer_parts.get("organizationName") or issuer_parts.get(
                    "commonName", "unknown"
                )

                not_after = cert.get("notAfter")
                if not_after:
                    expiry_dt = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                    result["expires_at"] = expiry_dt.isoformat()
                    result["days_until_expiry"] = (expiry_dt - datetime.utcnow()).days
    except ssl.SSLCertVerificationError as e:
        # HTTPS is reachable but certificate is invalid/self-signed/expired - a strong phishing signal
        result["https_available"] = True
        result["cert_valid"] = False
        result["error"] = f"certificate verification failed: {e}"
    except (socket.timeout, socket.gaierror, ConnectionRefusedError, OSError) as e:
        result["error"] = f"connection failed: {e}"
    except Exception as e:  # noqa: BLE001 - tool must never crash the pipeline
        result["error"] = f"unexpected error: {e}"
    return result

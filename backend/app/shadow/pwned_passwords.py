"""HaveIBeenPwned Pwned Passwords k-anonymity check.

The raw password is SHA1-hashed locally; only the first 5 hex characters of
the hash ("prefix") are sent to the API. The API returns every suffix that
shares that prefix, and we search the response locally for a match. This
means the full password (and even the full hash) never leaves the machine.
The raw password itself is never stored or logged anywhere.

No API key is required for the Pwned Passwords range endpoint.
"""
import hashlib

import requests

PWNED_RANGE_URL = "https://api.pwnedpasswords.com/range/{prefix}"
REQUEST_TIMEOUT_SECONDS = 10


def check_password_breach(password: str) -> dict:
    """Returns {"breach_count": int, "hash_prefix": str, "error": str | None}.

    breach_count is 0 if the password was not found in the corpus (or if the
    lookup failed - a failed lookup should never be treated as "confirmed
    safe" by callers, so `error` is set in that case too).
    """
    if not password:
        return {"breach_count": 0, "hash_prefix": None, "error": "no password provided"}

    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]

    try:
        resp = requests.get(
            PWNED_RANGE_URL.format(prefix=prefix),
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"Add-Padding": "true"},
        )
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        return {"breach_count": 0, "hash_prefix": prefix, "error": f"lookup failed: {e}"}

    breach_count = 0
    for line in resp.text.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        line_suffix, count_str = line.split(":", 1)
        if line_suffix.strip().upper() == suffix:
            try:
                breach_count = int(count_str.strip())
            except ValueError:
                breach_count = 0
            break

    return {"breach_count": breach_count, "hash_prefix": prefix, "error": None}

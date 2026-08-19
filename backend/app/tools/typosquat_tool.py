"""Flags domains that are suspiciously close (but not identical) to a
hardcoded list of commonly spoofed Indian + global brand domains, using
Levenshtein edit distance.
"""
from app.tools.url_utils import extract_domain


def _levenshtein_distance(a: str, b: str) -> int:
    """Pure-Python Levenshtein edit distance (no compiled dependency needed)."""
    if a == b:
        return 0
    if len(a) < len(b):
        a, b = b, a
    prev_row = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr_row = [i] + [0] * len(b)
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            curr_row[j] = min(
                prev_row[j] + 1,        # deletion
                curr_row[j - 1] + 1,    # insertion
                prev_row[j - 1] + cost, # substitution
            )
        prev_row = curr_row
    return prev_row[-1]

# ~100 commonly spoofed brand domains (Indian banking/gov + global tech/finance).
KNOWN_BRAND_DOMAINS = [
    # Indian banks
    "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com", "kotak.com",
    "pnbindia.in", "bankofbaroda.in", "canarabank.com", "unionbankofindia.co.in",
    "idbibank.in", "yesbank.in", "indusind.com", "federalbank.co.in",
    "idfcfirstbank.com", "rblbank.com", "bankofindia.co.in", "centralbankofindia.co.in",
    "indianbank.in", "ucobank.com", "maharashtrabank.com",
    # Indian govt / public services
    "uidai.gov.in", "irctc.co.in", "incometax.gov.in", "epfindia.gov.in",
    "passportindia.gov.in", "digilocker.gov.in", "mygov.in", "gst.gov.in",
    "nic.in", "india.gov.in", "aadhaar.gov.in", "epfo.gov.in",
    # Indian fintech / e-commerce
    "paytm.com", "phonepe.com", "amazon.in", "flipkart.com", "myntra.com",
    "bigbasket.com", "zomato.com", "swiggy.com", "ola.com", "cred.club",
    "razorpay.com", "billdesk.com", "mobikwik.com", "freecharge.in",
    "policybazaar.com", "makemytrip.com", "goibibo.com", "meesho.com",
    "snapdeal.com", "nykaa.com",
    # Global tech
    "google.com", "gmail.com", "microsoft.com", "outlook.com", "apple.com",
    "icloud.com", "facebook.com", "instagram.com", "whatsapp.com", "twitter.com",
    "x.com", "linkedin.com", "youtube.com", "netflix.com", "dropbox.com",
    "adobe.com", "yahoo.com", "github.com", "reddit.com", "tiktok.com",
    # Global finance / payments
    "paypal.com", "stripe.com", "visa.com", "mastercard.com",
    "americanexpress.com", "chase.com", "bankofamerica.com", "wellsfargo.com",
    "citibank.com", "hsbc.com", "westernunion.com", "wise.com", "coinbase.com",
    "binance.com",
    # Global e-commerce / shipping
    "amazon.com", "ebay.com", "aliexpress.com", "walmart.com", "fedex.com",
    "ups.com", "dhl.com", "usps.com",
    # Cloud / infra
    "aws.amazon.com", "azure.microsoft.com", "cloudflare.com", "digitalocean.com",
    "godaddy.com", "namecheap.com",
    # Others frequently spoofed
    "netflix.com", "spotify.com", "steam.com", "steampowered.com", "epicgames.com",
    "playstation.com", "xbox.com",
]

# A close match on very short/common substrings would false-positive constantly
# (e.g. "in.com" vs many ".in" domains), so require a minimum domain length.
MIN_DOMAIN_LEN_FOR_CHECK = 4
# Distance <= this (and > 0, i.e. not an exact/legit match) is flagged.
DISTANCE_THRESHOLD = 2


def _typosquat_check(url: str) -> dict:
    domain = extract_domain(url)
    result = {
        "is_known_exact_match": False,
        "closest_brand": None,
        "distance": None,
        "flagged_as_typosquat": False,
        "error": None,
    }
    try:
        if domain in KNOWN_BRAND_DOMAINS:
            result["is_known_exact_match"] = True
            result["closest_brand"] = domain
            result["distance"] = 0
            return result

        if len(domain) < MIN_DOMAIN_LEN_FOR_CHECK:
            return result

        best_brand = None
        best_distance = None
        for brand in KNOWN_BRAND_DOMAINS:
            dist = _levenshtein_distance(domain, brand)
            if best_distance is None or dist < best_distance:
                best_distance = dist
                best_brand = brand

        result["closest_brand"] = best_brand
        result["distance"] = best_distance
        if best_distance is not None and 0 < best_distance <= DISTANCE_THRESHOLD:
            result["flagged_as_typosquat"] = True
    except Exception as e:  # noqa: BLE001
        result["error"] = f"typosquat check failed: {e}"
    return result

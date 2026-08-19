# Architecture

## Overview

```
POST /check(url)
   │
   ▼
Recon step (deterministic Python, app/agents/recon.py)
   │  - cache_lookup: cache hit? → return cached result immediately
   │  - _ssl_check, _whois_lookup, _page_scrape,
   │    _redirect_chain, _typosquat_check — each run with its own
   │    try/except, degrading to "unknown" on failure, never crashing
   │  - flags priority signals (broken SSL, typosquat match) early
   ▼
Deterministic scoring (scoring.py) — fixed weighted formula, auditable
   ▼
Single AI explanation call (app/agents/llm_explain.py)
   │  one requests.post(...) to Ollama's HTTP API (gemma3:4b)
   │  hard 10s timeout enforced at the socket level, not a thread pool
   ▼
   ├─ success → AI explanation attached
   └─ timeout/failure → "AI explanation unavailable, showing raw analysis."
   ▼
cache_save → SQLite (also powers /history)
   ▼
JSON response: risk_score, verdict, breakdown, ai_explanation, from_cache
```

## Why tool execution is deterministic Python, not LLM-driven

The 5 real-world checks (SSL socket connection, WHOIS lookup, page fetch,
redirect following, typosquat distance) all involve network I/O with hard
latency requirements. An LLM deciding *whether* to call a tool, or retrying
a timed-out socket call, is not something we want in the critical path of a
security check that must "work correctly on real websites, not just look
good in a demo." So the Recon step executes all five tools directly in
Python, each independently wrapped in try/except with its own timeout,
before any LLM is invoked. This is what makes the tool layer *reliable*
rather than merely *demoable*.

## Why the score itself is deterministic, not LLM-generated

`scoring.py` implements a fixed, documented, weighted point system (see the
`WEIGHTS` dict and its inline documentation). The score is computed in plain
Python before the model is ever called, and the model is given the final
score and verdict as facts to explain, not something to (re)calculate.

This is intentional: an LLM asked to "compute a risk score" will produce
different numbers for the same input on different runs, which is
unacceptable for a security tool that needs to be auditable and
explainable (or, in a real deployment, to end users disputing a verdict).
The scoring formula is the single source of truth for *what counts as
risky and by how much*; the LLM's job is interpretation and communication,
which is exactly the kind of task LLMs are well-suited for and rule-based
code is not.

## Why one LLM call instead of a multi-agent pipeline

An earlier version of this project ran the AI reasoning step through a
3-agent pipeline (Recon Agent → Analyst Agent → Reporter Agent, chained
sequentially via an agent framework), each agent making its own separate
call to the local model. In practice this meant **three sequential LLM
calls per check**, and on constrained hardware (a 4GB VRAM GPU, for
example) that pushed total check time to 15-30+ seconds — and a
framework-level thread-pool timeout mechanism made worst-case behavior
still worse, since an abandoned background call could keep running (and
holding resources) well past its intended cutoff.

The current design keeps exactly the same real functionality — genuine
tool-gathered data feeding a genuine AI-generated explanation — but
collapses the reasoning step into a **single** direct HTTP call:

1. All five detection tools run first, deterministically, in Python.
2. The risk score is computed by the fixed formula.
3. All of that (per-tool findings + the computed score/verdict) is packaged
   into one structured prompt and sent once to Ollama via
   `requests.post(url, json=..., timeout=OLLAMA_TIMEOUT_SECONDS)`.
4. The model returns one plain-English explanation referencing the
   specific findings it was given.

Because the timeout is enforced by the HTTP client at the socket level
(not by waiting on a background thread to finish), a slow or unreachable
Ollama server fails predictably at the configured limit (default 10s) —
never later. This brought typical check time down to roughly 3-6 seconds
with no loss of real functionality: the same tool data still reaches the
model, it just reaches it in one pass instead of three.

## Scoring formula

| Signal | Points | Condition |
|---|---|---|
| No HTTPS at all | 15 | `https_available == False` |
| Invalid/expired/self-signed certificate | 20 | HTTPS present but cert invalid |
| Domain registered < 30 days ago | 20 | WHOIS `domain_age_days < 30` |
| Domain registered < 180 days ago | 10 | WHOIS `domain_age_days < 180` (and not already counted above) |
| Login form submits over HTTP | 20 | Password field present + form action is HTTP |
| Urgency-language keywords found | up to 10 | 3 points per keyword hit, capped at 10 |
| Meta-refresh auto-redirect present | 5 | `<meta http-equiv="refresh">` found |
| Final redirect lands on a different domain | 15 | Redirect chain domain mismatch |
| Domain closely matches a known brand (Levenshtein ≤ 2, not exact) | 25 | Typosquat check |
| Page loads scripts from 4+ external domains | 5 | External script domain count |

Total is capped at 100. Any signal whose underlying tool failed (network
error, WHOIS lookup failure, etc.) contributes **0 points** — it is recorded
as `"unknown"` in the breakdown and never silently treated as either safe or
risky. This satisfies the requirement that missing data must not be
penalized or rewarded.

**Verdict thresholds**: `score >= 60` → Dangerous, `score >= 30` → Suspicious,
else Safe.

## What each tool checks

- **`_ssl_check`** (`app/tools/ssl_check_tool.py`): Opens a raw TLS socket
  connection to port 443, reports whether HTTPS is available at all,
  whether the certificate validates, its issuer, and expiry. A failed
  `ssl.wrap_socket` due to certificate errors is itself a strong signal
  (self-signed/expired certs are common on phishing infrastructure), so
  it's captured as `cert_valid: False` rather than a generic error where
  possible.

- **`_whois_lookup`** (`app/tools/whois_free_tool.py`): Uses `python-whois`
  (free, no key) to fetch domain creation date and compute age in days.
  Because `python-whois` opens a raw socket with no built-in timeout, the
  lookup itself is run in a short-lived worker thread with a 6-second
  timeout (`WHOIS_TIMEOUT_SECONDS`) — the thread pool is explicitly shut
  down with `wait=False` so an unresponsive WHOIS server can never block
  the request past that limit. WHOIS lookups fail often anyway (rate
  limiting, unsupported TLDs, privacy-shielded records) — failures return
  `"unknown"` fields rather than raising.

- **`_page_scrape`** (`app/tools/page_scraper_tool.py`): Fetches the live
  page with a realistic `User-Agent` (some phishing kits block generic
  scrapers) and a 5s timeout, then uses BeautifulSoup to extract: page
  title, whether any `<form>` contains a password field, whether that
  form's `action` submits over HTTP, which external domains host
  `<script src>` tags, whether a `<meta http-equiv="refresh">` redirect
  exists, and whether any of ~14 urgency-language phrases ("verify now",
  "account suspended", "act immediately", "confirm your identity", etc.)
  appear in the visible text.

- **`_redirect_chain`** (`app/tools/redirect_chain_tool.py`): Follows up to
  5 redirects via `requests` (tracking `response.history`) and flags if
  the final landing domain differs from the domain the user originally
  entered — a common cloaking technique using URL shorteners or open
  redirects.

- **`_typosquat_check`** (`app/tools/typosquat_tool.py`): Computes
  Levenshtein edit distance between the entered domain and a hardcoded
  list of ~100 commonly spoofed Indian (SBI, HDFC, ICICI, UIDAI, IRCTC,
  Paytm, PhonePe, etc.) and global (Google, PayPal, Amazon, Microsoft,
  etc.) brand domains. A distance of 1-2 from a known brand (and not an
  exact match) is flagged as a likely typosquat.

- **`cache_lookup` / `cache_save`** (`app/tools/cache_tools.py`):
  SQLite-backed. A lookup within the configurable TTL window
  (`CACHE_TTL_HOURS`, default 24h) skips every tool call and the LLM call
  entirely, returning the prior result directly. Every completed check is
  saved and also serves as the data source for `/history`.

## Failure handling

Every tool function is wrapped in its own try/except and returns structured
`"unknown"`/`"error"` fields rather than raising. The LLM explanation step
(`generate_explanation` in `app/agents/llm_explain.py`) wraps its single
`requests.post(...)` call in a try/except around `RequestException`,
`JSONDecodeError`, and `KeyError`, with a hard `timeout=OLLAMA_TIMEOUT_SECONDS`
(default 10s) passed directly to `requests` — if Ollama is slow, unreachable,
or returns something unexpected, the API still returns the full
deterministic result (score, verdict, per-check breakdown) with
`ai_explanation: "AI explanation unavailable, showing raw analysis."` and
`ai_explanation_available: false`, so the frontend can render an honest
fallback state instead of hanging or erroring out.

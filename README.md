# Offline Phishing / Fake Website Detector

A fully offline, no-external-API phishing detector. Real, live-network
security signals — SSL certificate health, WHOIS domain age, page content,
redirect chains, and brand typosquatting — are gathered by deterministic
Python checks, scored by a fixed weighted formula, then explained in plain
English by a single call to a local Ollama model (`gemma3:4b`). No OpenAI
key, no paid API, no internet dependency beyond checking the target website
itself.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pipeline and scoring
formula work.

## Prerequisites

1. **Install Ollama**: https://ollama.com/download (Windows/Mac/Linux)
2. **Pull the model**:
   ```
   ollama pull gemma3:4b
   ```
3. Make sure Ollama is running (it starts a local server on
   `http://localhost:11434` automatically after install, or run `ollama serve`).
4. **Python 3.11+** and **Node.js 18+**.

## Backend setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Ollama is talked to directly via a plain `requests.post(...)` call to its
HTTP API (see [`backend/app/agents/llm_explain.py`](backend/app/agents/llm_explain.py))
— no agent framework, no OpenAI key ever read.

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The SQLite database file is created automatically on first run at the path
set by `DB_PATH` in `.env`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` requests to
the backend on port 8000 (see `frontend/vite.config.js`).

## Using it

1. Enter any URL (a real one, or a suspicious-looking domain) and click
   **Check**.
2. Watch the progress panel while the real Recon → Score → AI Explanation
   pipeline runs server-side (typically ~3-6 seconds).
3. View the risk score, verdict, per-check breakdown, and the AI-generated
   plain-English explanation.
4. Switch to **History** to see past checks pulled from SQLite.

## Offline guarantee

- No OpenAI/Anthropic/Google API keys are used anywhere in this codebase.
- The only network calls this app makes are: (a) one HTTP call to your
  local Ollama server, and (b) directly to the website you ask it to check
  (SSL socket, WHOIS, HTTP fetch) — the same way any browser or security
  scanner would.
- If Ollama is slow or unreachable, the app still returns a full result:
  raw tool outputs plus the deterministic risk score, with a note that the
  AI explanation was unavailable (see `OLLAMA_TIMEOUT_SECONDS` in `.env`,
  default 10s).

## Performance note

An earlier version of this project ran the AI reasoning step through a
3-agent framework (Recon → Analyst → Reporter agents chained sequentially),
which meant 3 separate LLM calls per check. On constrained hardware (e.g. a
4GB VRAM GPU) that added 15-30+ seconds per check. The current design keeps
all detection and scoring in deterministic Python and makes exactly **one**
LLM call for the explanation, bringing typical check time down to roughly
3-6 seconds with no loss of real functionality.

## Project structure

```
backend/
  app/
    tools/         # ssl_check, whois_free, page_scraper, redirect_chain, typosquat, cache
    agents/
      recon.py            # runs all 5 tools deterministically, flags priority signals
      scoring_helpers.py  # flattens tool outputs into the scoring signal dict + breakdown
      llm_explain.py       # single Ollama HTTP call for the plain-English explanation
      pipeline.py          # ties recon -> scoring -> AI explanation -> cache save together
    db/            # SQLAlchemy models + session (SQLite, swappable for Postgres)
    scoring.py     # deterministic weighted risk-scoring formula
    main.py        # FastAPI app: POST /check, GET /history
frontend/
  src/
    pages/         # LandingPage, DocsPage, CheckerApp
    components/    # RiskGauge, CheckBreakdown, ResultsView, AgentProgress, HistoryView
    App.jsx
```

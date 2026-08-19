#!/usr/bin/env bash
# One-command setup for PhishGuard (Mac/Linux).
# Installs Ollama + pulls gemma3:4b, sets up the Python venv + deps,
# installs frontend deps, and creates .env if missing.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL="gemma3:4b"
OLLAMA_URL="http://localhost:11434"

GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}==>${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; }

SUMMARY_INSTALLED=()
SUMMARY_READY=()

echo "=============================================="
echo " PhishGuard one-command setup"
echo "=============================================="

# 1. Ollama installed?
info "Checking for Ollama..."
if command -v ollama >/dev/null 2>&1; then
    ok "Ollama is already installed ($(ollama --version 2>/dev/null | head -n1))."
    SUMMARY_READY+=("Ollama already installed")
else
    warn "Ollama not found. Attempting automatic install..."
    if curl -fsSL https://ollama.com/install.sh | sh; then
        ok "Ollama installed successfully."
        SUMMARY_INSTALLED+=("Ollama (via install.sh)")
    else
        fail "Automatic Ollama install failed."
        echo "    Please install manually from: https://ollama.com/download"
        echo "    Then re-run this script."
        exit 1
    fi
fi

# 2. Ollama service running?
info "Checking if Ollama service is running..."
if curl -fsS -m 3 "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    ok "Ollama service is already running."
    SUMMARY_READY+=("Ollama service running")
else
    warn "Ollama service not reachable at ${OLLAMA_URL}. Starting it..."
    nohup ollama serve >/tmp/ollama_serve.log 2>&1 &
    disown || true
    for i in $(seq 1 15); do
        sleep 1
        if curl -fsS -m 2 "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
            ok "Ollama service started."
            SUMMARY_INSTALLED+=("Ollama service (started in background)")
            break
        fi
        if [ "$i" -eq 15 ]; then
            fail "Ollama service did not come up after 15s. Check /tmp/ollama_serve.log"
            echo "    You may need to run 'ollama serve' manually in another terminal."
        fi
    done
fi

# 3. Is gemma3:4b pulled?
info "Checking for ${MODEL} model..."
if ollama list 2>/dev/null | grep -q "^${MODEL}"; then
    ok "${MODEL} is already pulled."
    SUMMARY_READY+=("${MODEL} model already pulled")
else
    warn "${MODEL} not found locally. Pulling now — this downloads ~2-4GB and may take a"
    warn "few minutes depending on your internet speed. Please be patient, it is NOT frozen."
    if ollama pull "${MODEL}"; then
        ok "${MODEL} pulled successfully."
        SUMMARY_INSTALLED+=("${MODEL} model (pulled)")
    else
        fail "Failed to pull ${MODEL}. You can retry manually with: ollama pull ${MODEL}"
    fi
fi

# 4. Backend Python deps (venv)
info "Setting up backend Python environment..."
cd "${ROOT_DIR}/backend"
PYTHON_BIN="$(command -v python3 || command -v python)"
if [ -z "${PYTHON_BIN}" ]; then
    fail "No python3/python found on PATH. Install Python 3.11+ and re-run."
    exit 1
fi

if [ ! -d "venv" ]; then
    info "Creating virtual environment..."
    "${PYTHON_BIN}" -m venv venv
    SUMMARY_INSTALLED+=("Python virtual environment (backend/venv)")
else
    ok "Virtual environment already exists."
    SUMMARY_READY+=("Python virtual environment")
fi

# shellcheck disable=SC1091
source venv/bin/activate
info "Installing backend dependencies from requirements.txt..."
pip install --quiet --upgrade pip
if pip install --quiet -r requirements.txt; then
    ok "Backend dependencies installed."
    SUMMARY_INSTALLED+=("Backend Python dependencies")
else
    fail "pip install failed. Check the output above."
fi
deactivate

# 5. Frontend npm deps
info "Installing frontend dependencies..."
cd "${ROOT_DIR}/frontend"
if [ -d "node_modules" ]; then
    ok "node_modules already present, skipping install (run 'npm install' manually to refresh)."
    SUMMARY_READY+=("Frontend node_modules")
else
    if command -v npm >/dev/null 2>&1; then
        npm install
        ok "Frontend dependencies installed."
        SUMMARY_INSTALLED+=("Frontend npm dependencies")
    else
        fail "npm not found. Install Node.js 18+ from https://nodejs.org and re-run."
    fi
fi

# 6. .env file
info "Setting up backend/.env..."
cd "${ROOT_DIR}/backend"
if [ -f ".env" ]; then
    ok ".env already exists, leaving it untouched."
    SUMMARY_READY+=("backend/.env")
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        cat > .env <<EOF
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
DB_PATH=./phishing_detector.db
OLLAMA_TIMEOUT_SECONDS=10
CACHE_TTL_HOURS=24
EOF
    fi
    ok ".env created with sensible defaults."
    SUMMARY_INSTALLED+=("backend/.env (from .env.example)")
fi

# 7. Final summary
echo ""
echo "=============================================="
echo " Setup complete"
echo "=============================================="
if [ "${#SUMMARY_INSTALLED[@]}" -gt 0 ]; then
    echo ""
    echo "Installed / configured this run:"
    for item in "${SUMMARY_INSTALLED[@]}"; do echo "  + ${item}"; done
fi
if [ "${#SUMMARY_READY[@]}" -gt 0 ]; then
    echo ""
    echo "Already ready:"
    for item in "${SUMMARY_READY[@]}"; do echo "  * ${item}"; done
fi

echo ""
echo "Run the backend:"
echo "  cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo ""
echo "Run the frontend (in a separate terminal):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:5173"
echo ""
echo "Sanity check your setup any time with:"
echo "  python3 check_setup.py"

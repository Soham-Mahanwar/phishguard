# One-command setup for PhishGuard (Windows).
# Installs Ollama + pulls gemma3:4b, sets up the Python venv + deps,
# installs frontend deps, and creates .env if missing.

$ErrorActionPreference = "Continue"
$RootDir = $PSScriptRoot
$Model = "gemma3:4b"
$OllamaUrl = "http://localhost:11434"

$SummaryInstalled = New-Object System.Collections.Generic.List[string]
$SummaryReady = New-Object System.Collections.Generic.List[string]

function Info($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "[OK] $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Fail($msg)  { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host "=============================================="
Write-Host " PhishGuard one-command setup"
Write-Host "=============================================="

# 1. Ollama installed?
Info "Checking for Ollama..."
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaCmd) {
    Ok "Ollama is already installed."
    $SummaryReady.Add("Ollama already installed")
} else {
    Warn "Ollama not found on PATH."
    Write-Host "    There is no single reliable silent-install command for Ollama on Windows."
    Write-Host "    Please download and run the installer manually from:"
    Write-Host "      https://ollama.com/download" -ForegroundColor Yellow
    Write-Host "    After installing, re-run this script (.\setup.ps1) to continue."
    exit 1
}

# 2. Ollama service running?
Info "Checking if Ollama service is running..."
$ollamaUp = $false
try {
    $resp = Invoke-WebRequest -Uri "$OllamaUrl/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { $ollamaUp = $true }
} catch {}

if ($ollamaUp) {
    Ok "Ollama service is already running."
    $SummaryReady.Add("Ollama service running")
} else {
    Warn "Ollama service not reachable at $OllamaUrl. Starting it..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    $started = $false
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $resp = Invoke-WebRequest -Uri "$OllamaUrl/api/tags" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { $started = $true; break }
        } catch {}
    }
    if ($started) {
        Ok "Ollama service started."
        $SummaryInstalled.Add("Ollama service (started in background)")
    } else {
        Fail "Ollama service did not come up after 15s."
        Write-Host "    Try running 'ollama serve' manually in another terminal."
    }
}

# 3. Is gemma3:4b pulled?
Info "Checking for $Model model..."
$modelList = & ollama list 2>$null
if ($modelList -match [regex]::Escape($Model)) {
    Ok "$Model is already pulled."
    $SummaryReady.Add("$Model model already pulled")
} else {
    Warn "$Model not found locally. Pulling now - this downloads ~2-4GB and may take a"
    Warn "few minutes depending on your internet speed. Please be patient, it is NOT frozen."
    & ollama pull $Model
    if ($LASTEXITCODE -eq 0) {
        Ok "$Model pulled successfully."
        $SummaryInstalled.Add("$Model model (pulled)")
    } else {
        Fail "Failed to pull $Model. You can retry manually with: ollama pull $Model"
    }
}

# 4. Backend Python deps (venv)
Info "Setting up backend Python environment..."
Set-Location "$RootDir\backend"

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) { $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $pythonCmd) {
    Fail "No python/python3 found on PATH. Install Python 3.11+ from https://python.org and re-run."
    exit 1
}

if (-not (Test-Path "venv")) {
    Info "Creating virtual environment..."
    & $pythonCmd.Source -m venv venv
    $SummaryInstalled.Add("Python virtual environment (backend\venv)")
} else {
    Ok "Virtual environment already exists."
    $SummaryReady.Add("Python virtual environment")
}

$venvPython = "$RootDir\backend\venv\Scripts\python.exe"
Info "Installing backend dependencies from requirements.txt..."
& $venvPython -m pip install --quiet --upgrade pip
& $venvPython -m pip install --quiet -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Ok "Backend dependencies installed."
    $SummaryInstalled.Add("Backend Python dependencies")
} else {
    Fail "pip install failed. Check the output above."
}

# 5. Frontend npm deps
Info "Installing frontend dependencies..."
Set-Location "$RootDir\frontend"
if (Test-Path "node_modules") {
    Ok "node_modules already present, skipping install (run 'npm install' manually to refresh)."
    $SummaryReady.Add("Frontend node_modules")
} else {
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd) {
        & npm install
        Ok "Frontend dependencies installed."
        $SummaryInstalled.Add("Frontend npm dependencies")
    } else {
        Fail "npm not found. Install Node.js 18+ from https://nodejs.org and re-run."
    }
}

# 6. .env file
Info "Setting up backend\.env..."
Set-Location "$RootDir\backend"
if (Test-Path ".env") {
    Ok ".env already exists, leaving it untouched."
    $SummaryReady.Add("backend\.env")
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        @"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
DB_PATH=./phishing_detector.db
OLLAMA_TIMEOUT_SECONDS=10
CACHE_TTL_HOURS=24
"@ | Out-File -Encoding utf8 ".env"
    }
    Ok ".env created with sensible defaults."
    $SummaryInstalled.Add("backend\.env (from .env.example)")
}

# 7. Final summary
Set-Location $RootDir
Write-Host ""
Write-Host "=============================================="
Write-Host " Setup complete"
Write-Host "=============================================="

if ($SummaryInstalled.Count -gt 0) {
    Write-Host ""
    Write-Host "Installed / configured this run:"
    foreach ($item in $SummaryInstalled) { Write-Host "  + $item" }
}
if ($SummaryReady.Count -gt 0) {
    Write-Host ""
    Write-Host "Already ready:"
    foreach ($item in $SummaryReady) { Write-Host "  * $item" }
}

Write-Host ""
Write-Host "Run the backend:"
Write-Host "  cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
Write-Host ""
Write-Host "Run the frontend (in a separate terminal):"
Write-Host "  cd frontend; npm run dev"
Write-Host ""
Write-Host "Then open http://localhost:5173"
Write-Host ""
Write-Host "Sanity check your setup any time with:"
Write-Host "  python check_setup.py"

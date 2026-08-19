$root = $PSScriptRoot

Write-Host "Starting Ollama..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"

Write-Host "Starting backend (FastAPI)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"

Write-Host "Starting frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`nAll services launching in separate windows:" -ForegroundColor Green
Write-Host "  Ollama   -> http://localhost:11434"
Write-Host "  Backend  -> http://localhost:8000"
Write-Host "  Frontend -> http://localhost:5173"
Write-Host "`nOpen http://localhost:5173 once the frontend window shows 'ready'." -ForegroundColor Yellow

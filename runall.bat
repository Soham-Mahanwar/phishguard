@echo off
REM One-command entry point: sets up PhishGuard if needed, then launches
REM Ollama + backend + frontend all at once. Just clone the repo and
REM double-click this file (or run "runall.bat") - nothing else required.

setlocal
set "ROOT=%~dp0"

REM Run setup only if the backend venv doesn't exist yet (first run / fresh clone)
if not exist "%ROOT%backend\venv" (
    echo ==============================================
    echo  First run detected - running setup...
    echo ==============================================
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%setup.ps1"
    if errorlevel 1 (
        echo.
        echo [FAIL] Setup did not complete. Fix the issue above and re-run runall.bat
        pause
        exit /b 1
    )
)

echo.
echo ==============================================
echo  Launching PhishGuard...
echo ==============================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%run.ps1"

endlocal

@echo off
REM Thin wrapper so teammates can double-click or run "setup.bat" without
REM dealing with PowerShell execution policy prompts directly.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

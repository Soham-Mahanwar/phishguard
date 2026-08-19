#!/usr/bin/env python3
"""Sanity check for PhishGuard environment readiness.

Run this before demo day to confirm everything is wired up:
  python check_setup.py

Checks:
  - Ollama service is running and reachable
  - gemma3:4b model is pulled
  - Backend Python dependencies are installed (in backend/venv)
  - Frontend node_modules exists
  - Ollama actually responds to a real generate call (end-to-end)

Prints a checklist with clear PASS/FAIL markers and exits non-zero if
anything is missing so it can also be used in CI-style checks.
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")

PASS = "\033[92mPASS\033[0m" if sys.stdout.isatty() else "PASS"
FAIL = "\033[91mFAIL\033[0m" if sys.stdout.isatty() else "FAIL"

results = []  # (label, ok: bool, detail: str)


def check(label, ok, detail=""):
    results.append((label, ok, detail))
    marker = PASS if ok else FAIL
    line = f"[{marker}] {label}"
    if detail:
        line += f" - {detail}"
    print(line)
    return ok


def http_get_json(url, timeout=3):
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_post_json(url, payload, timeout=30):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def find_backend_python():
    win_python = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
    unix_python = os.path.join(BACKEND_DIR, "venv", "bin", "python")
    if os.path.exists(win_python):
        return win_python
    if os.path.exists(unix_python):
        return unix_python
    return None


def main():
    print("==============================================")
    print(" PhishGuard setup sanity check")
    print("==============================================")

    # 1. Ollama service running
    ollama_up = False
    try:
        tags = http_get_json(f"{OLLAMA_URL}/api/tags")
        ollama_up = True
        check("Ollama service running", True, OLLAMA_URL)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        check("Ollama service running", False, f"could not reach {OLLAMA_URL} ({e})")
        tags = {"models": []}

    # 2. gemma3:4b pulled
    model_names = [m.get("name", "") for m in tags.get("models", [])]
    model_pulled = any(MODEL in name for name in model_names)
    check(
        f"{MODEL} model pulled",
        model_pulled,
        "" if model_pulled else f"run: ollama pull {MODEL}",
    )

    # 3. Backend Python deps installed
    backend_python = find_backend_python()
    backend_ok = False
    if not backend_python:
        check("Backend Python venv exists", False, "backend/venv not found - run setup.sh/setup.ps1")
    else:
        try:
            proc = subprocess.run(
                [backend_python, "-c", "import fastapi, uvicorn, sqlalchemy, requests, bs4, whois, pydantic"],
                cwd=BACKEND_DIR,
                capture_output=True,
                text=True,
                timeout=15,
            )
            backend_ok = proc.returncode == 0
            check(
                "Backend Python dependencies installed",
                backend_ok,
                "" if backend_ok else proc.stderr.strip().splitlines()[-1] if proc.stderr else "import failed",
            )
        except Exception as e:  # noqa: BLE001
            check("Backend Python dependencies installed", False, str(e))

    # 4. Frontend node_modules exists
    node_modules_ok = os.path.isdir(os.path.join(FRONTEND_DIR, "node_modules"))
    check(
        "Frontend node_modules present",
        node_modules_ok,
        "" if node_modules_ok else "run: cd frontend && npm install",
    )

    # 5. End-to-end Ollama generate call
    e2e_ok = False
    if ollama_up and model_pulled:
        try:
            resp = http_post_json(
                f"{OLLAMA_URL}/api/generate",
                {"model": MODEL, "prompt": "Reply with exactly: OK", "stream": False},
                timeout=30,
            )
            e2e_ok = bool(resp.get("response", "").strip())
            check(
                "Backend can reach Ollama with a test prompt",
                e2e_ok,
                "" if e2e_ok else "empty response from Ollama",
            )
        except Exception as e:  # noqa: BLE001
            check("Backend can reach Ollama with a test prompt", False, str(e))
    else:
        check(
            "Backend can reach Ollama with a test prompt",
            False,
            "skipped - Ollama not running or model not pulled",
        )

    print("")
    all_ok = all(ok for _, ok, _ in results)
    if all_ok:
        print("Everything looks ready. You're good for demo day.")
    else:
        print("Some checks failed - see above for exact fix commands.")
        print("For a full automated fix, try: ./setup.sh (Mac/Linux) or .\\setup.ps1 (Windows)")

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()

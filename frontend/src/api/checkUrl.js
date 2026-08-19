/** Calls the FastAPI backend's POST /check endpoint.
 * Vite proxies /api/* to http://localhost:8000/* (see vite.config.js).
 */
export async function checkUrl(url) {
  const resp = await fetch("/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${resp.status})`);
  }

  return resp.json();
}

export async function getHistory(limit = 50) {
  const resp = await fetch(`/api/history?limit=${limit}`);
  if (!resp.ok) {
    throw new Error(`Request failed (${resp.status})`);
  }
  return resp.json();
}

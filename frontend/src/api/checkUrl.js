/** Calls the FastAPI backend's POST /check endpoint.
 * Vite proxies /api/* to http://localhost:8000/* (see vite.config.js).
 */

/** Reads the auth token directly from localStorage (rather than threading
 * AuthContext through every api call site) and returns an Authorization
 * header object, or {} when no token is present - so every call below stays
 * byte-for-byte identical for anonymous users.
 */
function authHeaders() {
  try {
    const token = localStorage.getItem("phishguard_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function checkUrl(url) {
  const resp = await fetch("/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  });

  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${resp.status})`);
  }

  return resp.json();
}

export async function getHistory(limit = 50) {
  const resp = await fetch(`/api/history?limit=${limit}`, {
    headers: { ...authHeaders() },
  });
  if (!resp.ok) {
    throw new Error(`Request failed (${resp.status})`);
  }
  return resp.json();
}

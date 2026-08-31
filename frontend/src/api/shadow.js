/** Calls the SHADOW layer endpoints on the FastAPI backend.
 * Vite proxies /api/* to http://localhost:8000/* (see vite.config.js).
 */

/** Reads the auth token directly from localStorage and returns an
 * Authorization header object, or {} when absent - anonymous behavior stays
 * byte-for-byte identical.
 */
function authHeaders() {
  try {
    const token = localStorage.getItem("phishguard_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function shadowMap(payload) {
  const resp = await fetch("/api/shadow/map", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${resp.status})`);
  }
  return resp.json();
}

export async function shadowPredict(userProfileId) {
  const resp = await fetch("/api/shadow/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_profile_id: userProfileId }),
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${resp.status})`);
  }
  return resp.json();
}

export async function shadowSummary(userProfileId) {
  const resp = await fetch(`/api/shadow/summary/${userProfileId}`, {
    headers: { ...authHeaders() },
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${resp.status})`);
  }
  return resp.json();
}

export async function shadowActivity(userProfileId) {
  const qs = userProfileId ? `?user_profile_id=${userProfileId}` : "";
  const resp = await fetch(`/api/shadow/activity${qs}`, {
    headers: { ...authHeaders() },
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${resp.status})`);
  }
  return resp.json();
}

import { useState } from "react";

function authHeaders() {
  try {
    const token = localStorage.getItem("phishguard_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function TextPaste({ onResult }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleScan() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/check-text", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail.detail || `Request failed (${resp.status})`);
      }
      const data = await resp.json();
      onResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Paste Email / SMS Text</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Paste suspicious email or SMS text here..."
        className="w-full rounded-lg bg-navy-800 border border-navy-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
      <button
        onClick={handleScan}
        disabled={loading}
        className="mt-3 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-navy-700 disabled:text-slate-500 text-navy-950 font-semibold text-sm transition-colors"
      >
        {loading ? "Scanning..." : "Scan Text"}
      </button>
      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-3 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

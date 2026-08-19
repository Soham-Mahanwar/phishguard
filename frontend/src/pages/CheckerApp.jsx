import { useState } from "react";
import { Link } from "react-router-dom";
import AgentProgress from "../components/AgentProgress.jsx";
import ResultsView from "../components/ResultsView.jsx";
import HistoryView from "../components/HistoryView.jsx";

export default function CheckerApp() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("check");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checkedUrl, setCheckedUrl] = useState("");

  async function handleCheck() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail.detail || `Request failed (${resp.status})`);
      }
      const data = await resp.json();
      setResult(data);
      setCheckedUrl(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <header className="border-b border-navy-700 bg-navy-900">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-lg font-bold tracking-tight">Offline Phishing Detector</h1>
          </Link>
          <nav className="flex gap-2">
            <button
              onClick={() => setTab("check")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "check" ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Check URL
            </button>
            <button
              onClick={() => setTab("history")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "history" ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {tab === "check" ? (
          <>
            <div className="flex gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                placeholder="Enter a URL, e.g. sbi-secure-login.co.in"
                className="flex-1 rounded-lg bg-navy-800 border border-navy-700 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCheck}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-navy-700 disabled:text-slate-500 text-navy-950 font-semibold transition-colors"
              >
                {loading ? "Checking..." : "Check"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3">
                {error}
              </div>
            )}

            {loading && <AgentProgress />}
            {!loading && result && <ResultsView result={result} url={checkedUrl} />}
          </>
        ) : (
          <HistoryView />
        )}
      </main>
    </div>
  );
}

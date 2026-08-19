import { useEffect, useState } from "react";

const VERDICT_DOT = {
  Safe: "bg-green-400",
  Suspicious: "bg-amber-400",
  Dangerous: "bg-red-400",
};

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setHistory(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 mt-6">Loading history...</div>;
  if (error) return <div className="text-red-400 mt-6">Failed to load history: {error}</div>;
  if (history.length === 0) return <div className="text-slate-400 mt-6">No checks yet.</div>;

  return (
    <div className="mt-6 space-y-2">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${VERDICT_DOT[item.verdict] || "bg-slate-400"}`} />
            <span className="text-slate-200 truncate">{item.url}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-sm">
            <span className="text-slate-400">{new Date(item.created_at).toLocaleString()}</span>
            <span className="font-semibold text-slate-200">{Math.round(item.risk_score)}</span>
            <span className="text-slate-400">{item.verdict}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

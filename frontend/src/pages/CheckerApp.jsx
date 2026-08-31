import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AgentProgress from "../components/AgentProgress.jsx";
import ResultsView from "../components/ResultsView.jsx";
import HistoryView from "../components/HistoryView.jsx";
import QrUpload from "../components/QrUpload.jsx";
import TextPaste from "../components/TextPaste.jsx";
import TextScanResults from "../components/TextScanResults.jsx";
import { checkUrl } from "../api/checkUrl.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function CheckerApp() {
  const { user, logout } = useAuth();
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("check");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checkedUrl, setCheckedUrl] = useState("");
  const [qrResult, setQrResult] = useState(null);
  const [textResult, setTextResult] = useState(null);

  async function handleCheck() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setQrResult(null);
    setTextResult(null);
    try {
      const data = await checkUrl(url);
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
            <Link
              to="/shadow"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Shadow Protect
            </Link>
            {user ? (
              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-navy-700">
                <span className="text-sm text-slate-400 truncate max-w-[160px]">{user.email}</span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Log in
              </Link>
            )}
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
              <motion.button
                onClick={handleCheck}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.03 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-navy-700 disabled:text-slate-500 text-navy-950 font-semibold transition-colors"
              >
                {loading ? "Checking..." : "Check"}
              </motion.button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3">
                {error}
              </div>
            )}

            {loading && <AgentProgress />}
            {!loading && result && <ResultsView result={result} url={checkedUrl} />}

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <QrUpload
                onResult={(data) => {
                  setResult(null);
                  setTextResult(null);
                  setQrResult(data);
                }}
              />
              <TextPaste
                onResult={(data) => {
                  setResult(null);
                  setQrResult(null);
                  setTextResult(data);
                }}
              />
            </div>

            {qrResult && (
              <div className="mt-8">
                <div className="text-xs text-slate-500 mb-2 break-all">
                  Decoded QR content: {qrResult.decoded_text}
                </div>
                <ResultsView result={qrResult} url={qrResult.url} />
              </div>
            )}

            {textResult && <TextScanResults data={textResult} />}
          </>
        ) : (
          <HistoryView />
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      <header className="border-b border-navy-700 bg-navy-900">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-lg font-bold tracking-tight">PhishGuard</h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm rounded-xl border border-navy-700 bg-navy-800 p-6 space-y-4"
        >
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-1">Log in</h2>
            <p className="text-sm text-slate-400">
              Optional &mdash; PhishGuard works fully without an account.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-navy-900 border border-navy-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-navy-900 border border-navy-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="w-full px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-navy-700 disabled:text-slate-500 text-navy-950 font-semibold transition-colors"
          >
            {loading ? "Logging in..." : "Log in"}
          </motion.button>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-400 text-center">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </motion.form>
      </main>
    </div>
  );
}

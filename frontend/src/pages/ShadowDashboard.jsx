import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Radar, Sparkles, Activity, ShieldCheck, Lock, KeyRound, Archive } from "lucide-react";
import ShadowGauge from "../components/ShadowGauge.jsx";
import { shadowMap, shadowPredict, shadowActivity } from "../api/shadow.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const CONFIDENCE_STYLES = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

/** Ambient drifting glow blobs, matching the dark navy aesthetic used
 * elsewhere in the app (e.g. the soft blurred glows on LandingPage). Purely
 * decorative, absolutely positioned, no layout impact. */
function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <motion.div
        className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-navy-700/40 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-blue-400/5 blur-3xl"
        animate={{ x: [0, 25, 0], y: [0, -25, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/** Shimmer/gradient-sweep skeleton block, replacing the flat animate-pulse. */
function ShimmerBlock({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded bg-navy-700 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

const SCAN_STEPS = [
  "Checking breach databases...",
  "Analyzing account hygiene...",
  "Computing exposure score...",
];

/** Multi-step "Scanning..." sequence shown while /shadow/map is in flight,
 * following the same sequential-step pattern as AgentProgress.jsx. */
function FormSkeleton() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i < SCAN_STEPS.length - 1 ? i + 1 : i));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="h-3 w-3 rounded-full bg-blue-400"
          animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-slate-300 font-medium"
          >
            {SCAN_STEPS[stepIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="space-y-3">
        <ShimmerBlock className="h-6 w-3/4" />
        <ShimmerBlock className="h-6 w-2/3" />
        <ShimmerBlock className="h-6 w-1/2" />
      </div>
    </div>
  );
}

function RecentFeedSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
        >
          <ShimmerBlock className="h-4 w-1/2" />
          <ShimmerBlock className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

const EVENT_STYLES = {
  checkup: { icon: Radar, classes: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  threat_blocked: { icon: ShieldAlert, classes: "text-red-400 bg-red-500/10 border-red-500/30" },
  prediction: { icon: Sparkles, classes: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
};

function RecentActivityFeed({ userProfileId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    shadowActivity(userProfileId)
      .then((data) => setEvents(data.events || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userProfileId]);

  if (loading) return <RecentFeedSkeleton />;
  if (error) return <div className="text-red-400 text-sm">Failed to load recent activity: {error}</div>;
  if (events.length === 0) {
    return (
      <div className="text-slate-400 text-sm">
        Log in or run a checkup to see activity here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {events.map((ev, idx) => {
          const style = EVENT_STYLES[ev.event_type] || EVENT_STYLES.checkup;
          const Icon = style.icon || Activity;
          const isThreat = ev.event_type === "threat_blocked";
          return (
            <motion.div
              key={`${ev.event_type}-${ev.timestamp}-${idx}`}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                backgroundColor: idx === 0
                  ? ["rgba(59,130,246,0.16)", "rgba(16,31,58,1)"]
                  : "rgba(16,31,58,1)",
              }}
              transition={{
                duration: 0.35,
                delay: idx * 0.04,
                backgroundColor: { duration: 1.4, delay: idx * 0.04 + 0.15 },
              }}
              className="flex items-center gap-3 rounded-lg border border-navy-700 px-4 py-3 text-sm"
            >
              <motion.span
                className={`flex items-center justify-center h-8 w-8 rounded-full border shrink-0 ${style.classes}`}
                initial={{ rotate: -20, scale: 0.6 }}
                animate={
                  isThreat
                    ? { rotate: [0, -8, 8, -4, 0], scale: 1 }
                    : { rotate: 0, scale: 1 }
                }
                transition={{ duration: isThreat ? 0.6 : 0.35, delay: idx * 0.04 + 0.1 }}
              >
                <Icon size={16} />
              </motion.span>
              <span className="text-slate-300 flex-1 min-w-0 truncate">{ev.description}</span>
              <span className="text-slate-500 shrink-0">{new Date(ev.timestamp).toLocaleString()}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function ShadowDashboard() {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [has2fa, setHas2fa] = useState(false);
  const [reusesPassword, setReusesPassword] = useState(false);
  const [hasOldAccounts, setHasOldAccounts] = useState(false);

  const [mapLoading, setMapLoading] = useState(false);
  const [mapResult, setMapResult] = useState(null);
  const [mapError, setMapError] = useState(null);

  const [predictLoading, setPredictLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [predictError, setPredictError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setMapLoading(true);
    setMapError(null);
    setMapResult(null);
    setPredictions(null);
    try {
      const data = await shadowMap({
        email: email.trim(),
        has_2fa: has2fa,
        reuses_password: reusesPassword,
        has_old_accounts: hasOldAccounts,
        password: password || null,
      });
      setMapResult(data);

      setPredictLoading(true);
      setPredictError(null);
      try {
        const preds = await shadowPredict(data.user_profile_id);
        setPredictions(preds);
      } catch (pe) {
        setPredictError(pe.message);
      } finally {
        setPredictLoading(false);
      }
    } catch (e2) {
      setMapError(e2.message);
    } finally {
      setMapLoading(false);
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-navy-950 text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <AnimatedBackground />
      <header className="border-b border-navy-700 bg-navy-900">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.span
              className="text-2xl"
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
            >
              🌑
            </motion.span>
            <h1 className="text-lg font-bold tracking-tight">Shadow Protect</h1>
          </Link>
          <nav className="flex gap-2 items-center">
            <Link
              to="/app"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              URL Checker
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

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Digital Exposure Checkup</h2>
          <p className="text-sm text-slate-400 max-w-xl">
            Answer a few questions about your account hygiene. If you provide a password, it is
            hashed locally in your browser and only the first characters of that hash are ever
            sent to the server for a breach lookup &mdash; your real password is never transmitted
            or stored.
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-navy-700 bg-navy-800 p-6 space-y-4"
        >
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
            <label className="block text-sm text-slate-300 mb-1.5">
              Password <span className="text-slate-500">(optional &mdash; hashed locally, only a prefix is sent, never stored)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to skip breach check"
              className="w-full rounded-lg bg-navy-900 border border-navy-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={has2fa}
                onChange={(e) => setHas2fa(e.target.checked)}
                className="rounded border-navy-700 bg-navy-900 accent-blue-500"
              />
              I have two-factor authentication (2FA) enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={reusesPassword}
                onChange={(e) => setReusesPassword(e.target.checked)}
                className="rounded border-navy-700 bg-navy-900 accent-blue-500"
              />
              I reuse this password across multiple accounts
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={hasOldAccounts}
                onChange={(e) => setHasOldAccounts(e.target.checked)}
                className="rounded border-navy-700 bg-navy-900 accent-blue-500"
              />
              I still have old/unused accounts
            </label>
          </div>

          <motion.button
            type="submit"
            disabled={mapLoading}
            whileHover={{ scale: mapLoading ? 1 : 1.03 }}
            whileTap={{ scale: mapLoading ? 1 : 0.97 }}
            className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-navy-700 disabled:text-slate-500 text-navy-950 font-semibold transition-colors"
          >
            {mapLoading ? "Analyzing..." : "Run Shadow Checkup"}
          </motion.button>

          {mapError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
              {mapError}
            </div>
          )}
        </motion.form>

        {mapLoading && <FormSkeleton />}

        {!mapLoading && mapResult && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div
              variants={item}
              className="rounded-xl border border-navy-700 bg-navy-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div>
                <div className="text-sm text-slate-400 mb-1">{mapResult.email}</div>
                <div className="text-2xl font-bold text-slate-100">{mapResult.risk_label}</div>
              </div>
              <ShadowGauge score={mapResult.shadow_score} riskLabel={mapResult.risk_label} />
            </motion.div>

            <motion.div variants={item}>
              <h3 className="text-slate-300 font-semibold mb-3">Findings</h3>
              <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 md:grid-cols-2" style={{ perspective: 800 }}>
                {[
                  {
                    icon: Lock,
                    title: "Breach Check",
                    value: mapResult.breach_check_skipped
                      ? "Skipped (no password provided)"
                      : mapResult.breach_check_error
                        ? `Error: ${mapResult.breach_check_error}`
                        : mapResult.breach_count > 0
                          ? `Found in ${mapResult.breach_count} breach${mapResult.breach_count === 1 ? "" : "es"}`
                          : "Not found in known breaches",
                    severity: mapResult.breach_check_skipped || mapResult.breach_check_error
                      ? "neutral"
                      : mapResult.breach_count > 0
                        ? "high"
                        : "low",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Two-Factor Auth",
                    value: has2fa ? "Enabled" : "Not enabled",
                    severity: has2fa ? "low" : "medium",
                  },
                  {
                    icon: KeyRound,
                    title: "Password Reuse",
                    value: reusesPassword ? "Reused elsewhere" : "Not reused",
                    severity: reusesPassword ? "medium" : "low",
                  },
                  {
                    icon: Archive,
                    title: "Old Accounts",
                    value: hasOldAccounts ? "Present" : "None reported",
                    severity: hasOldAccounts ? "medium" : "low",
                  },
                ].map((card, idx) => {
                  const severityClasses = {
                    high: "border-l-red-500 hover:border-red-500/60 hover:shadow-red-500/10",
                    medium: "border-l-amber-500 hover:border-amber-500/60 hover:shadow-amber-500/10",
                    low: "border-l-green-500 hover:border-green-500/60 hover:shadow-green-500/10",
                    neutral: "border-l-navy-700 hover:border-blue-500/60 hover:shadow-blue-500/10",
                  }[card.severity];
                  const iconColorClasses = {
                    high: "text-red-400",
                    medium: "text-amber-400",
                    low: "text-green-400",
                    neutral: "text-slate-400",
                  }[card.severity];
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      variants={item}
                      whileHover={{
                        rotateX: -3,
                        rotateY: 3,
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                      className={`rounded-lg border border-navy-700 border-l-4 bg-navy-800 p-4 shadow-lg shadow-transparent transition-shadow ${severityClasses}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <motion.span
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 14, delay: idx * 0.06 + 0.15 }}
                          className={iconColorClasses}
                        >
                          <Icon size={16} />
                        </motion.span>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">{card.title}</div>
                      </div>
                      <div className="text-slate-100 font-medium">{card.value}</div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>

            {mapResult.contributions?.length > 0 && (
              <motion.div variants={item}>
                <h3 className="text-slate-300 font-semibold mb-3">Score Contributions</h3>
                <div className="space-y-2">
                  {mapResult.contributions.map((c) => (
                    <div
                      key={c.signal}
                      className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3 text-sm"
                    >
                      <span className="text-slate-300">{c.reason}</span>
                      <span className="text-amber-400 font-semibold">+{c.points}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={item}>
              <h3 className="text-slate-300 font-semibold mb-3">Prediction Timeline</h3>
              {predictLoading && <FormSkeleton />}
              {predictError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                  {predictError}
                </div>
              )}
              {!predictLoading && predictions && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 italic">{predictions.disclaimer}</p>
                  <div className="relative pl-2">
                    {predictions.predictions.length > 1 && (
                      <motion.div
                        className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-400/60 via-blue-400/30 to-transparent origin-top"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6 + predictions.predictions.length * 0.15, ease: "easeOut" }}
                      />
                    )}
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                      {predictions.predictions.map((p, idx) => {
                        const isHigh = p.confidence_label === "high";
                        return (
                          <motion.div
                            key={idx}
                            variants={item}
                            className="relative rounded-lg border border-navy-700 bg-navy-800 p-4 pl-8"
                          >
                            <motion.span
                              className="absolute left-[7px] top-5 h-2.5 w-2.5 rounded-full bg-blue-400 ring-4 ring-navy-950"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 15, delay: idx * 0.1 + 0.2 }}
                            />
                            <div className="flex items-center gap-2 mb-1">
                              <motion.span
                                className={`text-xs px-2 py-0.5 rounded-full border ${CONFIDENCE_STYLES[p.confidence_label] || CONFIDENCE_STYLES.low}`}
                                animate={isHigh ? { opacity: [1, 0.6, 1] } : {}}
                                transition={isHigh ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
                              >
                                {p.confidence_label} confidence
                              </motion.span>
                            </div>
                            <p className="text-slate-200 text-sm leading-relaxed">{p.prediction_text}</p>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        <div>
          <h3 className="text-slate-300 font-semibold mb-3">Recent Activity</h3>
          <RecentActivityFeed userProfileId={mapResult?.user_profile_id} />
        </div>
      </main>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import RiskGauge from "./RiskGauge.jsx";
import CheckBreakdown from "./CheckBreakdown.jsx";

const VERDICT_STYLES = {
  Safe: "bg-green-500/10 border-green-500/40 text-green-400",
  Suspicious: "bg-amber-500/10 border-amber-500/40 text-amber-400",
  Dangerous: "bg-red-500/10 border-red-500/40 text-red-400",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ResultsView({ result, url }) {
  if (!result) return null;
  const verdictStyle = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.Suspicious;

  return (
    <motion.div
      className="mt-8 space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={item}
        className={`rounded-xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${verdictStyle}`}
      >
        <div>
          <div className="text-sm text-slate-400 mb-1 break-all">{url}</div>
          <div className="text-2xl font-bold">{result.verdict}</div>
          {result.from_cache && (
            <div className="text-xs mt-1 text-slate-400">Served from cache (checked recently)</div>
          )}
        </div>
        <RiskGauge score={result.risk_score} verdict={result.verdict} />
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
        <div className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
          AI Explanation
          {!result.ai_explanation_available && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
              Fallback
            </span>
          )}
        </div>
        <p className="text-slate-200 leading-relaxed">{result.ai_explanation}</p>
      </motion.div>

      <motion.div variants={item}>
        <h3 className="text-slate-300 font-semibold mb-3">Per-Check Breakdown</h3>
        <CheckBreakdown breakdown={result.breakdown} />
      </motion.div>
    </motion.div>
  );
}

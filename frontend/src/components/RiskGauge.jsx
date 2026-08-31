import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export default function RiskGauge({ score, verdict, label = "Risk Score" }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    verdict === "Dangerous" ? "#ef4444" : verdict === "Suspicious" ? "#f59e0b" : "#22c55e";
  const glowClass =
    verdict === "Dangerous"
      ? "bg-red-500/30"
      : verdict === "Suspicious"
        ? "bg-amber-500/25"
        : "bg-green-500/20";
  const pulseDuration = verdict === "Dangerous" ? 1.4 : verdict === "Suspicious" ? 2.2 : 3;

  const radius = 70;
  const circumference = Math.PI * radius; // half circle

  const springScore = useSpring(0, { stiffness: 60, damping: 18 });
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    springScore.set(clamped);
  }, [clamped, springScore]);

  useEffect(() => {
    const unsub = springScore.on("change", (v) => setDisplayScore(v));
    return unsub;
  }, [springScore]);

  const offset = useTransform(springScore, (v) => circumference - (v / 100) * circumference);

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 16 }}
    >
      <motion.div
        aria-hidden
        className={`absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${glowClass}`}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg width="180" height="100" viewBox="0 0 180 100" className="relative">
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <motion.path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="relative -mt-10 text-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>
          {Math.round(displayScore)}
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      </div>
    </motion.div>
  );
}

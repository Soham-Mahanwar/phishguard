import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "Recon agent choosing which checks to run...",
  "Running SSL, WHOIS, page-scrape, redirect, and typosquat checks...",
  "Analyst agent scoring risk...",
  "Reporter agent writing plain-English explanation...",
];

export default function AgentProgress() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 rounded-xl border border-navy-700 bg-navy-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-slate-300 font-medium">Running multi-agent analysis...</span>
      </div>
      <ul className="space-y-2">
        {STEPS.map((step, idx) => (
          <motion.li
            key={step}
            initial={{ opacity: 0.4, x: -6 }}
            animate={{
              opacity: idx <= stepIndex ? 1 : 0.4,
              x: 0,
              color: idx <= stepIndex ? "#e2e8f0" : "#64748b",
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-sm flex items-center gap-2"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={idx < stepIndex ? "done" : idx === stepIndex ? "active" : "pending"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {idx < stepIndex ? "✓" : idx === stepIndex ? "…" : "○"}
              </motion.span>
            </AnimatePresence>
            {step}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

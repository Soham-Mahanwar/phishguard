import { useEffect, useState } from "react";

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
          <li
            key={step}
            className={`text-sm flex items-center gap-2 transition-opacity ${
              idx <= stepIndex ? "opacity-100 text-slate-200" : "opacity-40 text-slate-500"
            }`}
          >
            <span>{idx < stepIndex ? "✓" : idx === stepIndex ? "…" : "○"}</span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

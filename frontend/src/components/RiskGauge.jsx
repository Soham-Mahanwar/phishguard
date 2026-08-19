export default function RiskGauge({ score, verdict }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    verdict === "Dangerous" ? "#ef4444" : verdict === "Suspicious" ? "#f59e0b" : "#22c55e";

  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="-mt-10 text-center">
        <div className="text-3xl font-bold" style={{ color }}>
          {Math.round(clamped)}
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">Risk Score</div>
      </div>
    </div>
  );
}

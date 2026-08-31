import RiskGauge from "./RiskGauge.jsx";

/** Adapts RiskGauge for the Shadow Score: maps a risk_label
 * (Low/Moderate/High Exposure) onto the same verdict-based color logic
 * RiskGauge already uses, so the visual language matches the phishing
 * risk gauge exactly.
 */
export default function ShadowGauge({ score, riskLabel }) {
  const verdict =
    riskLabel === "High Exposure" ? "Dangerous" : riskLabel === "Moderate Exposure" ? "Suspicious" : "Safe";

  return <RiskGauge score={score} verdict={verdict} label="Shadow Score" />;
}

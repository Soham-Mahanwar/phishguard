import { useState } from "react";

const STATUS_STYLES = {
  pass: { label: "Pass", classes: "bg-green-500/15 text-green-400 border-green-500/30" },
  fail: { label: "Fail", classes: "bg-red-500/15 text-red-400 border-red-500/30" },
  unknown: { label: "Unknown", classes: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

const CHECK_LABELS = {
  ssl_check: "SSL / HTTPS Certificate",
  whois: "Domain Age (WHOIS)",
  page_scrape: "Page Content Analysis",
  redirect_chain: "Redirect Chain",
  typosquat: "Brand Typosquat Match",
};

function CheckRow({ id, check }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[check.status] || STATUS_STYLES.unknown;

  return (
    <div className="border border-navy-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-navy-800 hover:bg-navy-700 transition-colors text-left"
      >
        <span className="font-medium text-slate-200">{CHECK_LABELS[id] || id}</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full border ${style.classes}`}>
            {style.label}
          </span>
          <span className="text-slate-500 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <pre className="bg-navy-950 text-xs text-slate-400 p-4 overflow-x-auto">
          {JSON.stringify(check.details, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function CheckBreakdown({ breakdown }) {
  return (
    <div className="space-y-2">
      {Object.entries(breakdown).map(([id, check]) => (
        <CheckRow key={id} id={id} check={check} />
      ))}
    </div>
  );
}

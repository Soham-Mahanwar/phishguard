import ResultsView from "./ResultsView.jsx";

export default function TextScanResults({ data }) {
  if (!data) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Urgency Language Found in Text</h3>
        {data.text_urgency_keywords_found?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.text_urgency_keywords_found.map((kw) => (
              <span key={kw} className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No urgency/pressure phrases detected.</p>
        )}
      </div>

      {data.urls_found?.length === 0 && (
        <p className="text-slate-500 text-sm">No URLs found in the pasted text.</p>
      )}

      {data.url_results?.map((r) => (
        <div key={r.url}>
          {r.error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3">
              {r.url}: {r.error}
            </div>
          ) : (
            <ResultsView result={r} url={r.url} />
          )}
        </div>
      ))}
    </div>
  );
}

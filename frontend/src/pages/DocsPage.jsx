import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Info,
  GitBranch as AccountTree,
  Shield,
  Brain,
  Sigma,
  Layers,
  AlertTriangle,
  Lock,
  Search,
  Terminal,
  GitBranch,
  ShieldAlert,
  Database,
  Moon,
  Sun,
  Link2,
  Globe,
  ClipboardCopy,
} from "lucide-react";
import ToolCard from "../components/ToolCard.jsx";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "architecture", label: "Architecture", icon: AccountTree },
  { id: "detection-tools", label: "Detection Tools", icon: Shield },
  { id: "ai-layer", label: "The AI Layer", icon: Brain },
  { id: "scoring-formula", label: "Scoring Formula", icon: Sigma },
  { id: "tech-stack", label: "Tech Stack", icon: Layers },
  { id: "limitations", label: "Limitations", icon: AlertTriangle },
];

const TOOLS = [
  {
    icon: Lock,
    title: "SSL Check",
    description:
      "Opens a raw TLS socket to port 443 and inspects the certificate: HTTPS availability, validity, issuer, and expiry.",
  },
  {
    icon: Search,
    title: "WHOIS Lookup",
    description:
      "Uses the free python-whois library to fetch domain creation date and registrar. Falls back to 'unknown' gracefully on lookup failure.",
  },
  {
    icon: Terminal,
    title: "Page Scraper",
    description:
      "Fetches the live page and parses it for login/password forms, HTTP-vs-HTTPS form submission, external script domains, meta-refresh redirects, and urgency-language keywords.",
  },
  {
    icon: GitBranch,
    title: "Redirect Chain",
    description:
      "Follows up to 5 redirects and flags whether the final landing domain differs from the domain you entered.",
  },
  {
    icon: ShieldAlert,
    title: "Typosquat Detection",
    description:
      "Computes Levenshtein edit distance against ~100 commonly spoofed Indian and global brand domains to catch close-but-not-exact matches.",
  },
  {
    icon: Database,
    title: "Cache Layer",
    description:
      "SQLite-backed cache: repeat checks on the same domain within 24 hours skip every tool call and the AI pipeline entirely.",
  },
];

// Mirrors backend/app/scoring.py WEIGHTS exactly — keep in sync with that file.
const SCORING_ROWS = [
  { signal: "No HTTPS at all", points: 15, condition: "https_available == False" },
  { signal: "Invalid / expired / self-signed certificate", points: 20, condition: "HTTPS present but cert invalid" },
  { signal: "Domain registered < 30 days ago", points: 20, condition: "WHOIS domain_age_days < 30" },
  { signal: "Domain registered < 180 days ago", points: 10, condition: "WHOIS domain_age_days < 180" },
  { signal: "Login form submits over HTTP", points: 20, condition: "password field + HTTP form action" },
  { signal: "Urgency-language keywords found", points: "up to 10", condition: "3 pts per keyword hit, capped at 10" },
  { signal: "Meta-refresh auto-redirect present", points: 5, condition: "<meta http-equiv=\"refresh\"> found" },
  { signal: "Final redirect lands on a different domain", points: 15, condition: "redirect chain domain mismatch" },
  { signal: "Domain closely matches a known brand", points: 25, condition: "Levenshtein distance ≤ 2, not exact" },
  { signal: "Page loads scripts from 4+ external domains", points: 5, condition: "external script domain count ≥ 4" },
];

const FORMULA_TEXT =
  "score = min(100, sum(points for each triggered signal)); unknown signals contribute 0";

function useScrollSpy(sectionIds) {
  const [activeId, setActiveId] = useState(sectionIds[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: "-80px 0px -40% 0px" }
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}

function smoothScrollTo(id) {
  const target = document.getElementById(id);
  if (target) {
    window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
  }
}

function useDocsDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem("docs-theme");
      if (stored) return stored === "dark";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("docs-theme", isDark ? "dark" : "light");
    } catch {
      // localStorage unavailable — theme just won't persist across reloads
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDark]);

  return [isDark, setIsDark];
}

export default function DocsPage() {
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeId = useScrollSpy(sectionIds);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useDocsDarkMode();

  function copyFormula() {
    navigator.clipboard.writeText(FORMULA_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="font-body text-doc-body-md bg-doc-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-doc-surface border-b border-doc-outline-variant">
        <div className="flex items-center gap-4">
          <span className="font-headline text-doc-headline-sm font-bold text-doc-primary">PhishGuard Docs</span>
          <div className="hidden md:flex ml-8 gap-6 items-center">
            <a
              className="font-body text-doc-body-md text-doc-on-surface-variant hover:text-doc-primary transition-colors duration-200"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <Link
              to="/"
              className="font-body text-doc-body-md text-doc-on-surface-variant hover:text-doc-primary transition-colors duration-200"
            >
              Landing Page
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            className="p-2 cursor-pointer transition-all duration-200 hover:bg-doc-surface-container-low rounded-full"
          >
            {isDark ? (
              <Sun className="text-doc-primary" size={20} />
            ) : (
              <Moon className="text-doc-primary" size={20} />
            )}
          </button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 w-sidebar-width h-screen bg-doc-background hidden md:block overflow-y-auto doc-sidebar-scroll">
          <nav className="flex flex-col gap-1 py-4 px-2 w-sidebar-width">
            <div className="px-4 py-2 mb-4">
              <h3 className="font-headline text-doc-headline-sm font-bold text-doc-on-surface">PhishGuard Docs</h3>
              <p className="font-body text-doc-body-sm text-doc-on-surface-variant">Technical Reference</p>
            </div>
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = activeId === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    smoothScrollTo(id);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 transition-all duration-200 font-body text-doc-body-sm rounded-lg ${
                    isActive
                      ? "bg-doc-secondary-container text-doc-on-secondary-container border-l-2 border-doc-primary rounded-r-lg"
                      : "text-doc-on-surface-variant hover:bg-doc-surface-container-high"
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow md:ml-sidebar-width px-margin-mobile md:px-gutter py-8 bg-doc-surface-container-lowest min-h-screen">
          <div className="max-w-[720px] mx-auto doc-content">
            <section className="mb-16" id="overview">
              <h1 className="font-headline text-doc-headline-xl text-doc-on-background mb-4">Technical Overview</h1>
              <p className="font-body text-doc-body-lg text-doc-on-surface-variant leading-relaxed">
                PhishGuard combines real, live-network security signals (SSL, WHOIS, page content, redirects,
                typosquat matching) with a single AI reasoning step running on a local Ollama model. Nothing
                here calls a paid third-party API — every check either connects directly to the site being
                analyzed or runs against a local LLM.
              </p>
            </section>

            <section className="mb-16" id="architecture">
              <h2 className="font-headline text-doc-headline-lg text-doc-on-background mb-6 border-b border-doc-outline-variant pb-2">
                Architecture
              </h2>
              <div className="bg-doc-surface-container p-6 rounded-xl border border-doc-outline-variant my-8 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex flex-col items-center min-w-fit">
                  <div className="bg-doc-primary text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                    <Link2 size={20} />
                  </div>
                  <span className="text-xs font-body font-medium mt-2">URL</span>
                </div>
                <div className="doc-flow-line w-8" />
                <div className="flex flex-col gap-2 p-3 bg-doc-surface-container-lowest border border-doc-outline-variant rounded-lg min-w-fit">
                  <div className="flex gap-2">
                    <Lock className="text-doc-primary" size={16} />
                    <Globe className="text-doc-primary" size={16} />
                    <Terminal className="text-doc-primary" size={16} />
                  </div>
                  <span className="text-[10px] font-body font-medium text-center">Recon (5 tools)</span>
                </div>
                <div className="doc-flow-line w-8" />
                <div className="flex flex-col gap-2 p-3 bg-doc-surface-container-lowest border border-doc-outline-variant rounded-lg min-w-fit">
                  <div className="flex gap-2">
                    <Sigma className="text-doc-tertiary" size={16} />
                  </div>
                  <span className="text-[10px] font-body font-medium text-center">Scoring</span>
                </div>
                <div className="doc-flow-line w-8" />
                <div className="flex flex-col gap-2 p-3 bg-doc-surface-container-lowest border border-doc-outline-variant rounded-lg min-w-fit">
                  <div className="flex gap-2">
                    <Brain className="text-doc-tertiary" size={16} />
                  </div>
                  <span className="text-[10px] font-body font-medium text-center">AI Reasoning (1 call)</span>
                </div>
                <div className="doc-flow-line w-8" />
                <div className="flex flex-col items-center min-w-fit">
                  <div className="bg-doc-on-background text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                    <Shield size={20} />
                  </div>
                  <span className="text-xs font-body font-medium mt-2">Verdict</span>
                </div>
              </div>
              <p className="font-body text-doc-body-md text-doc-on-surface-variant leading-relaxed">
                The Recon step runs all five tools deterministically in Python (each independently wrapped in
                try/except, degrading to "unknown" on failure) before any LLM call — real network I/O is kept
                out of the LLM's control path entirely. The score is then computed by a fixed formula, and the
                results are packaged into a single structured prompt sent once to a local Ollama model, under
                a hard timeout with a raw-analysis fallback if it's slow or unavailable.
              </p>
            </section>

            <section className="mb-16" id="detection-tools">
              <h2 className="font-headline text-doc-headline-lg text-doc-on-background mb-6 border-b border-doc-outline-variant pb-2">
                Detection Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOOLS.map((tool) => (
                  <ToolCard key={tool.title} {...tool} />
                ))}
              </div>
            </section>

            <section className="mb-16" id="ai-layer">
              <h2 className="font-headline text-doc-headline-lg text-doc-on-background mb-6 border-b border-doc-outline-variant pb-2">
                The AI Layer
              </h2>
              <p className="font-body text-doc-body-md text-doc-on-surface-variant leading-relaxed mb-4">
                Detection and scoring happen entirely in deterministic Python before the model is ever called.
                Once every tool has run and the risk score is computed, PhishGuard makes exactly{" "}
                <strong>one</strong> call to a local <code>gemma3:4b</code> model served by Ollama — no OpenAI
                key required, and no framework overhead from chaining multiple LLM calls together.
              </p>
              <p className="font-body text-doc-body-md text-doc-on-surface-variant leading-relaxed mb-4">
                The prompt packages every finding — SSL status, domain age, page content signals, redirect
                behavior, typosquat match, and the computed score/verdict — into one structured request, and
                asks the model for a 2-3 sentence plain-English explanation that references the specific
                signals found rather than inventing anything. The call has a 10-second timeout: if Ollama is
                slow or unreachable, the API still returns the full deterministic score and breakdown, with a
                note that the AI explanation is unavailable.
              </p>
              <p className="font-body text-doc-body-md text-doc-on-surface-variant leading-relaxed">
                This single-call design replaced an earlier 3-step pipeline (separate recon/analysis/reporting
                calls chained through an agent framework) after profiling showed the extra sequential LLM calls
                added 15-30+ seconds per check on consumer GPU hardware with no meaningful gain in explanation
                quality — the same real tool data now reaches the model in one pass, typically in 3-6 seconds.
              </p>
            </section>

            <section className="mb-16" id="scoring-formula">
              <h2 className="font-headline text-doc-headline-lg text-doc-on-background mb-6 border-b border-doc-outline-variant pb-2">
                Scoring Formula
              </h2>
              <div className="relative group mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-doc-primary to-doc-primary-container opacity-10 blur rounded-xl" />
                <div className="relative bg-[#0f172a] p-8 rounded-xl border border-slate-700 shadow-2xl overflow-x-auto">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 font-body text-xs uppercase tracking-widest">scoring.py</span>
                    <button
                      onClick={copyFormula}
                      className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
                    >
                      <ClipboardCopy size={14} />
                      {copied ? "Copied!" : ""}
                    </button>
                  </div>
                  <pre className="font-mono text-slate-100 whitespace-pre-wrap text-sm">
                    <span className="text-pink-400">score</span> = <span className="text-amber-400">min</span>(100,{" "}
                    <span className="text-amber-400">sum</span>(
                    <span className="text-blue-400">points_i</span> for each triggered{" "}
                    <span className="text-green-400">signal_i</span>))
                    {"\n"}
                    <span className="text-slate-500"># signals that couldn't be determined contribute 0 points</span>
                  </pre>
                </div>
              </div>
              <p className="font-body text-doc-body-md text-doc-on-surface-variant mb-4">
                This is a fixed, auditable point system — deliberately <em>not</em> computed by the LLM, so the
                same input always produces the same score. The Analyst Agent is given these exact contributions
                and explains them; it does not invent its own number.
              </p>
              <div className="overflow-x-auto rounded-xl border border-doc-outline-variant">
                <table className="w-full text-left font-body text-doc-body-sm">
                  <thead className="bg-doc-surface-container-high text-doc-on-surface-variant uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Signal</th>
                      <th className="px-4 py-3">Points</th>
                      <th className="px-4 py-3">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCORING_ROWS.map((row) => (
                      <tr key={row.signal} className="border-t border-doc-outline-variant bg-doc-surface-container-lowest">
                        <td className="px-4 py-3 text-doc-on-surface">{row.signal}</td>
                        <td className="px-4 py-3 text-doc-primary font-semibold">{row.points}</td>
                        <td className="px-4 py-3 text-doc-on-surface-variant">
                          <code>{row.condition}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="font-body text-doc-body-sm text-doc-on-surface-variant mt-4">
                Verdict thresholds: <code>score ≥ 60</code> → Dangerous, <code>score ≥ 30</code> → Suspicious,
                else Safe.
              </p>
            </section>

            <section className="mb-16" id="tech-stack">
              <h2 className="font-headline text-doc-headline-lg text-doc-on-background mb-6 border-b border-doc-outline-variant pb-2">
                Tech Stack
              </h2>
              <ul className="space-y-3 font-body text-doc-body-md text-doc-on-surface-variant list-disc pl-5">
                <li>
                  <strong>Frontend:</strong> React + Tailwind CSS (Vite)
                </li>
                <li>
                  <strong>Backend:</strong> Python FastAPI
                </li>
                <li>
                  <strong>Database:</strong> SQLite via SQLAlchemy ORM (swappable for Postgres)
                </li>
                <li>
                  <strong>AI reasoning:</strong> a single direct HTTP call per check, no agent framework
                </li>
                <li>
                  <strong>LLM:</strong> Ollama running <code>gemma3:4b</code> on <code>localhost:11434</code> —
                  no external API key
                </li>
              </ul>
            </section>

            <section className="mb-16" id="limitations">
              <h2 className="font-headline text-doc-headline-lg text-doc-on-background mb-6 border-b border-doc-outline-variant pb-2">
                Limitations
              </h2>
              <div className="p-6 bg-doc-surface-container-low border-l-4 border-doc-primary rounded-r-xl">
                <div className="flex items-center gap-2 mb-4 text-doc-primary">
                  <Info size={18} />
                  <span className="font-bold uppercase tracking-wider text-xs">Technical Constraints</span>
                </div>
                <ul className="space-y-3 font-body text-doc-body-md text-doc-on-surface-variant list-disc pl-5">
                  <li>
                    <strong>WHOIS lookup failures:</strong> Many registrars rate-limit or redact WHOIS data;
                    when this happens domain age is reported as "unknown" and contributes 0 points rather than
                    being guessed.
                  </li>
                  <li>
                    <strong>AI explanation timeout:</strong> The single Ollama call has a hard 10-second
                    timeout (<code>OLLAMA_TIMEOUT_SECONDS</code>). If Ollama is slow or unreachable, the API
                    still returns the full deterministic score and breakdown, with a note that the AI
                    explanation is unavailable — it never blocks or fails the request.
                  </li>
                  <li>
                    <strong>Typosquat list is finite:</strong> Brand matching checks against a hardcoded list of
                    ~100 commonly spoofed Indian and global domains, not an exhaustive registry.
                  </li>
                  <li>
                    <strong>JavaScript-rendered content:</strong> The page scraper fetches static HTML; content
                    injected only after complex client-side interaction may not be seen.
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </main>

        {/* Right Sidebar (Table of Contents) */}
        <aside className="fixed right-0 top-16 w-[240px] h-screen hidden lg:block border-l border-doc-outline-variant p-6">
          <h5 className="font-body text-xs uppercase text-doc-outline mb-4 tracking-widest font-medium">On This Page</h5>
          <ul className="space-y-4">
            {SECTIONS.map(({ id, label }) => {
              const isActive = activeId === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      smoothScrollTo(id);
                    }}
                    className={`font-body text-doc-body-sm block border-l-2 pl-3 transition-colors ${
                      isActive
                        ? "text-doc-primary border-doc-primary font-semibold"
                        : "text-doc-on-surface-variant border-transparent hover:text-doc-primary"
                    }`}
                  >
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="mt-12 pt-8 border-t border-doc-outline-variant">
            <p className="text-[10px] text-doc-outline leading-relaxed">
              Last updated: Jul 2026
              <br />
              Version: 1.0.0
            </p>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="md:ml-sidebar-width flex flex-col md:flex-row justify-between items-center px-gutter py-8 mt-section-padding bg-doc-surface border-t border-doc-outline-variant relative z-10">
        <p className="font-body text-doc-body-sm text-doc-on-surface-variant">© 2026 PhishGuard Security. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="font-body text-doc-body-sm text-doc-on-surface-variant hover:text-doc-primary transition-colors duration-200" href="#">
            Privacy Policy
          </a>
          <a className="font-body text-doc-body-sm text-doc-on-surface-variant hover:text-doc-primary transition-colors duration-200" href="#">
            Terms of Service
          </a>
          <a className="font-body text-doc-body-sm text-doc-on-surface-variant hover:text-doc-primary transition-colors duration-200" href="#">
            Security Architecture
          </a>
        </div>
      </footer>
    </div>
  );
}

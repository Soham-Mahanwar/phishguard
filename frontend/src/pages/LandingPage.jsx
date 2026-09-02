import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Brain,
  Zap,
  ArrowRight,
  Radar,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Mail,
} from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import { checkUrl } from "../api/checkUrl.js";

const AGENT_STEPS = [
  "Recon agent choosing checks...",
  "Analyst scoring risk...",
  "Reporter writing explanation...",
];

const VERDICT_BADGE = {
  Dangerous: { label: "HIGH RISK", classes: "bg-land-error/10 border-land-error/30 text-land-error" },
  Suspicious: { label: "SUSPICIOUS", classes: "bg-amber-400/10 border-amber-400/30 text-amber-300" },
  Safe: { label: "SAFE", classes: "bg-land-secondary-fixed/10 border-land-secondary-fixed/30 text-land-secondary-fixed-dim" },
};

function DemoCardIdle() {
  return (
    <>
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="text-label-sm font-bold text-land-on-surface-variant uppercase mb-1">Threat Score</div>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-bold text-land-error">85</span>
            <span className="text-xl text-land-on-surface-variant/50">/100</span>
          </div>
        </div>
        <div className="bg-land-error/10 border border-land-error/30 text-land-error px-4 py-1.5 rounded-land-full font-label-md text-label-md">
          HIGH RISK
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-1 bg-land-error rounded-full" />
          <div className="flex-grow">
            <div className="font-label-md text-land-on-surface mb-1">AI Explanation</div>
            <p className="font-body text-body-md text-land-on-surface-variant">
              This site mimics a popular bank login but was created 2 days ago in a high-risk region. SSL
              certificate is self-signed.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-land-surface-container-high/40 border border-white/5">
            <div className="text-[10px] uppercase font-bold text-land-on-surface-variant/60 mb-1">Domain Age</div>
            <div className="text-label-md text-land-error">2 Days Old</div>
          </div>
          <div className="p-4 rounded-2xl bg-land-surface-container-high/40 border border-white/5">
            <div className="text-[10px] uppercase font-bold text-land-on-surface-variant/60 mb-1">SSL Cert</div>
            <div className="text-label-md text-land-error">Untrusted</div>
          </div>
        </div>
        <button
          disabled
          className="w-full bg-land-error text-land-on-error font-label-md py-4 rounded-2xl flex items-center justify-center gap-2 opacity-90"
        >
          <Ban size={20} />
          Prevent Connection
        </button>
      </div>
    </>
  );
}

function DemoCardLoading() {
  const [stepIndex] = useState(() => 0);
  return (
    <div className="py-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="h-2.5 w-2.5 rounded-full bg-land-primary pulse-dot" />
        <span className="font-label-md text-label-md text-land-on-surface">Analyzing URL...</span>
      </div>
      <ul className="space-y-3">
        {AGENT_STEPS.map((step, idx) => (
          <li key={step} className="flex items-center gap-3 font-body text-body-md text-land-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-land-primary/60 animate-pulse" style={{ animationDelay: `${idx * 200}ms` }} />
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoCardError({ message }) {
  return (
    <div className="py-10 text-center">
      <ShieldAlert className="mx-auto mb-4 text-land-error" size={40} />
      <div className="font-label-md text-land-on-surface mb-2">Couldn't analyze this URL</div>
      <p className="font-body text-body-sm text-land-on-surface-variant">{message}</p>
    </div>
  );
}

function DemoCardResult({ result }) {
  const badge = VERDICT_BADGE[result.verdict] || VERDICT_BADGE.Suspicious;
  const scoreColor =
    result.verdict === "Dangerous" ? "text-land-error" : result.verdict === "Suspicious" ? "text-amber-300" : "text-land-secondary-fixed-dim";

  const sslDetails = result.breakdown?.ssl_check?.details;
  const whoisDetails = result.breakdown?.whois?.details;

  const sslLabel =
    sslDetails?.https_available && sslDetails?.cert_valid
      ? "Valid"
      : sslDetails?.https_available
      ? "Untrusted"
      : sslDetails
      ? "No HTTPS"
      : "Unknown";

  const domainAgeLabel =
    typeof whoisDetails?.domain_age_days === "number" ? `${whoisDetails.domain_age_days} Days Old` : "Unknown";

  return (
    <>
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="text-label-sm font-bold text-land-on-surface-variant uppercase mb-1">Threat Score</div>
          <div className="flex items-baseline gap-1">
            <span className={`text-6xl font-bold ${scoreColor}`}>{Math.round(result.risk_score)}</span>
            <span className="text-xl text-land-on-surface-variant/50">/100</span>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-land-full font-label-md text-label-md border ${badge.classes}`}>
          {badge.label}
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className={`w-1 rounded-full ${scoreColor.replace("text-", "bg-")}`} />
          <div className="flex-grow">
            <div className="font-label-md text-land-on-surface mb-1 flex items-center gap-2">
              AI Explanation
              {!result.ai_explanation_available && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-land-on-surface-variant border border-white/10">
                  Fallback
                </span>
              )}
            </div>
            <p className="font-body text-body-md text-land-on-surface-variant">{result.ai_explanation}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-land-surface-container-high/40 border border-white/5">
            <div className="text-[10px] uppercase font-bold text-land-on-surface-variant/60 mb-1">Domain Age</div>
            <div className={`text-label-md ${scoreColor}`}>{domainAgeLabel}</div>
          </div>
          <div className="p-4 rounded-2xl bg-land-surface-container-high/40 border border-white/5">
            <div className="text-[10px] uppercase font-bold text-land-on-surface-variant/60 mb-1">SSL Cert</div>
            <div className={`text-label-md ${scoreColor}`}>{sslLabel}</div>
          </div>
        </div>
        {result.verdict === "Safe" ? (
          <div className="w-full bg-land-secondary-fixed/10 border border-land-secondary-fixed/30 text-land-secondary-fixed-dim font-label-md py-4 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle2 size={20} />
            Looks Safe to Visit
          </div>
        ) : (
          <div className="w-full bg-land-error text-land-on-error font-label-md py-4 rounded-2xl flex items-center justify-center gap-2">
            <Ban size={20} />
            Proceed with Caution
          </div>
        )}
      </div>
    </>
  );
}

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const heroInputRef = useRef(null);

  async function handleCheck() {
    if (!url.trim() || state === "loading") return;
    setState("loading");
    setError(null);
    try {
      const data = await checkUrl(url.trim());
      setResult(data);
      setState("result");
    } catch (e) {
      setError(e.message || "Something went wrong. Is the backend running?");
      setState("error");
    }
  }

  function scrollToChecker() {
    heroInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    heroInputRef.current?.focus();
  }

  return (
    <div className="bg-land-background text-land-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-land-background/80 backdrop-blur-xl border-b border-white/10 h-20">
        <nav className="flex justify-between items-center px-gutter max-w-container-max mx-auto h-full">
          <div className="font-headline text-headline-md font-bold text-land-primary">PhishGuard</div>
          <div className="hidden md:flex gap-8 items-center font-label-md text-label-md">
            <a href="#hero" className="text-land-primary border-b-2 border-land-primary pb-1 active:scale-95 transition-transform">
              Platform
            </a>
            <Link to="/docs" className="text-land-on-surface-variant hover:text-land-primary transition-colors duration-300 active:scale-95 transition-transform">
              Docs
            </Link>
            <Link to="/app" className="text-land-on-surface-variant hover:text-land-primary transition-colors duration-300 active:scale-95 transition-transform">
              Full Checker
            </Link>
          </div>
          <button
            onClick={scrollToChecker}
            className="bg-land-primary-container text-land-on-primary-container font-label-md px-6 py-3 rounded-land-full hover:brightness-110 active:scale-95 transition-all primary-glow"
          >
            Try for free
          </button>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden hero-gradient">
          <div className="relative z-10 max-w-[900px] mx-auto px-gutter text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 glass-card rounded-land-full border-land-primary/20">
              <span className="w-2 h-2 rounded-full bg-land-secondary-fixed pulse-dot" />
              <span className="text-label-sm font-label-sm text-land-secondary-fixed-dim uppercase tracking-widest">
                Active System Protection
              </span>
            </div>
            <h1 className="font-headline text-headline-xl mb-6 text-land-on-surface max-md:text-headline-xl-mobile">
              Stop clicking on fake websites <span className="text-land-primary">before it's too late</span>
            </h1>
            <p className="font-body text-body-lg text-land-on-surface-variant mb-10 max-w-2xl mx-auto">
              PhishGuard checks any URL for phishing risk using SSL verification, domain age, and advanced AI
              analysis.
            </p>

            <div className="max-w-xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row gap-3 p-2 rounded-2xl glass-card border-white/10">
                <input
                  ref={heroInputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  className="flex-grow bg-land-surface-container-lowest border-none rounded-xl px-6 py-4 text-land-on-surface placeholder:text-land-on-surface-variant/40 focus:ring-2 focus:ring-land-primary transition-all outline-none"
                  placeholder="Paste URL to analyze (e.g., https://secure-login.com)"
                  type="text"
                />
                <button
                  onClick={handleCheck}
                  disabled={state === "loading"}
                  className="bg-land-primary-container text-land-on-primary-container font-label-md px-8 py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all whitespace-nowrap disabled:opacity-60"
                >
                  {state === "loading" ? "Checking..." : "Check Now"}
                </button>
              </div>

              {state !== "idle" && (
                <div className="relative glass-card p-6 md:p-8 rounded-[32px] border-white/5 overflow-hidden shadow-2xl mt-4 text-left">
                  {state === "loading" && <DemoCardLoading />}
                  {state === "error" && <DemoCardError message={error} />}
                  {state === "result" && result && <DemoCardResult result={result} />}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-land-on-surface-variant">
              <div className="flex items-center gap-2 font-label-md">
                <ShieldCheck className="text-land-secondary-fixed-dim" size={20} />
                SSL Verified
              </div>
              <div className="flex items-center gap-2 font-label-md">
                <Brain className="text-land-primary" size={20} />
                AI-Powered
              </div>
              <div className="flex items-center gap-2 font-label-md">
                <Zap className="text-land-tertiary" size={20} />
                Real-Time
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-section-gap px-gutter max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="font-headline text-headline-lg mb-4">The Growing Threat</h2>
              <p className="font-body text-body-lg text-land-on-surface-variant max-w-xl">
                Phishing attacks are evolving. Traditional filters aren't enough to catch modern social
                engineering tactics.
              </p>
            </div>
            <Link to="/docs" className="text-land-primary font-label-md flex items-center gap-2 cursor-pointer group">
              View Threat Report <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard className="p-10 rounded-3xl border-t-4 border-t-land-error">
              <div className="text-headline-lg font-bold text-land-error mb-4">₹1,500 Cr</div>
              <p className="font-body text-body-md text-land-on-surface-variant leading-relaxed">
                lost to digital scams in India during 2023 alone, marking a record high in financial fraud.
              </p>
            </GlassCard>
            <GlassCard className="p-10 rounded-3xl border-t-4 border-t-land-secondary-container">
              <div className="text-headline-lg font-bold text-land-secondary-container mb-4">75%</div>
              <p className="font-body text-body-md text-land-on-surface-variant leading-relaxed">
                increase in UPI-related phishing attacks, targeting mobile users via malicious links.
              </p>
            </GlassCard>
            <GlassCard className="p-10 rounded-3xl border-t-4 border-t-land-primary">
              <div className="text-headline-lg font-bold text-land-primary mb-4">90%</div>
              <p className="font-body text-body-md text-land-on-surface-variant leading-relaxed">
                of data breaches start with a single phishing email that bypasses standard security.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-section-gap bg-land-surface-container-low/50 relative overflow-hidden">
          <div className="max-w-container-max mx-auto px-gutter relative z-10">
            <div className="text-center mb-20">
              <h2 className="font-headline text-headline-lg mb-4">How It Works</h2>
              <p className="font-body text-body-lg text-land-on-surface-variant max-w-2xl mx-auto">
                Real security checks run first, a deterministic formula scores the risk, then one AI call turns
                the findings into a plain-English explanation — no guesswork, no black box.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-land-primary/30 to-transparent -z-10" />
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mb-8 border-land-primary/20 group-hover:scale-110 transition-transform">
                  <Radar className="text-land-primary" size={32} />
                </div>
                <h3 className="font-headline text-headline-md mb-4">Recon</h3>
                <p className="font-body text-body-md text-land-on-surface-variant">
                  Runs SSL, WHOIS, page-content, redirect-chain, and typosquat checks directly against the live
                  site, flagging priority signals like broken SSL early.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mb-8 border-land-primary/20 group-hover:scale-110 transition-transform">
                  <BarChart3 className="text-land-primary" size={32} />
                </div>
                <h3 className="font-headline text-headline-md mb-4">Scoring</h3>
                <p className="font-body text-body-md text-land-on-surface-variant">
                  A fixed, auditable weighted formula computes the 0-100 risk score in plain Python — the same
                  input always produces the same score.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mb-8 border-land-primary/20 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="text-land-primary" size={32} />
                </div>
                <h3 className="font-headline text-headline-md mb-4">AI Explanation</h3>
                <p className="font-body text-body-md text-land-on-surface-variant">
                  One local Ollama call turns the findings into a clear, human-readable explanation for
                  non-technical users — with a safe fallback if it's ever unavailable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Preview */}
        <section className="py-section-gap px-gutter max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline text-headline-lg mb-6">See it in Action</h2>
              <p className="font-body text-body-lg text-land-on-surface-variant mb-8">
                Get instant, actionable intelligence. Our platform doesn't just block; it educates users on why
                a site is dangerous.
              </p>
              <ul className="space-y-4 font-body text-body-md">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-land-secondary-fixed" size={20} /> Real-time domain registration
                  tracking
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-land-secondary-fixed" size={20} /> Brand typosquat detection
                  against known domains
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-land-secondary-fixed" size={20} /> Redirect chain and cloaking
                  detection
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-land-primary/10 blur-3xl rounded-full" />
              <div className="relative glass-card p-8 md:p-12 rounded-[40px] border-white/5 overflow-hidden shadow-2xl min-h-[420px] flex flex-col justify-center">
                {state === "idle" && <DemoCardIdle />}
                {state === "loading" && <DemoCardLoading />}
                {state === "error" && <DemoCardError message={error} />}
                {state === "result" && result && <DemoCardResult result={result} />}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-land-surface-container-lowest w-full py-section-gap border-t border-white/5">
        <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="font-headline text-headline-md text-land-primary font-bold">PhishGuard</div>
            <p className="font-body text-body-md text-land-on-surface-variant text-center md:text-left">
              © 2026 PhishGuard Team. Absolute Digital Sovereignty.
            </p>
          </div>
          <div className="flex gap-8 font-body text-body-md text-land-on-surface-variant">
            <a className="hover:text-land-secondary-fixed transition-colors opacity-80 hover:opacity-100" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-land-secondary-fixed transition-colors opacity-80 hover:opacity-100" href="#">
              Terms of Service
            </a>
            <Link to="/docs" className="hover:text-land-secondary-fixed transition-colors opacity-80 hover:opacity-100">
              Security Compliance
            </Link>
          </div>
          <div className="flex gap-4">
            <a
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-land-on-surface-variant hover:text-land-primary transition-all"
              href="#"
            >
              <Mail size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

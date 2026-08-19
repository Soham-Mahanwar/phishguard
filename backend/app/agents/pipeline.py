"""Top-level pipeline: Recon (deterministic tools) -> deterministic scoring
-> single Ollama call for the plain-English explanation -> cache save.

Replaces the earlier CrewAI-based 3-agent design. That design ran three
sequential LLM calls (Recon -> Analyst -> Reporter agents) through a
framework whose thread-pool-based timeout could leave orphaned background
work running past the configured limit, causing requests to hang well
beyond the intended cap on constrained hardware (e.g. a 4GB VRAM GPU).
This version makes exactly one LLM call via a plain `requests.post(...,
timeout=...)`, which fails fast and predictably at the OS socket level.
"""
from app.agents.recon import run_recon
from app.agents.scoring_helpers import compute_scoring_payload, build_breakdown
from app.agents.llm_explain import generate_explanation
from app.tools.cache_tools import cache_save


def run_pipeline(url: str) -> dict:
    recon_output = run_recon(url)

    if recon_output.get("cache_hit"):
        return {
            "risk_score": recon_output["risk_score"],
            "verdict": recon_output["verdict"],
            "breakdown": recon_output["breakdown"],
            "ai_explanation": recon_output.get("ai_explanation"),
            "ai_explanation_available": recon_output.get("ai_explanation_available", False),
            "from_cache": True,
        }

    tool_outputs = recon_output["tool_outputs"]
    scoring = compute_scoring_payload(tool_outputs)
    breakdown = build_breakdown(tool_outputs)

    ai_explanation, ai_explanation_available = generate_explanation(
        url, tool_outputs, scoring["score"], scoring["verdict"]
    )

    result = {
        "risk_score": scoring["score"],
        "verdict": scoring["verdict"],
        "breakdown": breakdown,
        "scoring_contributions": scoring["contributions"],
        "ai_explanation": ai_explanation,
        "ai_explanation_available": ai_explanation_available,
        "from_cache": False,
    }

    cache_save(url, result)
    return result

"use client";

import { useGraphStore, useSlotGraph } from "@/store/graphStore";
import { useHighlightStore } from "@/store/highlightStore";
import { useProjectStore } from "@/store/projectStore";
import { CiteButton } from "@/components/shared/CiteButton";

const CATEGORY_META: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  finding: {
    color: "#E85D82",
    bg: "rgba(232,93,130,0.10)",
    label: "Finding",
  },
  result: {
    color: "#FF7A8A",
    bg: "rgba(255,122,138,0.10)",
    label: "Result",
  },
  contribution: {
    color: "#E8A231",
    bg: "rgba(232,162,49,0.10)",
    label: "Contribution",
  },
  limitation: {
    color: "#F2A65A",
    bg: "rgba(242,166,90,0.10)",
    label: "Limitation",
  },
  methodology: {
    color: "#3ECF8E",
    bg: "rgba(62,207,142,0.10)",
    label: "Methodology",
  },
  implication: {
    color: "#4A9EFF",
    bg: "rgba(74,158,255,0.10)",
    label: "Implication",
  },
  gap: {
    color: "#9F7AEA",
    bg: "rgba(159,122,234,0.10)",
    label: "Gap",
  },
};

const CONFIDENCE_DOT: Record<string, string> = {
  high: "#3ECF8E",
  medium: "#E8A231",
  low: "#E85D82",
};

export function InsightsPanel() {
  const activeSlotId = useProjectStore((s) => s.activeSlotId);
  const { insights, isLoading, summary, rawNodes } = useSlotGraph(activeSlotId);
  const setFocus = useHighlightStore((s) => s.setFocus);
  const filename = useProjectStore((s) => s.slots[s.activeSlotId]?.filename ?? "");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em] animate-pulse">
          Synthesizing insights…
        </p>
      </div>
    );
  }

  if (!insights.length && !summary) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
          insights will appear here
        </p>
      </div>
    );
  }

  const focusOnQuote = (quote: string) => {
    if (!quote) return;
    const exact = rawNodes.find((n) => n.source_quote === quote);
    if (exact) {
      setFocus(exact.source_quote, exact.id);
      return;
    }
    setFocus(quote, "_evidence_");
  };

  const handleEvidenceClick = (insight: {
    evidence_quote?: string;
    evidence_hint?: string;
  }) => {
    if (insight.evidence_quote) {
      focusOnQuote(insight.evidence_quote);
      return;
    }
    const hint = insight.evidence_hint?.trim();
    if (!hint) return;
    const lower = hint.toLowerCase();
    const match = rawNodes.find(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.source_quote.toLowerCase().includes(lower)
    );
    if (match) setFocus(match.source_quote, match.id);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {summary && (
        <div className="bg-gradient-to-br from-gold/[0.06] via-obsidian-raised/40 to-obsidian-raised/40 border border-gold/25 rounded-xl p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">
              ◆ TL;DR
            </span>
            <span className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.16em]">
              auto-generated
            </span>
          </div>
          <p className="text-[13px] text-ink leading-[1.65]">{summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const meta =
            CATEGORY_META[insight.category] ?? CATEGORY_META.finding;
          const hasEvidence = !!(insight.evidence_quote || insight.evidence_hint);
          return (
            <div
              key={insight.id}
              className="group bg-obsidian-raised/60 border border-obsidian-border rounded-xl p-4 hover:border-obsidian-active transition-all animate-slide-up flex flex-col"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border"
                  style={{
                    color: meta.color,
                    background: meta.bg,
                    borderColor: meta.color + "30",
                  }}
                >
                  {meta.label}
                </span>
                <div className="flex items-center gap-2">
                  <CiteButton
                    slotId={activeSlotId}
                    filename={filename}
                    kind="insight"
                    label={insight.title}
                    quote={insight.evidence_quote || insight.body.slice(0, 300)}
                    category={insight.category}
                  />
                  <div
                    className="flex items-center gap-1.5"
                    title={`${insight.confidence} confidence`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: CONFIDENCE_DOT[insight.confidence],
                      }}
                    />
                    <span className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.14em]">
                      {insight.confidence}
                    </span>
                  </div>
                </div>
              </div>
              <h3 className="font-display text-[17px] leading-snug text-ink mb-1.5">
                {insight.title}
              </h3>
              <p className="text-[12.5px] text-ink-soft leading-[1.6]">
                {insight.body}
              </p>

              {insight.impact && (
                <div className="mt-3 pl-3 border-l-2 border-ai/30">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ai mb-0.5">
                    ↗ impact
                  </p>
                  <p className="text-[11.5px] text-ink-mute leading-[1.55]">
                    {insight.impact}
                  </p>
                </div>
              )}

              {insight.evidence_quote && (
                <blockquote className="mt-3 px-3 py-2 bg-obsidian/60 border-l-2 border-gold/40 rounded-r text-[11px] text-ink-soft italic leading-[1.5]">
                  &ldquo;{insight.evidence_quote.slice(0, 240)}
                  {insight.evidence_quote.length > 240 ? "…" : ""}&rdquo;
                </blockquote>
              )}

              {hasEvidence && (
                <button
                  onClick={() => handleEvidenceClick(insight)}
                  className="mt-3 self-start font-mono text-[10px] text-ink-faint hover:text-gold uppercase tracking-[0.14em] transition-colors flex items-center gap-1.5"
                >
                  <span className="opacity-60">→</span>
                  jump to evidence
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

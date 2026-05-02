"use client";

import { useGraphStore } from "@/store/graphStore";
import { useHighlightStore } from "@/store/highlightStore";

const CATEGORY_META: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  finding: {
    color: "#E85D82",
    bg: "rgba(232,93,130,0.10)",
    label: "Finding",
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
  const { insights, isLoading, rawNodes } = useGraphStore();
  const setFocus = useHighlightStore((s) => s.setFocus);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em] animate-pulse">
          Synthesizing insights…
        </p>
      </div>
    );
  }

  if (!insights.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
          insights will appear here
        </p>
      </div>
    );
  }

  const handleEvidenceClick = (hint: string) => {
    if (!hint) return;
    // Find a node whose label or source_quote matches the hint loosely.
    const lower = hint.toLowerCase();
    const match = rawNodes.find(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.source_quote.toLowerCase().includes(lower)
    );
    if (match) {
      setFocus(match.source_quote, match.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const meta =
            CATEGORY_META[insight.category] ?? CATEGORY_META.finding;
          return (
            <div
              key={insight.id}
              className="group bg-obsidian-raised/60 border border-obsidian-border rounded-xl p-4 hover:border-obsidian-active transition-all animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
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
              <h3 className="font-display text-[18px] leading-snug text-ink mb-1.5">
                {insight.title}
              </h3>
              <p className="text-[12.5px] text-ink-soft leading-[1.6]">
                {insight.body}
              </p>
              {insight.evidence_hint && (
                <button
                  onClick={() => handleEvidenceClick(insight.evidence_hint)}
                  className="mt-3 font-mono text-[10px] text-ink-faint hover:text-gold uppercase tracking-[0.14em] transition-colors flex items-center gap-1.5"
                >
                  <span className="opacity-50">→</span>
                  evidence: "{insight.evidence_hint}"
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

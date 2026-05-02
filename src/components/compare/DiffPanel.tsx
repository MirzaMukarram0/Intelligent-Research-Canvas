"use client";

import type { DiffResponse } from "@/lib/schema";

export function DiffPanel({
  diff, filename1, filename2,
}: {
  diff: DiffResponse;
  filename1: string;
  filename2: string;
}) {
  return (
    <div className="h-full overflow-y-auto p-5 space-y-6">
      {/* Synthesis */}
      <div className="bg-gradient-to-br from-gold/8 via-obsidian-raised to-obsidian-raised border border-gold/20 rounded-xl p-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gold mb-2">Synthesis</p>
        <p className="font-display text-[15px] text-ink leading-relaxed">{diff.synthesis}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Shared concepts */}
        <Section title="Shared Concepts" count={diff.shared_concepts.length} accent="sage">
          <div className="space-y-3">
            {diff.shared_concepts.map((sc, i) => (
              <div key={i} className="border border-sage/20 bg-sage/5 rounded-lg p-3.5">
                <p className="font-display text-[13px] text-ink mb-1">{sc.label}</p>
                <p className="font-mono text-[10px] text-sage mb-2">{sc.relationship}</p>
                <div className="space-y-1.5">
                  <Quote label={filename1} text={sc.doc1_quote} />
                  <Quote label={filename2} text={sc.doc2_quote} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contradictions */}
        <Section title="Contradictions" count={diff.contradictions.length} accent="rose">
          <div className="space-y-3">
            {diff.contradictions.map((c, i) => (
              <div key={i} className="border border-rose/20 bg-rose/5 rounded-lg p-3.5">
                <p className="font-display text-[13px] text-ink mb-2">{c.topic}</p>
                <Quote label={filename1} text={c.doc1_claim} />
                <Quote label={filename2} text={c.doc2_claim} />
                {c.explanation && (
                  <p className="mt-2 font-mono text-[10px] text-ink-faint italic">{c.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Methodology transfers */}
        <Section title="Method Transfers" count={diff.methodology_transfers.length} accent="gold">
          <div className="space-y-3">
            {diff.methodology_transfers.map((m, i) => (
              <div key={i} className="border border-gold/20 bg-gold/5 rounded-lg p-3.5">
                <p className="font-display text-[13px] text-ink mb-1">{m.method_label}</p>
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-ink-faint">
                  <span className="text-gold truncate max-w-[100px]">{m.method_from === "doc1" ? shortName(filename1) : shortName(filename2)}</span>
                  <span>→</span>
                  <span className="text-ai truncate max-w-[100px]">{m.applicable_to}</span>
                </div>
                <p className="font-mono text-[10px] text-ink-faint">{m.rationale}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title, count, accent, children,
}: {
  title: string;
  count: number;
  accent: "sage" | "rose" | "gold";
  children: React.ReactNode;
}) {
  const accentClass = {
    sage: "text-sage",
    rose: "text-rose",
    gold: "text-gold",
  }[accent];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className={`font-mono text-[9px] uppercase tracking-[0.18em] ${accentClass}`}>{title}</p>
        <span className={`font-mono text-[9px] ${accentClass} opacity-60`}>{count}</span>
      </div>
      {count === 0 ? (
        <p className="font-mono text-[10px] text-ink-faint italic">None found</p>
      ) : children}
    </div>
  );
}

function Quote({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-1">
      <span className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.12em] mr-1.5">{shortName(label)}:</span>
      <span className="font-mono text-[10px] text-ink italic">"{text}"</span>
    </div>
  );
}

function shortName(filename: string) {
  return filename.replace(/\.(pdf|docx)$/i, "").slice(0, 16);
}

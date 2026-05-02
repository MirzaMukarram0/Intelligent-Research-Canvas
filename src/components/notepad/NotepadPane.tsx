"use client";

import { useRef, useState } from "react";
import { useNotepadStore, type Citation } from "@/store/notepadStore";
import { ExportFromNotepad } from "@/components/chat/ExportButton";

// ─── Main Pane ──────────────────────────────────────────────────────────────

export function NotepadPane() {
  const expanded = useNotepadStore((s) => s.expanded);
  const toggleExpanded = useNotepadStore((s) => s.toggleExpanded);
  const rawCitations = useNotepadStore((s) => s.citations);
  const citations = [...rawCitations].sort((a, b) => a.order - b.order);
  const clearAll = useNotepadStore((s) => s.clearAll);

  return (
    <>
      {/* Vertical tab trigger on the far right edge */}
      <button
        onClick={toggleExpanded}
        title={expanded ? "Close Notepad" : "Open Research Notepad"}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 h-24 w-6 flex items-center justify-center bg-obsidian-panel border border-obsidian-border border-r-0 rounded-l-md hover:bg-obsidian-raised transition-colors group"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-faint group-hover:text-gold transition-colors rotate-180">
          {citations.length > 0 ? `Notes · ${citations.length}` : "Notepad"}
        </span>
      </button>

      {/* Slide-in panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 z-20 flex flex-col bg-obsidian-panel border-l border-obsidian-border shadow-[-8px_0_40px_rgba(0,0,0,0.4)] transition-all duration-300 ${
          expanded ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border flex-shrink-0">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">Research Notepad</p>
            <p className="font-mono text-[9px] text-ink-faint mt-0.5">{citations.length} citation{citations.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {citations.length > 0 && (
              <button
                onClick={() => { if (confirm("Clear all citations?")) clearAll(); }}
                className="font-mono text-[9px] text-ink-faint hover:text-rose transition-colors uppercase tracking-[0.12em]"
              >
                Clear
              </button>
            )}
            <button onClick={toggleExpanded} className="text-ink-faint hover:text-ink transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Citation list */}
        <div className="flex-1 overflow-y-auto">
          {citations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-5 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a4a50" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.16em]">No citations yet</p>
              <p className="font-mono text-[9px] text-ink-faint leading-relaxed">
                Click the <span className="text-gold">Cite</span> button on any graph node, insight card, or AI response to add it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-obsidian-border">
              {citations.map((c) => (
                <CitationCard key={c.id} citation={c} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — export */}
        {citations.length > 0 && (
          <div className="flex-shrink-0 border-t border-obsidian-border p-3">
            <ExportFromNotepad />
          </div>
        )}
      </div>
    </>
  );
}

// ─── Citation Card ──────────────────────────────────────────────────────────

function CitationCard({ citation }: { citation: Citation }) {
  const updateAnnotation = useNotepadStore((s) => s.updateAnnotation);
  const addTag = useNotepadStore((s) => s.addTag);
  const removeTag = useNotepadStore((s) => s.removeTag);
  const removeCitation = useNotepadStore((s) => s.removeCitation);
  const moveCitation = useNotepadStore((s) => s.moveCitation);

  const [tagInput, setTagInput] = useState("");
  const annotationRef = useRef<HTMLTextAreaElement>(null);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(citation.id, tagInput.trim().toLowerCase());
      setTagInput("");
    }
  };

  const kindIcon = {
    node: "◆",
    insight: "↗",
    chat: "❝",
  }[citation.kind];

  return (
    <div className="px-3 py-3 group space-y-2">
      {/* Source badge + controls */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px]" style={{ color: citation.slotColor }}>{kindIcon}</span>
          <span
            className="font-mono text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border truncate max-w-[120px]"
            style={{
              color: citation.slotColor,
              borderColor: citation.slotColor + "40",
              background: citation.slotColor + "12",
            }}
            title={citation.filename}
          >
            {citation.filename.replace(/\.(pdf|docx)$/i, "").slice(0, 14)}
          </span>
          {citation.category && (
            <span className="font-mono text-[8px] text-ink-faint uppercase tracking-[0.1em] truncate">
              {citation.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => moveCitation(citation.id, "up")} className="text-ink-faint hover:text-ink transition-colors" title="Move up">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
          </button>
          <button onClick={() => moveCitation(citation.id, "down")} className="text-ink-faint hover:text-ink transition-colors" title="Move down">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <button onClick={() => removeCitation(citation.id)} className="text-ink-faint hover:text-rose transition-colors" title="Remove">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* Label */}
      <p className="font-display text-[12px] text-ink leading-snug line-clamp-2">{citation.label}</p>

      {/* Quote */}
      <blockquote className="border-l-2 pl-2 text-[10.5px] text-ink-soft italic leading-relaxed line-clamp-3" style={{ borderColor: citation.slotColor + "60" }}>
        "{citation.quote.slice(0, 220)}{citation.quote.length > 220 ? "…" : ""}"
      </blockquote>

      {/* Annotation */}
      <textarea
        ref={annotationRef}
        value={citation.annotation}
        onChange={(e) => updateAnnotation(citation.id, e.target.value)}
        placeholder="Add your note…"
        rows={2}
        className="w-full bg-obsidian-raised/50 border border-obsidian-border rounded px-2 py-1.5 font-mono text-[10px] text-ink placeholder-ink-faint resize-none outline-none focus:border-gold/40 transition-colors"
      />

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {citation.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-obsidian-raised border border-obsidian-border rounded font-mono text-[8.5px] text-ink-mute"
          >
            {tag}
            <button onClick={() => removeTag(citation.id, tag)} className="hover:text-rose transition-colors">×</button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="+ tag"
          className="px-1 py-0.5 bg-transparent font-mono text-[8.5px] text-ink-faint placeholder-ink-faint/50 outline-none w-14"
        />
      </div>
    </div>
  );
}

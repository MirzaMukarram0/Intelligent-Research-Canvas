"use client";

import { useState } from "react";
import { useNotepadStore, SLOT_COLORS, type CitationKind } from "@/store/notepadStore";
import type { SlotId } from "@/store/projectStore";

interface CiteButtonProps {
  slotId: SlotId;
  filename: string;
  kind: CitationKind;
  label: string;
  quote: string;
  category?: string;
  /** Extra Tailwind classes for positioning */
  className?: string;
}

export function CiteButton({
  slotId,
  filename,
  kind,
  label,
  quote,
  category,
  className = "",
}: CiteButtonProps) {
  const addCitation = useNotepadStore((s) => s.addCitation);
  const isCited = useNotepadStore((s) => s.isCited);
  const already = isCited(slotId, label);
  const [flash, setFlash] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (already) return;
    addCitation({
      kind,
      slotId,
      filename,
      slotColor: SLOT_COLORS[slotId],
      label,
      quote,
      category,
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  return (
    <button
      onClick={handleClick}
      title={already ? "Already in Notepad" : "Add to Notepad"}
      className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] rounded px-1.5 py-0.5 transition-all duration-150 flex-shrink-0 ${
        already
          ? "text-sage border border-sage/30 bg-sage/8 cursor-default"
          : flash
          ? "text-sage border border-sage/50 bg-sage/12 scale-95"
          : "text-ink-faint border border-obsidian-border hover:text-gold hover:border-gold/40 hover:bg-gold/8"
      } ${className}`}
    >
      {already ? (
        <>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Cited
        </>
      ) : (
        <>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Cite
        </>
      )}
    </button>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useHighlightStore } from "@/store/highlightStore";
import { DropZone } from "./DropZone";

export function DocumentPane() {
  const { text, filename, hasDocument, clear } = useDocumentStore();
  const { activeQuote, clearFocus } = useHighlightStore();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    highlightQuote(activeQuote, contentRef.current);
  }, [activeQuote]);

  if (!hasDocument) return <DropZone />;

  const charCount = text.length.toLocaleString();
  const wordCount = text.trim().split(/\s+/).length.toLocaleString();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-obsidian-border flex items-center gap-3 flex-shrink-0 bg-obsidian-panel/40 backdrop-blur-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
        <span className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
          Document
        </span>
        <span className="text-obsidian-active">/</span>
        <span className="font-mono text-[11px] text-ink-mute truncate flex-1">
          {filename}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">
          {wordCount} words · {charCount} chars
        </span>
        <button
          onClick={() => {
            clear();
            clearFocus();
          }}
          title="Clear document"
          className="font-mono text-[10px] text-ink-faint hover:text-rose px-2 py-1 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      {activeQuote && (
        <div className="px-5 py-2 border-b border-obsidian-border flex items-center gap-2 bg-gold/5 animate-fade-in">
          <span className="font-mono text-[9px] text-gold uppercase tracking-[0.2em]">
            Focus
          </span>
          <span className="font-mono text-[10px] text-gold-soft truncate flex-1">
            "{activeQuote.slice(0, 80)}
            {activeQuote.length > 80 ? "…" : ""}"
          </span>
          <button
            onClick={clearFocus}
            className="text-gold/60 hover:text-gold text-xs"
            title="Clear focus"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-7 py-6 text-[14px] leading-[1.85] text-ink-soft font-sans whitespace-pre-wrap selection:bg-gold/30"
        style={{ wordBreak: "break-word" }}
      >
        {text}
      </div>
    </div>
  );
}

// ─── Highlight Logic ─────────────────────────────────────────────────────

function highlightQuote(
  quote: string | null,
  container: HTMLDivElement
): void {
  // Remove existing highlights
  container.querySelectorAll("mark.research-highlight").forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(
        document.createTextNode(el.textContent ?? ""),
        el
      );
      parent.normalize();
    }
  });

  if (!quote) return;
  const needle = quote.trim();
  if (needle.length < 3) return;

  // First try exact substring; if not found, try a fuzzy fallback (loose whitespace).
  let target = needle;
  const flatHaystack = container.textContent ?? "";
  if (!flatHaystack.includes(target)) {
    // Loose match: collapse whitespace
    const loose = needle.replace(/\s+/g, " ");
    if (flatHaystack.replace(/\s+/g, " ").includes(loose)) {
      target = loose;
    } else {
      // Fall back to first 50 chars
      target = needle.slice(0, 60);
      if (!flatHaystack.includes(target)) return;
    }
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let textNode: Text | null;
  while ((textNode = walker.nextNode() as Text | null)) {
    const idx = textNode.data.indexOf(target);
    if (idx === -1) continue;

    const range = document.createRange();
    range.setStart(textNode, idx);
    range.setEnd(textNode, idx + target.length);

    const mark = document.createElement("mark");
    mark.className = "research-highlight";

    try {
      range.surroundContents(mark);
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      // surroundContents throws on cross-element ranges — safe to ignore.
    }
    break;
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useHighlightStore } from "@/store/highlightStore";
import { DropZone } from "./DropZone";
import { DocumentRenderer } from "./DocumentRenderer";

type ViewMode = "rendered" | "text";

export function DocumentPane() {
  const { text, filename, hasDocument, kind, pageCount, file, clear } =
    useDocumentStore();
  const { activeQuote, clearFocus } = useHighlightStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewMode>("rendered");

  useEffect(() => {
    if (view !== "text") return;
    if (!contentRef.current) return;
    highlightQuote(activeQuote, contentRef.current);
  }, [activeQuote, view]);

  if (!hasDocument) return <DropZone />;

  const charCount = text.length.toLocaleString();
  const wordCount = text.trim().split(/\s+/).length.toLocaleString();
  const canRender = kind === "pdf" || kind === "docx";

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
          {pageCount > 0 && <>{pageCount} pg · </>}
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

      {/* View tabs */}
      {canRender && (
        <div className="flex border-b border-obsidian-border flex-shrink-0 bg-obsidian-panel/30">
          <ViewTab
            active={view === "rendered"}
            onClick={() => setView("rendered")}
            label="Rendered"
            hint={kind === "pdf" ? "pdf · pages" : "docx · html"}
          />
          <ViewTab
            active={view === "text"}
            onClick={() => setView("text")}
            label="Plain text"
            hint="extracted"
          />
          <span className="ml-auto self-center pr-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
            {kind.toUpperCase()}
          </span>
        </div>
      )}

      {activeQuote && (
        <div className="px-5 py-2 border-b border-obsidian-border flex items-center gap-2 bg-gold/5 animate-fade-in flex-shrink-0">
          <span className="font-mono text-[9px] text-gold uppercase tracking-[0.2em]">
            Focus
          </span>
          <span className="font-mono text-[10px] text-gold-soft truncate flex-1">
            &ldquo;{activeQuote.slice(0, 80)}
            {activeQuote.length > 80 ? "…" : ""}&rdquo;
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

      {view === "rendered" && canRender ? (
        file ? (
          <div className="flex-1 min-h-0">
            <DocumentRenderer />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center bg-obsidian">
            <div className="max-w-sm text-center space-y-3 px-6">
              <p className="font-display text-xl text-ink-mute">
                Rendered view needs the original file
              </p>
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.16em]">
                Session restored from cache · re-upload to view formatted pages
              </p>
              <button
                onClick={() => setView("text")}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold border border-gold/40 hover:bg-gold/10 px-3 py-1.5 rounded transition-colors"
              >
                Continue with plain text →
              </button>
            </div>
          </div>
        )
      ) : (
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-7 py-6 text-[14px] leading-[1.85] text-ink-soft font-sans whitespace-pre-wrap selection:bg-gold/30"
          style={{ wordBreak: "break-word" }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
        active ? "text-gold" : "text-ink-faint hover:text-ink-mute"
      }`}
    >
      {label}
      <span className="ml-2 text-[8.5px] text-ink-faint normal-case tracking-normal">
        {hint}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gold" />
      )}
    </button>
  );
}

// ─── Highlight Logic (text view) ─────────────────────────────────────────

function highlightQuote(
  quote: string | null,
  container: HTMLDivElement
): void {
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

  let target = needle;
  const flatHaystack = container.textContent ?? "";
  if (!flatHaystack.includes(target)) {
    const loose = needle.replace(/\s+/g, " ");
    if (flatHaystack.replace(/\s+/g, " ").includes(loose)) {
      target = loose;
    } else {
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

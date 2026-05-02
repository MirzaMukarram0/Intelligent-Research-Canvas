"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentPane } from "@/components/document/DocumentPane";
import { GraphPane } from "@/components/graph/GraphPane";
import { ChatPane } from "@/components/chat/ChatPane";
import { NotepadPane } from "@/components/notepad/NotepadPane";
import { ExportButton } from "@/components/chat/ExportButton";
import { useGraphStore, useSlotGraph } from "@/store/graphStore";
import { useProjectStore, SLOT_IDS, type SlotId } from "@/store/projectStore";
import { SLOT_COLORS } from "@/store/notepadStore";
import { useNotepadStore } from "@/store/notepadStore";
import { DropZone } from "@/components/document/DropZone";

/** Clamp a value between min and max. */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Prevents hydration mismatch for localStorage-backed Zustand state. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// ─── Document slot tab ────────────────────────────────────────────────────

function SlotTab({ slotId }: { slotId: SlotId }) {
  const slot = useProjectStore((s) => s.slots[slotId]);
  const activeSlotId = useProjectStore((s) => s.activeSlotId);
  const setActiveSlot = useProjectStore((s) => s.setActiveSlot);
  const removeDocument = useProjectStore((s) => s.removeDocument);
  const graphs = useGraphStore((s) => s.graphs);
  const color = SLOT_COLORS[slotId];
  const isActive = activeSlotId === slotId;

  if (!slot) return null;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hasData = (graphs[slotId]?.rawNodes.length ?? 0) > 0;
    if (hasData && !confirm(`Remove "${slot.filename}" and its graph?`)) return;
    removeDocument(slotId);
  };

  return (
    <button
      onClick={() => setActiveSlot(slotId)}
      className={`group flex items-center gap-1.5 px-3 py-1.5 border-r border-obsidian-border font-mono text-[10px] truncate max-w-[180px] transition-colors ${
        isActive
          ? "bg-obsidian text-ink border-b-0"
          : "bg-obsidian-panel/40 text-ink-faint hover:text-ink hover:bg-obsidian-raised"
      }`}
      title={slot.filename}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="truncate">{slot.filename.replace(/\.(pdf|docx)$/i, "")}</span>
      <span
        onClick={handleRemove}
        className="ml-1 opacity-0 group-hover:opacity-100 hover:text-rose transition-opacity text-[11px] leading-none"
        title="Remove document"
      >
        ×
      </span>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const mounted = useMounted();
  const activeSlotId = useProjectStore((s) => s.activeSlotId);
  const layout = useProjectStore((s) => s.layout);
  const compareSlots = useProjectStore((s) => s.compareSlots);
  const setLayout = useProjectStore((s) => s.setLayout);
  const setCompareSlots = useProjectStore((s) => s.setCompareSlots);
  const slots = useProjectStore((s) => s.slots);
  const nextEmptySlot = useProjectStore((s) => s.nextEmptySlot);
  const occupiedCount = useProjectStore((s) => s.occupiedCount);
  const citationCount = useNotepadStore((s) => s.citations.length);

  const activeGraph = useSlotGraph(activeSlotId);
  const { rawNodes, rawEdges, insights } = activeGraph;

  // Horizontal split: left pane width as % of total workspace width
  const [leftPct, setLeftPct] = useState(40);
  // Vertical split inside right pane: graph pane height as % of right-section height
  const [graphPct, setGraphPct] = useState(60);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLElement>(null);

  // ── Horizontal drag ──────────────────────────────────────────────────────
  const onHDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = leftPct;

    const onMove = (ev: MouseEvent) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const totalW = workspace.getBoundingClientRect().width;
      const delta = ((ev.clientX - startX) / totalW) * 100;
      setLeftPct(clamp(startPct + delta, 20, 70));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [leftPct]);

  // ── Vertical drag ────────────────────────────────────────────────────────
  const onVDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startPct = graphPct;

    const onMove = (ev: MouseEvent) => {
      const section = rightSectionRef.current;
      if (!section) return;
      const totalH = section.getBoundingClientRect().height;
      const delta = ((ev.clientY - startY) / totalH) * 100;
      setGraphPct(clamp(startPct + delta, 20, 80));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [graphPct]);

  const occupiedSlots = SLOT_IDS.filter((id) => !!slots[id]);
  const hasMultiple = occupiedCount() >= 2;

  const handleCompareToggle = () => {
    if (layout === "compare") {
      setLayout("single");
    } else {
      // Pick two occupied slots for compare
      const occupied = SLOT_IDS.filter((id) => !!slots[id]);
      if (occupied.length >= 2) {
        setCompareSlots(occupied[0], occupied[1]);
        setLayout("compare");
      }
    }
  };

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-obsidian">
      {/* Top bar */}
      <header className="border-b border-obsidian-border bg-obsidian-panel/60 backdrop-blur-md flex-shrink-0">
        {/* Row 1: brand + stats + export */}
        <div className="h-11 flex items-center px-5">
          <Link href="/" className="flex items-center gap-2.5 group" title="Home">
            <div className="w-5 h-5 rounded-[5px] bg-gradient-to-br from-gold to-rose flex items-center justify-center text-[10px] font-display text-obsidian">R</div>
            <span className="font-display text-[15px] text-ink group-hover:text-gold transition-colors">Research Canvas</span>
          </Link>

          <span className="ml-3 text-obsidian-active">·</span>
          <span className="ml-3 font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">workspace</span>

          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
            {rawNodes.length > 0 && <span><span className="text-gold">{rawNodes.length}</span> nodes</span>}
            {rawEdges.length > 0 && <span><span className="text-ai">{rawEdges.length}</span> edges</span>}
            {insights.length > 0 && <span><span className="text-sage">{insights.length}</span> insights</span>}
            {citationCount > 0 && <span><span className="text-gold">{citationCount}</span> cited</span>}
            <ExportButton />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
              gemini 2.5 flash
            </span>
          </div>
        </div>

        {/* Row 2: document tabs — only rendered client-side to avoid hydration mismatch */}
        <div className="flex items-stretch border-t border-obsidian-border/50 h-8">
          {mounted && occupiedSlots.map((id) => <SlotTab key={id} slotId={id} />)}

          {/* Add document button */}
          {mounted && occupiedSlots.length < 3 && nextEmptySlot() && (
            <button
              className="flex items-center gap-1 px-3 h-full font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint hover:text-gold border-r border-obsidian-border transition-colors"
              title="Add another document"
              onClick={() => {
                const emptySlot = nextEmptySlot();
                if (emptySlot) useProjectStore.getState().setActiveSlot(emptySlot);
              }}
            >
              <span className="text-[13px] leading-none">+</span>
              <span>{3 - occupiedSlots.length} slot{3 - occupiedSlots.length > 1 ? "s" : ""} free</span>
            </button>
          )}

          {/* Layout toggle */}
          {mounted && hasMultiple && (
            <div className="ml-auto flex items-center gap-1 px-3 border-l border-obsidian-border">
              <button
                onClick={() => setLayout("single")}
                className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] rounded transition-colors ${
                  layout === "single" ? "bg-gold/20 text-gold" : "text-ink-faint hover:text-ink"
                }`}
              >Single</button>
              <button
                onClick={handleCompareToggle}
                className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] rounded transition-colors ${
                  layout === "compare" ? "bg-ai/20 text-ai" : "text-ink-faint hover:text-ink"
                }`}
              >Compare</button>
            </div>
          )}
        </div>
      </header>

      {/* Three-pane workspace + NotepadPane rail */}
      <div className="flex flex-1 min-h-0 relative">
        {layout === "single" ? (
          /* ── Single mode ─────────────────────────────── */
          <div ref={workspaceRef} className="flex flex-1 min-h-0 min-w-0">
            {/* Left — Document Viewer */}
            <section style={{ width: `${leftPct}%` }} className="flex-shrink-0 flex flex-col min-w-0 overflow-hidden">
              <DocumentPane />
            </section>

            {/* Horizontal drag handle */}
            <div onMouseDown={onHDragStart} className="w-1 flex-shrink-0 relative cursor-col-resize group z-20" title="Drag to resize">
              <div className="absolute inset-y-0 left-0 w-px bg-obsidian-border group-hover:bg-gold/50 group-active:bg-gold transition-colors duration-150" />
              <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
            </div>

            {/* Right — Graph + Chat */}
            <section ref={rightSectionRef} className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <div style={{ height: `${graphPct}%` }} className="min-h-0">
                <GraphPane />
              </div>
              <div onMouseDown={onVDragStart} className="h-1 flex-shrink-0 relative cursor-row-resize group z-20" title="Drag to resize">
                <div className="absolute inset-x-0 top-0 h-px bg-obsidian-border group-hover:bg-gold/50 group-active:bg-gold transition-colors duration-150" />
                <div className="absolute inset-x-0 -top-1.5 -bottom-1.5" />
              </div>
              <div style={{ height: `${100 - graphPct}%` }} className="min-h-0">
                <ChatPane />
              </div>
            </section>
          </div>
        ) : (
          /* ── Compare mode ────────────────────────────── */
          <CompareLayout
            slotA={compareSlots[0]}
            slotB={compareSlots[1]}
            graphPct={graphPct}
            onVDragStart={onVDragStart}
            rightSectionRef={rightSectionRef}
          />
        )}

        {/* Notepad rail — anchored to right edge */}
        <div className="relative flex-shrink-0 w-6">
          <NotepadPane />
        </div>
      </div>
    </main>
  );
}

// ─── Compare layout ───────────────────────────────────────────────────────

function CompareLayout({
  slotA,
  slotB,
  graphPct,
  onVDragStart,
  rightSectionRef,
}: {
  slotA: SlotId;
  slotB: SlotId;
  graphPct: number;
  onVDragStart: (e: React.MouseEvent) => void;
  rightSectionRef: React.RefObject<HTMLElement | null>;
}) {
  const slotAData = useProjectStore((s) => s.slots[slotA]);
  const slotBData = useProjectStore((s) => s.slots[slotB]);

  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      {/* Slot A column */}
      <CompareColumn slotId={slotA} label={slotAData?.filename ?? "Slot A"} graphPct={graphPct} onVDragStart={onVDragStart} rightSectionRef={rightSectionRef} />

      {/* Column divider */}
      <div className="w-px bg-obsidian-border flex-shrink-0" />

      {/* Slot B column */}
      <CompareColumn slotId={slotB} label={slotBData?.filename ?? "Slot B"} graphPct={graphPct} onVDragStart={onVDragStart} rightSectionRef={undefined} />
    </div>
  );
}

function CompareColumn({
  slotId,
  label,
  graphPct,
  onVDragStart,
  rightSectionRef,
}: {
  slotId: SlotId;
  label: string;
  graphPct: number;
  onVDragStart: (e: React.MouseEvent) => void;
  rightSectionRef: React.RefObject<HTMLElement | null> | undefined;
}) {
  const color = SLOT_COLORS[slotId];
  const slot = useProjectStore((s) => s.slots[slotId]);
  const setActiveSlot = useProjectStore((s) => s.setActiveSlot);

  return (
    <div className="flex-1 min-w-0 flex flex-col" onClick={() => setActiveSlot(slotId)}>
      {/* Column label */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-obsidian-border bg-obsidian-panel/30 flex-shrink-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint truncate">{label.replace(/\.(pdf|docx)$/i, "")}</span>
      </div>

      {!slot ? (
        <div className="flex-1 min-h-0"><DropZone /></div>
      ) : (
        <>
          {/* Graph */}
          <div style={{ height: `${graphPct}%` }} className="min-h-0">
            <GraphPane slotId={slotId} />
          </div>
          {/* Drag */}
          <div onMouseDown={onVDragStart} className="h-1 flex-shrink-0 relative cursor-row-resize group z-20" ref={rightSectionRef as React.RefObject<HTMLDivElement>}>
            <div className="absolute inset-x-0 top-0 h-px bg-obsidian-border group-hover:bg-gold/50 group-active:bg-gold transition-colors" />
            <div className="absolute inset-x-0 -top-1.5 -bottom-1.5" />
          </div>
          {/* Chat */}
          <div style={{ height: `${100 - graphPct}%` }} className="min-h-0">
            <ChatPane slotId={slotId} />
          </div>
        </>
      )}
    </div>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { ResearchNode } from "./ResearchNode";
import { applyDagreLayout } from "@/lib/dagre";
import { useGraphStore, useSlotGraph } from "@/store/graphStore";
import { useProjectStore, type SlotId } from "@/store/projectStore";
import { useDocumentStore } from "@/store/documentStore";

const nodeTypes = { research: ResearchNode };

const edgeDefaults: Partial<Edge> = {
  type: "smoothstep",
  animated: false,
  style: { stroke: "rgba(255,255,255,0.10)", strokeWidth: 1 },
  labelStyle: {
    fill: "#6b6a66",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
  },
  labelBgStyle: { fill: "#0c0c0e" },
  labelBgPadding: [4, 2],
  labelBgBorderRadius: 4,
  markerEnd: {
    type: MarkerType.Arrow,
    color: "rgba(255,255,255,0.18)",
    width: 14,
    height: 14,
  },
};

export function GraphPane({ slotId: slotIdProp }: { slotId?: SlotId } = {}) {
  const activeSlotId = useProjectStore((s) => s.activeSlotId);
  const slotId = slotIdProp ?? activeSlotId;
  const { rawNodes, rawEdges, isLoading, error, errorHint, graphReady } = useSlotGraph(slotId);
  const triggerAnalysis = useGraphStore((s) => s.triggerAnalysis);
  const hasDocument = useDocumentStore((s) => s.hasDocument);
  const docText = useDocumentStore((s) => s.text);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!rawNodes.length) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flowNodes = rawNodes.map((n) => ({
      id: n.id,
      type: "research",
      position: { x: 0, y: 0 },
      data: {
        id: n.id,
        label: n.label,
        category: n.category,
        source_quote: n.source_quote,
        description: n.description,
      },
    }));

    const flowEdges: Edge[] = rawEdges.map((e, i) => ({
      id: `e-${i}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.relationship,
      ...edgeDefaults,
    }));

    const laidOut = applyDagreLayout(flowNodes, flowEdges);
    setNodes(laidOut);
    setEdges(flowEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // Filter nodes/edges by search query — fade non-matching, keep their
  // first-degree neighbours visible for context.
  const { displayNodes, displayEdges, matchCount } = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return {
        displayNodes: nodes,
        displayEdges: edges,
        matchCount: 0,
      };
    }
    const matches = new Set(
      rawNodes
        .filter(
          (n) =>
            n.label.toLowerCase().includes(q) ||
            n.description.toLowerCase().includes(q) ||
            n.category.toLowerCase().includes(q) ||
            n.source_quote.toLowerCase().includes(q)
        )
        .map((n) => n.id)
    );
    // Pull in first-degree neighbours so context isn't lost
    const neighbours = new Set<string>();
    rawEdges.forEach((e) => {
      if (matches.has(e.source)) neighbours.add(e.target);
      if (matches.has(e.target)) neighbours.add(e.source);
    });

    const dn: Node[] = nodes.map((n) => {
      const isMatch = matches.has(n.id);
      const isNeighbour = neighbours.has(n.id);
      return {
        ...n,
        style: {
          ...n.style,
          opacity: isMatch ? 1 : isNeighbour ? 0.45 : 0.08,
          transition: "opacity 220ms ease",
        },
        data: { ...n.data, dimmed: !isMatch && !isNeighbour },
      };
    });
    const de: Edge[] = edges.map((e) => {
      const live =
        matches.has(e.source) ||
        matches.has(e.target) ||
        (neighbours.has(e.source) && neighbours.has(e.target));
      return {
        ...e,
        style: {
          ...(e.style ?? {}),
          opacity: live ? 1 : 0.06,
          transition: "opacity 220ms ease",
        },
      };
    });
    return { displayNodes: dn, displayEdges: de, matchCount: matches.size };
  }, [search, nodes, edges, rawNodes, rawEdges]);

  if (isLoading || (hasDocument && !graphReady && !error)) {
    return <LoadingState />;
  }

  if (error) {
    const isQuota = /quota|rate|429/i.test(error);
    return (
      <div className="w-full h-full flex items-center justify-center bg-obsidian p-6">
        <div className="max-w-md w-full bg-obsidian-panel/80 border border-rose/30 rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(232,93,130,0.12)]">
          <div className="px-4 py-2.5 border-b border-rose/20 bg-rose/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose">
              {isQuota ? "Rate limit / quota" : "Analysis failed"}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <p className="font-display text-[18px] text-ink leading-snug">
              {error}
            </p>
            {errorHint && (
              <div className="bg-obsidian-raised/60 border border-obsidian-border rounded-md p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint mb-1.5">
                  ◆ How to fix
                </p>
                <p className="text-[12px] text-ink-soft leading-relaxed break-words">
                  {errorHint}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => docText && triggerAnalysis(slotId, docText)}
                disabled={!docText}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold border border-gold/40 hover:bg-gold/10 px-3 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↻ Retry analysis
              </button>
              {isQuota && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink border border-obsidian-border hover:border-obsidian-active px-3 py-1.5 rounded transition-colors"
                >
                  Get API key →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-obsidian">
        <div className="text-center space-y-2">
          <p className="font-display text-2xl text-ink-mute">
            Knowledge graph appears here
          </p>
          <p className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.16em]">
            upload a PDF to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-obsidian flex flex-col">
          <GraphCanvas
            displayNodes={displayNodes}
            displayEdges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            search={search}
            setSearch={setSearch}
            matchCount={matchCount}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
          />
        </div>
      )}
      <div className="relative w-full h-full">
        <GraphCanvas
          displayNodes={displayNodes}
          displayEdges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          search={search}
          setSearch={setSearch}
          matchCount={matchCount}
          fullscreen={fullscreen}
          setFullscreen={setFullscreen}
        />
      </div>
    </>
  );
}

interface GraphCanvasProps {
  displayNodes: Node[];
  displayEdges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  search: string;
  setSearch: (v: string) => void;
  matchCount: number;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
}

function GraphCanvas({
  displayNodes, displayEdges, onNodesChange, onEdgesChange,
  search, setSearch, matchCount, fullscreen, setFullscreen,
}: GraphCanvasProps) {
  return (
    <div className="relative w-full h-full">
      {/* Floating search bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-obsidian-panel/90 backdrop-blur-md border border-obsidian-border hover:border-obsidian-active focus-within:border-gold/50 rounded-lg pl-3 pr-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-colors min-w-[280px]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint flex-shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search graph — concept, method, dataset…"
          className="flex-1 bg-transparent font-mono text-[11px] text-ink placeholder-ink-faint outline-none"
        />
        {search && (
          <>
            <span className="font-mono text-[9.5px] text-ink-faint uppercase tracking-[0.14em] flex-shrink-0">
              {matchCount} match{matchCount === 1 ? "" : "es"}
            </span>
            <button
              onClick={() => setSearch("")}
              className="font-mono text-[12px] text-ink-faint hover:text-rose w-4 h-4 flex items-center justify-center rounded transition-colors"
              title="Clear"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Expand / collapse button */}
      <button
        onClick={() => setFullscreen(!fullscreen)}
        title={fullscreen ? "Exit fullscreen" : "Expand graph"}
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded bg-obsidian-panel/90 border border-obsidian-border hover:border-gold/50 text-ink-faint hover:text-gold transition-colors backdrop-blur-md"
      >
        {fullscreen ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        )}
      </button>

      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.06, maxZoom: 1.4 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        style={{ background: "#0c0c0e" }}
      >
        <Background
          color="#1a1a1f"
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1}
        />
        <Controls
          style={{
            background: "#111114",
            border: "1px solid #1e1e22",
            borderRadius: 8,
            overflow: "hidden",
            // @ts-ignore
            "--xy-controls-button-color": "#e8e8e8",
            "--xy-controls-button-color-hover": "#ffffff",
          }}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            const cat = n.data?.category as string;
            return (
              ({
                concept: "#E8A231",
                entity: "#4A9EFF",
                method: "#3ECF8E",
                finding: "#E85D82",
                dataset: "#7AD3FF",
                metric: "#C8E84A",
                result: "#FF7A8A",
                assumption: "#B5A8E8",
                limitation: "#F2A65A",
              } as Record<string, string>)[cat] ?? "#333"
            );
          }}
          maskColor="rgba(12,12,14,0.7)"
          style={{
            background: "#0c0c0e",
            border: "1px solid #1e1e22",
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </div>
  );
}

function LoadingState() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(id);
  }, []);
  const seconds = (elapsed / 1000).toFixed(1);
  const stage =
    elapsed < 4_000
      ? "Sending document to Gemini…"
      : elapsed < 15_000
      ? "Extracting concepts and relationships…"
      : elapsed < 35_000
      ? "Still working — large documents take longer."
      : "Hmm, this is unusually slow. Will time out at 90s.";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-7 bg-obsidian relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl animate-aurora" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
            Two agents running in parallel
          </p>
          <div
            className="w-1.5 h-1.5 rounded-full bg-ai animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>

      <div className="w-72 space-y-4 relative">
        <LoadingBar label="Mapping concepts → graph" color="gold" delay={0} />
        <LoadingBar
          label="Synthesizing insights"
          color="ai"
          delay={250}
        />
      </div>

      <div className="text-center space-y-1.5">
        <p className="font-mono text-[11px] text-ink-soft tabular-nums">
          {seconds}s
        </p>
        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em] max-w-xs">
          {stage}
        </p>
      </div>
    </div>
  );
}

function LoadingBar({
  label,
  color,
  delay,
}: {
  label: string;
  color: "gold" | "ai";
  delay: number;
}) {
  const colorMap: Record<string, string> = {
    gold: "var(--color-gold)",
    ai: "var(--color-ai)",
  };
  return (
    <div style={{ animationDelay: `${delay}ms` }} className="animate-fade-in">
      <p className="font-mono text-[10.5px] text-ink-mute mb-1.5 uppercase tracking-[0.14em]">
        {label}
      </p>
      <div className="h-[2px] bg-obsidian-border rounded-full overflow-hidden relative">
        <div
          className="absolute inset-y-0 w-1/3 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${colorMap[color]}, transparent)`,
            animation: `shimmer 1.6s ease-in-out infinite`,
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

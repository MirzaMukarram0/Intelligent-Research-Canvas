"use client";

import { useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { ResearchNode } from "./ResearchNode";
import { applyDagreLayout } from "@/lib/dagre";
import { useGraphStore } from "@/store/graphStore";
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

export function GraphPane() {
  const { rawNodes, rawEdges, isLoading, error, graphReady } = useGraphStore();
  const hasDocument = useDocumentStore((s) => s.hasDocument);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  if (isLoading || (hasDocument && !graphReady && !error)) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-obsidian gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-rose">
          Analysis failed
        </p>
        <p className="font-mono text-[11px] text-ink-mute max-w-md text-center">
          {error}
        </p>
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
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.2 }}
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
  );
}

function LoadingState() {
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

      <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
        gemini 2.0 flash · ~10s typical
      </p>
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

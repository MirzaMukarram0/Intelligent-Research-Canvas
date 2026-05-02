"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  MarkerType, useNodesState, useEdgesState,
  type Edge, type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useEffect } from "react";
import { applyDagreLayout } from "@/lib/dagre";
import { ResearchNode } from "@/components/graph/ResearchNode";
import type { GraphResponse, DiffResponse } from "@/lib/schema";

const nodeTypes = { research: ResearchNode };

const SHARED_COLOR = "#3ECF8E";
const CONTRADICTION_COLOR = "#E85D82";

export function DiffGraphPane({
  graph1, graph2, diff, filename1, filename2,
}: {
  graph1: GraphResponse;
  graph2: GraphResponse;
  diff: DiffResponse;
  filename1: string;
  filename2: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build sets for quick lookups
  const sharedLabels = useMemo(
    () => new Set(diff.shared_concepts.map((c) => c.label.toLowerCase())),
    [diff]
  );
  const contradictionTopics = useMemo(
    () => new Set(diff.contradictions.map((c) => c.topic.toLowerCase())),
    [diff]
  );

  useEffect(() => {
    const isShared = (label: string) =>
      sharedLabels.has(label.toLowerCase()) ||
      [...sharedLabels].some((s) => label.toLowerCase().includes(s) || s.includes(label.toLowerCase()));

    // Doc1 nodes — shared nodes get category "method" (green = #3ECF8E)
    const flowNodes1: Node[] = graph1.nodes.map((n) => {
      const shared = isShared(n.label);
      return {
        id: n.id,
        type: "research",
        position: { x: 0, y: 0 },
        data: {
          id: n.id,
          label: n.label,
          category: shared ? "method" : n.category,
          source_quote: n.source_quote,
          description: n.description,
          _doc: "d1",
          _shared: shared,
        },
      };
    });

    // Doc2 nodes — shared nodes get category "method" (green = #3ECF8E)
    const flowNodes2: Node[] = graph2.nodes.map((n) => {
      const shared = isShared(n.label);
      return {
        id: n.id,
        type: "research",
        position: { x: 0, y: 0 },
        data: {
          id: n.id,
          label: n.label,
          category: shared ? "method" : n.category,
          source_quote: n.source_quote,
          description: n.description,
          _doc: "d2",
          _shared: shared,
        },
      };
    });

    const edgeDefaults = (color: string): Partial<Edge> => ({
      type: "smoothstep",
      animated: false,
      style: { stroke: color, strokeWidth: 1 },
      labelStyle: { fill: "#6b6a66", fontSize: 10, fontFamily: "var(--font-mono)" },
      labelBgStyle: { fill: "#0c0c0e" },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.Arrow, color, width: 12, height: 12 },
    });

    const flowEdges1: Edge[] = graph1.edges.map((e, i) => ({
      id: `e1-${i}`,
      source: e.source,
      target: e.target,
      label: e.relationship,
      ...edgeDefaults("rgba(232,162,49,0.25)"),
    }));

    const flowEdges2: Edge[] = graph2.edges.map((e, i) => ({
      id: `e2-${i}`,
      source: e.source,
      target: e.target,
      label: e.relationship,
      ...edgeDefaults("rgba(74,158,255,0.25)"),
    }));

    // Add bridge edges: shared concepts get a green cross-edge
    const bridgeEdges: Edge[] = [];
    diff.shared_concepts.forEach((sc, i) => {
      const label = sc.label.toLowerCase();
      const n1 = graph1.nodes.find((n) => n.label.toLowerCase().includes(label));
      const n2 = graph2.nodes.find((n) => n.label.toLowerCase().includes(label));
      if (n1 && n2) {
        bridgeEdges.push({
          id: `bridge-${i}`,
          source: n1.id,
          target: n2.id,
          label: sc.relationship,
          type: "smoothstep",
          animated: true,
          style: { stroke: SHARED_COLOR, strokeWidth: 2, strokeDasharray: "5,3" },
          labelStyle: { fill: SHARED_COLOR, fontSize: 9, fontFamily: "var(--font-mono)" },
          labelBgStyle: { fill: "#0c0c0e" },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: { type: MarkerType.Arrow, color: SHARED_COLOR, width: 12, height: 12 },
        });
      }
    });

    // Contradiction bridge edges (red dashed)
    diff.contradictions.forEach((con, i) => {
      const topic = con.topic.toLowerCase();
      const n1 = graph1.nodes.find((n) => n.label.toLowerCase().includes(topic));
      const n2 = graph2.nodes.find((n) => n.label.toLowerCase().includes(topic));
      if (n1 && n2) {
        bridgeEdges.push({
          id: `contra-${i}`,
          source: n1.id,
          target: n2.id,
          label: "contradicts",
          type: "smoothstep",
          animated: true,
          style: { stroke: CONTRADICTION_COLOR, strokeWidth: 2, strokeDasharray: "3,3" },
          labelStyle: { fill: CONTRADICTION_COLOR, fontSize: 9 },
          labelBgStyle: { fill: "#0c0c0e" },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: { type: MarkerType.Arrow, color: CONTRADICTION_COLOR, width: 12, height: 12 },
        });
      }
    });

    const allNodes = [...flowNodes1, ...flowNodes2];
    const allEdges = [...flowEdges1, ...flowEdges2, ...bridgeEdges];

    const laidOut = applyDagreLayout(allNodes, allEdges);
    setNodes(laidOut);
    setEdges(allEdges);
  }, [graph1, graph2, diff, sharedLabels, contradictionTopics, setNodes, setEdges]);

  return (
    <div className="relative w-full h-full">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-obsidian-panel/90 backdrop-blur-md border border-obsidian-border rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 rounded" style={{ background: "rgba(232,162,49,0.6)" }} />
          <span className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.12em]">{filename1}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 rounded" style={{ background: "rgba(74,158,255,0.6)" }} />
          <span className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.12em]">{filename2}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 rounded border-t-2 border-dashed" style={{ borderColor: SHARED_COLOR }} />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: SHARED_COLOR }}>Shared concept</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 rounded border-t-2 border-dashed" style={{ borderColor: CONTRADICTION_COLOR }} />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: CONTRADICTION_COLOR }}>Contradiction</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        style={{ background: "#0c0c0e" }}
      >
        <Background color="#1a1a1f" variant={BackgroundVariant.Dots} gap={26} size={1} />
        <Controls
          style={{ background: "#111114", border: "1px solid #1e1e22", borderRadius: 8, overflow: "hidden" }}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?._shared) return SHARED_COLOR;
            return n.data?._doc === "d1" ? "#E8A231" : "#4A9EFF";
          }}
          maskColor="rgba(12,12,14,0.7)"
          style={{ background: "#0c0c0e", border: "1px solid #1e1e22", borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}

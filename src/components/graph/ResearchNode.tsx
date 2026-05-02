"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { useHighlightStore } from "@/store/highlightStore";

const CATEGORY_STYLES = {
  concept: {
    border: "#E8A231",
    label: "concept",
    glow: "rgba(232,162,49,0.18)",
  },
  entity: {
    border: "#4A9EFF",
    label: "entity",
    glow: "rgba(74,158,255,0.18)",
  },
  method: {
    border: "#3ECF8E",
    label: "method",
    glow: "rgba(62,207,142,0.18)",
  },
  finding: {
    border: "#E85D82",
    label: "finding",
    glow: "rgba(232,93,130,0.18)",
  },
  dataset: {
    border: "#7AD3FF",
    label: "dataset",
    glow: "rgba(122,211,255,0.18)",
  },
  metric: {
    border: "#C8E84A",
    label: "metric",
    glow: "rgba(200,232,74,0.18)",
  },
  result: {
    border: "#FF7A8A",
    label: "result",
    glow: "rgba(255,122,138,0.18)",
  },
  assumption: {
    border: "#B5A8E8",
    label: "assumption",
    glow: "rgba(181,168,232,0.18)",
  },
  limitation: {
    border: "#F2A65A",
    label: "limitation",
    glow: "rgba(242,166,90,0.18)",
  },
} as const;

export function ResearchNode({ data, selected }: NodeProps) {
  const cat =
    (data?.category as keyof typeof CATEGORY_STYLES) ?? "concept";
  const style = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.concept;
  const setFocus = useHighlightStore((s) => s.setFocus);
  const activeNodeId = useHighlightStore((s) => s.activeNodeId);
  const isActive = activeNodeId === data?.id || selected;

  const handleClick = () => {
    if (data?.source_quote && data?.id) {
      setFocus(data.source_quote, data.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "linear-gradient(180deg, #16161a 0%, #111114 100%)",
        border: `1px solid ${
          isActive ? style.border : style.border + "55"
        }`,
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 160,
        maxWidth: 220,
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: isActive
          ? `0 0 0 2px ${style.glow}, 0 0 32px ${style.glow}`
          : "0 1px 0 rgba(255,255,255,0.02), 0 4px 14px rgba(0,0,0,0.35)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: style.border,
          border: "none",
          width: 6,
          height: 6,
          top: -3,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: style.border,
          }}
        />
        <p
          style={{
            color: style.border,
            fontSize: 9.5,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {style.label}
        </p>
      </div>
      <p
        style={{
          color: "#F0EDE8",
          fontSize: 12.5,
          lineHeight: 1.35,
          fontFamily: "var(--font-geist-sans), system-ui",
          fontWeight: 500,
        }}
      >
        {data?.label}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: style.border,
          border: "none",
          width: 6,
          height: 6,
          bottom: -3,
        }}
      />
    </div>
  );
}

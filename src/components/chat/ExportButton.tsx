"use client";

import { useState } from "react";
import { useGraphStore } from "@/store/graphStore";
import { useChatStore } from "@/store/chatStore";

export function ExportButton() {
  const { rawNodes, rawEdges, insights } = useGraphStore();
  const { messages } = useChatStore();
  const [busy, setBusy] = useState<"latex" | "markdown" | null>(null);

  const exportAs = async (format: "latex" | "markdown") => {
    if (!rawNodes.length) return;
    setBusy(format);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insights,
          graph: { nodes: rawNodes, edges: rawEdges },
          chatHistory: messages
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
            )
            .join("\n\n"),
          format,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const ext = format === "latex" ? "tex" : "md";
      const blob = new Blob([text], {
        type: format === "latex" ? "application/x-tex" : "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research-canvas-export.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  const disabled = !rawNodes.length;

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => exportAs("markdown")}
        disabled={disabled || !!busy}
        title="Export Markdown"
        className="px-2.5 py-1 border border-obsidian-border text-ink-mute font-mono text-[10px] uppercase tracking-[0.14em] rounded hover:border-obsidian-active hover:text-ink disabled:opacity-30 disabled:hover:border-obsidian-border transition-colors"
      >
        {busy === "markdown" ? "…" : "MD"}
      </button>
      <button
        onClick={() => exportAs("latex")}
        disabled={disabled || !!busy}
        title="Export LaTeX"
        className="px-2.5 py-1 border border-gold/40 text-gold font-mono text-[10px] uppercase tracking-[0.14em] rounded hover:bg-gold/10 hover:border-gold/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        {busy === "latex" ? "…" : "LaTeX"}
      </button>
    </div>
  );
}

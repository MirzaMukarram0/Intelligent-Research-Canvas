"use client";

import { useState } from "react";
import { useGraphStore, useSlotGraph } from "@/store/graphStore";
import { useChatStore, useSlotChat } from "@/store/chatStore";
import { useProjectStore, SLOT_IDS } from "@/store/projectStore";
import { useNotepadStore } from "@/store/notepadStore";

// ─── Category colours shared by both export modes ────────────────────────

const CAT_COLORS: Record<string, string> = {
  concept: "#E8A231", entity: "#4A9EFF", method: "#3ECF8E",
  finding: "#E85D82", dataset: "#7AD3FF", metric: "#C8E84A",
  result: "#FF7A8A", assumption: "#B5A8E8", limitation: "#F2A65A",
  contribution: "#E8A231", implication: "#4A9EFF", gap: "#9F7AEA",
  methodology: "#3ECF8E",
};

const SLOT_COLORS: Record<string, string> = {
  "slot-1": "#E8A231", "slot-2": "#4A9EFF", "slot-3": "#9F7AEA",
};

// ─── Header toolbar export buttons (MD + PDF from current slot) ─────────

export function ExportButton() {
  const activeSlotId = useProjectStore((s) => s.activeSlotId);
  const slotGraph = useSlotGraph(activeSlotId);
  const slotChat = useSlotChat(activeSlotId);
  const { rawNodes, rawEdges, insights, summary } = slotGraph;
  const { messages } = slotChat;
  const [busy, setBusy] = useState<"pdf" | "markdown" | null>(null);

  const exportMarkdown = async () => {
    if (!rawNodes.length) return;
    setBusy("markdown");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insights,
          graph: { nodes: rawNodes, edges: rawEdges },
          chatHistory: messages
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n\n"),
          format: "markdown",
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "research-canvas-export.md";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = () => {
    if (!rawNodes.length) return;
    setBusy("pdf");
    const insightsHtml = insights.map((ins) => `
      <div class="insight">
        <div class="insight-header">
          <span class="badge" style="background:${CAT_COLORS[ins.category] ?? "#888"}22;color:${CAT_COLORS[ins.category] ?? "#888"};border-color:${CAT_COLORS[ins.category] ?? "#888"}44">${ins.category}</span>
          <span class="confidence">${ins.confidence}</span>
        </div>
        <h3>${ins.title}</h3><p>${ins.body}</p>
        ${ins.impact ? `<p class="impact"><strong>Impact:</strong> ${ins.impact}</p>` : ""}
        ${ins.evidence_quote ? `<blockquote>${ins.evidence_quote}</blockquote>` : ""}
      </div>`).join("");
    const nodesHtml = rawNodes.map((n) => `
      <tr>
        <td><span class="badge" style="background:${CAT_COLORS[n.category] ?? "#888"}22;color:${CAT_COLORS[n.category] ?? "#888"};border-color:${CAT_COLORS[n.category] ?? "#888"}44">${n.category}</span></td>
        <td><strong>${n.label}</strong></td><td>${n.description ?? ""}</td>
      </tr>`).join("");
    const chatHtml = messages.length ? messages.map((m) => `
      <div class="msg ${m.role}"><span class="role">${m.role === "user" ? "You" : "Assistant"}</span><span>${m.content}</span></div>`
    ).join("") : "<p><em>No conversation recorded.</em></p>";
    printHtml(buildBaseHtml("Research Canvas", summary, insightsHtml, nodesHtml, chatHtml));
    setBusy(null);
  };

  const disabled = !rawNodes.length;
  return (
    <div className="flex gap-1.5">
      <button onClick={exportMarkdown} disabled={disabled || !!busy} title="Export Markdown"
        className="px-2.5 py-1 border border-obsidian-border text-ink-mute font-mono text-[10px] uppercase tracking-[0.14em] rounded hover:border-obsidian-active hover:text-ink disabled:opacity-30 transition-colors">
        {busy === "markdown" ? "…" : "MD"}
      </button>
      <button onClick={exportPdf} disabled={disabled || !!busy} title="Export PDF (print dialog)"
        className="px-2.5 py-1 border border-gold/40 text-gold font-mono text-[10px] uppercase tracking-[0.14em] rounded hover:bg-gold/10 hover:border-gold/60 disabled:opacity-30 transition-colors">
        {busy === "pdf" ? "…" : "PDF"}
      </button>
    </div>
  );
}

// ─── Notepad → Report export (in NotepadPane footer) ─────────────────────

export function ExportFromNotepad() {
  const citations = useNotepadStore((s) => s.citations);
  const slots = useProjectStore((s) => s.slots);
  const graphs = useGraphStore((s) => s.graphs);
  const chats = useChatStore((s) => s.chats);
  const [busy, setBusy] = useState<"pdf" | "md" | null>(null);

  const buildContent = () => {
    const sorted = [...citations].sort((a, b) => a.order - b.order);

    // Group by tag (ungrouped = "Uncategorized")
    const groups: Record<string, typeof sorted> = {};
    sorted.forEach((c) => {
      const tags = c.tags.length > 0 ? c.tags : ["Uncategorized"];
      tags.forEach((tag) => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(c);
      });
    });

    // Synopsis = join all summaries from occupied slots
    const synopsis = SLOT_IDS
      .map((id) => {
        const slot = slots[id];
        const g = graphs[id];
        if (!slot || !g?.summary) return null;
        return `**${slot.filename}:** ${g.summary}`;
      })
      .filter(Boolean)
      .join("\n\n");

    return { sorted, groups, synopsis };
  };

  const exportPdf = () => {
    if (!citations.length) return;
    setBusy("pdf");
    const { groups, synopsis } = buildContent();

    const citationHtml = Object.entries(groups).map(([tag, cs]) => `
      <h3>${tag}</h3>
      ${cs.map((c) => `
        <div class="citation">
          <span class="slot-badge" style="border-color:${c.slotColor}60;color:${c.slotColor};background:${c.slotColor}18">${c.filename.replace(/\.(pdf|docx)$/i, "").slice(0, 20)}</span>
          ${c.category ? `<span class="cat-badge">${c.category}</span>` : ""}
          <p class="cite-label">${c.label}</p>
          <blockquote>${c.quote.slice(0, 600)}${c.quote.length > 600 ? "…" : ""}</blockquote>
          ${c.annotation ? `<p class="annotation"><strong>Note:</strong> ${c.annotation}</p>` : ""}
        </div>`).join("")}
    `).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Research Notes Export</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,serif;font-size:11pt;color:#1a1a1a;padding:32px 48px;max-width:860px;margin:0 auto}
  h1{font-size:22pt;margin-bottom:4px}
  h2{font-size:14pt;margin:28px 0 10px;border-bottom:1px solid #ddd;padding-bottom:4px}
  h3{font-size:11pt;margin:18px 0 8px;color:#555;font-variant:small-caps;letter-spacing:.04em}
  p{line-height:1.65;margin-bottom:8px}
  .subtitle{color:#666;font-size:10pt;margin-bottom:24px}
  .synopsis{background:#fffbf0;border-left:3px solid #E8A231;padding:12px 16px;margin-bottom:24px;border-radius:4px;font-style:italic}
  .citation{margin-bottom:18px;padding:12px 14px;border:1px solid #e8e8e8;border-radius:6px;break-inside:avoid}
  .slot-badge{font-size:8pt;padding:2px 7px;border-radius:999px;border:1px solid;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;margin-right:6px}
  .cat-badge{font-size:8pt;color:#666;font-family:monospace;text-transform:uppercase;letter-spacing:.08em}
  .cite-label{font-weight:600;font-size:11pt;margin:6px 0 4px}
  blockquote{border-left:2px solid #ccc;padding-left:12px;color:#555;font-style:italic;font-size:10pt;margin:6px 0}
  .annotation{font-size:10pt;color:#2563eb;margin-top:6px}
  @media print{body{padding:0}}
</style>
</head><body>
<h1>Research Notes</h1>
<p class="subtitle">Exported ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ${citations.length} citation${citations.length !== 1 ? "s" : ""}</p>
${synopsis ? `<h2>Synopsis</h2><div class="synopsis">${synopsis.replace(/\*\*/g, "")}</div>` : ""}
<h2>Cited Findings</h2>
${citationHtml}
</body></html>`;

    printHtml(html);
    setBusy(null);
  };

  const exportMd = () => {
    if (!citations.length) return;
    setBusy("md");
    const { groups, synopsis } = buildContent();

    let md = `# Research Notes\n\n`;
    md += `_Exported ${new Date().toLocaleDateString()} · ${citations.length} citations_\n\n`;
    if (synopsis) md += `## Synopsis\n\n${synopsis}\n\n`;
    md += `## Cited Findings\n\n`;

    Object.entries(groups).forEach(([tag, cs]) => {
      md += `### ${tag}\n\n`;
      cs.forEach((c) => {
        md += `#### ${c.label}\n`;
        md += `_Source: ${c.filename}${c.category ? ` · ${c.category}` : ""}_\n\n`;
        md += `> "${c.quote.slice(0, 600)}${c.quote.length > 600 ? "…" : ""}"\n\n`;
        if (c.annotation) md += `**Note:** ${c.annotation}\n\n`;
      });
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-notes.md";
    a.click();
    URL.revokeObjectURL(url);
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-faint">Export report from {citations.length} citations</p>
      <div className="flex gap-2">
        <button onClick={exportMd} disabled={!!busy}
          className="flex-1 py-1.5 border border-obsidian-border text-ink-faint font-mono text-[9px] uppercase tracking-[0.14em] rounded hover:border-obsidian-active hover:text-ink disabled:opacity-30 transition-colors">
          {busy === "md" ? "…" : "↓ MD"}
        </button>
        <button onClick={exportPdf} disabled={!!busy}
          className="flex-1 py-1.5 border border-gold/40 text-gold font-mono text-[9px] uppercase tracking-[0.14em] rounded hover:bg-gold/10 hover:border-gold/60 disabled:opacity-30 transition-colors">
          {busy === "pdf" ? "…" : "↓ PDF"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────

function buildBaseHtml(
  title: string,
  summary: string,
  insightsHtml: string,
  nodesHtml: string,
  chatHtml: string
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,serif;font-size:11pt;color:#1a1a1a;padding:32px 48px;max-width:860px;margin:0 auto}
  h1{font-size:22pt;margin-bottom:4px}h2{font-size:14pt;margin:28px 0 10px;border-bottom:1px solid #ddd;padding-bottom:4px}
  h3{font-size:11pt;margin-bottom:6px;font-weight:600}p{line-height:1.65;margin-bottom:8px}
  .subtitle{color:#666;font-size:10pt;margin-bottom:24px}
  .summary{background:#fffbf0;border-left:3px solid #E8A231;padding:12px 16px;margin-bottom:24px;border-radius:4px;font-style:italic}
  .insight{margin-bottom:20px;padding:14px 16px;border:1px solid #e8e8e8;border-radius:6px;break-inside:avoid}
  .insight-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .badge{font-size:8pt;padding:2px 7px;border-radius:999px;border:1px solid;font-family:monospace;text-transform:uppercase;letter-spacing:.08em}
  .confidence{font-size:8pt;color:#888;font-family:monospace;text-transform:uppercase}
  .impact{color:#2563eb;font-size:10pt;margin-top:6px}
  blockquote{border-left:2px solid #E8A231;padding-left:12px;color:#555;font-style:italic;margin-top:8px;font-size:10pt}
  table{width:100%;border-collapse:collapse;font-size:10pt}
  th{text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;font-size:9pt;text-transform:uppercase;letter-spacing:.08em;color:#666}
  td{padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top}
  .msg{margin-bottom:12px}.role{display:inline-block;font-weight:600;font-size:9pt;text-transform:uppercase;letter-spacing:.08em;width:72px;color:#555}
  .user .role{color:#E8A231}@media print{body{padding:0}}
</style>
</head><body>
<h1>${title}</h1>
<p class="subtitle">Exported ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
${summary ? `<div class="summary">${summary}</div>` : ""}
<h2>Key Insights</h2>${insightsHtml || "<p><em>No insights extracted.</em></p>"}
<h2>Knowledge Graph Nodes</h2>
<table><thead><tr><th>Type</th><th>Label</th><th>Description</th></tr></thead><tbody>${nodesHtml}</tbody></table>
<h2>Research Conversation</h2>${chatHtml}
</body></html>`;
}

function printHtml(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

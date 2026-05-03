"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore, useSlotChat } from "@/store/chatStore";
import { useProjectStore, type SlotId } from "@/store/projectStore";
import { useGraphStore, useSlotGraph } from "@/store/graphStore";
import { useHighlightStore } from "@/store/highlightStore";
import { CiteButton } from "@/components/shared/CiteButton";
import { InsightsPanel } from "./InsightsPanel";
import { ExportButton } from "./ExportButton";

type Tab = "insights" | "chat";

export function ChatPane({ slotId: slotIdProp }: { slotId?: SlotId } = {}) {
  const [tab, setTab] = useState<Tab>("insights");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSlotIdFromStore = useProjectStore((s) => s.activeSlotId);
  const activeSlotId = slotIdProp ?? activeSlotIdFromStore;
  const activeSlot = useProjectStore((s) => s.slots[activeSlotId]);
  const hasDocument = !!activeSlot;
  const docText = activeSlot?.text ?? "";
  const filename = activeSlot?.filename ?? "";

  const slotChat = useSlotChat(activeSlotId);
  const { messages, groundingEnabled } = slotChat;
  const isStreaming = useChatStore((s) => s.isStreaming);

  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastAssistant = useChatStore((s) => s.updateLastAssistant);
  const setLastAssistantSources = useChatStore((s) => s.setLastAssistantSources);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const setGrounding = useChatStore((s) => s.setGrounding);

  const slotGraph = useSlotGraph(activeSlotId);
  const graphNodes = slotGraph.rawNodes;
  const graphEdges = slotGraph.rawEdges;
  const { activeQuote, setFocus } = useHighlightStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !hasDocument) return;

    setInput("");
    setTab("chat");
    addMessage(activeSlotId, { role: "user", content: trimmed });
    addMessage(activeSlotId, { role: "assistant", content: "" });
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: trimmed }],
          docText,
          graph: { nodes: graphNodes, edges: graphEdges },
          focusQuote: activeQuote,
          useGrounding: groundingEnabled,
        }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      const SENTINEL = "\n\n<<<IRC_SOURCES>>>";
      let tail = "";
      let sentinelHit = false;
      let sourcesJson = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (sentinelHit) {
          sourcesJson += chunk;
          continue;
        }
        const combined = tail + chunk;
        const idx = combined.indexOf(SENTINEL);
        if (idx >= 0) {
          const before = combined.slice(0, idx);
          if (before.length > tail.length) {
            updateLastAssistant(activeSlotId, before.slice(tail.length));
          }
          sourcesJson += combined.slice(idx + SENTINEL.length);
          sentinelHit = true;
          tail = "";
        } else {
          const safe = combined.length - SENTINEL.length;
          if (safe > 0) {
            updateLastAssistant(activeSlotId, combined.slice(0, safe).slice(tail.length));
            tail = combined.slice(safe);
          } else {
            tail = combined;
          }
        }
      }
      if (tail && !sentinelHit) updateLastAssistant(activeSlotId, tail);

      if (sourcesJson) {
        try {
          const parsed = JSON.parse(sourcesJson);
          if (Array.isArray(parsed.sources)) {
            setLastAssistantSources(activeSlotId, parsed.sources);
          }
        } catch { /* ignore */ }
      }
    } catch (err) {
      updateLastAssistant(
        activeSlotId,
        `\n\n_Error: ${err instanceof Error ? err.message : "request failed"}_`
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleNodeChipClick = (label: string) => {
    const node = graphNodes.find(
      (n) => n.label.toLowerCase() === label.toLowerCase()
    );
    if (node) setFocus(node.source_quote, node.id);
  };

  const handleCiteChipClick = (quote: string) => {
    if (!quote) return;
    setFocus(quote, "_cite_");
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-panel">
      {/* Tab bar */}
      <div className="flex items-center border-b border-obsidian-border flex-shrink-0 bg-obsidian-panel/60">
        {(["insights", "chat"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.18em] font-semibold transition-colors relative ${
              tab === t ? "text-gold" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t}
            {t === "chat" && messages.length > 0 && (
              <span className="ml-2 text-[10px] text-ink-mute">
                ({Math.floor(messages.length / 2)})
              </span>
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
            )}
          </button>
        ))}
        <div className="ml-auto pr-3">
          <ExportButton />
        </div>
      </div>

      {tab === "insights" ? (
        <InsightsPanel />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center pt-6 space-y-3">
                <p className="font-mono text-[12px] text-ink-soft uppercase tracking-[0.18em] font-semibold">
                  Ask anything about {filename || "the document"}
                </p>
                <p className="font-mono text-[11px] text-ink-mute">
                  Tip: click a graph node first to focus your question
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm animate-slide-up ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                {msg.role === "user" ? (
                  <span className="inline-block bg-obsidian-raised border border-obsidian-border px-3.5 py-2 rounded-xl text-ink max-w-[85%] text-[13px]">
                    {msg.content}
                  </span>
                ) : (
                  <div className="chat-prose">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p>
                            {renderInlineChips(children, handleNodeChipClick, handleCiteChipClick)}
                          </p>
                        ),
                        li: ({ children }) => (
                          <li>
                            {renderInlineChips(children, handleNodeChipClick, handleCiteChipClick)}
                          </li>
                        ),
                      }}
                    >
                      {msg.content + (isStreaming && i === messages.length - 1 ? " ▍" : "")}
                    </ReactMarkdown>
                    {/* Cite button under assistant messages */}
                    {!isStreaming && msg.content && (
                      <div className="mt-1.5">
                        <CiteButton
                          slotId={activeSlotId}
                          filename={filename}
                          kind="chat"
                          label={msg.content.slice(0, 80)}
                          quote={msg.content}
                        />
                      </div>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-obsidian-border/60">
                        <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ai mb-1.5">
                          ◆ Web sources · Google Search
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((s, si) => (
                            <a
                              key={si}
                              href={s.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-ai/[0.06] hover:bg-ai/[0.12] border border-ai/25 hover:border-ai/50 rounded text-[10.5px] text-ai/80 hover:text-ai transition-colors max-w-[260px] truncate"
                              title={s.uri}
                            >
                              <span className="opacity-60">↗</span>
                              <span className="truncate">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-obsidian-border px-3 py-2 flex flex-col gap-1.5 flex-shrink-0 bg-obsidian-panel/40">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  hasDocument
                    ? groundingEnabled
                      ? "Ask about the document or the web…"
                      : `Ask about ${filename || "the document"}…`
                    : "Upload a document first"
                }
                rows={1}
                disabled={!hasDocument || isStreaming}
                className="flex-1 bg-transparent resize-none font-mono text-[13.5px] text-ink placeholder-ink-mute outline-none py-2 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim() || !hasDocument}
                className="px-5 py-2 bg-gold text-obsidian border border-gold rounded-md font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:bg-gold-soft disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(232,162,49,0.2)]"
              >
                Send
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setGrounding(activeSlotId, !groundingEnabled)}
                disabled={!hasDocument}
                title={
                  groundingEnabled
                    ? "Disable Google Search grounding"
                    : "Enable Google Search grounding for live web facts"
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.16em] font-semibold border transition-colors disabled:opacity-30 ${
                  groundingEnabled
                    ? "bg-ai/20 text-ai border-ai/60 hover:bg-ai/30"
                    : "bg-obsidian-raised/40 text-ink-soft border-obsidian-active hover:text-ink hover:border-ink-faint"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${groundingEnabled ? "bg-ai animate-pulse" : "bg-ink-mute"}`} />
                Google Search
              </button>
              <span className="font-mono text-[10px] text-ink-mute">
                {groundingEnabled ? "answers grounded in live web results" : "document-only mode"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderInlineChips(
  children: React.ReactNode,
  onNodeClick: (label: string) => void,
  onCiteClick: (quote: string) => void
): React.ReactNode {
  const PATTERN = /\[NODE:\s*([^\]]+)\]|\[CITE:\s*["']([^"']+)["']\s*\]/g;
  const transform = (node: React.ReactNode, idx: number): React.ReactNode => {
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;
      const regex = new RegExp(PATTERN);
      while ((match = regex.exec(node)) !== null) {
        if (match.index > lastIdx) parts.push(node.slice(lastIdx, match.index));
        if (match[1]) {
          const label = match[1].trim();
          parts.push(
            <button key={`n-${idx}-${match.index}`} type="button" className="node-chip" onClick={() => onNodeClick(label)}>
              ◆ {label}
            </button>
          );
        } else if (match[2]) {
          const quote = match[2].trim();
          const preview = quote.length > 36 ? quote.slice(0, 36) + "…" : quote;
          parts.push(
            <button key={`c-${idx}-${match.index}`} type="button" className="cite-chip" onClick={() => onCiteClick(quote)} title={quote}>
              ❝ {preview}
            </button>
          );
        }
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < node.length) parts.push(node.slice(lastIdx));
      return parts.length > 0 ? parts : node;
    }
    return node;
  };
  if (Array.isArray(children)) return children.map((c, i) => transform(c, i));
  return transform(children, 0);
}

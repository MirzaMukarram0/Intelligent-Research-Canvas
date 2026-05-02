"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore } from "@/store/chatStore";
import { useDocumentStore } from "@/store/documentStore";
import { useGraphStore } from "@/store/graphStore";
import { useHighlightStore } from "@/store/highlightStore";
import { InsightsPanel } from "./InsightsPanel";
import { ExportButton } from "./ExportButton";

type Tab = "insights" | "chat";

export function ChatPane() {
  const [tab, setTab] = useState<Tab>("insights");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    groundingEnabled,
    addMessage,
    updateLastAssistant,
    setLastAssistantSources,
    setStreaming,
    setGrounding,
  } = useChatStore();
  const docText = useDocumentStore((s) => s.text);
  const hasDocument = useDocumentStore((s) => s.hasDocument);
  const { rawNodes: graphNodes, rawEdges: graphEdges } = useGraphStore();
  const { activeQuote, setFocus } = useHighlightStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Switch to chat tab automatically when user starts a conversation while on insights
  useEffect(() => {
    if (messages.length > 0 && tab === "insights") {
      // user-initiated; don't auto-switch unless empty insights
    }
  }, [messages.length, tab]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !hasDocument) return;

    setInput("");
    setTab("chat");
    addMessage({ role: "user", content: trimmed });
    addMessage({ role: "assistant", content: "" });
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

      // Buffer the tail so we can detect the SOURCES sentinel that the server
      // appends after the streamed message body.
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
          // Emit only the part before the sentinel; everything after is sources.
          const before = combined.slice(0, idx);
          if (before.length > tail.length) {
            updateLastAssistant(before.slice(tail.length));
          }
          sourcesJson += combined.slice(idx + SENTINEL.length);
          sentinelHit = true;
          tail = "";
        } else {
          // Hold back the last SENTINEL.length chars in case the marker straddles a chunk.
          const safe = combined.length - SENTINEL.length;
          if (safe > 0) {
            updateLastAssistant(combined.slice(0, safe).slice(tail.length));
            tail = combined.slice(safe);
          } else {
            tail = combined;
          }
        }
      }
      if (tail && !sentinelHit) updateLastAssistant(tail);

      if (sourcesJson) {
        try {
          const parsed = JSON.parse(sourcesJson);
          if (Array.isArray(parsed.sources)) {
            setLastAssistantSources(parsed.sources);
          }
        } catch {
          /* ignore malformed sentinel payload */
        }
      }
    } catch (err) {
      updateLastAssistant(
        `\n\n_Error: ${
          err instanceof Error ? err.message : "request failed"
        }_`
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

  // Click a [CITE: "..."] chip → focus the document on that exact quote.
  // The text-view highlighter (and the rendered-PDF text layer) will scroll
  // to and highlight the matching passage.
  const handleCiteChipClick = (quote: string) => {
    if (!quote) return;
    setFocus(quote, "_cite_");
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-panel">
      {/* Tab bar */}
      <div className="flex items-center border-b border-obsidian-border flex-shrink-0">
        {(["insights", "chat"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors relative ${
              tab === t
                ? "text-gold"
                : "text-ink-faint hover:text-ink-mute"
            }`}
          >
            {t}
            {t === "chat" && messages.length > 0 && (
              <span className="ml-1.5 text-[9px] text-ink-faint">
                ({Math.floor(messages.length / 2)})
              </span>
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gold" />
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
                <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
                  Ask anything about the document
                </p>
                <p className="font-mono text-[10px] text-ink-faint">
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
                            {renderInlineChips(
                              children,
                              handleNodeChipClick,
                              handleCiteChipClick
                            )}
                          </p>
                        ),
                        li: ({ children }) => (
                          <li>
                            {renderInlineChips(
                              children,
                              handleNodeChipClick,
                              handleCiteChipClick
                            )}
                          </li>
                        ),
                      }}
                    >
                      {msg.content +
                        (isStreaming && i === messages.length - 1
                          ? " ▍"
                          : "")}
                    </ReactMarkdown>
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
                      : "Ask about the document…"
                    : "Upload a document first"
                }
                rows={1}
                disabled={!hasDocument || isStreaming}
                className="flex-1 bg-transparent resize-none font-mono text-[12px] text-ink placeholder-ink-faint outline-none py-1.5 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim() || !hasDocument}
                className="px-3.5 py-1.5 bg-gold/10 text-gold border border-gold/40 rounded-md font-mono text-[11px] uppercase tracking-[0.12em] hover:bg-gold/20 hover:border-gold/60 disabled:opacity-30 disabled:hover:bg-gold/10 transition-all"
              >
                Send
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGrounding(!groundingEnabled)}
                disabled={!hasDocument}
                title={
                  groundingEnabled
                    ? "Disable Google Search grounding"
                    : "Enable Google Search grounding for live web facts"
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[9.5px] uppercase tracking-[0.16em] border transition-colors disabled:opacity-30 ${
                  groundingEnabled
                    ? "bg-ai/15 text-ai border-ai/50 hover:bg-ai/25"
                    : "bg-transparent text-ink-faint border-obsidian-border hover:text-ink-mute hover:border-obsidian-active"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    groundingEnabled ? "bg-ai animate-pulse" : "bg-ink-faint"
                  }`}
                />
                Google Search
              </button>
              <span className="font-mono text-[9px] text-ink-faint">
                {groundingEnabled
                  ? "answers grounded in live web results"
                  : "document-only mode"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Walks ReactMarkdown children replacing [NODE: label] with concept chips and
// [CITE: "quote"] with citation chips that scroll the doc to the matching passage.
function renderInlineChips(
  children: React.ReactNode,
  onNodeClick: (label: string) => void,
  onCiteClick: (quote: string) => void
): React.ReactNode {
  // Match either [NODE: label] or [CITE: "quote"] / [CITE: 'quote'].
  const PATTERN = /\[NODE:\s*([^\]]+)\]|\[CITE:\s*["']([^"']+)["']\s*\]/g;

  const transform = (node: React.ReactNode, idx: number): React.ReactNode => {
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;
      const regex = new RegExp(PATTERN);
      while ((match = regex.exec(node)) !== null) {
        if (match.index > lastIdx) {
          parts.push(node.slice(lastIdx, match.index));
        }
        if (match[1]) {
          const label = match[1].trim();
          parts.push(
            <button
              key={`n-${idx}-${match.index}`}
              type="button"
              className="node-chip"
              onClick={() => onNodeClick(label)}
            >
              ◆ {label}
            </button>
          );
        } else if (match[2]) {
          const quote = match[2].trim();
          const preview =
            quote.length > 36 ? quote.slice(0, 36) + "…" : quote;
          parts.push(
            <button
              key={`c-${idx}-${match.index}`}
              type="button"
              className="cite-chip"
              onClick={() => onCiteClick(quote)}
              title={quote}
            >
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

  if (Array.isArray(children)) {
    return children.map((c, i) => transform(c, i));
  }
  return transform(children, 0);
}

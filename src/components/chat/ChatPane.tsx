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
    addMessage,
    updateLastAssistant,
    setStreaming,
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
        }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        updateLastAssistant(decoder.decode(value, { stream: true }));
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
                        p: ({ children }) => {
                          // Replace [NODE: label] inline tokens with chips
                          return (
                            <p>
                              {renderNodeChips(children, handleNodeChipClick)}
                            </p>
                          );
                        },
                        li: ({ children }) => (
                          <li>
                            {renderNodeChips(children, handleNodeChipClick)}
                          </li>
                        ),
                      }}
                    >
                      {msg.content +
                        (isStreaming && i === messages.length - 1
                          ? " ▍"
                          : "")}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-obsidian-border px-3 py-2.5 flex gap-2 flex-shrink-0 bg-obsidian-panel/40">
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
                  ? "Ask about the document…"
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
        </div>
      )}
    </div>
  );
}

// Recursively walks ReactMarkdown children replacing [NODE: label] with chips.
function renderNodeChips(
  children: React.ReactNode,
  onClick: (label: string) => void
): React.ReactNode {
  const NODE_PATTERN = /\[NODE:\s*([^\]]+)\]/g;

  const transform = (node: React.ReactNode, idx: number): React.ReactNode => {
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;
      const regex = new RegExp(NODE_PATTERN);
      while ((match = regex.exec(node)) !== null) {
        if (match.index > lastIdx) {
          parts.push(node.slice(lastIdx, match.index));
        }
        const label = match[1].trim();
        parts.push(
          <button
            key={`${idx}-${match.index}`}
            type="button"
            className="node-chip"
            onClick={() => onClick(label)}
          >
            ◆ {label}
          </button>
        );
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

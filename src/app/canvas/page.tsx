"use client";

import Link from "next/link";
import { DocumentPane } from "@/components/document/DocumentPane";
import { GraphPane } from "@/components/graph/GraphPane";
import { ChatPane } from "@/components/chat/ChatPane";
import { useGraphStore } from "@/store/graphStore";
import { useDocumentStore } from "@/store/documentStore";

export default function CanvasPage() {
  const insightsCount = useGraphStore((s) => s.insights.length);
  const nodeCount = useGraphStore((s) => s.rawNodes.length);
  const edgeCount = useGraphStore((s) => s.rawEdges.length);
  const filename = useDocumentStore((s) => s.filename);

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-obsidian">
      {/* Top bar */}
      <header className="h-11 border-b border-obsidian-border bg-obsidian-panel/60 backdrop-blur-md flex items-center px-5 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          title="Home"
        >
          <div className="w-5 h-5 rounded-[5px] bg-gradient-to-br from-gold to-rose flex items-center justify-center text-[10px] font-display text-obsidian">
            R
          </div>
          <span className="font-display text-[15px] text-ink group-hover:text-gold transition-colors">
            Research Canvas
          </span>
        </Link>

        <span className="ml-3 text-obsidian-active">·</span>
        <span className="ml-3 font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
          workspace
        </span>

        {filename && (
          <>
            <span className="ml-3 text-obsidian-active">/</span>
            <span className="ml-3 font-mono text-[11px] text-ink-mute truncate max-w-[300px]">
              {filename}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          {nodeCount > 0 && (
            <span>
              <span className="text-gold">{nodeCount}</span> nodes
            </span>
          )}
          {edgeCount > 0 && (
            <span>
              <span className="text-ai">{edgeCount}</span> edges
            </span>
          )}
          {insightsCount > 0 && (
            <span>
              <span className="text-sage">{insightsCount}</span> insights
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
            gemini 2.0 flash
          </span>
        </div>
      </header>

      {/* Three-pane workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Left — Document Viewer */}
        <section className="w-[40%] flex-shrink-0 border-r border-obsidian-border flex flex-col min-w-0">
          <DocumentPane />
        </section>

        {/* Right — Graph + Chat */}
        <section className="flex flex-col flex-1 min-w-0">
          <div className="h-[60%] border-b border-obsidian-border min-h-0">
            <GraphPane />
          </div>
          <div className="h-[40%] min-h-0">
            <ChatPane />
          </div>
        </section>
      </div>
    </main>
  );
}

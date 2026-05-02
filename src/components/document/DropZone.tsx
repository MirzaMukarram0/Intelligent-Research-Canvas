"use client";

import { useCallback, useState } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useGraphStore } from "@/store/graphStore";
import { useChatStore } from "@/store/chatStore";
import { useHighlightStore } from "@/store/highlightStore";
import { extractTextFromFile } from "@/lib/pdfWorker";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>("Awaiting document");
  const [error, setError] = useState<string | null>(null);

  const setText = useDocumentStore((s) => s.setText);
  const triggerAnalysis = useGraphStore((s) => s.triggerAnalysis);
  const clearChat = useChatStore((s) => s.clear);
  const clearHighlight = useHighlightStore((s) => s.clearFocus);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are supported.");
        return;
      }
      setError(null);
      setIsProcessing(true);
      setProgress(0);
      setStage("Extracting text from PDF…");
      clearChat();
      clearHighlight();

      try {
        const text = await extractTextFromFile(file, (pct) => {
          setProgress(pct * 100);
        });
        if (text.length < 200) {
          throw new Error("PDF contained too little text to analyze.");
        }
        setText(text, file.name);
        setStage("Running AI agents…");
        setProgress(100);
        await triggerAnalysis(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
      } finally {
        setIsProcessing(false);
      }
    },
    [setText, triggerAnalysis, clearChat, clearHighlight]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden"
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full bg-ai/10 blur-3xl" />
      </div>

      <label
        className={`relative w-full max-w-md aspect-[5/4] flex flex-col items-center justify-center border rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
          isDragging
            ? "border-gold bg-gold/5 scale-[1.02] shadow-[0_0_60px_rgba(232,162,49,0.15)]"
            : "border-obsidian-border border-dashed bg-obsidian-panel/40 hover:border-obsidian-active animate-border-pulse"
        }`}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={isProcessing}
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />

        {isProcessing ? (
          <div className="text-center space-y-5 animate-fade-in px-6 w-full">
            <div className="w-10 h-10 mx-auto relative">
              <div className="absolute inset-0 border-2 border-gold/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold mb-2">
                {stage}
              </p>
              <div className="h-[2px] bg-obsidian-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-soft transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-5 px-8">
            <div className="w-14 h-14 mx-auto rounded-xl bg-gold/8 border border-gold/25 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gold"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-2xl text-ink leading-tight">
                Drop your research PDF
              </p>
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">
                or click to browse · max ~50k chars
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <span className="w-1 h-1 rounded-full bg-gold/60" />
              <span className="w-1 h-1 rounded-full bg-ai/60" />
              <span className="w-1 h-1 rounded-full bg-sage/60" />
              <span className="w-1 h-1 rounded-full bg-rose/60" />
            </div>
          </div>
        )}
      </label>

      {error && (
        <p className="mt-4 font-mono text-[11px] text-rose animate-fade-in">
          ! {error}
        </p>
      )}

      <p className="mt-6 font-mono text-[10px] text-ink-faint uppercase tracking-[0.16em]">
        all processing happens in your browser → ai
      </p>
    </div>
  );
}

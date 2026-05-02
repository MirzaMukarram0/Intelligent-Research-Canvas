import { create } from "zustand";
import type { ResearchNode, ResearchEdge, Insight } from "@/lib/schema";

interface GraphState {
  rawNodes: ResearchNode[];
  rawEdges: ResearchEdge[];
  insights: Insight[];
  isLoading: boolean;
  graphReady: boolean;
  insightsReady: boolean;
  error: string | null;
  errorHint: string | null;
  triggerAnalysis: (text: string) => Promise<void>;
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  rawNodes: [],
  rawEdges: [],
  insights: [],
  isLoading: false,
  graphReady: false,
  insightsReady: false,
  error: null,
  errorHint: null,

  triggerAnalysis: async (text: string) => {
    set({
      isLoading: true,
      error: null,
      errorHint: null,
      graphReady: false,
      insightsReady: false,
      rawNodes: [],
      rawEdges: [],
      insights: [],
    });
    try {
      // Client-side guard: 90s ceiling so we never spin forever.
      const ac = new AbortController();
      const killer = setTimeout(() => ac.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: ac.signal,
        });
      } finally {
        clearTimeout(killer);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const e = new Error(err.error ?? `Analysis failed (${res.status})`);
        // attach hint for UI
        (e as Error & { hint?: string }).hint = err.hint;
        throw e;
      }
      const { graph, insights } = await res.json();
      set({
        rawNodes: graph.nodes ?? [],
        rawEdges: graph.edges ?? [],
        insights: insights.insights ?? [],
        graphReady: true,
        insightsReady: true,
        isLoading: false,
      });
    } catch (err) {
      const isAbort =
        err instanceof DOMException && err.name === "AbortError";
      const message = isAbort
        ? "Analysis took too long and was cancelled."
        : err instanceof Error
        ? err.message
        : "Analysis failed";
      const hint = isAbort
        ? "Try a shorter document or switch to a faster model (set GEMINI_MODEL=gemini-2.5-flash-lite)."
        : err && typeof err === "object" && "hint" in err
        ? (err as { hint?: string }).hint ?? null
        : null;
      set({ error: message, errorHint: hint, isLoading: false });
    }
  },

  reset: () =>
    set({
      rawNodes: [],
      rawEdges: [],
      insights: [],
      isLoading: false,
      graphReady: false,
      insightsReady: false,
      error: null,
      errorHint: null,
    }),
}));

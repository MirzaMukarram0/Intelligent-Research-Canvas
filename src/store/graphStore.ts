import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ResearchNode, ResearchEdge, Insight } from "@/lib/schema";

interface GraphState {
  rawNodes: ResearchNode[];
  rawEdges: ResearchEdge[];
  insights: Insight[];
  summary: string;
  isLoading: boolean;
  graphReady: boolean;
  insightsReady: boolean;
  error: string | null;
  errorHint: string | null;
  triggerAnalysis: (text: string) => Promise<void>;
  reset: () => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set) => ({
      rawNodes: [],
      rawEdges: [],
      insights: [],
      summary: "",
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
          summary: "",
        });
        try {
          // Client-side guard: 150s ceiling — enough for both parallel calls
          // to finish on large papers. Route-level maxDuration is 120s.
          const ac = new AbortController();
          const killer = setTimeout(() => ac.abort(), 150_000);
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
            (e as Error & { hint?: string }).hint = err.hint;
            throw e;
          }
          const { graph, insights } = await res.json();
          set({
            rawNodes: graph.nodes ?? [],
            rawEdges: graph.edges ?? [],
            insights: insights.insights ?? [],
            summary: insights.summary ?? "",
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
            ? "Document may be too large. Try a shorter one, or switch to gemini-2.5-flash-lite for faster responses (set GEMINI_MODEL=gemini-2.5-flash-lite in .env.local)."
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
          summary: "",
          isLoading: false,
          graphReady: false,
          insightsReady: false,
          error: null,
          errorHint: null,
        }),
    }),
    {
      name: "irc-graph",
      storage: createJSONStorage(() => localStorage),
      // Don't persist transient UI/error state.
      partialize: (s) => ({
        rawNodes: s.rawNodes,
        rawEdges: s.rawEdges,
        insights: s.insights,
        summary: s.summary,
        graphReady: s.graphReady,
        insightsReady: s.insightsReady,
      }),
    }
  )
);

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

  triggerAnalysis: async (text: string) => {
    set({
      isLoading: true,
      error: null,
      graphReady: false,
      insightsReady: false,
      rawNodes: [],
      rawEdges: [],
      insights: [],
    });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Analysis failed (${res.status})`);
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
      const message = err instanceof Error ? err.message : "Analysis failed";
      set({ error: message, isLoading: false });
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
    }),
}));

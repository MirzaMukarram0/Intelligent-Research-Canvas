import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ResearchNode, ResearchEdge, Insight } from "@/lib/schema";
import type { SlotId } from "./projectStore";

// ─── Per-slot graph record ─────────────────────────────────────────────────

export interface SlotGraph {
  rawNodes: ResearchNode[];
  rawEdges: ResearchEdge[];
  insights: Insight[];
  summary: string;
  isLoading: boolean;
  graphReady: boolean;
  insightsReady: boolean;
  error: string | null;
  errorHint: string | null;
}

const EMPTY_SLOT_GRAPH: SlotGraph = {
  rawNodes: [],
  rawEdges: [],
  insights: [],
  summary: "",
  isLoading: false,
  graphReady: false,
  insightsReady: false,
  error: null,
  errorHint: null,
};

interface GraphState {
  graphs: Record<SlotId, SlotGraph>;
  triggerAnalysis: (slotId: SlotId, text: string) => Promise<void>;
  resetSlot: (slotId: SlotId) => void;
  // Legacy single-doc selectors (read active slot from projectStore)
  // These are kept to minimize cascading changes in components that don't
  // yet need multi-doc awareness.
  rawNodes: ResearchNode[];
  rawEdges: ResearchEdge[];
  insights: Insight[];
  summary: string;
  isLoading: boolean;
  graphReady: boolean;
  insightsReady: boolean;
  error: string | null;
  errorHint: string | null;
  /** @deprecated use triggerAnalysis(slotId, text) */
  reset: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function patchSlot(
  graphs: Record<SlotId, SlotGraph>,
  slotId: SlotId,
  patch: Partial<SlotGraph>
): Record<SlotId, SlotGraph> {
  return {
    ...graphs,
    [slotId]: { ...(graphs[slotId] ?? EMPTY_SLOT_GRAPH), ...patch },
  };
}

// ─── Store ────────────────────────────────────────────────────────────────

const INITIAL_GRAPHS: Record<SlotId, SlotGraph> = {
  "slot-1": { ...EMPTY_SLOT_GRAPH },
  "slot-2": { ...EMPTY_SLOT_GRAPH },
  "slot-3": { ...EMPTY_SLOT_GRAPH },
};

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      graphs: { ...INITIAL_GRAPHS },

      // ── Flat legacy properties — always reflect slot-1 for backwards compat
      // Real usage should prefer useSlotGraph(slotId) hook (see below).
      get rawNodes() { return get().graphs["slot-1"]?.rawNodes ?? []; },
      get rawEdges() { return get().graphs["slot-1"]?.rawEdges ?? []; },
      get insights() { return get().graphs["slot-1"]?.insights ?? []; },
      get summary() { return get().graphs["slot-1"]?.summary ?? ""; },
      get isLoading() { return get().graphs["slot-1"]?.isLoading ?? false; },
      get graphReady() { return get().graphs["slot-1"]?.graphReady ?? false; },
      get insightsReady() { return get().graphs["slot-1"]?.insightsReady ?? false; },
      get error() { return get().graphs["slot-1"]?.error ?? null; },
      get errorHint() { return get().graphs["slot-1"]?.errorHint ?? null; },

      triggerAnalysis: async (slotId, text) => {
        set((s) => ({
          graphs: patchSlot(s.graphs, slotId, {
            isLoading: true,
            error: null,
            errorHint: null,
            graphReady: false,
            insightsReady: false,
            rawNodes: [],
            rawEdges: [],
            insights: [],
            summary: "",
          }),
        }));

        try {
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
          set((s) => ({
            graphs: patchSlot(s.graphs, slotId, {
              rawNodes: graph.nodes ?? [],
              rawEdges: graph.edges ?? [],
              insights: insights.insights ?? [],
              summary: insights.summary ?? "",
              graphReady: true,
              insightsReady: true,
              isLoading: false,
            }),
          }));
        } catch (err) {
          const isAbort =
            err instanceof DOMException && err.name === "AbortError";
          const message = isAbort
            ? "Analysis took too long and was cancelled."
            : err instanceof Error
            ? err.message
            : "Analysis failed";
          const hint = isAbort
            ? "Document may be too large. Try a shorter one."
            : err && typeof err === "object" && "hint" in err
            ? (err as { hint?: string }).hint ?? null
            : null;
          set((s) => ({
            graphs: patchSlot(s.graphs, slotId, {
              error: message,
              errorHint: hint,
              isLoading: false,
            }),
          }));
        }
      },

      resetSlot: (slotId) =>
        set((s) => ({
          graphs: patchSlot(s.graphs, slotId, { ...EMPTY_SLOT_GRAPH }),
        })),

      /** @deprecated — clears slot-1 only, kept for DropZone compatibility */
      reset: () =>
        set((s) => ({
          graphs: patchSlot(s.graphs, "slot-1", { ...EMPTY_SLOT_GRAPH }),
        })),
    }),
    {
      name: "irc-graphs",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        graphs: Object.fromEntries(
          Object.entries(s.graphs).map(([id, g]) => [
            id,
            {
              rawNodes: g.rawNodes,
              rawEdges: g.rawEdges,
              insights: g.insights,
              summary: g.summary,
              graphReady: g.graphReady,
              insightsReady: g.insightsReady,
            },
          ])
        ) as Record<SlotId, SlotGraph>,
      }),
    }
  )
);

// ─── Convenience hook ─────────────────────────────────────────────────────

/** Returns the graph record for a specific slot (or an empty default). */
export function useSlotGraph(slotId: SlotId): SlotGraph {
  return useGraphStore((s) => s.graphs[slotId] ?? EMPTY_SLOT_GRAPH);
}

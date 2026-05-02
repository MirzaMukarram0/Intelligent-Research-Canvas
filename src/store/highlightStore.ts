import { create } from "zustand";

interface HighlightState {
  activeQuote: string | null;
  activeNodeId: string | null;
  setFocus: (quote: string, nodeId: string) => void;
  clearFocus: () => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
  activeQuote: null,
  activeNodeId: null,
  setFocus: (quote, nodeId) =>
    set({ activeQuote: quote, activeNodeId: nodeId }),
  clearFocus: () => set({ activeQuote: null, activeNodeId: null }),
}));

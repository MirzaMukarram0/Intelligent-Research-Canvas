import { create } from "zustand";
import type { GraphResponse, DiffResponse } from "@/lib/schema";

export interface CompareDoc {
  text: string;
  filename: string;
  file: File | null;
  pageCount: number;
}

interface ComparisonState {
  doc1: CompareDoc | null;
  doc2: CompareDoc | null;
  graph1: GraphResponse | null;
  graph2: GraphResponse | null;
  diff: DiffResponse | null;
  filename1: string;
  filename2: string;
  isLoading: boolean;
  error: string | null;
  done: boolean;

  setDoc: (slot: 1 | 2, doc: CompareDoc) => void;
  triggerCompare: () => Promise<void>;
  reset: () => void;
}

export const useComparisonStore = create<ComparisonState>()((set, get) => ({
  doc1: null,
  doc2: null,
  graph1: null,
  graph2: null,
  diff: null,
  filename1: "Paper A",
  filename2: "Paper B",
  isLoading: false,
  error: null,
  done: false,

  setDoc: (slot, doc) => {
    if (slot === 1) set({ doc1: doc, filename1: doc.filename });
    else set({ doc2: doc, filename2: doc.filename });
  },

  triggerCompare: async () => {
    const { doc1, doc2, filename1, filename2 } = get();
    if (!doc1 || !doc2) return;

    set({ isLoading: true, error: null, done: false, graph1: null, graph2: null, diff: null });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150_000);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text1: doc1.text,
          text2: doc2.text,
          filename1,
          filename2,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      set({
        graph1: data.graph1,
        graph2: data.graph2,
        diff: data.diff,
        isLoading: false,
        done: true,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : "Unknown error";
      set({ isLoading: false, error: msg, done: false });
    }
  },

  reset: () => set({
    doc1: null, doc2: null, graph1: null, graph2: null, diff: null,
    filename1: "Paper A", filename2: "Paper B",
    isLoading: false, error: null, done: false,
  }),
}));

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SlotId } from "./projectStore";

// ─── Types ─────────────────────────────────────────────────────────────────

export type CitationKind = "node" | "insight" | "chat";

export interface Citation {
  id: string;
  createdAt: number;
  /** Order index for drag-to-reorder. Lower = higher in list. */
  order: number;

  kind: CitationKind;
  /** Which document slot this came from */
  slotId: SlotId;
  /** Document filename snapshot (so it survives slot removal) */
  filename: string;
  /** Colour associated with the slot, for visual grouping */
  slotColor: string;

  /** Node label | Insight title | First 80 chars of message */
  label: string;
  /** The quoted text */
  quote: string;
  /** Category badge (node category or insight category) */
  category?: string;

  /** User-written annotation */
  annotation: string;
  /** User-defined theme tags */
  tags: string[];
}

// ─── Slot colours (match the graph: d1=gold, d2=blue, d3=purple) ──────────

export const SLOT_COLORS: Record<SlotId, string> = {
  "slot-1": "#E8A231",
  "slot-2": "#4A9EFF",
  "slot-3": "#9F7AEA",
};

// ─── Store ─────────────────────────────────────────────────────────────────

interface NotepadState {
  citations: Citation[];
  /** Whether the notepad rail is expanded */
  expanded: boolean;

  addCitation: (
    input: Omit<Citation, "id" | "createdAt" | "order" | "annotation" | "tags">
  ) => void;
  updateAnnotation: (id: string, text: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  removeCitation: (id: string) => void;
  /** Move citation to a new position in the list */
  moveCitation: (id: string, direction: "up" | "down") => void;
  toggleExpanded: () => void;
  setExpanded: (v: boolean) => void;
  /** Is a given (slotId + label) combination already cited? */
  isCited: (slotId: SlotId, label: string) => boolean;
  clearAll: () => void;
}

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useNotepadStore = create<NotepadState>()(
  persist(
    (set, get) => ({
      citations: [],
      expanded: false,

      addCitation: (input) => {
        const citations = get().citations;
        const maxOrder = citations.reduce((m, c) => Math.max(m, c.order), -1);
        const citation: Citation = {
          ...input,
          id: nanoid(),
          createdAt: Date.now(),
          order: maxOrder + 1,
          annotation: "",
          tags: [],
        };
        set((s) => ({
          citations: [...s.citations, citation],
          expanded: true, // open notepad so user sees the addition
        }));
      },

      updateAnnotation: (id, text) =>
        set((s) => ({
          citations: s.citations.map((c) =>
            c.id === id ? { ...c, annotation: text } : c
          ),
        })),

      addTag: (id, tag) =>
        set((s) => ({
          citations: s.citations.map((c) =>
            c.id === id && !c.tags.includes(tag)
              ? { ...c, tags: [...c.tags, tag] }
              : c
          ),
        })),

      removeTag: (id, tag) =>
        set((s) => ({
          citations: s.citations.map((c) =>
            c.id === id ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c
          ),
        })),

      removeCitation: (id) =>
        set((s) => ({ citations: s.citations.filter((c) => c.id !== id) })),

      moveCitation: (id, direction) => {
        const sorted = [...get().citations].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((c) => c.id === id);
        if (idx === -1) return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const newList = sorted.map((c, i) => {
          if (i === idx) return { ...c, order: sorted[swapIdx].order };
          if (i === swapIdx) return { ...c, order: sorted[idx].order };
          return c;
        });
        set({ citations: newList });
      },

      toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
      setExpanded: (v) => set({ expanded: v }),

      isCited: (slotId, label) =>
        get().citations.some(
          (c) => c.slotId === slotId && c.label === label
        ),

      clearAll: () => set({ citations: [] }),
    }),
    {
      name: "irc-notepad",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ citations: s.citations, expanded: s.expanded }),
    }
  )
);

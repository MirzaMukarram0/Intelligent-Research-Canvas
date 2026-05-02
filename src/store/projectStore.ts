import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DocumentKind = "pdf" | "docx" | "unknown";

export const SLOT_IDS = ["slot-1", "slot-2", "slot-3"] as const;
export type SlotId = (typeof SLOT_IDS)[number];
export const MAX_SLOTS = 3;

export interface DocSlot {
  id: SlotId;
  filename: string;
  /** Text capped at 80k chars to stay within localStorage quota. */
  text: string;
  pageCount: number;
  kind: DocumentKind;
  loadedAt: number;
}

export type Layout = "single" | "compare";

interface ProjectState {
  slots: Record<SlotId, DocSlot | null>;
  activeSlotId: SlotId;
  layout: Layout;
  /** Which two slots are shown in compare mode. */
  compareSlots: [SlotId, SlotId];

  /** Add or replace a slot. Picks the first empty slot if slot arg is omitted. */
  addDocument: (
    doc: Omit<DocSlot, "id" | "loadedAt">,
    targetSlot?: SlotId
  ) => SlotId | null;
  removeDocument: (slotId: SlotId) => void;
  setActiveSlot: (slotId: SlotId) => void;
  setLayout: (layout: Layout) => void;
  setCompareSlots: (a: SlotId, b: SlotId) => void;
  /** Number of currently occupied slots. */
  occupiedCount: () => number;
  /** Returns first empty SlotId or null if all full. */
  nextEmptySlot: () => SlotId | null;
}

function detectKind(name: string): DocumentKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "unknown";
}

const EMPTY_SLOTS: Record<SlotId, null> = {
  "slot-1": null,
  "slot-2": null,
  "slot-3": null,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      slots: { ...EMPTY_SLOTS },
      activeSlotId: "slot-1",
      layout: "single",
      compareSlots: ["slot-1", "slot-2"],

      addDocument: (doc, targetSlot) => {
        const state = get();
        const slot: SlotId =
          targetSlot ??
          (SLOT_IDS.find((id) => state.slots[id] === null) as SlotId | undefined) ??
          state.activeSlotId; // overwrite active if all full

        const newSlot: DocSlot = {
          id: slot,
          filename: doc.filename,
          text: doc.text.slice(0, 80_000),
          pageCount: doc.pageCount,
          kind: detectKind(doc.filename),
          loadedAt: Date.now(),
        };
        set((s) => ({
          slots: { ...s.slots, [slot]: newSlot },
          activeSlotId: slot,
        }));
        return slot;
      },

      removeDocument: (slotId) => {
        const state = get();
        const newSlots = { ...state.slots, [slotId]: null };
        // pick a new active slot
        const remaining = SLOT_IDS.filter(
          (id) => id !== slotId && newSlots[id] !== null
        );
        const newActive: SlotId =
          remaining.length > 0 ? remaining[0] : "slot-1";
        set({
          slots: newSlots,
          activeSlotId: newActive,
          layout: remaining.length < 2 ? "single" : state.layout,
        });
      },

      setActiveSlot: (slotId) => set({ activeSlotId: slotId }),

      setLayout: (layout) => {
        const state = get();
        const occupied = SLOT_IDS.filter((id) => state.slots[id] !== null);
        if (layout === "compare" && occupied.length < 2) return; // guard
        set({ layout });
        // auto-pick compare slots to be the first 2 occupied
        if (layout === "compare") {
          set({ compareSlots: [occupied[0], occupied[1]] as [SlotId, SlotId] });
        }
      },

      setCompareSlots: (a, b) => set({ compareSlots: [a, b] }),

      occupiedCount: () =>
        SLOT_IDS.filter((id) => get().slots[id] !== null).length,

      nextEmptySlot: () =>
        (SLOT_IDS.find((id) => get().slots[id] === null) as SlotId | undefined) ??
        null,
    }),
    {
      name: "irc-project",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        slots: s.slots,
        activeSlotId: s.activeSlotId,
        layout: s.layout,
        compareSlots: s.compareSlots,
      }),
    }
  )
);

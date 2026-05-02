import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SlotId } from "./projectStore";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: GroundingSource[];
}

export interface SlotChat {
  messages: Message[];
  groundingEnabled: boolean;
}

const EMPTY_CHAT: SlotChat = {
  messages: [],
  groundingEnabled: false,
};

interface ChatState {
  chats: Record<SlotId, SlotChat>;
  isStreaming: boolean;

  addMessage: (slotId: SlotId, msg: Message) => void;
  updateLastAssistant: (slotId: SlotId, chunk: string) => void;
  setLastAssistantSources: (slotId: SlotId, sources: GroundingSource[]) => void;
  setStreaming: (v: boolean) => void;
  setGrounding: (slotId: SlotId, v: boolean) => void;
  clearSlot: (slotId: SlotId) => void;

  // Legacy flat accessors — kept to not break ChatPane/ExportButton immediately
  messages: Message[];
  groundingEnabled: boolean;
  addMessage_legacy: (msg: Message) => void;
  updateLastAssistant_legacy: (chunk: string) => void;
  setLastAssistantSources_legacy: (sources: GroundingSource[]) => void;
  setGrounding_legacy: (v: boolean) => void;
  clear: () => void;
}

function patchChat(
  chats: Record<SlotId, SlotChat>,
  slotId: SlotId,
  patch: Partial<SlotChat>
): Record<SlotId, SlotChat> {
  return { ...chats, [slotId]: { ...(chats[slotId] ?? EMPTY_CHAT), ...patch } };
}

const INITIAL_CHATS: Record<SlotId, SlotChat> = {
  "slot-1": { ...EMPTY_CHAT },
  "slot-2": { ...EMPTY_CHAT },
  "slot-3": { ...EMPTY_CHAT },
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: { ...INITIAL_CHATS },
      isStreaming: false,

      addMessage: (slotId, msg) =>
        set((s) => ({
          chats: patchChat(s.chats, slotId, {
            messages: [...(s.chats[slotId]?.messages ?? []), msg],
          }),
        })),

      updateLastAssistant: (slotId, chunk) =>
        set((s) => {
          const msgs = [...(s.chats[slotId]?.messages ?? [])];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant")
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
          return { chats: patchChat(s.chats, slotId, { messages: msgs }) };
        }),

      setLastAssistantSources: (slotId, sources) =>
        set((s) => {
          const msgs = [...(s.chats[slotId]?.messages ?? [])];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant")
            msgs[msgs.length - 1] = { ...last, sources };
          return { chats: patchChat(s.chats, slotId, { messages: msgs }) };
        }),

      setStreaming: (v) => set({ isStreaming: v }),

      setGrounding: (slotId, v) =>
        set((s) => ({
          chats: patchChat(s.chats, slotId, { groundingEnabled: v }),
        })),

      clearSlot: (slotId) =>
        set((s) => ({
          chats: patchChat(s.chats, slotId, { ...EMPTY_CHAT }),
        })),

      // ── Legacy flat surface — mirrors slot-1 for now ──────────────────
      get messages() { return get().chats["slot-1"]?.messages ?? []; },
      get groundingEnabled() { return get().chats["slot-1"]?.groundingEnabled ?? false; },
      addMessage_legacy: (msg) => get().addMessage("slot-1", msg),
      updateLastAssistant_legacy: (chunk) => get().updateLastAssistant("slot-1", chunk),
      setLastAssistantSources_legacy: (sources) => get().setLastAssistantSources("slot-1", sources),
      setGrounding_legacy: (v) => get().setGrounding("slot-1", v),
      clear: () => get().clearSlot("slot-1"),
    }),
    {
      name: "irc-chats",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ chats: s.chats }),
    }
  )
);

// ─── Convenience hook ─────────────────────────────────────────────────────

export function useSlotChat(slotId: SlotId): SlotChat {
  return useChatStore((s) => s.chats[slotId] ?? EMPTY_CHAT);
}


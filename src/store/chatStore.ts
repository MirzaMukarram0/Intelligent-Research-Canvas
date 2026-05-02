import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  // Web grounding sources attached to assistant messages (when Google Search
  // grounding is enabled).
  sources?: GroundingSource[];
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  // When true, the next user message will be sent with Google Search grounding.
  groundingEnabled: boolean;
  addMessage: (msg: Message) => void;
  updateLastAssistant: (chunk: string) => void;
  setLastAssistantSources: (sources: GroundingSource[]) => void;
  setStreaming: (v: boolean) => void;
  setGrounding: (v: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isStreaming: false,
      groundingEnabled: false,
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateLastAssistant: (chunk) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
          }
          return { messages: msgs };
        }),
      setLastAssistantSources: (sources) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, sources };
          }
          return { messages: msgs };
        }),
      setStreaming: (v) => set({ isStreaming: v }),
      setGrounding: (v) => set({ groundingEnabled: v }),
      clear: () => set({ messages: [], isStreaming: false }),
    }),
    {
      name: "irc-chat",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        messages: s.messages,
        groundingEnabled: s.groundingEnabled,
      }),
    }
  )
);

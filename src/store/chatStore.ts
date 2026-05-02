import { create } from "zustand";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  addMessage: (msg: Message) => void;
  updateLastAssistant: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
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
  setStreaming: (v) => set({ isStreaming: v }),
  clear: () => set({ messages: [], isStreaming: false }),
}));

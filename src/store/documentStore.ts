import { create } from "zustand";

interface DocumentState {
  text: string;
  filename: string;
  hasDocument: boolean;
  pageCount: number;
  setText: (text: string, filename: string, pageCount?: number) => void;
  clear: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  text: "",
  filename: "",
  hasDocument: false,
  pageCount: 0,
  setText: (text, filename, pageCount = 0) =>
    set({ text, filename, hasDocument: true, pageCount }),
  clear: () =>
    set({ text: "", filename: "", hasDocument: false, pageCount: 0 }),
}));

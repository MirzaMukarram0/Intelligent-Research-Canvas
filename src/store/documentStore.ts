import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DocumentKind = "pdf" | "docx" | "unknown";

interface DocumentState {
  text: string;
  filename: string;
  hasDocument: boolean;
  pageCount: number;
  file: File | null;
  kind: DocumentKind;
  setDocument: (
    text: string,
    filename: string,
    file: File,
    pageCount?: number
  ) => void;
  clear: () => void;
}

function detectKind(name: string): DocumentKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "unknown";
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      text: "",
      filename: "",
      hasDocument: false,
      pageCount: 0,
      file: null,
      kind: "unknown",
      setDocument: (text, filename, file, pageCount = 0) =>
        set({
          text,
          filename,
          hasDocument: true,
          pageCount,
          file,
          kind: detectKind(filename),
        }),
      clear: () =>
        set({
          text: "",
          filename: "",
          hasDocument: false,
          pageCount: 0,
          file: null,
          kind: "unknown",
        }),
    }),
    {
      name: "irc-document",
      storage: createJSONStorage(() => localStorage),
      // File objects can't be serialized — exclude them. The text + metadata
      // is enough to keep the chat / insights / graph alive across reloads.
      partialize: (s) => ({
        text: s.text,
        filename: s.filename,
        hasDocument: s.hasDocument,
        pageCount: s.pageCount,
        kind: s.kind,
      }),
    }
  )
);

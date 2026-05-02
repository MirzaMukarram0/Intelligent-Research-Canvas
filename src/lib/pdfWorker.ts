"use client";

// Lazy-loaded client-side PDF text extraction using pdfjs-dist.
// Worker is loaded from unpkg, which mirrors npm exactly and serves the
// matching file for whatever pdfjs-dist version is installed.

type PdfJsModule = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJsModule> | null = null;

export async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (mod) => {
      const version = mod.version;
      mod.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return pdfjsPromise;
}

export interface ExtractResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ExtractResult> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".docx")) return extractFromDocx(file, onProgress);
  return extractFromPdf(file, onProgress);
}

async function extractFromPdf(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ExtractResult> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const total = pdf.numPages;
  const collected: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    // Prefix each page with a marker so the chat model can cite by page.
    collected.push(`=== PAGE ${i} ===\n${pageText}`);
    onProgress?.(i / total);
  }

  return {
    text: collected
      .join("\n\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    pageCount: total,
  };
}

async function extractFromDocx(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ExtractResult> {
  onProgress?.(0.2);
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(0.5);
  const result = await mammoth.extractRawText({ arrayBuffer });
  onProgress?.(1);
  return { text: result.value.trim(), pageCount: 0 };
}

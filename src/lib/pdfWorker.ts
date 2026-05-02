"use client";

// Lazy-loaded client-side PDF text extraction using pdfjs-dist.
// Worker is loaded from unpkg, which mirrors npm exactly and serves the
// matching file for whatever pdfjs-dist version is installed.

type PdfJsModule = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (mod) => {
      const version = mod.version;
      mod.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
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
    collected.push(pageText);
    onProgress?.(i / total);
  }

  return collected
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

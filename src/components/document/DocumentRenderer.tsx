"use client";

import { useEffect, useRef, useState } from "react";
import { loadPdfJs } from "@/lib/pdfWorker";
import { useDocumentStore } from "@/store/documentStore";
import { useHighlightStore } from "@/store/highlightStore";

/**
 * Visually faithful renderer for the uploaded document.
 *  - PDFs are rendered page-by-page via pdfjs canvas + a selectable text layer
 *    on top so the original fonts, layout, tables, and figures are preserved.
 *  - DOCX files are converted to styled HTML via mammoth, keeping headings,
 *    bold/italic, tables and inline images.
 *
 * The same `activeQuote` highlight system from the text view works here —
 * the text layer is real DOM the highlighter walks.
 */
export function DocumentRenderer() {
  const { file, kind, filename } = useDocumentStore();
  const activeQuote = useHighlightStore((s) => s.activeQuote);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Render whenever a new file lands.
  useEffect(() => {
    if (!file || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    setError(null);

    let cancelled = false;

    (async () => {
      try {
        if (kind === "pdf") {
          await renderPdf(file, container, () => cancelled);
        } else if (kind === "docx") {
          await renderDocx(file, container);
        } else {
          setError("This file type cannot be rendered visually.");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[DocumentRenderer]", e);
          setError(e instanceof Error ? e.message : "Render failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, kind]);

  // Re-apply highlight whenever the focus changes or the doc finishes rendering.
  useEffect(() => {
    if (!containerRef.current) return;
    highlightInRendered(activeQuote, containerRef.current);
  }, [activeQuote]);

  if (!file) return null;

  return (
    <div className="relative h-full overflow-auto bg-[#202124] doc-render-scroll">
      {error && (
        <div className="m-6 p-4 rounded-md border border-rose/30 bg-rose/5 text-rose font-mono text-[11px]">
          {error}
        </div>
      )}
      <div
        ref={containerRef}
        className="doc-render mx-auto py-8 px-4 flex flex-col items-center gap-6"
        data-filename={filename}
      />
    </div>
  );
}

// ─── PDF rendering ────────────────────────────────────────────────────────

async function renderPdf(
  file: File,
  container: HTMLElement,
  isCancelled: () => boolean
) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  // Match container CSS pixels at a high-DPI scale for crisp text.
  const containerWidth = Math.min(container.clientWidth - 32, 900);

  for (let i = 1; i <= pdf.numPages; i++) {
    if (isCancelled()) return;
    const page = await pdf.getPage(i);

    // Compute viewport scaled to fit container width.
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const pageWrap = document.createElement("div");
    pageWrap.className = "doc-page";
    pageWrap.style.width = `${viewport.width}px`;
    pageWrap.style.height = `${viewport.height}px`;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Cannot get 2D context");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    const textLayer = document.createElement("div");
    textLayer.className = "doc-text-layer";
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    const pageNum = document.createElement("div");
    pageNum.className = "doc-page-num";
    pageNum.textContent = `${i} / ${pdf.numPages}`;

    pageWrap.append(canvas, textLayer, pageNum);
    container.appendChild(pageWrap);

    // 1. Paint the bitmap.
    await page.render({
      canvasContext: ctx,
      viewport,
      // satisfy typed signature
      canvas,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).promise;

    // 2. Build a selectable, positioned text layer over the canvas.
    const textContent = await page.getTextContent();
    // pdfjs >= 4 exposes a TextLayer class we can use directly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TextLayer = (pdfjs as any).TextLayer;
    if (TextLayer) {
      const layer = new TextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
      });
      await layer.render();
    } else {
      // Fallback for older builds.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (pdfjs as any).renderTextLayer({
        textContent,
        container: textLayer,
        viewport,
        textDivs: [],
      }).promise;
    }
  }
}

// ─── DOCX rendering ───────────────────────────────────────────────────────

async function renderDocx(file: File, container: HTMLElement) {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      // Convert <table> with all default styling preserved.
      styleMap: [
        "p[style-name='Title'] => h1.doc-title",
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading 3'] => h3",
        "p[style-name='Quote'] => blockquote",
      ],
    }
  );

  const page = document.createElement("article");
  page.className = "doc-page doc-page-html";
  page.innerHTML = result.value;
  container.appendChild(page);

  if (result.messages.length) {
    console.log("[mammoth]", result.messages);
  }
}

// ─── Cross-page highlight ─────────────────────────────────────────────────

function highlightInRendered(quote: string | null, root: HTMLElement) {
  // Clear previous highlights.
  root
    .querySelectorAll<HTMLElement>("mark.research-highlight")
    .forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize?.();
    });

  if (!quote) return;
  const needle = quote.trim();
  if (needle.length < 4) return;

  // Search every text node in every page.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  const candidates: Text[] = [];
  while ((node = walker.nextNode() as Text | null)) candidates.push(node);

  // Try the full needle first; fall back to first 50 chars.
  for (const length of [needle.length, 60, 40]) {
    const target = needle.slice(0, length);
    if (target.length < 4) continue;
    for (const n of candidates) {
      const idx = n.data.indexOf(target);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(n, idx);
      range.setEnd(n, idx + target.length);
      const mark = document.createElement("mark");
      mark.className = "research-highlight";
      try {
        range.surroundContents(mark);
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      } catch {
        /* cross-element range — try next candidate */
      }
    }
  }
}

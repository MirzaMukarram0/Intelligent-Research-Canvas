# Intelligent Research Canvas

> **Transform research PDFs into an interactive, AI-powered knowledge workspace.**
> Upload a paper → get a knowledge graph + ranked insights → chat with full context → export structured LaTeX.

Built with **Next.js 15**, **TypeScript**, **Tailwind v4**, **React Flow**, **Zustand**, and **Gemini 2.0 Flash**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key
cp .env.example .env.local
# then edit .env.local and paste your key from https://aistudio.google.com

# 3. Run dev server
npm run dev
```

Open http://localhost:3000 for the landing page,
or http://localhost:3000/canvas to jump straight into the workspace.

---

## What It Does

| Step | Description |
|------|-------------|
| **Drop a PDF** | Text is extracted in your browser via `pdfjs-dist` — no upload. |
| **Two agents fire** | Graph Extractor + Insight Analyzer run in parallel via `Promise.all`. |
| **Click any node** | The verbatim source quote glows in the document — bidirectional highlight. |
| **Chat** | Streamed responses grounded in `DOCUMENT + GRAPH + FOCUS quote`. |
| **Export** | One-shot LaTeX or Markdown report with abstract, findings, concept map, and chat. |

---

## The Four Agents

- **Agent A — Graph Extractor** → 8–20 typed nodes (`concept | entity | method | finding`) + edges
- **Agent B — Insight Analyzer** → exactly 5 ranked insights with category + confidence
- **Agent C — Context Chat** → streaming chat with full doc + graph + focus context
- **Agent D — LaTeX Formatter** → compilable `.tex` export of the entire session

All four prompts live in `src/lib/gemini.ts` and Zod schemas validate every response in `src/lib/schema.ts`.

---

## Environment

```
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com).

---

## Deploy

```bash
npm i -g vercel
vercel deploy --prod
```

Add `GEMINI_API_KEY` in **Project Settings → Environment Variables**.

---

*Powered by Gemini 2.0 Flash.*

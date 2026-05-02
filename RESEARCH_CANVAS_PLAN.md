# Intelligent Research Canvas — Complete Implementation Plan
> Hackathon Build Guide · Google AI Studio + Next.js 15
> Stack: Next.js 15 · TypeScript · Tailwind CSS v4 · React Flow · Zustand · Gemini 2.0 Flash · pdfjs-dist

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Design System — Obsidian Lab](#3-design-system--obsidian-lab)
4. [Architecture](#4-architecture)
5. [File & Folder Structure](#5-file--folder-structure)
6. [Phase 1 — UI Shell](#6-phase-1--ui-shell-days-12)
7. [Phase 2 — Backend & AI Integration](#7-phase-2--backend--ai-integration-days-24)
8. [Phase 3 — Graph Canvas](#8-phase-3--graph-canvas-days-47)
9. [Phase 4 — Chat & Export](#9-phase-4--chat--export-days-710)
10. [Google AI Studio — Master Prompt Set](#10-google-ai-studio--master-prompt-set)
11. [State Management](#11-state-management)
12. [Deployment](#12-deployment)
13. [Demo Strategy](#13-demo-strategy)
14. [What to Cut & Why](#14-what-to-cut--why)

---

## 1. Project Overview

**Intelligent Research Canvas** transforms unstructured research documents (PDFs) into an interactive, AI-powered knowledge workspace. Users upload a paper, and the system simultaneously extracts a visual knowledge graph and key insights. They can then explore the graph, click nodes to see highlighted source passages in the original document, and chat with an AI that has full context of both the document and the graph.

### Core User Journey

```
Upload PDF → [Parallel] Graph Extraction + Insight Analysis
         → Interactive Knowledge Graph (React Flow)
         → Click node → Exact sentence highlights in PDF
         → Chat with AI with full document + graph context
         → Export structured LaTeX / Markdown report
```

### What Makes This Demo-Worthy

- **Bidirectional highlight**: Click a graph node → the exact sentence glows in the PDF. Zero latency.
- **Parallel AI agents**: Graph + Insights run simultaneously. Show two progress bars filling at once.
- **The full chain**: Raw PDF → structured knowledge → compiled LaTeX in one click.

---

## 2. Technology Stack

### Decision Log (With Reasons)

| Decision | Choice | Rejected Alternative | Reason |
|---|---|---|---|
| Framework | Next.js 15 App Router | Next.js + Express | Single deployment, native streaming, fewer moving parts |
| AI Model | Gemini 2.0 Flash | Gemini 1.5 Pro | Faster, free-tier on AI Studio, supports JSON + streaming |
| State | Zustand | Redux / Context API | Zero boilerplate, cross-pane subscriptions are trivial |
| PDF Parse | pdfjs-dist (client) | pdf-parse (server) | No file upload needed, Web Worker = non-blocking |
| Graph Layout | dagre + React Flow | vis.js / D3 force | React-native, composable, custom node types easy |
| DB | None (localStorage persist) | MongoDB | Hackathon scope — zero infra overhead |
| Styling | Tailwind CSS v4 + CSS vars | Styled-components | Faster iteration, no runtime overhead |
| Fonts | Instrument Serif + JetBrains Mono + Geist | Inter / Roboto | Distinctive editorial feel, not generic AI slop |

### Install Commands

```bash
# Init project
npx create-next-app@latest research-canvas --typescript --tailwind --app --src-dir
cd research-canvas

# Core dependencies
npm install @google/generative-ai
npm install reactflow @dagrejs/dagre
npm install pdfjs-dist
npm install zustand
npm install react-markdown remark-gfm
npm install zod

# Dev
npm install -D @types/node
```

---

## 3. Design System — Obsidian Lab

> **Design direction**: Precision scientific tool. Not glassmorphism — that's overused and decorative. Think: Nature journal meets terminal interface. Every element earns its place.

### Color Tokens

```css
/* globals.css — add to :root */
:root {
  --bg-base:        #0C0C0E;   /* main canvas */
  --bg-panel:       #111114;   /* pane backgrounds */
  --bg-elevated:    #18181C;   /* cards, dropdowns */
  --border-subtle:  #1E1E22;   /* panel dividers */
  --border-active:  #2E2E36;   /* hover states */

  --text-primary:   #F0EDE8;   /* warm white — not harsh pure white */
  --text-secondary: #9A9895;   /* labels, captions */
  --text-muted:     #4A4A50;   /* placeholder text */

  --accent-gold:    #E8A231;   /* graph nodes, active */
  --accent-blue:    #4A9EFF;   /* AI/entity nodes, chat */
  --accent-green:   #3ECF8E;   /* method nodes, success */
  --accent-rose:    #E85D82;   /* finding nodes, errors */

  --node-concept:   #E8A231;
  --node-entity:    #4A9EFF;
  --node-method:    #3ECF8E;
  --node-finding:   #E85D82;
}
```

### Typography

```css
/* Font stack */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');
/* Geist via: npm install geist */

/* Usage */
.heading-display  { font-family: 'Instrument Serif', serif; }
.label-mono       { font-family: 'JetBrains Mono', monospace; }
.body-ui          { font-family: var(--font-geist-sans); }
```

### Tailwind Config Extension

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0C0C0E',
          panel:   '#111114',
          raised:  '#18181C',
          border:  '#1E1E22',
          active:  '#2E2E36',
        },
        gold:  '#E8A231',
        ai:    '#4A9EFF',
        sage:  '#3ECF8E',
        rose:  '#E85D82',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
        'fade-in':      'fade-in 0.3s ease-out',
        'slide-up':     'slide-up 0.3s ease-out',
      },
      keyframes: {
        'border-pulse': {
          '0%, 100%': { borderColor: '#E8A23140' },
          '50%':      { borderColor: '#E8A231AA' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config
```

---

## 4. Architecture

### System Overview

```
┌─────────────────────────────────┐      ┌──────────────────────────────────────┐
│   FRONTEND (Next.js Client)     │      │   BACKEND (Next.js API Routes)       │
│                                 │      │                                      │
│  ┌───────────┐  ┌────────────┐  │      │  POST /api/analyze                   │
│  │  Doc Pane │  │ Graph Pane │  │ HTTP │  ├── Agent A: Graph Extractor         │
│  │ (pdfjs)   │  │(React Flow)│  │◄────►│  └── Agent B: Insight Analyzer       │
│  └───────────┘  └────────────┘  │      │       (A + B run in Promise.all)     │
│  ┌─────────────────────────────┐│      │                                      │
│  │  Chat + Insights Pane      ││      │  POST /api/chat (streaming)           │
│  │  (streaming, react-markdown)││      │  └── Agent C: Context Chat            │
│  └─────────────────────────────┘│      │                                      │
│                                 │      │  POST /api/export                    │
│  Zustand Stores                 │      │  └── Agent D: LaTeX Formatter        │
│  ├── graphStore                 │      │                                      │
│  ├── documentStore              │      └──────────────┬───────────────────────┘
│  ├── chatStore                  │                     │
│  └── highlightStore ◄───────────┼─────────────────────┘
└─────────────────────────────────┘                     │
                                                         ▼
                                          ┌──────────────────────────┐
                                          │  Gemini 2.0 Flash        │
                                          │  @google/generative-ai   │
                                          │  JSON mode + Streaming   │
                                          └──────────────────────────┘
```

### Data Flow — On PDF Upload

```
User drops PDF
  → pdfjs-dist (Web Worker, client-side)
  → extractedText: string
  → documentStore.setText(extractedText)
  → POST /api/analyze { text }
      → Promise.all([
          Agent A (Graph Extractor) → { nodes[], edges[] }
          Agent B (Insight Analyzer) → { insights[] }
        ])
  → graphStore.setGraph(nodes, edges)
  → dagre layout calculation
  → React Flow renders
  → InsightsPanel renders
```

### Data Flow — On Node Click

```
User clicks ResearchNode
  → highlightStore.setFocus(source_quote, nodeId)
  → DocumentPane subscribes → highlightQuote(source_quote)
  → DOM text-walk finds exact substring
  → Wraps in <mark class="research-highlight">
  → scrollIntoView({ behavior: 'smooth', block: 'center' })
  → ChatPane: focusQuote injected into next message context
```

---

## 5. File & Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          ← Agents A + B in parallel
│   │   ├── chat/
│   │   │   └── route.ts          ← Agent C streaming
│   │   └── export/
│   │       └── route.ts          ← Agent D LaTeX
│   ├── globals.css               ← CSS custom properties
│   ├── layout.tsx                ← Font loading, metadata
│   └── page.tsx                  ← Three-pane shell
│
├── components/
│   ├── document/
│   │   ├── DocumentPane.tsx      ← PDF renderer + highlight logic
│   │   ├── DropZone.tsx          ← Upload UI (drag + click)
│   │   └── HighlightLayer.tsx    ← DOM manipulation for highlights
│   │
│   ├── graph/
│   │   ├── GraphPane.tsx         ← React Flow wrapper
│   │   ├── ResearchNode.tsx      ← Custom node component
│   │   ├── ResearchEdge.tsx      ← Custom edge with label
│   │   └── useGraphLayout.ts     ← dagre layout hook
│   │
│   ├── chat/
│   │   ├── ChatPane.tsx          ← Tabbed: Insights | Chat
│   │   ├── ChatThread.tsx        ← Message list + streaming
│   │   ├── ChatInput.tsx         ← Textarea + send
│   │   └── InsightsPanel.tsx     ← Insight cards grid
│   │
│   └── ui/
│       ├── LoadingState.tsx      ← Dual progress bars
│       ├── Badge.tsx             ← Category badge
│       └── ExportButton.tsx      ← LaTeX / MD download
│
├── lib/
│   ├── gemini.ts                 ← Shared Gemini client + all prompts
│   ├── pdfWorker.ts              ← Client-side PDF text extraction
│   ├── schema.ts                 ← Zod schemas for API response validation
│   └── dagre.ts                  ← Layout helper
│
└── store/
    ├── graphStore.ts             ← nodes, edges, selected node
    ├── documentStore.ts          ← raw text, page count, filename
    ├── chatStore.ts              ← messages, streaming state
    └── highlightStore.ts         ← activeQuote, activeNodeId
```

---

## 6. Phase 1 — UI Shell (Days 1–2)

### `app/layout.tsx`

```tsx
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata = {
  title: 'Research Canvas',
  description: 'AI-powered knowledge graph from your documents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-obsidian text-[#F0EDE8] antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
```

### `app/page.tsx`

```tsx
'use client'
import { DocumentPane } from '@/components/document/DocumentPane'
import { GraphPane } from '@/components/graph/GraphPane'
import { ChatPane } from '@/components/chat/ChatPane'
import { useDocumentStore } from '@/store/documentStore'

export default function Home() {
  const hasDocument = useDocumentStore(s => s.hasDocument)

  return (
    <main className="h-screen w-screen flex overflow-hidden bg-obsidian">
      {/* Left — Document Viewer (40%) */}
      <section className="w-[40%] flex-shrink-0 border-r border-obsidian-border flex flex-col">
        <DocumentPane />
      </section>

      {/* Right — Graph + Chat (60%) */}
      <section className="flex flex-col flex-1 min-w-0">
        {/* Top — Knowledge Graph */}
        <div className="h-[60%] border-b border-obsidian-border">
          <GraphPane />
        </div>
        {/* Bottom — Insights + Chat */}
        <div className="h-[40%]">
          <ChatPane />
        </div>
      </section>
    </main>
  )
}
```

### `components/document/DropZone.tsx`

```tsx
'use client'
import { useCallback, useState } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import { useGraphStore } from '@/store/graphStore'
import { extractTextFromFile } from '@/lib/pdfWorker'

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const setText = useDocumentStore(s => s.setText)
  const triggerAnalysis = useGraphStore(s => s.triggerAnalysis)

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const text = await extractTextFromFile(file)
      setText(text, file.name)
      await triggerAnalysis(text)
    } finally {
      setIsProcessing(false)
    }
  }, [setText, triggerAnalysis])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-8"
      onDrop={onDrop}
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
    >
      <label className={`
        w-full max-w-sm aspect-video flex flex-col items-center justify-center
        border-2 rounded-xl cursor-pointer transition-all duration-300
        ${isDragging
          ? 'border-gold bg-gold/5 scale-[1.02]'
          : 'border-obsidian-border border-dashed hover:border-obsidian-active animate-border-pulse'
        }
      `}>
        <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />

        {isProcessing ? (
          <div className="text-center space-y-3 animate-fade-in">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"/>
            <p className="font-mono text-xs text-[#9A9895]">Extracting text…</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto opacity-30">
              {/* Document icon SVG */}
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="4" width="32" height="40" rx="4"/>
                <line x1="16" y1="16" x2="32" y2="16"/>
                <line x1="16" y1="24" x2="32" y2="24"/>
                <line x1="16" y1="32" x2="24" y2="32"/>
              </svg>
            </div>
            <div>
              <p className="font-display text-lg text-[#F0EDE8]">Drop your PDF here</p>
              <p className="font-mono text-xs text-[#4A4A50] mt-1">or click to browse</p>
            </div>
          </div>
        )}
      </label>
    </div>
  )
}
```

---

## 7. Phase 2 — Backend & AI Integration (Days 2–4)

### `lib/gemini.ts` — Shared Client + All Prompts

```ts
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set')
}

export const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const MODEL = 'gemini-2.0-flash'

export const JSON_CONFIG: GenerationConfig = {
  responseMimeType: 'application/json',
  temperature: 0.2,         // Low temp = consistent structured output
  topP: 0.8,
  maxOutputTokens: 4096,
}

export const CHAT_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 2048,
}

// ─── Agent Prompts ───────────────────────────────────────────────────────────

export const GRAPH_EXTRACTOR_PROMPT = `You are a precision knowledge extraction engine for academic and research documents.

INPUT: Raw text extracted from a research document.
OUTPUT: A single JSON object. No prose before it. No markdown code fences. No text after it.

## Required JSON Schema

{
  "nodes": [
    {
      "id": "snake_case_unique_id",
      "label": "2 to 5 word human-readable label",
      "category": "concept | entity | method | finding",
      "source_quote": "verbatim exact substring from the input text, minimum 15 characters",
      "description": "one sentence explaining this node in context"
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "relationship": "3 to 6 word description of the relationship",
      "weight": 1
    }
  ]
}

## Category Definitions

- concept: An abstract idea, theory, or principle discussed in the text
- entity: A named, concrete thing — a person, system, dataset, or organization
- method: A process, algorithm, technique, or experimental approach
- finding: A result, conclusion, claim, or empirical observation

## Hard Constraints

1. Produce between 8 and 20 nodes. Prefer fewer, higher-quality nodes over many generic ones.
2. Only create edges where both source and target IDs exist in your nodes array.
3. source_quote MUST be a character-perfect verbatim substring copied directly from the input. It will be used for text search and highlighting — any deviation will cause failures.
4. No duplicate node IDs.
5. weight field must be an integer from 1 to 5 representing relationship strength.
6. category must be exactly one of the four specified strings.
7. If the text is too short or not a research document, return { "nodes": [], "edges": [], "error": "insufficient content" }.`


export const INSIGHT_ANALYZER_PROMPT = `You are a research synthesis engine specializing in extracting structured intelligence from academic documents.

INPUT: Raw text from a research paper or document.
OUTPUT: A single JSON object only. No prose. No markdown.

## Required JSON Schema

{
  "insights": [
    {
      "id": "insight_1",
      "title": "maximum 8 words summarizing the insight",
      "body": "2 to 3 sentence elaboration of the insight, in plain language",
      "category": "finding | limitation | methodology | implication | gap",
      "confidence": "high | medium | low",
      "evidence_hint": "a short phrase or key term from the text that supports this insight"
    }
  ]
}

## Category Definitions

- finding: An empirical result, measured outcome, or observed fact
- limitation: A stated constraint, caveat, or weakness in the research
- methodology: A key technique, experimental design, or analytical approach
- implication: A downstream consequence, recommendation, or application
- gap: Identified missing evidence, future work, or open question

## Hard Constraints

1. Extract exactly 5 insights.
2. Rank them by significance — most important first.
3. confidence reflects how explicitly the insight is stated (high = directly stated, low = inferred).
4. evidence_hint must be a short phrase that could be used to search the original text.
5. If the document has fewer than 5 clear insights, still return 5 — use gap or implication categories for the remainder.`


export const CHAT_SYSTEM_PROMPT = `You are an analytical research assistant embedded in a document exploration workspace.

You have access to three sources of context, provided in the SYSTEM CONTEXT block:
1. DOCUMENT: The full text of the research document
2. GRAPH: A JSON knowledge graph extracted from the document (nodes and edges)
3. FOCUS: The source quote of the graph node the user last clicked (may be empty)

## Behavior Rules

- Answer strictly from the provided context. Do not use external knowledge.
- When referencing a concept from the graph, format it as [NODE: label] — the UI will render this as a clickable chip.
- When quoting the document, use direct language: "The document states..." or "According to the paper..."
- If the answer is not in the context, say so clearly rather than guessing.
- Be precise and concise. Prefer short, dense answers over long ones.
- If FOCUS is provided, bias your interpretation toward that section of the document.

## Response Format

Plain text with Markdown formatting:
- Use **bold** for key terms
- Use \`code\` for technical terms, model names, or dataset names
- Use bullet points for multi-part answers
- Never use headers (##) in chat responses — keep it conversational`


export const EXPORT_PROMPT = `You are a LaTeX academic document formatter.

You will receive:
- INSIGHTS: JSON array of extracted research insights
- GRAPH_SUMMARY: JSON summary of the knowledge graph (nodes and edges)
- CHAT_HISTORY: The full conversation transcript

Produce a complete, compilable LaTeX document with:

1. Preamble with these packages: geometry (margin=1in), hyperref, booktabs, enumitem, xcolor (definecolor for gold: E8A231)
2. Title "Research Canvas — Structured Analysis"
3. Abstract summarizing the document in 3-4 sentences based on the insights
4. Section "Key Findings" — one subsection per insight, using the insight title as subsection heading
5. Section "Concept Map Summary" — an itemized list of all nodes with their category in brackets, followed by a nested list of their edges
6. Section "Research Conversation" — the chat transcript formatted with \\textit{User:} and \\textbf{Assistant:} prefixes
7. \\bibliographystyle{unsrt} and \\bibliography{references} placeholder at the end

Output ONLY the LaTeX source code. No prose before or after. No markdown code fences.`
```

### `app/api/analyze/route.ts`

```ts
import { NextRequest } from 'next/server'
import { genai, MODEL, JSON_CONFIG, GRAPH_EXTRACTOR_PROMPT, INSIGHT_ANALYZER_PROMPT } from '@/lib/gemini'
import { graphResponseSchema, insightResponseSchema } from '@/lib/schema'

export const maxDuration = 60  // Vercel function timeout

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'text field is required' }, { status: 400 })
    }
    if (text.length < 100) {
      return Response.json({ error: 'Document text is too short for analysis' }, { status: 422 })
    }

    const trimmedText = text.slice(0, 50000)  // ~37k tokens — fits Gemini context

    const model = genai.getGenerativeModel({ model: MODEL, generationConfig: JSON_CONFIG })

    // Run both agents in parallel — this is the core agentic workflow
    const [graphResult, insightResult] = await Promise.all([
      model.generateContent(`${GRAPH_EXTRACTOR_PROMPT}\n\n---\n\nTEXT:\n${trimmedText}`),
      model.generateContent(`${INSIGHT_ANALYZER_PROMPT}\n\n---\n\nTEXT:\n${trimmedText}`),
    ])

    const rawGraph = JSON.parse(graphResult.response.text())
    const rawInsights = JSON.parse(insightResult.response.text())

    // Validate with Zod — prevents bad AI output from crashing the frontend
    const graph = graphResponseSchema.parse(rawGraph)
    const insights = insightResponseSchema.parse(rawInsights)

    return Response.json({ graph, insights })
  } catch (err) {
    console.error('[/api/analyze]', err)
    if (err instanceof SyntaxError) {
      return Response.json({ error: 'AI returned malformed JSON. Try again.' }, { status: 502 })
    }
    return Response.json({ error: 'Analysis failed. Check server logs.' }, { status: 500 })
  }
}
```

### `app/api/chat/route.ts`

```ts
import { NextRequest } from 'next/server'
import { genai, MODEL, CHAT_CONFIG, CHAT_SYSTEM_PROMPT } from '@/lib/gemini'

export const maxDuration = 30

function buildSystemContext(docText: string, graph: unknown, focusQuote?: string): string {
  return [
    `DOCUMENT:\n${docText.slice(0, 30000)}`,
    `GRAPH:\n${JSON.stringify(graph, null, 2)}`,
    focusQuote ? `FOCUS:\n${focusQuote}` : '',
  ].filter(Boolean).join('\n\n---\n\n')
}

function toGeminiHistory(messages: Array<{role: string, content: string}>) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

export async function POST(req: NextRequest) {
  try {
    const { messages, docText, graph, focusQuote } = await req.json()
    if (!messages?.length) return Response.json({ error: 'messages required' }, { status: 400 })

    const systemContext = buildSystemContext(docText ?? '', graph ?? {}, focusQuote)
    const fullSystem = `${CHAT_SYSTEM_PROMPT}\n\n## SYSTEM CONTEXT\n\n${systemContext}`

    const model = genai.getGenerativeModel({ model: MODEL, generationConfig: CHAT_CONFIG })
    const history = toGeminiHistory(messages.slice(0, -1))
    const lastMessage = messages.at(-1).content

    const chat = model.startChat({ systemInstruction: fullSystem, history })
    const streamResult = await chat.sendMessageStream(lastMessage)

    // Return a streaming response — the frontend reads chunks as they arrive
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          for await (const chunk of streamResult.stream) {
            const text = chunk.text()
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (err) {
    console.error('[/api/chat]', err)
    return Response.json({ error: 'Chat failed' }, { status: 500 })
  }
}
```

### `app/api/export/route.ts`

```ts
import { NextRequest } from 'next/server'
import { genai, MODEL, EXPORT_PROMPT } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { insights, graph, chatHistory, format } = await req.json()

  const context = `INSIGHTS:\n${JSON.stringify(insights, null, 2)}\n\nGRAPH_SUMMARY:\n${JSON.stringify(graph, null, 2)}\n\nCHAT_HISTORY:\n${chatHistory}`

  const model = genai.getGenerativeModel({ model: MODEL })

  if (format === 'markdown') {
    const result = await model.generateContent(`Convert the following research data into a clean Markdown report with sections for Insights, Concept Map, and Chat History.\n\n${context}`)
    return new Response(result.response.text(), { headers: { 'Content-Type': 'text/markdown' } })
  }

  const result = await model.generateContent(`${EXPORT_PROMPT}\n\n${context}`)
  return new Response(result.response.text(), { headers: { 'Content-Type': 'application/x-tex' } })
}
```

### `lib/schema.ts` — Zod Validation

```ts
import { z } from 'zod'

export const nodeSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(60),
  category: z.enum(['concept', 'entity', 'method', 'finding']),
  source_quote: z.string().min(10),
  description: z.string().optional(),
})

export const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string().min(1).max(80),
  weight: z.number().int().min(1).max(5).default(1),
})

export const graphResponseSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  error: z.string().optional(),
})

export const insightSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  body: z.string().min(10),
  category: z.enum(['finding', 'limitation', 'methodology', 'implication', 'gap']),
  confidence: z.enum(['high', 'medium', 'low']),
  evidence_hint: z.string().optional(),
})

export const insightResponseSchema = z.object({
  insights: z.array(insightSchema).min(1).max(10),
})

export type GraphResponse = z.infer<typeof graphResponseSchema>
export type InsightResponse = z.infer<typeof insightResponseSchema>
export type ResearchNode = z.infer<typeof nodeSchema>
export type ResearchEdge = z.infer<typeof edgeSchema>
export type Insight = z.infer<typeof insightSchema>
```

### `lib/pdfWorker.ts` — Client-Side PDF Extraction

```ts
import * as pdfjs from 'pdfjs-dist'

// Point to the bundled worker — copy to /public in next.config.ts
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const pagePromises = Array.from({ length: pdf.numPages }, (_, i) =>
    pdf.getPage(i + 1).then(page => page.getTextContent())
  )

  const pages = await Promise.all(pagePromises)

  return pages
    .flatMap(page => page.items.map((item: any) => item.str))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
```

> **Note**: Add this to `next.config.ts` to copy the worker file:
> ```ts
> // next.config.ts
> import type { NextConfig } from 'next'
> import CopyPlugin from 'copy-webpack-plugin'
> 
> const nextConfig: NextConfig = {
>   webpack: (config) => {
>     config.plugins.push(new CopyPlugin({
>       patterns: [{ from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs', to: '../public' }]
>     }))
>     return config
>   }
> }
> export default nextConfig
> ```
> Install: `npm install -D copy-webpack-plugin`

---

## 8. Phase 3 — Graph Canvas (Days 4–7)

### `lib/dagre.ts` — Layout Engine

```ts
import dagre from '@dagrejs/dagre'
import type { Node, Edge } from 'reactflow'

const NODE_WIDTH  = 180
const NODE_HEIGHT = 60
const RANK_SEP    = 100
const NODE_SEP    = 60

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: RANK_SEP, nodesep: NODE_SEP })

  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach(e => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map(node => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })
}
```

### `components/graph/ResearchNode.tsx`

```tsx
import { Handle, Position, type NodeProps } from 'reactflow'
import { useHighlightStore } from '@/store/highlightStore'

const CATEGORY_STYLES = {
  concept:  { border: '#E8A231', bg: '#1A150820', label: '#E8A231CC', labelText: 'concept' },
  entity:   { border: '#4A9EFF', bg: '#08142020', label: '#4A9EFFCC', labelText: 'entity' },
  method:   { border: '#3ECF8E', bg: '#0D1A1020', label: '#3ECF8ECC', labelText: 'method' },
  finding:  { border: '#E85D82', bg: '#1A0D1420', label: '#E85D82CC', labelText: 'finding' },
}

export function ResearchNode({ data, selected }: NodeProps) {
  const style = CATEGORY_STYLES[data.category as keyof typeof CATEGORY_STYLES] ?? CATEGORY_STYLES.concept
  const setFocus = useHighlightStore(s => s.setFocus)

  const handleClick = () => {
    if (data.source_quote) setFocus(data.source_quote, data.id)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background: '#111114',
        border: `1px solid ${selected ? style.border : style.border + '50'}`,
        borderRadius: 8,
        padding: '10px 16px',
        minWidth: 140,
        maxWidth: 200,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: selected
          ? `0 0 0 2px ${style.border}30, 0 0 32px ${style.border}15`
          : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border, border: 'none', width: 6, height: 6, top: -3 }}
      />

      {/* Category badge */}
      <p style={{ color: style.label, fontSize: 10, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        {style.labelText}
      </p>

      {/* Node label */}
      <p style={{ color: '#F0EDE8', fontSize: 13, lineHeight: 1.3, fontFamily: 'Geist, sans-serif' }}>
        {data.label}
      </p>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border, border: 'none', width: 6, height: 6, bottom: -3 }}
      />
    </div>
  )
}
```

### `components/graph/GraphPane.tsx`

```tsx
'use client'
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  MarkerType, useNodesState, useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEffect } from 'react'
import { ResearchNode } from './ResearchNode'
import { applyDagreLayout } from '@/lib/dagre'
import { useGraphStore } from '@/store/graphStore'

const nodeTypes = { research: ResearchNode }

const edgeDefaults = {
  type: 'smoothstep',
  style: { stroke: '#FFFFFF12', strokeWidth: 1 },
  labelStyle: { fill: '#4A4A50', fontSize: 10, fontFamily: 'JetBrains Mono' },
  markerEnd: { type: MarkerType.Arrow, color: '#FFFFFF15', width: 14, height: 14 },
}

export function GraphPane() {
  const { rawNodes, rawEdges, isLoading } = useGraphStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (!rawNodes.length) return

    const flowNodes = rawNodes.map(n => ({
      id: n.id,
      type: 'research',
      position: { x: 0, y: 0 },  // dagre will override this
      data: { label: n.label, category: n.category, source_quote: n.source_quote },
    }))

    const flowEdges = rawEdges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      label: e.relationship,
      ...edgeDefaults,
    }))

    const laidOut = applyDagreLayout(flowNodes, flowEdges)
    setNodes(laidOut)
    setEdges(flowEdges)
  }, [rawNodes, rawEdges])

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-obsidian">
        <div className="w-64 space-y-3">
          <LoadingBar label="Mapping concepts" delay={0} />
          <LoadingBar label="Extracting insights" delay={300} />
        </div>
      </div>
    )
  }

  if (!nodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-obsidian">
        <p className="font-mono text-xs text-[#4A4A50]">Upload a document to generate the knowledge graph</p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      style={{ background: '#0C0C0E' }}
    >
      <Background color="#1A1A1F" variant={BackgroundVariant.Dots} gap={24} size={1} />
      <Controls
        style={{ background: '#111114', border: '1px solid #1E1E22', borderRadius: 8 }}
        showInteractive={false}
      />
      <MiniMap
        nodeColor={n => {
          const cat = n.data?.category as string
          return { concept: '#E8A231', entity: '#4A9EFF', method: '#3ECF8E', finding: '#E85D82' }[cat] ?? '#333'
        }}
        style={{ background: '#0C0C0E', border: '1px solid #1E1E22', borderRadius: 8 }}
      />
    </ReactFlow>
  )
}

function LoadingBar({ label, delay }: { label: string; delay: number }) {
  return (
    <div style={{ animationDelay: `${delay}ms` }} className="animate-fade-in">
      <p className="font-mono text-xs text-[#6B6A66] mb-1.5">{label}</p>
      <div className="h-[2px] bg-obsidian-border rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '40%' }}/>
      </div>
    </div>
  )
}
```

### `components/document/DocumentPane.tsx` — Highlight Logic

```tsx
'use client'
import { useRef, useEffect } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import { useHighlightStore } from '@/store/highlightStore'
import { DropZone } from './DropZone'

export function DocumentPane() {
  const { text, filename, hasDocument } = useDocumentStore()
  const { activeQuote } = useHighlightStore()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeQuote || !contentRef.current) return
    highlightQuote(activeQuote, contentRef.current)
  }, [activeQuote])

  if (!hasDocument) return <DropZone />

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-obsidian-border flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-[10px] text-[#4A4A50] uppercase tracking-wider">Document</span>
        <span className="text-[#2E2E36]">/</span>
        <span className="font-mono text-[11px] text-[#9A9895] truncate">{filename}</span>
      </div>

      {/* Scrollable text content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-7 text-[#C0BDB8] font-sans"
        style={{ wordBreak: 'break-word' }}
      >
        {text}
      </div>
    </div>
  )
}

// ─── Highlight Logic ──────────────────────────────────────────────────────────

function highlightQuote(quote: string, container: HTMLDivElement): void {
  // Remove existing highlights
  container.querySelectorAll('.research-highlight').forEach(el => {
    const parent = el.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent ?? ''), el)
      parent.normalize()
    }
  })

  if (!quote) return

  // Walk all text nodes looking for exact match
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let textNode: Text | null

  while ((textNode = walker.nextNode() as Text | null)) {
    const idx = textNode.data.indexOf(quote)
    if (idx === -1) continue

    // Found — split and wrap
    const range = document.createRange()
    range.setStart(textNode, idx)
    range.setEnd(textNode, idx + quote.length)

    const mark = document.createElement('mark')
    mark.className = 'research-highlight'
    mark.style.cssText = `
      background: #E8A23118;
      border-bottom: 1.5px solid #E8A231;
      border-radius: 3px;
      color: inherit;
      padding: 1px 0;
    `

    try {
      range.surroundContents(mark)
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch {
      // surroundContents throws if range crosses element boundaries — safe to ignore
    }
    break
  }
}
```

---

## 9. Phase 4 — Chat & Export (Days 7–10)

### `store/chatStore.ts`

```ts
import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  addMessage: (msg: Message) => void
  updateLastAssistant: (chunk: string) => void
  setStreaming: (v: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  updateLastAssistant: (chunk) => set(s => {
    const msgs = [...s.messages]
    const last = msgs.at(-1)
    if (last?.role === 'assistant') last.content += chunk
    return { messages: msgs }
  }),
  setStreaming: (v) => set({ isStreaming: v }),
  clear: () => set({ messages: [], isStreaming: false }),
}))
```

### `components/chat/ChatPane.tsx`

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore } from '@/store/chatStore'
import { useDocumentStore } from '@/store/documentStore'
import { useGraphStore } from '@/store/graphStore'
import { useHighlightStore } from '@/store/highlightStore'
import { InsightsPanel } from './InsightsPanel'

type Tab = 'insights' | 'chat'

export function ChatPane() {
  const [tab, setTab] = useState<Tab>('insights')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, isStreaming, addMessage, updateLastAssistant, setStreaming } = useChatStore()
  const { text: docText } = useDocumentStore()
  const { rawNodes: graphNodes, rawEdges: graphEdges } = useGraphStore()
  const { activeQuote } = useHighlightStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput('')
    addMessage({ role: 'user', content: trimmed })
    addMessage({ role: 'assistant', content: '' })
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: trimmed }],
          docText,
          graph: { nodes: graphNodes, edges: graphEdges },
          focusQuote: activeQuote,
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        updateLastAssistant(decoder.decode(value, { stream: true }))
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-obsidian-panel">
      {/* Tabs */}
      <div className="flex border-b border-obsidian-border flex-shrink-0">
        {(['insights', 'chat'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === t
                ? 'text-gold border-b-2 border-gold'
                : 'text-[#4A4A50] hover:text-[#9A9895]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'insights' ? (
        <InsightsPanel />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="font-mono text-xs text-[#4A4A50] text-center pt-4">
                Ask anything about the document. Click a graph node first to focus your question.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? (
                  <span className="inline-block bg-obsidian-raised px-3 py-2 rounded-lg text-[#F0EDE8] max-w-[85%]">
                    {msg.content}
                  </span>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-[#C0BDB8]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content + (isStreaming && i === messages.length - 1 ? '▌' : '')}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-obsidian-border px-3 py-2 flex gap-2 flex-shrink-0">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask about the document…"
              rows={1}
              className="flex-1 bg-transparent resize-none font-mono text-xs text-[#F0EDE8] placeholder-[#4A4A50] outline-none py-1.5"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              className="px-3 py-1.5 bg-gold/10 text-gold border border-gold/30 rounded font-mono text-xs hover:bg-gold/20 disabled:opacity-30 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Export Button

```tsx
'use client'
import { useGraphStore } from '@/store/graphStore'
import { useChatStore } from '@/store/chatStore'

export function ExportButton() {
  const { rawNodes, rawEdges } = useGraphStore()
  const { messages } = useChatStore()

  const exportAs = async (format: 'latex' | 'markdown') => {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph: { nodes: rawNodes, edges: rawEdges },
        chatHistory: messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n'),
        format,
      }),
    })
    const text = await res.text()
    const ext = format === 'latex' ? 'tex' : 'md'
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-canvas-export.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => exportAs('markdown')} className="px-3 py-1.5 border border-obsidian-border text-[#9A9895] font-mono text-xs rounded hover:border-obsidian-active hover:text-[#F0EDE8] transition-colors">
        Export MD
      </button>
      <button onClick={() => exportAs('latex')} className="px-3 py-1.5 border border-gold/40 text-gold font-mono text-xs rounded hover:bg-gold/10 transition-colors">
        Export LaTeX
      </button>
    </div>
  )
}
```

---

## 10. Google AI Studio — Master Prompt Set

> Use these prompts verbatim in **Google AI Studio** for testing and iteration before wiring up the SDK.
> For each prompt: create a new chat, paste the System Instructions, then paste a text sample in the user turn.

---

### Prompt A — Graph Extractor

**System Instructions (paste exactly):**

```
You are a precision knowledge extraction engine for academic and research documents.

INPUT: Raw text extracted from a research document.
OUTPUT: A single JSON object. No prose before it. No markdown code fences. No text after it.

Required JSON Schema:
{
  "nodes": [
    {
      "id": "snake_case_unique_id",
      "label": "2 to 5 word human-readable label",
      "category": "concept | entity | method | finding",
      "source_quote": "verbatim exact substring from the input text, minimum 15 characters",
      "description": "one sentence explaining this node in context"
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "relationship": "3 to 6 word description of the relationship",
      "weight": 1
    }
  ]
}

Category Definitions:
- concept: An abstract idea, theory, or principle discussed in the text
- entity: A named, concrete thing — a person, system, dataset, or organization
- method: A process, algorithm, technique, or experimental approach
- finding: A result, conclusion, claim, or empirical observation

Hard Constraints:
1. Produce between 8 and 20 nodes. Prefer fewer, higher-quality nodes.
2. Only create edges where both source and target IDs exist in your nodes array.
3. source_quote MUST be a character-perfect verbatim substring copied directly from the input. It will be used for text search and highlighting — any deviation breaks the application.
4. No duplicate node IDs.
5. weight field must be an integer from 1 to 5 representing relationship strength.
6. category must be exactly one of the four specified strings.
7. If the text is too short or not a research document, return: { "nodes": [], "edges": [], "error": "insufficient content" }

Enable JSON Mode in AI Studio settings before testing.
```

**How to test:** Set AI Studio to JSON mode → paste any research abstract into the user turn.

---

### Prompt B — Insight Analyzer

**System Instructions (paste exactly):**

```
You are a research synthesis engine specializing in extracting structured intelligence from academic documents.

INPUT: Raw text from a research paper or document.
OUTPUT: A single JSON object only. No prose. No markdown code fences.

Required JSON Schema:
{
  "insights": [
    {
      "id": "insight_1",
      "title": "maximum 8 words summarizing the insight",
      "body": "2 to 3 sentence elaboration of the insight, written in plain language for a non-specialist reader",
      "category": "finding | limitation | methodology | implication | gap",
      "confidence": "high | medium | low",
      "evidence_hint": "a short phrase or key term from the text that supports this insight"
    }
  ]
}

Category Definitions:
- finding: An empirical result, measured outcome, or observed fact
- limitation: A stated constraint, caveat, or weakness in the research
- methodology: A key technique, experimental design, or analytical approach
- implication: A downstream consequence, recommendation, or application
- gap: Identified missing evidence, future work, or open question

Hard Constraints:
1. Extract exactly 5 insights. No more, no fewer.
2. Rank them by significance — most important first.
3. confidence reflects how explicitly the insight is stated: high = directly stated, medium = implied, low = inferred.
4. evidence_hint must be a short phrase (5 words max) that could locate this in the text.
5. If the document has fewer than 5 clear insights, use gap or implication categories to reach 5.

Enable JSON Mode in AI Studio settings before testing.
```

---

### Prompt C — Context-Aware Chat

**System Instructions (paste exactly):**

```
You are an analytical research assistant embedded in a document exploration workspace.

You have access to three sources of context (they will be provided in the user's first message):
1. DOCUMENT: The full text of the research document
2. GRAPH: A JSON knowledge graph extracted from the document (nodes and edges)
3. FOCUS: The source quote of the graph node the user last clicked (may be empty)

Behavior Rules:
- Answer strictly from the provided context. Do not use external knowledge unless the user explicitly asks.
- When referencing a concept from the graph, format it as [NODE: label] — this renders as a clickable chip in the UI.
- When quoting the document, use direct attribution: "The document states..." or "According to the paper..."
- If the answer is not in the context, say so clearly rather than guessing.
- Be precise and concise. Prefer short, dense answers over long ones.
- If FOCUS is provided, bias your interpretation toward that section of the document first.

Response Format:
- Plain text with Markdown formatting allowed
- Use **bold** for key terms and important findings
- Use `backticks` for technical terms, model names, or dataset names
- Use bullet points for multi-part answers
- Never use headers (##) in responses — keep it conversational
- Keep responses under 200 words unless the question clearly requires more

Session Start:
When the user sends their first message, it will contain the full context in this format:
DOCUMENT: [text]
GRAPH: [json]
FOCUS: [quote or empty]
[question]

Parse this and answer the question using the provided context.
```

**How to use in the app:** The API route injects the document text, graph JSON, and active focus quote into the system instruction programmatically. In AI Studio for manual testing, paste the context block at the start of the user message.

---

### Prompt D — LaTeX Exporter

**System Instructions (paste exactly):**

```
You are a LaTeX academic document formatter with expertise in producing clean, compilable research reports.

You will receive:
- INSIGHTS: JSON array of structured research insights
- GRAPH_SUMMARY: JSON representing the knowledge graph (nodes with categories, edges with relationships)
- CHAT_HISTORY: Plain text transcript of the research conversation

Your task: Produce a complete, compilable LaTeX document.

Required Document Structure:
1. Preamble — use these packages:
   \usepackage[margin=1in]{geometry}
   \usepackage{hyperref}
   \usepackage{booktabs}
   \usepackage{enumitem}
   \usepackage{xcolor}
   \definecolor{researchgold}{HTML}{E8A231}
   \usepackage{titlesec}
   
2. Document Info:
   \title{Research Canvas — Structured Analysis}
   \author{Generated by Intelligent Research Canvas}
   \date{\today}
   
3. Abstract — 3 to 4 sentences summarizing the document based on the top insights.

4. Section: Key Findings
   One \subsection per insight, using the insight title.
   Body text for each insight. Confidence level as a small note in \textit{}.
   
5. Section: Concept Map Summary
   \begin{itemize} listing each node as: \item \textbf{[CATEGORY]} label — description
   Then a nested \begin{itemize} listing its connected edges.
   
6. Section: Research Conversation
   The full chat transcript formatted as:
   \textit{User:} question text
   \textbf{Assistant:} answer text
   (one blank line between exchanges)
   
7. Bibliography placeholder:
   \bibliographystyle{unsrt}
   \bibliography{references}

Output Rules:
- Output ONLY the LaTeX source. No prose before it. No markdown code fences (no triple backticks). No explanations after it.
- The output must be directly saveable as a .tex file and compilable with pdflatex.
- Escape all special LaTeX characters in user content: & % $ # _ { } ~ ^ \
- If CHAT_HISTORY is empty, omit Section 3 entirely.
```

---

### Prompt Testing Checklist for AI Studio

| Test | Expected Result |
|---|---|
| Paste a research abstract → Prompt A | Valid JSON with nodes array, all IDs snake_case, all source_quotes present as substrings |
| Paste a 500-word paper excerpt → Prompt A | 8–20 nodes, edges only reference existing node IDs |
| Paste same excerpt → Prompt B | Exactly 5 insights, all categories valid enum values |
| Pass context + question → Prompt C | Response references [NODE: ...] format, stays within document context |
| Pass insights + graph + chat → Prompt D | Compilable .tex output, no markdown fences, correct document structure |

---

## 11. State Management

### `store/highlightStore.ts`

```ts
import { create } from 'zustand'

interface HighlightState {
  activeQuote:  string | null
  activeNodeId: string | null
  setFocus: (quote: string, nodeId: string) => void
  clearFocus: () => void
}

export const useHighlightStore = create<HighlightState>((set) => ({
  activeQuote:  null,
  activeNodeId: null,
  setFocus: (quote, nodeId) => set({ activeQuote: quote, activeNodeId: nodeId }),
  clearFocus: () => set({ activeQuote: null, activeNodeId: null }),
}))
```

### `store/graphStore.ts`

```ts
import { create } from 'zustand'
import type { ResearchNode, ResearchEdge, Insight } from '@/lib/schema'

interface GraphState {
  rawNodes:  ResearchNode[]
  rawEdges:  ResearchEdge[]
  insights:  Insight[]
  isLoading: boolean
  error:     string | null
  triggerAnalysis: (text: string) => Promise<void>
  setGraph: (nodes: ResearchNode[], edges: ResearchEdge[]) => void
}

export const useGraphStore = create<GraphState>((set) => ({
  rawNodes:  [],
  rawEdges:  [],
  insights:  [],
  isLoading: false,
  error:     null,

  triggerAnalysis: async (text: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Analysis failed')
      }
      const { graph, insights } = await res.json()
      set({ rawNodes: graph.nodes, rawEdges: graph.edges, insights: insights.insights, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  setGraph: (nodes, edges) => set({ rawNodes: nodes, rawEdges: edges }),
}))
```

### `store/documentStore.ts`

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DocumentState {
  text:        string
  filename:    string
  hasDocument: boolean
  setText: (text: string, filename: string) => void
  clear:   () => void
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      text:        '',
      filename:    '',
      hasDocument: false,
      setText: (text, filename) => set({ text, filename, hasDocument: true }),
      clear:   () => set({ text: '', filename: '', hasDocument: false }),
    }),
    { name: 'research-canvas-document' }  // persists to localStorage
  )
)
```

---

## 12. Deployment

### Environment Setup

```bash
# .env.local
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

Get your key at: [aistudio.google.com](https://aistudio.google.com) → Get API Key

### Deploy to Vercel (One Command)

```bash
npm i -g vercel
vercel deploy --prod
```

Add `GEMINI_API_KEY` in Vercel Dashboard → Project Settings → Environment Variables.

### `vercel.json`

```json
{
  "functions": {
    "app/api/analyze/route.ts": { "maxDuration": 60 },
    "app/api/chat/route.ts":    { "maxDuration": 30 },
    "app/api/export/route.ts":  { "maxDuration": 60 }
  }
}
```

---

## 13. Demo Strategy

### The Three Moments That Win

**Moment 1 — The Click.** Click a graph node. Watch the exact sentence in the PDF glow amber. Zero latency. Say: *"The graph isn't just a visualization — it's linked to the source text."*

**Moment 2 — Parallel Speed.** Show the two loading bars filling simultaneously when a document is uploaded. Say: *"Two AI agents running in parallel — one mapping concepts, one extracting insights."*

**Moment 3 — The Chain.** Click Export LaTeX. Open the `.tex` file. Show it's a compilable academic document. Say: *"From a PDF upload to a structured report in under 20 seconds."*

### Pre-Demo Checklist

- [ ] API key is set, Vercel is deployed
- [ ] Test document is pre-selected (pick a well-structured 5-10 page paper)
- [ ] Have the PDF upload ready — don't waste time browsing during the demo
- [ ] Test the full flow once before presenting — cached responses will be instant
- [ ] Have a backup: screenshot of the graph rendered, in case of network issues

---

## 14. What to Cut & Why

| Original Plan Item | Status | Reason |
|---|---|---|
| Separate Express server | ❌ Removed | Next.js API routes replace it. Single deployment. |
| MongoDB | ❌ Removed | Zustand persist + localStorage is sufficient for hackathon scope. |
| Gemini 1.5 Pro | ❌ Replaced with 2.0 Flash | 2.0 Flash is faster and free-tier on AI Studio. |
| react-pdf | ❌ Replaced with pdfjs-dist | More control, runs client-side, no server file handling. |
| Glassmorphism UI | ❌ Replaced with Obsidian Lab | Glassmorphism is overused. Obsidian Lab is distinctive and functional. |
| Vercel AI SDK | ❌ Not used | Direct streaming from Gemini SDK is simpler and removes abstraction. |
| Generic Inter/Roboto fonts | ❌ Replaced | Instrument Serif + JetBrains Mono = memorable, editorial feel. |

---

*Built for hackathon · Powered by Gemini 2.0 Flash · Deployed on Vercel*

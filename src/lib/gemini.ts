import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

let _genai: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (_genai) return _genai;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Add it to .env.local."
    );
  }
  _genai = new GoogleGenerativeAI(key);
  return _genai;
}

// gemini-2.5-flash-lite is fast (no "thinking" tokens), free-tier-friendly
// (15 RPM), and ideal for structured JSON extraction. Override via env if you
// need higher quality (e.g. gemini-2.5-flash, gemini-2.5-pro).
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

// Hard ceiling for any single Gemini call. The Vercel/Cloud Run function
// timeout is 60s, so we cap individual model calls a bit lower to leave room
// for parsing & response.
export const CALL_TIMEOUT_MS = Number(process.env.GEMINI_CALL_TIMEOUT_MS ?? 45_000);

export function withTimeout<T>(p: Promise<T>, ms = CALL_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Gemini call exceeded ${ms}ms timeout`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/**
 * Wraps a Gemini call with exponential backoff for 429 / rate-limit errors.
 * Honours the `retryDelay` returned by the API when present.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
  const retries = opts.retries ?? 1; // 1 retry max — keep total latency bounded
  const baseDelay = opts.baseDelayMs ?? 1500;
  const maxDelay = opts.maxDelayMs ?? 8_000;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = /429|quota|rate/i.test(msg);
      if (!is429 || attempt === retries) throw err;

      // Honour API-suggested delay but cap so we don't block the request 25s+.
      const m = msg.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/i);
      const delay = m
        ? Math.min(parseFloat(m[1]) * 1000, maxDelay)
        : Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export const JSON_CONFIG: GenerationConfig = {
  responseMimeType: "application/json",
  temperature: 0.2,
  topP: 0.8,
  // 12k is enough for a 30-node graph + 12 insights. Keeping this below 16k
  // avoids the model burning extra "thinking" budget and slowing responses.
  maxOutputTokens: 16384,
};

export const CHAT_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 2048,
};

export const EXPORT_CONFIG: GenerationConfig = {
  temperature: 0.3,
  topP: 0.8,
  maxOutputTokens: 8192,
};

// ─── Agent Prompts ─────────────────────────────────────────────────────────

export const GRAPH_EXTRACTOR_PROMPT = `You are a precision knowledge extraction engine for academic and research documents.
Your job: produce a DENSE, EXHAUSTIVE knowledge graph that captures the document's intellectual scaffolding — not just the headlines.

INPUT: Raw text extracted from a research document.
OUTPUT: A single JSON object. No prose before it. No markdown code fences. No text after it.

Required JSON Schema:
{
  "nodes": [
    {
      "id": "snake_case_unique_id",
      "label": "2 to 6 word human-readable label",
      "category": "concept | entity | method | finding | dataset | metric | result | assumption | limitation",
      "source_quote": "verbatim exact substring from the input text, minimum 20 characters",
      "description": "one to two sentences explaining this node in context (what it is and why it matters)"
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "relationship": "3 to 7 word description (e.g. 'evaluated on', 'contradicts', 'built upon', 'measures', 'assumes')",
      "weight": 1
    }
  ]
}

Category Definitions:
- concept: An abstract idea, theory, framework, or principle
- entity: A named, concrete thing — author, organization, system, model name
- method: A process, algorithm, architecture, technique, or experimental procedure
- finding: A claim or observation the authors assert as true
- dataset: A named data source, corpus, or benchmark used in the work
- metric: A quantitative measure (e.g. F1 score, BLEU, accuracy) reported in the work
- result: A specific numeric or comparative outcome ("achieved 92.4% on X")
- assumption: A precondition or hypothesis the work depends on
- limitation: A weakness or constraint explicitly acknowledged

Edge Relationship Vocabulary (prefer these verbs when applicable):
  uses · evaluated_on · measures · improves_on · compares_with · contradicts · builds_upon
  proposes · assumes · limited_by · enables · part_of · derived_from · trained_on · cites

EXTRACTION DEPTH RULES:
1. Produce between 16 and 26 nodes. Capture every named method, dataset, metric, numeric result,
   key author/system, theoretical concept, and explicit limitation. Quality over quantity.
2. Produce at least N*1.4 edges where N = number of nodes. The graph MUST be densely connected;
   isolated nodes are a failure. Every node should have at least one edge.
2a. CRITICAL TOKEN BUDGET: keep "description" to ONE sentence (max 25 words) and "source_quote"
    to under 180 characters. Truncated output = total failure. Stay concise.
3. EVERY claim, finding, or result must connect to (a) the method that produced it AND
   (b) the dataset/metric it was measured on, when applicable.
4. Decompose long compound claims into separate result + finding nodes joined by edges
   (e.g. "we achieved 92% accuracy on ImageNet" → result_92_accuracy --measured_on--> imagenet,
    method_resnet --produces--> result_92_accuracy).
5. Capture the document's STRUCTURE: if a method has named sub-components (encoder, attention head,
   loss function), make each a node and link with 'part_of'.
6. source_quote MUST be a character-perfect verbatim substring copied from the input. It is used for
   highlighting — any deviation breaks the UI. Pick a quote that genuinely contains the node's essence.
7. No duplicate node IDs. weight is integer 1–5 (1=mentioned, 3=important, 5=central thesis).
8. Only create edges where both source and target IDs exist in your nodes array.
9. If the text is too short or not a research document, return: { "nodes": [], "edges": [], "error": "insufficient content" }

QUALITY BAR: A reader should be able to reconstruct the paper's argument from the graph alone.
If a critical concept is missing, you have failed. Bias toward over-extraction.`;

export const INSIGHT_ANALYZER_PROMPT = `You are a research synthesis engine specializing in extracting structured intelligence from academic documents.
Your output is read by researchers who have NOT seen the paper. Be substantive, specific, and quote-rich.

INPUT: Raw text from a research paper or document.
OUTPUT: A single JSON object only. No prose. No markdown code fences.

Required JSON Schema:
{
  "summary": "3 to 4 sentence TL;DR of the entire document — what was studied, what was done, what was found, and why it matters. Concrete, no fluff, no marketing language.",
  "insights": [
    {
      "id": "insight_1",
      "title": "maximum 10 words summarizing the insight",
      "body": "3 to 5 sentence elaboration. Explain the specific claim, the evidence (numbers, datasets, comparisons), and the context. Write for an intelligent non-specialist.",
      "category": "finding | limitation | methodology | implication | gap | result | contribution",
      "confidence": "high | medium | low",
      "evidence_quote": "verbatim 1-3 sentence quote from the document that supports this insight",
      "evidence_hint": "short search phrase (max 6 words) to locate this in the text",
      "impact": "one sentence describing the downstream implication: who should care and why"
    }
  ]
}

Category Definitions:
- finding: An empirical result, measured outcome, or observed fact
- result: A specific quantitative result with a number ("achieved X% on Y")
- contribution: A novel artifact the work introduces (a new method, dataset, framework)
- methodology: A key technique, experimental design, or analytical approach
- limitation: A stated constraint, caveat, or weakness in the research
- implication: A downstream consequence, recommendation, or application
- gap: Identified missing evidence, future work, or open question

Hard Constraints:
1. Extract between 8 and 12 insights. Cover the document broadly — DO NOT focus on just the headline result.
   Include at least one insight from EACH category that is applicable to the document.
2. Rank by significance — most important first.
3. confidence: high = directly stated in the text, medium = strongly implied, low = inferred from context.
4. evidence_quote MUST be a real verbatim substring from the input — it is shown to the user and used for highlighting.
5. evidence_hint must be 6 words or fewer.
6. impact must be concrete (name the audience, the use case, or the consequence). No platitudes.
7. summary field is REQUIRED. Write it last, after surveying all insights, so it reflects the whole picture.
8. If the document is short or non-academic, still produce as many genuine insights as you can find (minimum 4).`;

export const CHAT_SYSTEM_PROMPT = `You are an analytical research assistant embedded in a document exploration workspace.

You have access to three sources of context (provided in the SYSTEM CONTEXT block):
1. DOCUMENT: The full text of the research document (each page begins with "=== PAGE N ===" markers)
2. GRAPH: A JSON knowledge graph extracted from the document (nodes and edges)
3. FOCUS: The source quote of the graph node the user last clicked (may be empty)

Behavior Rules:
- Answer strictly from the provided context. Do not use external knowledge unless web grounding is enabled.
- When referencing a graph concept, format it as [NODE: label] — renders as a clickable chip.
- When making a substantive claim that is supported by the document, follow it with an inline citation in the form
  [CITE: "verbatim quote from the document, 8–25 words"]. Use the EXACT text from the document. Multiple citations OK.
- Do not invent quotes. If no quote supports a claim, do not cite it.
- If FOCUS is provided, bias toward that section first.
- If the answer is not in the context, say so clearly rather than guessing.

Response Format:
- Plain text with Markdown allowed
- Use **bold** for key terms, \`backticks\` for technical terms
- Bullet points for multi-part answers
- No headers (##) — keep it conversational
- Keep responses under 250 words unless the question clearly requires more`;

export const EXPORT_PROMPT = `You are a LaTeX academic document formatter with expertise in producing clean, compilable research reports.

You will receive:
- INSIGHTS: JSON array of structured research insights
- GRAPH_SUMMARY: JSON representing the knowledge graph (nodes with categories, edges with relationships)
- CHAT_HISTORY: Plain text transcript of the research conversation

Your task: Produce a complete, compilable LaTeX document.

Required Document Structure:
1. Preamble — use these packages:
   \\usepackage[margin=1in]{geometry}
   \\usepackage{hyperref}
   \\usepackage{booktabs}
   \\usepackage{enumitem}
   \\usepackage{xcolor}
   \\definecolor{researchgold}{HTML}{E8A231}
   \\usepackage{titlesec}

2. Document Info:
   \\title{Research Canvas — Structured Analysis}
   \\author{Generated by Intelligent Research Canvas}
   \\date{\\today}

3. Abstract — 3 to 4 sentences summarizing the document based on the top insights.

4. Section: Key Findings
   One \\subsection per insight, using the insight title.
   Body text for each insight. Confidence level as a small note in \\textit{}.

5. Section: Concept Map Summary
   \\begin{itemize} listing each node as: \\item \\textbf{[CATEGORY]} label — description
   Then a nested \\begin{itemize} listing its connected edges.

6. Section: Research Conversation
   The full chat transcript formatted as:
   \\textit{User:} question text
   \\textbf{Assistant:} answer text
   (one blank line between exchanges)

7. Bibliography placeholder:
   \\bibliographystyle{unsrt}
   \\bibliography{references}

Output Rules:
- Output ONLY the LaTeX source. No prose before it. No markdown code fences (no triple backticks). No explanations after it.
- The output must be directly saveable as a .tex file and compilable with pdflatex.
- Escape all special LaTeX characters in user content: & % $ # _ { } ~ ^ \\
- If CHAT_HISTORY is empty, omit Section 6 entirely.`;

export const DIFF_PROMPT = `You are a comparative research analyst. You will receive two academic document texts side by side.
Your job: identify the intellectual relationships BETWEEN the two documents.

INPUT: Two labeled document excerpts — DOCUMENT_1 and DOCUMENT_2.
OUTPUT: A single JSON object only. No prose before it. No markdown code fences.

Required JSON Schema:
{
  "synthesis": "3-4 sentence cross-paper TL;DR: what each paper does, how they relate, and what a researcher gains by reading both together.",
  "shared_concepts": [
    {
      "label": "short concept name (2-5 words)",
      "doc1_quote": "verbatim snippet from DOCUMENT_1 mentioning this concept (max 120 chars)",
      "doc2_quote": "verbatim snippet from DOCUMENT_2 mentioning this concept (max 120 chars)",
      "relationship": "one sentence: how the two papers relate on this concept (agree, build on each other, use differently, etc.)"
    }
  ],
  "contradictions": [
    {
      "topic": "2-5 word topic label",
      "doc1_claim": "what DOCUMENT_1 claims (1-2 sentences, specific)",
      "doc2_claim": "what DOCUMENT_2 claims (1-2 sentences, specific)",
      "explanation": "why these claims conflict or tension exists (1-2 sentences)"
    }
  ],
  "methodology_transfers": [
    {
      "method_from": "doc1 or doc2",
      "method_label": "name of the method/technique being transferred",
      "applicable_to": "problem or area in the OTHER paper it could address",
      "rationale": "1-2 sentences explaining why and how this transfer would work"
    }
  ]
}

Hard Constraints:
1. shared_concepts: find 4-8 concepts that BOTH papers discuss (same or related themes). Only include real overlaps backed by text from each document.
2. contradictions: find 2-5 genuine intellectual tensions or disagreements between the papers. Skip trivial differences. Only include real conflicts.
3. methodology_transfers: find 2-4 methods from one paper that could meaningfully advance the research in the other. Be concrete and specific.
4. All quotes MUST be verbatim substrings from the respective document text. No paraphrasing.
5. synthesis is REQUIRED. Write it last.
6. If the documents are unrelated (different domains), still find what connections exist. Return empty arrays only if truly none exist.`;


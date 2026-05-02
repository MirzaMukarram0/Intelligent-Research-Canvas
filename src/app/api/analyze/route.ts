import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  getGenAI,
  MODEL,
  JSON_CONFIG,
  GRAPH_EXTRACTOR_PROMPT,
  INSIGHT_ANALYZER_PROMPT,
  withRetry,
  withTimeout,
} from "@/lib/gemini";
import { humanizeGeminiError } from "@/lib/errors";
import {
  graphResponseSchema,
  insightResponseSchema,
} from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

// Per-call ceiling. Graph + insights run in parallel; each may take up to
// ~55s on large papers with the new richer prompts + 60k input window.
const PER_CALL_TIMEOUT_MS = 75_000;

async function callJson<T>(
  label: string,
  fn: () => Promise<{ response: { text(): string } }>,
  parse: (raw: unknown) => T
): Promise<T> {
  const t0 = Date.now();
  const result = await withRetry(() => withTimeout(fn(), PER_CALL_TIMEOUT_MS));
  const elapsed = Date.now() - t0;
  const raw = result.response.text();
  console.log(`[/api/analyze] ${label} ${elapsed}ms · ${raw.length} chars`);
  if (!raw.trim()) {
    throw new Error(
      `${label}: model returned empty response (likely token-budget exhaustion)`
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Strip code fences first.
    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Last resort: the response was truncated mid-stream by the token
      // ceiling. Attempt to repair by closing the open string + brackets.
      console.warn(
        `[/api/analyze] ${label} JSON truncated at ${cleaned.length} chars — attempting repair`
      );
      parsed = JSON.parse(repairTruncatedJson(cleaned));
    }
  }
  return parse(parsed);
}

/**
 * Best-effort repair for JSON truncated mid-stream (token-budget hit).
 * Handles:
 *   1. Truncation inside a string value  → backtrack to last complete element
 *   2. Dangling "key": with no value     → remove the key before closing
 *   3. Trailing commas                   → strip before closing brackets
 *   4. Open brackets/braces             → close in reverse order
 */
function repairTruncatedJson(s: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let lastSafeIdx = -1; // index just after the last fully-closed array element
  let lastCommaIdx = -1; // last comma seen outside a string

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) { escape = false; }
      else if (c === "\\") { escape = true; }
      else if (c === '"') { inString = false; }
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === ",") { lastCommaIdx = i; }
    if (c === "{" || c === "[") {
      stack.push(c === "{" ? "}" : "]");
    } else if (c === "}" || c === "]") {
      stack.pop();
      if (stack.length === 1 && stack[0] === "]") lastSafeIdx = i + 1;
    }
  }

  let out = s;

  // Phase 1: if truncated inside a string, backtrack to last complete element.
  if (inString) {
    if (lastSafeIdx > 0) {
      return repairTruncatedJson(s.slice(0, lastSafeIdx));
    }
    if (lastCommaIdx > 0) {
      return repairTruncatedJson(s.slice(0, lastCommaIdx));
    }
    // Just close the string as a fallback.
    out = s + '"';
  }

  // Phase 2: remove dangling "key": with no value before any close bracket.
  // e.g. {"id":"x","source":} → {"id":"x"}
  out = out.replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:\s*(?=[\}\]])/g, "");

  // Phase 3: remove trailing "key": at end of string (value not started).
  out = out.replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:\s*$/, "");

  // Phase 4: remove trailing commas before close brackets.
  out = out.replace(/,(\s*[\}\]])/g, "$1");

  // Phase 5: close all still-open brackets.
  const finalStack: string[] = [];
  inString = false; escape = false;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (inString) {
      if (escape) { escape = false; }
      else if (c === "\\") { escape = true; }
      else if (c === '"') { inString = false; }
    } else {
      if (c === '"') { inString = true; }
      else if (c === "{" || c === "[") { finalStack.push(c === "{" ? "}" : "]"); }
      else if (c === "}" || c === "]") { finalStack.pop(); }
    }
  }
  while (finalStack.length) out += finalStack.pop();
  return out;
}

export async function POST(req: NextRequest) {
  const reqStart = Date.now();
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "text field is required" },
        { status: 400 }
      );
    }
    if (text.length < 200) {
      return Response.json(
        { error: "Document text is too short for analysis." },
        { status: 422 }
      );
    }

    // Cap input — graph extractor uses 35k (its output is ~4× the input size
    // so 35k → ~14k output which fits comfortably in the token budget).
    // Insights extractor can use more text safely (its output is much smaller).
    const graphText = text.slice(0, 35_000);
    const insightText = text.slice(0, 60_000);
    console.log(
      `[/api/analyze] start · model=${MODEL} · input=${insightText.length} chars`
    );

    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      generationConfig: JSON_CONFIG,
    });

    const [graph, insightWrap] = await Promise.all([
      callJson(
        "graph",
        () =>
          model.generateContent(
            `${GRAPH_EXTRACTOR_PROMPT}\n\n---\n\nTEXT:\n${graphText}`
          ),
        (raw) => graphResponseSchema.parse(raw)
      ),
      callJson(
        "insights",
        () =>
          model.generateContent(
            `${INSIGHT_ANALYZER_PROMPT}\n\n---\n\nTEXT:\n${insightText}`
          ),
        (raw) => insightResponseSchema.parse(raw)
      ),
    ]);

    // Filter edges to only those whose source/target are valid node IDs.
    const ids = new Set(graph.nodes.map((n) => n.id));
    graph.edges = graph.edges.filter(
      (e) => ids.has(e.source) && ids.has(e.target)
    );

    console.log(
      `[/api/analyze] done · ${Date.now() - reqStart}ms · ${
        graph.nodes.length
      } nodes · ${graph.edges.length} edges · ${
        insightWrap.insights.length
      } insights · summary=${insightWrap.summary ? "yes" : "no"}`
    );

    return Response.json({ graph, insights: insightWrap });
  } catch (err) {
    console.error(`[/api/analyze] failed after ${Date.now() - reqStart}ms`, err);
    if (err instanceof ZodError) {
      return Response.json(
        {
          error: "AI response did not match the expected shape.",
          hint:
            err.issues
              .slice(0, 3)
              .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
              .join(" · ") || "Try again — the model occasionally drifts.",
        },
        { status: 502 }
      );
    }
    if (err instanceof SyntaxError) {
      return Response.json(
        { error: "AI returned malformed JSON. Try again." },
        { status: 502 }
      );
    }
    const { status, message, hint } = humanizeGeminiError(err);
    return Response.json({ error: message, hint }, { status });
  }
}

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
export const maxDuration = 60;

// Per-call cap so a stalled Gemini request can't burn the entire 60s budget.
const PER_CALL_TIMEOUT_MS = 40_000;

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
    // Some models wrap JSON in code fences despite responseMimeType.
    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  }
  return parse(parsed);
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

    // Cap input aggressively — most papers reach diminishing returns past ~25k.
    const trimmedText = text.slice(0, 25_000);
    console.log(
      `[/api/analyze] start · model=${MODEL} · input=${trimmedText.length} chars`
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
            `${GRAPH_EXTRACTOR_PROMPT}\n\n---\n\nTEXT:\n${trimmedText}`
          ),
        (raw) => graphResponseSchema.parse(raw)
      ),
      callJson(
        "insights",
        () =>
          model.generateContent(
            `${INSIGHT_ANALYZER_PROMPT}\n\n---\n\nTEXT:\n${trimmedText}`
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
      } insights`
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

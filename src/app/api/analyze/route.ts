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
 * Strategy: walk the prefix, track string/bracket state, then close anything
 * still open. Drops the trailing partial element when needed.
 */
function repairTruncatedJson(s: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let lastSafeIdx = -1; // index just after last fully-closed top-level element

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{" || c === "[") {
      stack.push(c === "{" ? "}" : "]");
    } else if (c === "}" || c === "]") {
      stack.pop();
      // After closing, if we're inside an array (top frame is ']'), this
      // is the end of one element — remember as a safe truncation point.
      if (stack.length === 1 && stack[0] === "]") lastSafeIdx = i + 1;
    }
  }

  let out = s;
  // If we ended inside a string, truncate back to the last safe element.
  if (inString && lastSafeIdx > 0) {
    out = s.slice(0, lastSafeIdx);
    // Recompute open brackets for the truncated prefix.
    return repairTruncatedJson(out);
  }
  // Drop trailing comma if the partial element was cut between commas.
  out = out.replace(/,\s*$/, "");
  // Close all open structures in reverse order.
  while (stack.length) out += stack.pop();
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

    // Cap input at 60k chars — large enough for most papers, still leaves
    // headroom under the model's 1M-token context window.
    const trimmedText = text.slice(0, 60_000);
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

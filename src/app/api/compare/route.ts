import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  getGenAI,
  MODEL,
  JSON_CONFIG,
  GRAPH_EXTRACTOR_PROMPT,
  DIFF_PROMPT,
  withRetry,
  withTimeout,
} from "@/lib/gemini";
import { humanizeGeminiError } from "@/lib/errors";
import { graphResponseSchema, diffResponseSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  console.log(`[/api/compare] ${label} ${elapsed}ms · ${raw.length} chars`);
  if (!raw.trim()) throw new Error(`${label}: empty response`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Best-effort: close dangling structures
      parsed = JSON.parse(closeDanglingJson(cleaned));
    }
  }
  return parse(parsed);
}

function closeDanglingJson(s: string): string {
  let inString = false, escape = false;
  const stack: string[] = [];
  for (const c of s) {
    if (inString) {
      if (escape) { escape = false; }
      else if (c === "\\") { escape = true; }
      else if (c === '"') { inString = false; }
    } else {
      if (c === '"') inString = true;
      else if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
      else if (c === "}" || c === "]") stack.pop();
    }
  }
  let out = s.replace(/,?\s*"[^"]*"\s*:\s*$/, "").replace(/,(\s*[}\]])/g, "$1");
  while (stack.length) out += stack.pop();
  return out;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { text1, text2, filename1, filename2 } = await req.json();

    if (!text1 || !text2 || typeof text1 !== "string" || typeof text2 !== "string") {
      return Response.json({ error: "text1 and text2 are required" }, { status: 400 });
    }
    if (text1.length < 200 || text2.length < 200) {
      return Response.json({ error: "Both documents must have at least 200 characters." }, { status: 422 });
    }

    const doc1 = text1.slice(0, 30_000);
    const doc2 = text2.slice(0, 30_000);

    console.log(`[/api/compare] start · model=${MODEL} · doc1=${doc1.length} · doc2=${doc2.length}`);

    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      generationConfig: JSON_CONFIG,
    });

    // Run all three extractions in parallel: graph for doc1, graph for doc2, diff
    const [graph1, graph2, diff] = await Promise.all([
      callJson(
        "graph1",
        () => model.generateContent(`${GRAPH_EXTRACTOR_PROMPT}\n\n---\n\nTEXT:\n${doc1}`),
        (raw) => graphResponseSchema.parse(raw)
      ),
      callJson(
        "graph2",
        () => model.generateContent(`${GRAPH_EXTRACTOR_PROMPT}\n\n---\n\nTEXT:\n${doc2}`),
        (raw) => graphResponseSchema.parse(raw)
      ),
      callJson(
        "diff",
        () => model.generateContent(
          `${DIFF_PROMPT}\n\n---\n\nDOCUMENT_1 (${filename1 ?? "Paper A"}):\n${doc1}\n\n---\n\nDOCUMENT_2 (${filename2 ?? "Paper B"}):\n${doc2}`
        ),
        (raw) => diffResponseSchema.parse(raw)
      ),
    ]);

    // Prefix all node IDs with doc index to avoid collisions
    const prefix = (nodes: typeof graph1.nodes, p: string) =>
      nodes.map((n) => ({ ...n, id: `${p}_${n.id}`, _doc: p }));
    const prefixEdges = (edges: typeof graph1.edges, p: string) =>
      edges.map((e) => ({ ...e, source: `${p}_${e.source}`, target: `${p}_${e.target}` }));

    graph1.nodes = prefix(graph1.nodes, "d1");
    graph1.edges = prefixEdges(graph1.edges, "d1");
    graph2.nodes = prefix(graph2.nodes, "d2");
    graph2.edges = prefixEdges(graph2.edges, "d2");

    const ids1 = new Set(graph1.nodes.map((n) => n.id));
    const ids2 = new Set(graph2.nodes.map((n) => n.id));
    graph1.edges = graph1.edges.filter((e) => ids1.has(e.source) && ids1.has(e.target));
    graph2.edges = graph2.edges.filter((e) => ids2.has(e.source) && ids2.has(e.target));

    console.log(
      `[/api/compare] done · ${Date.now() - t0}ms · ` +
      `${graph1.nodes.length}+${graph2.nodes.length} nodes · ` +
      `${diff.shared_concepts.length} shared · ${diff.contradictions.length} contradictions`
    );

    return Response.json({ graph1, graph2, diff, filename1, filename2 });
  } catch (err) {
    console.error(`[/api/compare] failed after ${Date.now() - t0}ms`, err);
    if (err instanceof ZodError) {
      return Response.json({
        error: "AI response did not match expected shape.",
        hint: err.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join(" · "),
      }, { status: 502 });
    }
    if (err instanceof SyntaxError) {
      return Response.json({ error: "AI returned malformed JSON. Try again." }, { status: 502 });
    }
    const { status, message, hint } = humanizeGeminiError(err);
    return Response.json({ error: message, hint }, { status });
  }
}

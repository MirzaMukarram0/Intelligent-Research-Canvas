import { NextRequest } from "next/server";
import {
  getGenAI,
  MODEL,
  JSON_CONFIG,
  GRAPH_EXTRACTOR_PROMPT,
  INSIGHT_ANALYZER_PROMPT,
  withRetry,
} from "@/lib/gemini";
import { humanizeGeminiError } from "@/lib/errors";
import {
  graphResponseSchema,
  insightResponseSchema,
} from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
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

    const trimmedText = text.slice(0, 50000);
    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      generationConfig: JSON_CONFIG,
    });

    const [graphResult, insightResult] = await Promise.all([
      withRetry(() =>
        model.generateContent(
          `${GRAPH_EXTRACTOR_PROMPT}\n\n---\n\nTEXT:\n${trimmedText}`
        )
      ),
      withRetry(() =>
        model.generateContent(
          `${INSIGHT_ANALYZER_PROMPT}\n\n---\n\nTEXT:\n${trimmedText}`
        )
      ),
    ]);

    const rawGraph = JSON.parse(graphResult.response.text());
    const rawInsights = JSON.parse(insightResult.response.text());

    const graph = graphResponseSchema.parse(rawGraph);
    const insights = insightResponseSchema.parse(rawInsights);

    // Filter edges to only those whose source/target are valid node IDs.
    const ids = new Set(graph.nodes.map((n) => n.id));
    graph.edges = graph.edges.filter(
      (e) => ids.has(e.source) && ids.has(e.target)
    );

    return Response.json({ graph, insights });
  } catch (err) {
    console.error("[/api/analyze]", err);
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

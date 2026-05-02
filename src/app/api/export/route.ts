import { NextRequest } from "next/server";
import {
  getGenAI,
  MODEL,
  EXPORT_CONFIG,
  EXPORT_PROMPT,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { insights, graph, chatHistory, format } = await req.json();

    const context = `INSIGHTS:\n${JSON.stringify(
      insights ?? [],
      null,
      2
    )}\n\nGRAPH_SUMMARY:\n${JSON.stringify(
      graph ?? {},
      null,
      2
    )}\n\nCHAT_HISTORY:\n${chatHistory ?? ""}`;

    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      generationConfig: EXPORT_CONFIG,
    });

    if (format === "markdown") {
      const result = await model.generateContent(
        `Convert the following research data into a clean Markdown report with the following sections in order: # Research Canvas — Structured Analysis, ## Abstract (3-4 sentences), ## Key Findings (bullet list of insights with category and confidence), ## Concept Map (each node with its category and connected edges), ## Research Conversation (transcript). Output ONLY the Markdown — no code fences.\n\n${context}`
      );
      const md = result.response.text();
      return new Response(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="research-canvas-export.md"',
        },
      });
    }

    const result = await model.generateContent(
      `${EXPORT_PROMPT}\n\n${context}`
    );
    const tex = result.response.text().replace(/^```(?:latex|tex)?\n?|\n?```$/g, "");
    return new Response(tex, {
      headers: {
        "Content-Type": "application/x-tex; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="research-canvas-export.tex"',
      },
    });
  } catch (err) {
    console.error("[/api/export]", err);
    const message = err instanceof Error ? err.message : "Export failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

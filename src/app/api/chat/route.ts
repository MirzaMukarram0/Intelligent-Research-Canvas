import { NextRequest } from "next/server";
import {
  getGenAI,
  MODEL,
  CHAT_CONFIG,
  CHAT_SYSTEM_PROMPT,
} from "@/lib/gemini";
import { humanizeGeminiError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 30;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

// A short sentinel the client can split on to detect the grounding-sources
// JSON trailer. Plain text messages will never contain this marker.
export const SOURCES_SENTINEL = "\n\n<<<IRC_SOURCES>>>";

function buildSystemContext(
  docText: string,
  graph: unknown,
  focusQuote?: string | null,
  useGrounding?: boolean
): string {
  const groundingHint = useGrounding
    ? `WEB_SEARCH: ENABLED — you may use Google Search to supplement the document with current external information. When you use a web result, attribute it as "(per <source name>)" inline.`
    : `WEB_SEARCH: DISABLED — answer strictly from the document and graph.`;
  return [
    `DOCUMENT:\n${(docText ?? "").slice(0, 60000)}`,
    `GRAPH:\n${JSON.stringify(graph ?? {}, null, 2)}`,
    focusQuote ? `FOCUS:\n${focusQuote}` : "FOCUS:\n(none)",
    groundingHint,
  ].join("\n\n---\n\n");
}

function toGeminiHistory(messages: IncomingMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

interface GroundingSource {
  title: string;
  uri: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGroundingSources(metadata: any): GroundingSource[] {
  if (!metadata) return [];
  const chunks = metadata.groundingChunks ?? metadata.grounding_chunks ?? [];
  const out: GroundingSource[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of chunks as any[]) {
    const web = c?.web ?? c?.Web;
    if (web?.uri) {
      out.push({
        title: web.title ?? web.uri,
        uri: web.uri,
      });
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, docText, graph, focusQuote, useGrounding } =
      (await req.json()) as {
        messages: IncomingMessage[];
        docText?: string;
        graph?: unknown;
        focusQuote?: string | null;
        useGrounding?: boolean;
      };

    if (!messages?.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const systemContext = buildSystemContext(
      docText ?? "",
      graph ?? {},
      focusQuote,
      useGrounding
    );
    const fullSystem = `${CHAT_SYSTEM_PROMPT}\n\n## SYSTEM CONTEXT\n\n${systemContext}`;

    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      generationConfig: CHAT_CONFIG,
      systemInstruction: fullSystem,
      // Google Search grounding — turns Gemini into a search-augmented agent.
      // The SDK accepts the snake_case shape under tools[].
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(useGrounding ? { tools: [{ googleSearch: {} } as any] } : {}),
    });

    const history = toGeminiHistory(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const streamResult = await chat.sendMessageStream(lastMessage);

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of streamResult.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
            // After the stream ends, surface grounding metadata if present.
            try {
              const final = await streamResult.response;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const candidates = (final as any).candidates ?? [];
              const meta =
                candidates[0]?.groundingMetadata ??
                candidates[0]?.grounding_metadata;
              const sources = extractGroundingSources(meta);
              if (sources.length) {
                controller.enqueue(
                  encoder.encode(
                    SOURCES_SENTINEL + JSON.stringify({ sources })
                  )
                );
              }
            } catch {
              // Grounding metadata is optional — silently skip if missing.
            }
          } catch (e) {
            controller.enqueue(
              encoder.encode(
                `\n\n_(stream error: ${
                  e instanceof Error ? e.message : "unknown"
                })_`
              )
            );
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (err) {
    console.error("[/api/chat]", err);
    const { status, message, hint } = humanizeGeminiError(err);
    return Response.json({ error: message, hint }, { status });
  }
}

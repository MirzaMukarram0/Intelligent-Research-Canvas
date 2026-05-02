import { NextRequest } from "next/server";
import {
  getGenAI,
  MODEL,
  CHAT_CONFIG,
  CHAT_SYSTEM_PROMPT,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemContext(
  docText: string,
  graph: unknown,
  focusQuote?: string | null
): string {
  return [
    `DOCUMENT:\n${(docText ?? "").slice(0, 30000)}`,
    `GRAPH:\n${JSON.stringify(graph ?? {}, null, 2)}`,
    focusQuote ? `FOCUS:\n${focusQuote}` : "FOCUS:\n(none)",
  ].join("\n\n---\n\n");
}

function toGeminiHistory(messages: IncomingMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { messages, docText, graph, focusQuote } = (await req.json()) as {
      messages: IncomingMessage[];
      docText?: string;
      graph?: unknown;
      focusQuote?: string | null;
    };

    if (!messages?.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const systemContext = buildSystemContext(
      docText ?? "",
      graph ?? {},
      focusQuote
    );
    const fullSystem = `${CHAT_SYSTEM_PROMPT}\n\n## SYSTEM CONTEXT\n\n${systemContext}`;

    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      generationConfig: CHAT_CONFIG,
      systemInstruction: fullSystem,
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
    const message = err instanceof Error ? err.message : "Chat failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

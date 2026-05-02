// Run with: node --import tsx --test src/lib/__tests__/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { graphResponseSchema, insightResponseSchema } from "../schema";
import { humanizeGeminiError } from "../errors";

test("graphResponseSchema accepts a minimal valid graph", () => {
  const parsed = graphResponseSchema.parse({
    nodes: [
      {
        id: "n1",
        label: "Transformer",
        category: "entity",
        source_quote: "We propose the Transformer.",
      },
    ],
    edges: [{ source: "n1", target: "n1", relationship: "self-references" }],
  });
  assert.equal(parsed.nodes.length, 1);
  assert.equal(parsed.edges[0].weight, 1, "weight defaults to 1");
});

test("graphResponseSchema accepts empty arrays (defaults applied)", () => {
  const parsed = graphResponseSchema.parse({});
  assert.deepEqual(parsed.nodes, []);
  assert.deepEqual(parsed.edges, []);
});

test("graphResponseSchema accepts node without source_quote", () => {
  const parsed = graphResponseSchema.parse({
    nodes: [{ id: "x", label: "X", category: "concept" }],
    edges: [],
  });
  assert.equal(parsed.nodes[0].source_quote, "");
});

test("graphResponseSchema rejects bad category", () => {
  assert.throws(() =>
    graphResponseSchema.parse({
      nodes: [{ id: "x", label: "X", category: "bogus" }],
      edges: [],
    })
  );
});

test("edge weight coerces from string", () => {
  const parsed = graphResponseSchema.parse({
    nodes: [{ id: "a", label: "A", category: "concept" }],
    edges: [
      { source: "a", target: "a", relationship: "loops", weight: "3" },
    ],
  });
  assert.equal(parsed.edges[0].weight, 3);
});

test("insightResponseSchema allows zero insights", () => {
  const parsed = insightResponseSchema.parse({ insights: [] });
  assert.deepEqual(parsed.insights, []);
});

test("insightResponseSchema accepts a typical insight", () => {
  const parsed = insightResponseSchema.parse({
    insights: [
      {
        id: "i1",
        title: "Self-attention scales",
        body: "Allows parallel processing.",
        category: "finding",
        confidence: "high",
      },
    ],
  });
  assert.equal(parsed.insights[0].evidence_hint, "");
});

test("humanizeGeminiError detects free-tier zero quota", () => {
  const err = new Error(
    '[429 Too Many Requests] Quota exceeded for metric: limit: 0, model: gemini-2.0-flash retryDelay: "23s"'
  );
  const out = humanizeGeminiError(err);
  assert.equal(out.status, 429);
  assert.match(out.message, /no free-tier quota/i);
  assert.match(out.hint!, /aistudio|GEMINI_MODEL/i);
});

test("humanizeGeminiError detects invalid key", () => {
  const out = humanizeGeminiError(new Error("API key not valid"));
  assert.equal(out.status, 401);
});

test("humanizeGeminiError handles unknown errors", () => {
  const out = humanizeGeminiError(new Error("kaboom"));
  assert.equal(out.status, 500);
  assert.ok(out.hint?.includes("kaboom"));
});

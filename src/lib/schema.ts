import { z } from "zod";

export const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(160),
  // Extended palette to allow richer extraction.
  category: z
    .enum([
      "concept",
      "entity",
      "method",
      "finding",
      "dataset",
      "metric",
      "result",
      "assumption",
      "limitation",
    ])
    .catch("concept"),
  // Quote may be short or omitted for some node types — be lenient.
  source_quote: z.string().default(""),
  // Coerce unrecognised categories rather than throwing.
  description: z.string().optional().default(""),
});

export const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string().min(1).max(200),
  weight: z.coerce.number().int().min(1).max(5).default(1),
});

export const graphResponseSchema = z.object({
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
  error: z.string().optional(),
});

export const insightSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(220),
  body: z.string().min(1),
  category: z
    .enum([
      "finding",
      "limitation",
      "methodology",
      "implication",
      "gap",
      "result",
      "contribution",
    ])
    .catch("finding"),
  confidence: z.enum(["high", "medium", "low"]).catch("medium"),
  evidence_quote: z.string().optional().default(""),
  evidence_hint: z.string().optional().default(""),
  impact: z.string().optional().default(""),
});

export const insightResponseSchema = z.object({
  // Allow zero insights — short or non-academic docs may legitimately produce none.
  // Cap raised to 16 for richer extraction.
  insights: z.array(insightSchema).max(16).default([]),
  // 3–4 sentence TL;DR auto-summary
  summary: z.string().optional().default(""),
});

export type GraphResponse = z.infer<typeof graphResponseSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type ResearchNode = z.infer<typeof nodeSchema>;
export type ResearchEdge = z.infer<typeof edgeSchema>;
export type Insight = z.infer<typeof insightSchema>;

// ─── Comparison / Diff schemas ───────────────────────────────────────────────

export const sharedConceptSchema = z.object({
  label: z.string(),
  doc1_quote: z.string().default(""),
  doc2_quote: z.string().default(""),
  relationship: z.string(), // how they're related across papers
});

export const contradictionSchema = z.object({
  topic: z.string(),
  doc1_claim: z.string(),
  doc2_claim: z.string(),
  explanation: z.string(),
});

export const methodologyTransferSchema = z.object({
  method_from: z.string(), // paper index: "doc1" | "doc2"
  method_label: z.string(),
  applicable_to: z.string(), // problem/area in the other paper
  rationale: z.string(),
});

export const diffResponseSchema = z.object({
  shared_concepts: z.array(sharedConceptSchema).default([]),
  contradictions: z.array(contradictionSchema).default([]),
  methodology_transfers: z.array(methodologyTransferSchema).default([]),
  synthesis: z.string().default(""), // 3-4 sentence cross-paper TL;DR
});

export type DiffResponse = z.infer<typeof diffResponseSchema>;
export type SharedConcept = z.infer<typeof sharedConceptSchema>;
export type Contradiction = z.infer<typeof contradictionSchema>;
export type MethodologyTransfer = z.infer<typeof methodologyTransferSchema>;

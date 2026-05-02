import { z } from "zod";

export const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(160),
  // Extended palette to allow richer extraction.
  category: z.enum([
    "concept",
    "entity",
    "method",
    "finding",
    "dataset",
    "metric",
    "result",
    "assumption",
    "limitation",
  ]),
  // Quote may be short or omitted for some node types — be lenient.
  source_quote: z.string().default(""),
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
  category: z.enum([
    "finding",
    "limitation",
    "methodology",
    "implication",
    "gap",
    "result",
    "contribution",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
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

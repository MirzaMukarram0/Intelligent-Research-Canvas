import { z } from "zod";

export const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
  category: z.enum(["concept", "entity", "method", "finding"]),
  // Quote may be short or omitted for some node types — be lenient.
  source_quote: z.string().default(""),
  description: z.string().optional().default(""),
});

export const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string().min(1).max(160),
  weight: z.coerce.number().int().min(1).max(5).default(1),
});

export const graphResponseSchema = z.object({
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
  error: z.string().optional(),
});

export const insightSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(180),
  body: z.string().min(1),
  category: z.enum([
    "finding",
    "limitation",
    "methodology",
    "implication",
    "gap",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  evidence_hint: z.string().optional().default(""),
});

export const insightResponseSchema = z.object({
  // Allow zero insights — short or non-academic docs may legitimately produce none.
  insights: z.array(insightSchema).max(12).default([]),
});

export type GraphResponse = z.infer<typeof graphResponseSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type ResearchNode = z.infer<typeof nodeSchema>;
export type ResearchEdge = z.infer<typeof edgeSchema>;
export type Insight = z.infer<typeof insightSchema>;

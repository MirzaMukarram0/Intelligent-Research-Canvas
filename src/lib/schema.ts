import { z } from "zod";

export const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  category: z.enum(["concept", "entity", "method", "finding"]),
  source_quote: z.string().min(8),
  description: z.string().optional().default(""),
});

export const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string().min(1).max(120),
  weight: z.number().int().min(1).max(5).default(1),
});

export const graphResponseSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  error: z.string().optional(),
});

export const insightSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(140),
  body: z.string().min(8),
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
  insights: z.array(insightSchema).min(1).max(10),
});

export type GraphResponse = z.infer<typeof graphResponseSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type ResearchNode = z.infer<typeof nodeSchema>;
export type ResearchEdge = z.infer<typeof edgeSchema>;
export type Insight = z.infer<typeof insightSchema>;

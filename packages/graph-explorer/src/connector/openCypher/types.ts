import { z } from "zod";

export type OCVertex = {
  "~id": string;
  "~entityType": string;
  "~labels": Array<string>;
  "~properties": Record<string, string | number>;
};

export type OCEdge = {
  "~id": string;
  "~entityType": string;
  "~start": string;
  "~end": string;
  "~type": string;
  "~properties": Record<string, string | number>;
};

export type OpenCypherFetch = <TResult = any>(
  queryTemplate: string
) => Promise<TResult>;

export type GraphSummary = {
  numNodes: number;
  numEdges: number;
  numNodeLabels: number;
  numEdgeLabels: number;
  nodeLabels: Array<string>;
  edgeLabels: Array<string>;
  numNodeProperties: number;
  numEdgeProperties: number;
  nodeProperties: Record<string, number>;
  edgeProperties: Record<string, number>;
  totalNodePropertyValues: number;
  totalEdgePropertyValues: number;
};

export const ocIdSchema = z.string();
export const ocValueSchema = z.union([z.string(), z.number()]);

export const ocEdgeSchema = z.object({
  "~id": ocIdSchema,
  "~entityType": z.literal("relationship"),
  "~start": ocIdSchema,
  "~end": ocIdSchema,
  "~type": z.string(),
  "~properties": z.record(z.string(), ocValueSchema),
});

export const ocVertexSchema = z.object({
  "~id": ocIdSchema,
  "~entityType": z.literal("node"),
  "~labels": z.array(z.string()),
  "~properties": z.record(z.string(), ocValueSchema),
});

export function ocResponseSchema<T extends z.ZodTypeAny>(resultsSchema: T) {
  return z.object({
    results: z.array(resultsSchema),
  });
}

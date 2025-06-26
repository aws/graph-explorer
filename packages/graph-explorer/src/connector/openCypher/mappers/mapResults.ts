import { logger } from "@/utils";
import { z } from "zod";
import mapApiVertex from "./mapApiVertex";
import mapApiEdge from "./mapApiEdge";
import { MapValueResult, mapValuesToQueryResults } from "@/connector/mapping";
import { OCEdge, OCVertex } from "../types";

const cypherScalarValueSchema = z.union([z.number(), z.string(), z.boolean()]);

const cypherNodeSchema: z.ZodType<OCVertex> = z.object({
  "~entityType": z.literal("node"),
  "~id": z.string(),
  "~labels": z.array(z.string()),
  "~properties": z.record(z.any()),
});

const cypherEdgeSchema: z.ZodType<OCEdge> = z.object({
  "~entityType": z.literal("relationship"),
  "~id": z.string(),
  "~start": z.string(),
  "~end": z.string(),
  "~type": z.string(),
  "~properties": z.record(z.any()),
});

type CypherScalar = z.infer<typeof cypherScalarValueSchema>;
type CypherValue =
  | CypherScalar
  | OCVertex
  | OCEdge
  | Array<CypherValue>
  | { [key: string]: CypherValue };

const cypherValueSchema: z.ZodType<CypherValue> = z.lazy(() =>
  z.union([
    cypherScalarValueSchema,
    cypherNodeSchema,
    cypherEdgeSchema,
    z.array(cypherValueSchema),
    z.record(cypherValueSchema),
  ])
);

const cypherQueryResultSchema = z.object({
  results: z.array(z.record(cypherValueSchema)),
});

/**
 * Maps the raw results from an OpenCypher query to the expected format
 * @param data The raw data from the OpenCypher query fetch
 * @returns The mapped results
 */
export function mapResults(data: unknown) {
  const parsed = cypherQueryResultSchema.safeParse(data);

  if (!parsed.success) {
    logger.error("Failed to parse results", parsed.error);
    throw parsed.error;
  }

  const values = parsed.data.results.flatMap(mapValue);

  return mapValuesToQueryResults(values);
}

/**
 * Recursively maps a value from the OpenCypher query to the expected format
 * @param value The value to map
 * @returns The mapped value
 */
function mapValue(value: CypherValue): MapValueResult[] {
  if (typeof value === "number") {
    return [{ scalar: value }];
  }

  if (typeof value === "string") {
    return [{ scalar: value }];
  }

  if (typeof value === "boolean") {
    return [{ scalar: value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap(mapValue);
  }

  // Map record types
  if (typeof value === "object") {
    if (value["~entityType"] === "node") {
      return [{ vertex: mapApiVertex(value as OCVertex) }];
    }

    if (value["~entityType"] === "relationship") {
      const edge = mapApiEdge(value as OCEdge, [], []);
      edge.__isFragment = true;
      return [{ edge: edge }];
    }
    return Object.values(value).flatMap(mapValue);
  }

  // Unsupported type
  return [];
}

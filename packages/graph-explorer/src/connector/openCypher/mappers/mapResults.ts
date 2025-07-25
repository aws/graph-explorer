import { logger, MISSING_DISPLAY_VALUE } from "@/utils";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import mapApiVertex from "./mapApiVertex";
import mapApiEdge from "./mapApiEdge";
import { MapValueResult, mapValuesToQueryResults } from "@/connector/mapping";
import { OCEdge, OCVertex } from "../types";

const cypherScalarValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.null(),
]);

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

export function parseResults(data: unknown) {
  const parsed = cypherQueryResultSchema.safeParse(data);

  if (!parsed.success) {
    const validationError = fromError(parsed.error);
    logger.error("Failed to parse results", validationError.toString(), data);
    throw validationError;
  }

  return parsed.data.results;
}

/**
 * Maps the raw results from an OpenCypher query to the expected format
 * @param data The raw data from the OpenCypher query fetch
 * @returns The mapped results
 */
export function mapResults(data: unknown) {
  const results = parseResults(data);
  const values = results.flatMap(mapValue);
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

  // Skip nulls
  if (value === null) {
    return [{ scalar: MISSING_DISPLAY_VALUE }];
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

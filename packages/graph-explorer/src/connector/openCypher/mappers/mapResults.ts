import { logger } from "@/utils";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import mapApiVertex from "./mapApiVertex";
import mapApiEdge from "./mapApiEdge";
import { OCEdge, OCVertex } from "../types";
import {
  createResultBundle,
  createResultScalar,
  type ResultEntity,
} from "@/connector/entities";

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
  const values = results.flatMap(result => {
    const entities = Object.entries(result).flatMap(([key, value]) =>
      mapValue(value, key)
    );

    // Create a bundle if there is more than one entity
    if (entities.length > 1) {
      return [createResultBundle({ values: entities })];
    } else {
      return entities;
    }
  });
  return values;
}

/**
 * Recursively maps a value from the OpenCypher query to the expected format
 * @param value The value to map
 * @param name The name/key for the value (used for scalar naming)
 * @returns The mapped value
 */
function mapValue(value: CypherValue, name?: string): ResultEntity[] {
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return [createResultScalar({ value, name })];
  }

  if (Array.isArray(value)) {
    const values = value.flatMap(v => mapValue(v));
    return [createResultBundle({ name, values })];
  }

  // Map record types
  if (typeof value === "object") {
    if (value["~entityType"] === "node") {
      return [mapApiVertex(value as OCVertex, name)];
    }

    if (value["~entityType"] === "relationship") {
      return [mapApiEdge(value as OCEdge, name)];
    }

    return [mapRecordToBundle(value, name)];
  }

  // Unsupported type
  return [];
}

function mapRecordToBundle(record: Record<string, CypherValue>, name?: string) {
  const values = Object.entries(record).flatMap(([key, value]) =>
    mapValue(value, key)
  );
  return createResultBundle({ values, name });
}

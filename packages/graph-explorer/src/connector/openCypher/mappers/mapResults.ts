import { logger } from "@/utils";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import mapApiVertex from "./mapApiVertex";
import mapApiEdge from "./mapApiEdge";
import { OCEdge, OCVertex } from "../types";
import { createResultScalar, createResultBundle, ResultEntity } from "@/core";

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
 * @param isRootObject Whether this is a root object in the results list
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
    // Any array value should become a bundle
    const results = value.flatMap(v => mapValue(v));
    // Arrays should always be bundles, even with one item
    return [createResultBundle({ name, values: results })];
  }

  // Map record types
  if (typeof value === "object") {
    if (value["~entityType"] === "node") {
      return [mapApiVertex(value as OCVertex, name)];
    }

    if (value["~entityType"] === "relationship") {
      return [mapApiEdge(value as OCEdge, name)];
    }

    // Any object other than vertex, edge, or root object should become a bundle
    const keyValuePairs = Object.entries(value).map(([key, val]) => ({
      key,
      results: mapValue(val, key),
    }));

    // If this object has only one key-value pair and that value produces only one scalar result,
    // promote that scalar with the key as the name (but not for objects inside arrays)
    if (
      keyValuePairs.length === 1 &&
      keyValuePairs[0].results.length === 1 &&
      name !== undefined
    ) {
      const { key, results } = keyValuePairs[0];
      const result = results[0];
      // Only promote scalars - everything else should create bundles
      if (result.entityType === "scalar") {
        return [{ ...result, name: key || result.name }];
      }
    }

    const results = keyValuePairs.flatMap(pair => pair.results);
    return [createResultBundle({ name, values: results })];
  }

  // Unsupported type
  return [];
}

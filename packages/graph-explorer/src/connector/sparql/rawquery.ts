import { logger, query } from "@/utils";
import type { RawQueryRequest, RawQueryResponse } from "../useGEFetchTypes";
import {
  type SparqlFetch,
  sparqlResponseSchema,
  sparqlValueSchema,
  sparqlAskResponseSchema,
  sparqlQuadBindingSchema,
  type SparqlQuadBinding,
} from "./types";
import isErrorResponse from "../utils/isErrorResponse";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import {
  createResultScalar,
  createResultBundle,
  createResultVertex,
} from "../entities";
import { mapSparqlValueToScalar } from "./mappers/mapSparqlValueToScalar";
import { mapQuadToEntities } from "./mappers/mapQuadToEntities";

// Zod schema for any SPARQL response - uses a record of variable names to SPARQL values
const rawQueryBindingSchema = z.record(z.string(), sparqlValueSchema);
const rawQueryResponseSchema = sparqlResponseSchema(rawQueryBindingSchema);
type RawQueryBinding = z.infer<typeof rawQueryBindingSchema>;

export async function rawQuery(
  dbFetch: SparqlFetch,
  request: RawQueryRequest
): Promise<RawQueryResponse> {
  const template = query`${request.query}`;

  if (template.length <= 0) {
    return [];
  }

  // Fetch the results
  const data = (await dbFetch(template)) as unknown;
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  logger.debug("Raw query result", data);

  // Try to parse as ASK query response first
  const askParsed = sparqlAskResponseSchema.safeParse(data);
  if (askParsed.success) {
    logger.debug("Parsing SPARQL ASK response");
    return handleAskQueryResult(askParsed.data.boolean);
  }

  // Try to parse as quads next (CONSTRUCT and DESCRIBE queries)
  const quadsParsed = sparqlResponseSchema(sparqlQuadBindingSchema).safeParse(
    data
  );
  if (quadsParsed.success) {
    logger.debug("Parsing SPARQL quads response");
    return handleConstructQueryResults(quadsParsed.data.results.bindings);
  }

  // Parse raw JSON format response for all other queries
  logger.debug("Parsing SPARQL JSON response");
  const parsed = rawQueryResponseSchema.safeParse(data);
  if (!parsed.success) {
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse SPARQL JSON response",
      validationError.toString(),
      data
    );
    throw validationError;
  }

  return handleSelectQueryResults(parsed.data.results.bindings);
}

/**
 * Handles ASK query results by creating a scalar boolean value
 */
function handleAskQueryResult(booleanResult: boolean): RawQueryResponse {
  return [
    createResultScalar({
      name: "ASK",
      value: booleanResult,
    }),
  ];
}

/**
 * Handles CONSTRUCT query results by mapping to fragment vertices and edges.
 *
 * This will filter out blank node results and mark vertices as fragments to
 * ensure any query limits does not prevent gathering all of the vertex details.
 */
function handleConstructQueryResults(
  bindings: Array<SparqlQuadBinding>
): RawQueryResponse {
  // Filter out blank node results until we can determine a good way to handle them
  const bindingsWithoutBlankNodes = bindings.filter(
    b => b.subject.type !== "bnode" && b.object.type !== "bnode"
  );

  const results = mapQuadToEntities(bindingsWithoutBlankNodes);

  // Force vertices to be fragments so they will be fetched later.
  // This ensures if the user limits the results we can still show the full vertex details.
  const vertexFragments = results.vertices.map(v =>
    createResultVertex({ ...v, attributes: undefined })
  );

  return [...vertexFragments, ...results.edges];
}

/**
 * Handles SELECT query results by creating scalar values for each variable
 */
function handleSelectQueryResults(
  bindings: Array<RawQueryBinding>
): RawQueryResponse {
  const results: RawQueryResponse = [];

  for (const binding of bindings) {
    const scalars = Object.entries(binding).map(
      ([variableName, sparqlValue]) => {
        // Convert SPARQL value to scalar value
        const scalarValue = mapSparqlValueToScalar(sparqlValue);

        return createResultScalar({
          name: `?${variableName}`,
          value: scalarValue,
        });
      }
    );

    // If there's only one scalar, return it directly instead of wrapping in a bundle
    if (scalars.length === 1) {
      results.push(scalars[0]);
    } else {
      // Create a bundle for multiple values in this row
      results.push(createResultBundle({ values: scalars }));
    }
  }

  return results;
}

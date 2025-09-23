import { logger, query } from "@/utils";
import { RawQueryRequest, RawQueryResponse } from "../useGEFetchTypes";
import {
  rdfTypeUri,
  SparqlFetch,
  sparqlResponseSchema,
  sparqlValueSchema,
  sparqlAskResponseSchema,
  sparqlQuadBindingSchema,
} from "./types";
import isErrorResponse from "../utils/isErrorResponse";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import {
  createResultScalar,
  createResultBundle,
  createResultVertex,
  createResultEdge,
} from "../entities";
import { createRdfEdgeId } from "./createRdfEdgeId";
import { mapSparqlValueToScalar } from "./mappers/mapSparqlValueToScalar";

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
 * Handles CONSTRUCT query results by separating triples into edges and vertex attributes
 */
function handleConstructQueryResults(
  bindings: Array<RawQueryBinding>
): RawQueryResponse {
  const results: RawQueryResponse = [];
  const resourcesAdded = new Set<string>();

  // Separate triples into edges and vertices
  for (const binding of bindings) {
    // Filter out all blank node results
    if (binding.subject.type === "bnode" || binding.object.type === "bnode") {
      continue;
    }

    if (isEdgeBinding(binding)) {
      const sourceId = binding.subject.value;
      const targetId = binding.object.value;
      const predicate = binding.predicate.value;

      // Create RDF edge ID using the standard format
      const edgeId = createRdfEdgeId(sourceId, predicate, targetId);

      results.push(
        createResultEdge({
          id: edgeId,
          sourceId,
          targetId,
          type: predicate,
          // RDF edges don't have additional attributes beyond the predicate
          attributes: {},
        })
      );
    } else {
      const subjectUri = binding.subject.value;

      // Only create the vertex once
      if (resourcesAdded.has(subjectUri)) {
        continue;
      }

      // NOTE: Ignoring any other attributes in order to force this vertex to be a fragment so the full details will be fetched later
      results.push(
        createResultVertex({
          id: subjectUri,
          isBlankNode: false, // URI subjects are not blank nodes
        })
      );

      // Add the subject URI to the set of resources added
      resourcesAdded.add(subjectUri);
    }
  }

  return results;
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

function isVertexTypeBinding(binding: RawQueryBinding) {
  return (
    binding.predicate.value.toLowerCase() === rdfTypeUri.toLowerCase() &&
    binding.object.type === "uri"
  );
}

function isEdgeBinding(binding: RawQueryBinding) {
  return (
    binding.subject.type === "uri" &&
    binding.predicate.type === "uri" &&
    binding.object.type === "uri" &&
    !isVertexTypeBinding(binding)
  );
}

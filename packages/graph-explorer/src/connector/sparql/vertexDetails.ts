import { logger, query } from "@/utils";
import {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import {
  rdfTypeUri,
  sparqlResponseSchema,
  SparqlFetch,
  sparqlUriValueSchema,
  sparqlValueSchema,
  SparqlValue,
} from "./types";
import { z } from "zod";
import { createVertex, EntityProperties, VertexId } from "@/core";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";

const bindingSchema = z.object({
  label: sparqlUriValueSchema,
  value: sparqlValueSchema,
});
type VertexDetailsBinding = z.infer<typeof bindingSchema>;
const vertexDetailsResponseSchema = sparqlResponseSchema(bindingSchema);

export async function vertexDetails(
  sparqlFetch: SparqlFetch,
  request: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  const template = query`
    # Get the resource attributes and class
    SELECT * 
    WHERE {
      {
        # Get the resource attributes
        SELECT ?label ?value
        WHERE {
          ${idParam(request.vertexId)} ?label ?value .
          FILTER(isLiteral(?value))
        }
      }
      UNION
      {
        # Get the resource type
        SELECT ?label ?value
        WHERE {
          ${idParam(request.vertexId)} a ?value .
          BIND(IRI("${rdfTypeUri}") AS ?label)
        }
      }
    }
  `;

  // Fetch the vertex details
  const response = await sparqlFetch(template);
  if (isErrorResponse(response)) {
    logger.error("Vertex details request failed", request, response);
    throw new Error("Vertex details request failed", {
      cause: response,
    });
  }

  // Parse the response
  const parsed = vertexDetailsResponseSchema.safeParse(response);

  if (!parsed.success) {
    logger.error(
      "Failed to parse sparql response",
      response,
      parsed.error.issues
    );
    throw new Error("Failed to parse sparql response", {
      cause: parsed.error,
    });
  }

  // Map the results
  if (parsed.data.results.bindings.length === 0) {
    logger.warn("Vertex not found", request.vertexId, response);
    return { vertex: null };
  }

  const vertex = mapToVertex(request.vertexId, parsed.data.results.bindings);

  return { vertex };
}

function mapToVertex(id: VertexId, detailsBinding: VertexDetailsBinding[]) {
  const types: string[] = [];
  const attributes: EntityProperties = {};

  for (const result of detailsBinding) {
    if (result.label.value === rdfTypeUri) {
      types.push(result.value.value);
    } else {
      attributes[result.label.value] = mapToValue(result.value);
    }
  }

  if (!types.length) {
    throw new Error("Vertex type not found in bindings");
  }

  return createVertex({
    id,
    types,
    attributes,
  });
}

function mapToValue(value: SparqlValue): string | number {
  if (value.type === "literal") {
    if (value.datatype === "http://www.w3.org/2001/XMLSchema#integer") {
      return parseInt(value.value);
    }
    if (value.datatype === "http://www.w3.org/2001/XMLSchema#decimal") {
      return parseFloat(value.value);
    }
    return value.value;
  }
  return value.value;
}

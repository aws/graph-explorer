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
} from "./types";
import { z } from "zod";
import {
  createVertex,
  createVertexId,
  EntityProperties,
  VertexId,
} from "@/core";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";
import { fromError } from "zod-validation-error";
import { mapAttributeValue } from "./mappers/mapAttributeValue";

const bindingSchema = z.object({
  resource: sparqlUriValueSchema,
  label: sparqlUriValueSchema,
  value: sparqlValueSchema,
});
type VertexDetailsBinding = z.infer<typeof bindingSchema>;
const vertexDetailsResponseSchema = sparqlResponseSchema(bindingSchema);

export async function vertexDetails(
  sparqlFetch: SparqlFetch,
  request: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { vertices: [] };
  }

  const template = query`
    # Get the resource attributes and class
    SELECT ?resource ?label ?value
    WHERE {
      VALUES ?resource {
        ${request.vertexIds.map(idParam).join("\n")}
      }

      ?resource ?label ?value .
      FILTER(isLiteral(?value) || ?label = rdf:type)
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
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse sparql response",
      validationError.toString(),
      response
    );
    throw validationError;
  }

  // Group by resource URI and map to vertex
  const vertices = Map.groupBy(parsed.data.results.bindings, b =>
    createVertexId(b.resource.value)
  )
    .entries()
    .map(([id, bindings]) => mapToVertex(id, bindings))
    .toArray();

  // Log a warning if some nodes are missing
  const missing = new Set(request.vertexIds).difference(
    new Set(vertices.map(v => v.id))
  );
  if (missing.size) {
    logger.warn("Did not find all requested vertices", {
      requested: request.vertexIds,
      missing: missing.values().toArray(),
      response,
    });
  }

  return { vertices };
}

function mapToVertex(id: VertexId, detailsBinding: VertexDetailsBinding[]) {
  const types: string[] = [];
  const attributes: EntityProperties = {};

  for (const result of detailsBinding) {
    if (result.label.value === rdfTypeUri) {
      types.push(result.value.value);
    } else {
      attributes[result.label.value] = mapAttributeValue(result.value);
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

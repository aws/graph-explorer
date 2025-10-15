import { logger, query } from "@/utils";
import {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import { rdfTypeUri, SparqlFetch } from "./types";
import { createVertex } from "@/core";
import { idParam } from "./idParam";
import { parseAndMapQuads } from "./parseAndMapQuads";

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
    SELECT ?subject ?predicate ?object
    WHERE {
      VALUES ?subject {
        ${request.vertexIds.map(idParam).join("\n")}
      }

      ?subject ?predicate ?object .
      FILTER(isLiteral(?object) || ?predicate = ${idParam(rdfTypeUri)})
    }
  `;

  // Fetch the vertex details
  const response = await sparqlFetch(template);

  // Map results to fully materialized vertices
  const results = parseAndMapQuads(response);

  // Ensure each requested vertex is present in the response, and create a new vertex for any vertex ID that is not
  // present in the response.
  const vertices = request.vertexIds.map(vertexId => {
    const vertex = results.vertices.find(v => v.id === vertexId);
    return vertex ? createVertex(vertex) : createVertex({ id: vertexId });
  });

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

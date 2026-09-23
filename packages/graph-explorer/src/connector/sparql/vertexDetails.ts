import { warnMissingIds } from "@/connector/utils/warnMissingIds";
import { createVertex } from "@/core";
import { query } from "@/utils";

import type {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";

import { fragment } from "./fragments";
import { parseAndMapQuads } from "./parseAndMapQuads";
import { rdfTypeUri, type SparqlFetch } from "./types";

export async function vertexDetails(
  sparqlFetch: SparqlFetch,
  request: VertexDetailsRequest,
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
        ${request.vertexIds.map(fragment.iri).join("\n")}
      }

      ?subject ?predicate ?object .
      FILTER(isLiteral(?object) || ?predicate = ${fragment.iri(rdfTypeUri)})
    }
  `;

  // Fetch the vertex details
  const response = await sparqlFetch(template);

  // Map results to fully materialized vertices
  const results = parseAndMapQuads(response);
  const vertices = results.vertices.map(v => createVertex(v));

  // Log a warning if some nodes are missing
  warnMissingIds(
    "vertices",
    request.vertexIds,
    vertices.map(v => v.id),
    {
      response,
    },
  );

  return { vertices };
}

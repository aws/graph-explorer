import type { QueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

import type { EdgeId, VertexId } from "@/core";

import { bulkEdgeDetailsQuery, bulkVertexDetailsQuery } from "@/connector";
import { formatEntityCounts } from "@/utils";

/**
 * Fetches the details for the given vertices and edges.
 *
 * This uses the query client to fetch the data in parallel, and then aggregates
 * the results. It also provides a breakdown of any errors that occurred.
 */
export async function fetchEntityDetails(
  vertices: Iterable<VertexId>,
  edges: Iterable<EdgeId>,
  queryClient: QueryClient,
) {
  const verticesArray = Array.from(vertices);
  const edgesArray = Array.from(edges);

  const vertexResults = await queryClient.fetchQuery(
    bulkVertexDetailsQuery(verticesArray),
  );
  const edgeResults = await queryClient.fetchQuery(
    bulkEdgeDetailsQuery(edgesArray),
  );

  const vertexDetails = vertexResults.vertices;
  const edgeDetails = edgeResults.edges;

  const countOfVertexNotFound = verticesArray.filter(
    id => vertexDetails.find(v => v.id === id) == null,
  ).length;
  const countOfEdgeNotFound = edgesArray.filter(
    id => edgeDetails.find(e => e.id === id) == null,
  ).length;

  return {
    entities: {
      vertices: vertexDetails,
      edges: edgeDetails,
    },
    counts: {
      notFound: {
        vertices: countOfVertexNotFound,
        edges: countOfEdgeNotFound,
        total: countOfVertexNotFound + countOfEdgeNotFound,
      },
    },
  };
}

export type FetchEntityDetailsResult = Awaited<
  ReturnType<typeof fetchEntityDetails>
>;

/** Uses the result of `fetchEntityDetails` to create a notification message. */
export function notifyOnIncompleteRestoration(
  result: FetchEntityDetailsResult,
) {
  if (result.counts.notFound.total > 0) {
    const errorMessage = formatEntityCounts(
      result.counts.notFound.vertices,
      result.counts.notFound.edges,
    );
    const verb = result.counts.notFound.total > 1 ? "were" : "was";
    toast.warning(
      `Finished loading the graph, but ${errorMessage} ${verb} not found.`,
    );
  }

  const anyImported =
    result.entities.vertices.length + result.entities.edges.length > 0;
  if (!anyImported) {
    toast.warning(
      "Finished loading the graph, but no nodes or edges were loaded.",
    );
  }
}

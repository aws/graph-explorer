import { bulkEdgeDetailsQuery, bulkVertexDetailsQuery } from "@/connector";
import { VertexId, EdgeId } from "@/core";
import { formatEntityCounts } from "@/utils";
import { QueryClient } from "@tanstack/react-query";
import { Notification } from "@/components/NotificationProvider";

/**
 * Fetches the details for the given vertices and edges.
 *
 * This uses the query client to fetch the data in parallel, and then aggregates
 * the results. It also provides a breakdown of any errors that occurred.
 */
export async function fetchEntityDetails(
  vertices: Iterable<VertexId>,
  edges: Iterable<EdgeId>,
  queryClient: QueryClient
) {
  const vertexResults = await queryClient.fetchQuery(
    bulkVertexDetailsQuery(Array.from(vertices))
  );
  const edgeResults = await queryClient.fetchQuery(
    bulkEdgeDetailsQuery(Array.from(edges))
  );

  const vertexDetails = vertexResults.vertices;
  const edgeDetails = edgeResults.edges;

  const countOfVertexNotFound = Iterator.from(vertices)
    .filter(id => vertexDetails.find(v => v.id === id) == null)
    .toArray().length;
  const countOfEdgeNotFound = Iterator.from(edges)
    .filter(id => edgeDetails.find(e => e.id === id) == null)
    .toArray().length;

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

/** Uses the result of `fetchEntityDetails` to create a notification that summarizes the results. */
export function createFetchEntityDetailsCompletionNotification(
  result: FetchEntityDetailsResult
): Notification {
  if (result.counts.notFound.total > 0) {
    const errorMessage = formatEntityCounts(
      result.counts.notFound.vertices,
      result.counts.notFound.edges
    );
    const verb = result.counts.notFound.total > 1 ? "were" : "was";
    return {
      message: `Finished loading the graph, but ${errorMessage} ${verb} not found.`,
      type: "info",
    };
  }

  const anyImported =
    result.entities.vertices.length + result.entities.edges.length > 0;
  if (!anyImported) {
    return {
      message: `Finished loading the graph, but no nodes or edges were loaded.`,
      type: "error",
    };
  }

  const entityCountMessage = formatEntityCounts(
    result.entities.vertices.length,
    result.entities.edges.length
  );
  return {
    message: `Finished loading ${entityCountMessage} from the graph file.`,
    type: "success",
  };
}

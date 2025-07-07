import { edgeDetailsQuery, vertexDetailsQuery } from "@/connector";
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
  vertices: Set<VertexId>,
  edges: Set<EdgeId>,
  queryClient: QueryClient
) {
  const vertexResults = await Promise.allSettled(
    vertices.values().map(id => queryClient.fetchQuery(vertexDetailsQuery(id)))
  );
  const edgeResults = await Promise.allSettled(
    edges.values().map(id => queryClient.fetchQuery(edgeDetailsQuery(id)))
  );

  const vertexDetails = vertexResults
    .filter(result => result.status === "fulfilled")
    .map(result => result.value.vertex)
    .filter(v => v != null);
  const edgeDetails = edgeResults
    .filter(result => result.status === "fulfilled")
    .map(result => result.value.edge)
    .filter(e => e != null);

  const countOfVertexErrors = vertexResults.reduce((sum, item) => {
    return sum + (item.status === "rejected" ? 1 : 0);
  }, 0);
  const countOfEdgeErrors = edgeResults.reduce((sum, item) => {
    return sum + (item.status === "rejected" ? 1 : 0);
  }, 0);

  const countOfVertexNotFound = vertexResults.reduce((sum, item) => {
    return (
      sum + (item.status === "fulfilled" && item.value.vertex == null ? 1 : 0)
    );
  }, 0);
  const countOfEdgeNotFound = edgeResults.reduce((sum, item) => {
    return (
      sum + (item.status === "fulfilled" && item.value.edge == null ? 1 : 0)
    );
  }, 0);

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
      errors: {
        vertices: countOfVertexErrors,
        edges: countOfEdgeErrors,
        total: countOfVertexErrors + countOfEdgeErrors,
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
  if (result.counts.errors.total > 0) {
    const errorMessage = formatEntityCounts(
      result.counts.errors.vertices,
      result.counts.errors.edges
    );

    return {
      message: `Finished loading the graph, but ${errorMessage} encountered an error.`,
      type: "error",
    };
  }

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

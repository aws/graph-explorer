import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { Vertex } from "../@types/entities";
import { useNotification } from "../components/NotificationProvider";
import { neighborsCountQuery } from "../connector/queries";
import { activeConnectionSelector, explorerSelector } from "../core/connector";
import useEntities from "./useEntities";
import { VertexId } from "../connector/useGEFetchTypes";

export function useUpdateNodeCountsQuery(nodeId: VertexId) {
  const connection = useRecoilValue(activeConnectionSelector);
  const explorer = useRecoilValue(explorerSelector);
  return useQuery(
    neighborsCountQuery(nodeId, connection?.nodeExpansionLimit, explorer)
  );
}

/**
 * Hook that watches nodes added to the graph and queries the database for
 * neighbor counts. There should be only one instance of this hook in the render
 * pipeline since it uses effects for progress and error notifications.
 */
export function useUpdateAllNodeCounts() {
  const [entities, setEntities] = useEntities();
  const connection = useRecoilValue(activeConnectionSelector);
  const explorer = useRecoilValue(explorerSelector);
  const { enqueueNotification, clearNotification } = useNotification();

  const nodeIds = [...new Set(entities.nodes.map(n => n.data.id))];

  const query = useQueries({
    queries: nodeIds.map(id =>
      neighborsCountQuery(id, connection?.nodeExpansionLimit, explorer)
    ),
    combine: results => {
      // Combines data with existing node data and filters out undefined
      const data = results
        .flatMap(result => (result.data ? [result.data] : []))
        .map(data => {
          const prevNode = entities.nodes.find(n => n.data.id === data.nodeId);
          const node: Vertex | undefined = prevNode
            ? {
                ...prevNode,
                data: {
                  ...prevNode.data,
                  neighborsCount: data.totalCount,
                  neighborsCountByType: data.counts,
                },
              }
            : undefined;
          return node;
        });

      return {
        data: data,
        pending: results.some(result => result.isPending),
        errors: results.map(result => result.error),
        hasErrors: results.some(result => result.isError),
      };
    },
  });

  // Update the graph with the node counts from the query results
  useEffect(() => {
    // Ensure we have expanded and finished all count queries
    if (query.pending) {
      return;
    }

    // Update node graph with counts
    setEntities(prev => ({
      nodes: prev.nodes.map(node => {
        const nodeWithCounts = query.data.find(
          n => n?.data.id === node.data.id
        );

        return nodeWithCounts ?? node;
      }),
      edges: prev.edges,
    }));
  }, [query.data, query.pending, setEntities]);

  // Show loading notification
  useEffect(() => {
    if (!query.pending) {
      return;
    }
    const notificationId = enqueueNotification({
      title: "Updating Neighbors",
      message: `Updating neighbor counts for new nodes`,
      autoHideDuration: null,
    });
    return () => clearNotification(notificationId);
  }, [clearNotification, query.pending, enqueueNotification]);

  // Show error notification
  useEffect(() => {
    if (query.pending || !query.hasErrors) {
      return;
    }
    const notificationId = enqueueNotification({
      title: "Some Errors Occurred",
      message: `While requesting counts for neighboring nodes, some errors occurred.`,
      type: "error",
    });
    return () => clearNotification(notificationId);
  }, [clearNotification, query.pending, query.hasErrors, enqueueNotification]);
}

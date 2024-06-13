import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { useNotification } from "../components/NotificationProvider";
import type {
  NeighborsRequest,
  NeighborsResponse,
} from "../connector/useGEFetchTypes";
import { explorerSelector } from "../core/connector";
import useEntities from "./useEntities";
import { useRecoilValue } from "recoil";
import { useMutation, useQueries } from "@tanstack/react-query";
import { neighborsCountQuery } from "../connector/queries";
import useDisplayNames from "./useDisplayNames";
import { Vertex } from "../@types/entities";

/*

# Developer Note

Since the expand request could come from the GraphViewer or the sidebar, we must
encapsulate the logic within a React context. This ensures the dependent queries
will be run regardless if the view is unmounted.

*/

type ExpandNodeFilters = Omit<
  NeighborsRequest,
  "vertexId" | "idType" | "vertexType"
>;

export type ExpandNodeRequest = {
  vertex: Vertex;
  filters?: ExpandNodeFilters;
};

export type ExpandNodeContextType = {
  expandNode: (vertex: Vertex, filters?: ExpandNodeFilters) => void;
  isPending: boolean;
};

const ExpandNodeContext = createContext<ExpandNodeContextType | null>(null);

export function ExpandNodeProvider(props: PropsWithChildren) {
  // Wires up node count query in response to new nodes in the graph
  useUpdateNodeCounts();

  const explorer = useRecoilValue(explorerSelector);
  const [_, setEntities] = useEntities();
  const { enqueueNotification, clearNotification } = useNotification();
  const getDisplayNames = useDisplayNames();

  const mutation = useMutation({
    mutationFn: async (
      expandNodeRequest: ExpandNodeRequest
    ): Promise<NeighborsResponse | null> => {
      // Perform the query when a request exists
      const request: NeighborsRequest | null = expandNodeRequest && {
        vertexId: expandNodeRequest.vertex.data.id,
        idType: expandNodeRequest.vertex.data.idType,
        vertexType:
          expandNodeRequest.vertex.data.types?.join("::") ??
          expandNodeRequest.vertex.data.type,
        ...expandNodeRequest.filters,
      };

      if (!explorer || !request) {
        return null;
      }

      return await explorer.fetchNeighbors(request);
    },
    onSuccess: data => {
      if (!data) {
        return;
      }
      // Update nodes and edges in the graph
      setEntities({
        nodes: data.vertices,
        edges: data.edges,
      });
    },
    onError: (error, request) => {
      const displayName = getDisplayNames(request.vertex);
      // Notify the user of the error
      enqueueNotification({
        title: "Expanding Node Failed",
        message: `Expanding the node ${displayName.name} failed with error "${error.message}"`,
        type: "error",
      });
    },
  });

  // Show a loading message to the user
  useEffect(() => {
    if (!mutation.isPending) {
      return;
    }
    // const displayName = getDisplayNames(expandNodeRequest.vertex);
    const notificationId = enqueueNotification({
      title: "Expanding Node",
      // message: `Expanding the node ${displayName.name}`,
      message: "Expanding neighbors for the given node.",
      stackable: true,
    });

    return () => clearNotification(notificationId);
  }, [clearNotification, enqueueNotification, mutation.isPending]);

  const expandNode = useCallback(
    (vertex: Vertex, filters?: ExpandNodeFilters) => {
      const request: ExpandNodeRequest = { vertex, filters };

      // Only allow expansion if we are not busy with another expansion
      if (mutation.isPending) {
        return;
      }

      if (vertex.data.__unfetchedNeighborCount === 0) {
        enqueueNotification({
          title: "No more neighbors",
          message:
            "This vertex has been fully expanded or it does not have connections",
        });
        return;
      }

      mutation.mutate(request);
    },
    [enqueueNotification, mutation]
  );

  const value: ExpandNodeContextType = {
    expandNode,
    isPending: mutation.isPending,
  };

  return (
    <ExpandNodeContext.Provider value={value}>
      {props.children}
    </ExpandNodeContext.Provider>
  );
}

/**
 * Hook that watches nodes added to the graph and queries the database for
 * neighbor counts. There should be only one instance of this hook in the render
 * pipeline since it uses effects for progress and error notifications.
 */
function useUpdateNodeCounts() {
  const [entities, setEntities] = useEntities();
  const explorer = useRecoilValue(explorerSelector);
  const { enqueueNotification, clearNotification } = useNotification();

  const nodeIds = [...new Set(entities.nodes.map(n => n.data.id))];

  const query = useQueries({
    queries: nodeIds.map(id => neighborsCountQuery(id, explorer)),
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

/**
 * Provides a callback to submit a node expansion request, the query
 * information, and a callback to reset the request state.
 */
export default function useExpandNode() {
  const value = useContext(ExpandNodeContext);
  if (!value) {
    throw new Error("useExpandNode must be used within <ExpandNodeProvider>");
  }
  return value;
}

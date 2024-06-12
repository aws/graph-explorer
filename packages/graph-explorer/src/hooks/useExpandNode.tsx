import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNotification } from "../components/NotificationProvider";
import type {
  NeighborsRequest,
  NeighborsResponse,
} from "../connector/useGEFetchTypes";
import { explorerSelector } from "../core/connector";
import useEntities from "./useEntities";
import { useRecoilValue } from "recoil";
import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import { neighborsCountQuery, neighborsQuery } from "../connector/queries";
import useDisplayNames from "./useDisplayNames";
import { Vertex } from "../@types/entities";
import { isEqual } from "lodash";

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
  reset: () => void;
  query: UseQueryResult<NeighborsResponse | null, Error>;
};

const ExpandNodeContext = createContext<ExpandNodeContextType | null>(null);

export function ExpandNodeProvider(props: PropsWithChildren) {
  // Wires up node count query in response to new nodes in the graph
  useUpdateNodeCounts();

  const [expandNodeRequest, setExpandNodeRequest] =
    useState<ExpandNodeRequest | null>(null);

  // Perform the query when a request exists
  const request: NeighborsRequest | null = expandNodeRequest && {
    vertexId: expandNodeRequest.vertex.data.id,
    idType: expandNodeRequest.vertex.data.idType,
    vertexType:
      expandNodeRequest.vertex.data.types?.join("::") ??
      expandNodeRequest.vertex.data.type,
    ...expandNodeRequest.filters,
  };
  const explorer = useRecoilValue(explorerSelector);
  const query = useQuery(neighborsQuery(request, explorer));

  const { enqueueNotification, clearNotification } = useNotification();
  const getDisplayNames = useDisplayNames();

  // Show a loading message to the user
  useEffect(() => {
    if (!expandNodeRequest || !query.isLoading) {
      return;
    }
    const displayName = getDisplayNames(expandNodeRequest.vertex);
    const notificationId = enqueueNotification({
      title: "Expanding Node",
      message: `Expanding the node ${displayName.name}`,
      stackable: true,
    });

    return () => clearNotification(notificationId);
  }, [
    clearNotification,
    enqueueNotification,
    getDisplayNames,
    query.isLoading,
    expandNodeRequest,
  ]);

  // Show an error message to the user
  const error =
    expandNodeRequest && !query.isFetching && query.isError
      ? query.error
      : null;
  useEffect(() => {
    if (!error || !expandNodeRequest) {
      return;
    }

    const displayName = getDisplayNames(expandNodeRequest.vertex);
    const notificationId = enqueueNotification({
      title: "Expanding Node Failed",
      message: `Expanding the node ${displayName.name} failed with error "${error.message}"`,
      type: "error",
    });

    return () => clearNotification(notificationId);
  }, [
    clearNotification,
    enqueueNotification,
    getDisplayNames,
    expandNodeRequest,
    error,
  ]);

  // Update the graph with the new neighbors
  const [, setEntities] = useEntities();
  useEffect(() => {
    if (!query.data) {
      return;
    }
    setEntities({
      nodes: query.data.vertices,
      edges: query.data.edges,
    });

    // Reset the expand request
    setExpandNodeRequest(null);
  }, [query.data, setEntities, setExpandNodeRequest]);

  const expandNode = useCallback(
    (vertex: Vertex, filters?: ExpandNodeFilters) => {
      const request: ExpandNodeRequest = { vertex, filters };

      // Retry error cases
      if (query.isError && isEqual(request, expandNodeRequest)) {
        query.refetch();
        return;
      }

      // Only allow expansion if we are not busy with another expansion
      if (expandNodeRequest) {
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

      setExpandNodeRequest(null);
      setExpandNodeRequest(request);
    },
    [enqueueNotification, expandNodeRequest, query, setExpandNodeRequest]
  );

  // Reset is needed when changing connections and there was an error that
  // preserves the request state. I tried making the state a Recoil atom, but it
  // caused a crash for some reason. It would be worth retrying that approach
  // if we move to Jotai.
  const reset = useCallback(() => {
    setExpandNodeRequest(null);
  }, []);

  const value: ExpandNodeContextType = { expandNode, query, reset };

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

import { useCallback, useEffect, useState } from "react";
import { useNotification } from "../components/NotificationProvider";
import type { NeighborsRequest } from "../connector/useGEFetchTypes";
import { explorerSelector } from "../core/connector";
import useEntities from "./useEntities";
import { useRecoilValue } from "recoil";
import { useQuery } from "@tanstack/react-query";
import { neighborsQuery } from "../connector/queries";
import useDisplayNames from "./useDisplayNames";
import { Vertex } from "../@types/entities";

export type ExpandNodeRequest = {
  vertex: Vertex;
  filters?: Omit<NeighborsRequest, "vertexId" | "idType" | "vertexType">;
};

export default function useExpandNode() {
  const [expandNodeRequest, setExpandNodeRequest] =
    useState<ExpandNodeRequest | null>(null);

  const expandNode = useCallback(
    (
      vertex: Vertex,
      filters?: Omit<NeighborsRequest, "vertexId" | "idType" | "vertexType">
    ) => {
      setExpandNodeRequest({ vertex, filters });
    },
    [setExpandNodeRequest]
  );

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
  useEffect(() => {
    if (!expandNodeRequest || !query.isError) {
      return;
    }
    const displayName = getDisplayNames(expandNodeRequest.vertex);
    const notificationId = enqueueNotification({
      title: "Expanding Node Failed",
      message: `Expanding the node ${displayName.name} failed with error "${query.error.message}"`,
      type: "error",
    });

    return () => clearNotification(notificationId);
  }, [
    clearNotification,
    enqueueNotification,
    getDisplayNames,
    query.error?.message,
    query.isError,
    query.isLoading,
    expandNodeRequest,
  ]);

  // Update the graph with the new neighbors
  const [, setEntities] = useEntities();
  useEffect(() => {
    if (!query.data || !query.isSuccess) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log("Adding the new vertices and edges to the graph", query.data);
    setEntities({
      nodes: query.data.vertices,
      edges: query.data.edges,
      // selectNewEntities: "nodes",
    });
  }, [
    query.data?.vertices,
    query.data?.edges,
    query.data,
    setEntities,
    query.isSuccess,
  ]);

  return { expandNode, ...query };

  // const notificationId = enqueueNotification({
  //   title: "Updating Neighbors",
  //   message: `Looking for the Neighbors of ${result.vertices.length} results`,
  //   autoHideDuration: null,
  // });
}

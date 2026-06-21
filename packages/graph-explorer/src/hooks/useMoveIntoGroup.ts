import { useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { toast } from "sonner";

import type { ResultEdge } from "@/connector/entities";

import { neighborsCountQuery, setEdgeDetailsQueryCache } from "@/connector";
import {
  type MoveIntoGroupRequest,
  moveIntoGroupQuery,
} from "@/connector/gremlin/moveIntoGroup";
import { getExplorer } from "@/connector/queries/helpers";
import { createEdge, edgesAtom, type VertexId } from "@/core";
import { loggerSelector } from "@/core/connector";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";

import { useAddToGraph } from "./useAddToGraph";
import { useRemoveFromGraph } from "./useRemoveFromGraph";

const CONTAINS_EDGE_TYPE = "contains";

/**
 * Persists the move of a vertex (a notion or a notion group) into a new notion
 * group directly through the Gremlin connection, then syncs the in-memory graph
 * so the canvas and Tree View reflect the change without a re-query.
 *
 * Only valid for Gremlin connections — `contains` is a property-graph edge.
 */
export function useMoveIntoGroup() {
  const addToGraph = useAddToGraph();
  const removeFromGraph = useRemoveFromGraph();
  const remoteLogger = useAtomValue(loggerSelector);
  const getEdges = useAtomCallback(useCallback(get => get(edgesAtom), []));

  const { mutate: moveIntoGroup, isPending } = useMutation({
    scope: {
      // Serialize moves so concurrent drops can't race on the same vertex.
      id: "moveIntoGroup",
    },
    mutationFn: async (request: MoveIntoGroupRequest, { client, meta }) => {
      const explorer = getExplorer(meta);

      if (explorer.connection.queryEngine !== "gremlin") {
        throw new Error(
          "Moving into a group is only supported on Gremlin engines",
        );
      }

      const movePromise = explorer.rawQuery({
        query: moveIntoGroupQuery(request),
      });

      toast.promise(movePromise, {
        loading: "Moving into group",
        success: "Moved into group",
        error: err => {
          remoteLogger.error(
            `Failed to move into group: ${(err as Error)?.message ?? "Unknown error"}`,
          );
          return createDisplayError(err).message;
        },
      });

      const response = await movePromise;

      // The traversal returns the newly created `contains` edge. We map it
      // through the standard edge result so its id matches what a later fetch
      // would return, even for engines (e.g. JanusGraph) with composite edge
      // ids. This keeps the graph in sync without a re-query.
      const newEdgeResult = response.results.find(
        (entity): entity is ResultEdge => entity.entityType === "edge",
      );

      if (newEdgeResult == null) {
        logger.warn(
          "Move succeeded but no edge was returned; the graph may be stale until refresh",
        );
        return;
      }

      const newEdge = createEdge(newEdgeResult);

      // Drop the vertex's previous `contains` edge(s) from the graph, then add
      // the new one so the tree re-roots the vertex under its new group.
      const oldContainsEdgeIds = getEdges()
        .values()
        .filter(
          edge =>
            edge.type === CONTAINS_EDGE_TYPE &&
            edge.targetId === request.vertexId &&
            edge.id !== newEdge.id,
        )
        .map(edge => edge.id)
        .toArray();

      const previousGroupIds = getEdges()
        .values()
        .filter(edge => oldContainsEdgeIds.includes(edge.id))
        .map(edge => edge.sourceId)
        .toArray();

      removeFromGraph({ edges: oldContainsEdgeIds });
      setEdgeDetailsQueryCache(client, newEdge);
      await addToGraph({ edges: [newEdge] });

      // Neighbor counts changed for the vertex and the involved groups, so the
      // tree's "unexpanded" badges need to refetch from the database.
      const affectedVertexIds: VertexId[] = [
        request.vertexId,
        request.toGroupId,
        ...previousGroupIds,
      ];
      await Promise.all(
        affectedVertexIds.map(vertexId =>
          client.invalidateQueries({
            queryKey: neighborsCountQuery(vertexId).queryKey,
          }),
        ),
      );
    },
  });

  return { moveIntoGroup, isPending };
}

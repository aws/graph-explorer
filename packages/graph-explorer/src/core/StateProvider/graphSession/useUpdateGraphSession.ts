import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import type { EdgeId, VertexId } from "@/core";

import { logger } from "@/utils";

import { edgesAtom } from "../edges";
import { nodesAtom } from "../nodes";
import {
  activeGraphSessionAtom,
  type GraphSessionStorageModel,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";

/**
 * Returns a callback that can be used to trigger an update of the graph
 * session storage for the active connection.
 */
export function useUpdateGraphSession() {
  return useAtomCallback(
    useCallback((get, set) => {
      // Get the latest graph data from the atoms
      const nodesInGraph = get(nodesAtom);
      const edgesInGraph = get(edgesAtom);

      // Get the entity IDs, ignoring blank nodes
      const vertices = new Set<VertexId>();
      for (const [key, node] of nodesInGraph) {
        if (!node.isBlankNode) {
          vertices.add(key);
        }
      }
      const edges = new Set<EdgeId>();
      for (const [key, edge] of edgesInGraph) {
        const source = nodesInGraph.get(edge.sourceId);
        const target = nodesInGraph.get(edge.targetId);
        if (!source?.isBlankNode && !target?.isBlankNode) {
          edges.add(key);
        }
      }

      // Construct the graph storage model
      const graphSession: GraphSessionStorageModel = {
        vertices,
        edges,
      };

      // Update the session
      logger.debug("Updating graph session", graphSession);
      set(activeGraphSessionAtom, graphSession);
      set(isRestorePreviousSessionAvailableAtom, false);
    }, []),
  );
}

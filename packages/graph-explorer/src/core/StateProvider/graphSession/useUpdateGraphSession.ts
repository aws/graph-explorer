import { logger } from "@/utils";
import { edgesAtom } from "../edges";
import { nodesAtom } from "../nodes";
import {
  type GraphSessionStorageModel,
  activeGraphSessionAtom,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

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
      const vertices = new Set(
        nodesInGraph
          .entries()
          .filter(([_key, node]) => !node.isBlankNode)
          .map(([key]) => key)
      );
      const edges = new Set(
        edgesInGraph
          .entries()
          .filter(([_key, edge]) => {
            const source = nodesInGraph.get(edge.sourceId);
            const target = nodesInGraph.get(edge.targetId);
            return !source?.isBlankNode && !target?.isBlankNode;
          })
          .map(([key]) => key)
      );

      // Construct the graph storage model
      const graphSession: GraphSessionStorageModel = {
        vertices,
        edges,
      };

      // Update the session
      logger.debug("Updating graph session", graphSession);
      set(activeGraphSessionAtom, graphSession);
      set(isRestorePreviousSessionAvailableAtom, false);
    }, [])
  );
}

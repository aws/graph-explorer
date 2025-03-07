import { logger } from "@/utils";
import { useRecoilCallback } from "recoil";
import { edgesAtom } from "../edges";
import { nodesAtom } from "../nodes";
import {
  GraphSessionStorageModel,
  activeGraphSessionAtom,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";

/**
 * Returns a callback that can be used to trigger an update of the graph
 * session storage for the active connection.
 */
export function useUpdateGraphSession() {
  return useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        // Get the latest graph data from the atoms
        const nodesInGraph = await snapshot.getPromise(nodesAtom);
        const edgesInGraph = await snapshot.getPromise(edgesAtom);

        // Get the entity IDs, ignoring blank nodes
        const vertices = new Set(
          nodesInGraph
            .entries()
            .filter(([_key, node]) => !node.__isBlank)
            .map(([key]) => key)
        );
        const edges = new Set(
          edgesInGraph
            .entries()
            .filter(([_key, edge]) => {
              const source = nodesInGraph.get(edge.source);
              const target = nodesInGraph.get(edge.target);
              return !source?.__isBlank && !target?.__isBlank;
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
      },
    []
  );
}

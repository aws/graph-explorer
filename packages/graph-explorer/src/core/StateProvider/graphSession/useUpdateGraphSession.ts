import type { Getter } from "jotai";

import { useAtomCallback } from "jotai/utils";
import { RESET } from "jotai/utils";
import { useCallback } from "react";

import { logger } from "@/utils";

import { edgesAtom } from "../edges";
import { nodesAtom } from "../nodes";
import { retainGraphArrangementVertices } from "./arrangement";
import { graphViewLayoutAlgorithmAtom } from "./graphViewLayoutAlgorithm";
import {
  activeGraphSessionAtom,
  type GraphSessionStorageModel,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";

export function getGraphSessionFromCurrentGraph(
  get: Getter,
): GraphSessionStorageModel {
  const nodesInGraph = get(nodesAtom);
  const edgesInGraph = get(edgesAtom);

  const vertices = new Set(
    nodesInGraph
      .entries()
      .filter(([_key, node]) => !node.isBlankNode)
      .map(([key]) => key),
  );

  const edges = new Set(
    edgesInGraph
      .entries()
      .filter(([_key, edge]) => {
        const source = nodesInGraph.get(edge.sourceId);
        const target = nodesInGraph.get(edge.targetId);
        return !source?.isBlankNode && !target?.isBlankNode;
      })
      .map(([key]) => key),
  );

  const layout = get(graphViewLayoutAlgorithmAtom);
  const arrangement = retainGraphArrangementVertices(
    get(activeGraphSessionAtom)?.arrangement,
    vertices,
  );

  return arrangement
    ? { vertices, edges, layout, arrangement }
    : { vertices, edges, layout };
}

/**
 * Returns a callback that can be used to trigger an update of the graph
 * session storage for the active connection.
 */
export function useUpdateGraphSession() {
  return useAtomCallback(
    useCallback((get, set) => {
      const graphSession = getGraphSessionFromCurrentGraph(get);

      logger.debug("Updating graph session", graphSession);
      if (graphSession.vertices.size === 0 && graphSession.edges.size === 0) {
        set(activeGraphSessionAtom, RESET);
      } else {
        set(activeGraphSessionAtom, graphSession);
      }
      set(isRestorePreviousSessionAvailableAtom, false);
    }, []),
  );
}

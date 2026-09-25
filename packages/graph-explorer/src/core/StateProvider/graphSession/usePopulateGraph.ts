import { useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import { logger } from "@/utils";

import type { Entities } from "../../entities";

import { edgesAtom, toEdgeMap } from "../edges";
import { nodesAtom, toNodeMap } from "../nodes";
import {
  activeSchemaSelector,
  createVertexTypeLookup,
  updateSchemaFromEntities,
} from "../schema";

export function usePopulateGraph() {
  const setVertices = useSetAtom(nodesAtom);
  const setEdges = useSetAtom(edgesAtom);
  const setActiveSchema = useSetAtom(activeSchemaSelector);

  const getCanvasVertices = useAtomCallback(
    useCallback(get => get(nodesAtom), []),
  );

  return useCallback(
    (entities: Partial<Entities>) => {
      const newVerticesMap = toNodeMap(entities.vertices ?? []);
      const newEdgesMap = toEdgeMap(entities.edges ?? []);

      if (newVerticesMap.size === 0 && newEdgesMap.size === 0) {
        return;
      }

      const vertexLookup = createVertexTypeLookup(
        newVerticesMap,
        getCanvasVertices(),
      );

      if (newVerticesMap.size > 0) {
        logger.debug("Adding vertices to graph", newVerticesMap);
        setVertices(prev => new Map([...prev, ...newVerticesMap]));
      }

      if (newEdgesMap.size > 0) {
        logger.debug("Adding edges to graph", newEdgesMap);
        setEdges(prev => new Map([...prev, ...newEdgesMap]));
      }

      setActiveSchema(prev => {
        if (!prev) {
          return prev;
        }
        return updateSchemaFromEntities(
          {
            vertices: newVerticesMap.values().toArray(),
            edges: newEdgesMap.values().toArray(),
          },
          prev,
          vertexLookup,
        );
      });
    },
    [setVertices, setEdges, setActiveSchema, getCanvasVertices],
  );
}

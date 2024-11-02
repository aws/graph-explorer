import { useCallback } from "react";
import { Vertex } from "@/types/entities";
import useEntities from "./useEntities";
import { toNodeMap } from "@/core/StateProvider/nodes";

/** Returns a callback that adds a node or array of nodes to the graph. */
export default function useFetchNode() {
  const [, setEntities] = useEntities();

  return useCallback(
    (nodeOrNodes: Vertex | Vertex[]) => {
      const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];

      const validResults = nodes.filter(Boolean);

      if (!validResults.length) {
        return;
      }

      setEntities({
        nodes: toNodeMap(validResults),
        edges: [],
        selectNewEntities: "nodes",
      });
    },
    [setEntities]
  );
}

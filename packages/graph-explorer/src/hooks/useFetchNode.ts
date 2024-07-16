import { useCallback } from "react";
import { Vertex } from "../@types/entities";
import useEntities from "./useEntities";

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
        nodes: validResults,
        edges: [],
        selectNewEntities: "nodes",
      });
    },
    [setEntities]
  );
}

import { useCallback } from "react";
import { Vertex } from "../@types/entities";
import useEntities from "./useEntities";

const useFetchNode = () => {
  const [, setEntities] = useEntities();

  return useCallback(
    async (nodeOrNodes: Vertex | Vertex[]) => {
      const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];

      setEntities({
        nodes: nodes,
        edges: [],
        selectNewEntities: "nodes",
      });
    },
    [setEntities]
  );
};

export default useFetchNode;

import { useCallback } from "react";
import type { NeighborsRequest } from "../connector/AbstractConnector";
import useConnector from "../core/ConnectorProvider/useConnector";
import useEntities from "./useEntities";

const useExpandNode = () => {
  const [, setEntities] = useEntities();
  const connector = useConnector();

  return useCallback(
    async (req: NeighborsRequest) => {
      const result = await connector.explorer?.fetchNeighbors(req);
      if (!result) {
        return;
      }

      setEntities({
        nodes: result.vertices,
        edges: result.edges,
        selectNewEntities: "nodes",
      });
    },
    [connector.explorer, setEntities]
  );
};

export default useExpandNode;

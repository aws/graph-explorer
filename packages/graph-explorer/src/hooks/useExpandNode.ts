import { useCallback } from "react";
import { useNotification } from "../components/NotificationProvider";
import type { NeighborsRequest } from "../connector/useGEFetchTypes";
import { explorerSelector } from "../core/connector";
import useEntities from "./useEntities";
import { useRecoilValue } from "recoil";

const useExpandNode = () => {
  const [, setEntities] = useEntities();
  const explorer = useRecoilValue(explorerSelector);
  const { enqueueNotification } = useNotification();

  return useCallback(
    async (req: NeighborsRequest) => {
      const result = await explorer?.fetchNeighbors(req);

      if (!result || !result.vertices.length) {
        enqueueNotification({
          title: "No more neighbors",
          message:
            "This vertex has been fully expanded or it does not have connections",
        });
        return;
      }

      setEntities({
        nodes: result.vertices,
        edges: result.edges,
        selectNewEntities: "nodes",
      });
    },
    [explorer, setEntities, enqueueNotification]
  );
};

export default useExpandNode;

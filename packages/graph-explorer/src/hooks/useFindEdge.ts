import { useCallback, useMemo } from "react";
import { Vertex } from "../@types/entities";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import useTextTransform from "./useTextTransform";
import useConnector from "../core/ConnectorProvider/useConnector";
import { useNotification } from "../components/NotificationProvider";
import { NeighborsRequest } from "../connector/AbstractConnector";
import useEntities from "./useEntities";


const edgeArray = {
    "label":"value"
}

const useFindEdge = (vertex: Vertex) => {
  const config = useConfiguration();
  const [, setEntities] = useEntities();
  const textTransform = useTextTransform();
  const connector = useConnector();
  const { enqueueNotification, clearNotification } = useNotification();

  return useCallback(
    async (req: NeighborsRequest) => {
        const result = await connector.explorer?.fetchConnectedEdges(req);
        setEntities({
            nodes: vertex,
            edges: result.edges,
            selectNewEntities: "edges",
          });     
    },
    [connector.explorer, setEntities, enqueueNotification, clearNotification]
  )

  /*return useMemo(() => {
    return Object.keys(defualtArray)
      .map(vt => {
        const vConfig = config?.getVertexTypeConfig(vt);

        return {
          label: vConfig?.displayLabel || textTransform(vt),
          value: vt,
          isDisabled: vertex.data.__unfetchedNeighborCounts?.[vt] === 0,
          config: vConfig,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [
    config,
    textTransform
  ])*/;
};

export default useFindEdge;
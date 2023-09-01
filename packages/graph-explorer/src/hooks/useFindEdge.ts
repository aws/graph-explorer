import { useCallback, useMemo } from "react";
import { Vertex } from "../@types/entities";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import useTextTransform from "./useTextTransform";
import useConnector from "../core/ConnectorProvider/useConnector";
import { useNotification } from "../components/NotificationProvider";
import { EdgesRequest, NeighborsRequest } from "../connector/AbstractConnector";
import useEntities from "./useEntities";


const useFindEdge = () => {
  const config = useConfiguration();
  const [, setEntities] = useEntities();
  const textTransform = useTextTransform();
  const connector = useConnector();
  const { enqueueNotification, clearNotification } = useNotification();
  const edgesData = useCallback(
    (req: EdgesRequest) => {
        return connector.explorer?.fetchConnectedEdges({
            vertexId:req.vertexId
        });
    },
    [connector.explorer]
  )
  return edgesData;


}
/*  return useCallback(
    async (req: EdgesRequest) => {
        const result = await connector.explorer?.fetchConnectedEdges(req);
        setEntities({
            nodes: [],
            edges: result.edges,
            selectNewEntities:"edges",
        });
        /*return {
            data: {

            }
        };
        //const validResults = result as Edge[];
        setEntities({
            nodes: [],
            edges: result.edges,
            selectNewEntities: "edges",
        })
    },
    [edgesData, 
        setEntities, 
        enqueueNotification, 
        clearNotification]
  

  return useMemo(() => {
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
  ]);
};*/

export default useFindEdge;
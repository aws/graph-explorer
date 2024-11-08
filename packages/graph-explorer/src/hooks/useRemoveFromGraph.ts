import { EdgeId, VertexId } from "@/types/entities";
import useEntities from "./useEntities";

export function useRemoveNodeFromGraph(nodeId: VertexId) {
  const [, setEntities] = useEntities();

  return () => {
    setEntities(prev => {
      return {
        ...prev,
        nodes: new Map(prev.nodes.entries().filter(([id]) => id !== nodeId)),
        forceSet: true,
      };
    });
  };
}

export function useRemoveEdgeFromGraph(edgeId: EdgeId) {
  const [, setEntities] = useEntities();

  return () => {
    setEntities(prev => {
      return {
        ...prev,
        edges: new Map(prev.edges.entries().filter(([id]) => id !== edgeId)),
        forceSet: true,
      };
    });
  };
}

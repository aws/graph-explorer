import { useMemo } from "react";
import { useConfiguration } from "../core";

const useEntitiesCounts = () => {
  const config = useConfiguration();

  const totalNodes = useMemo(() => {
    if (config?.totalVertices != null) {
      return config?.totalVertices;
    }

    if (!config?.vertexTypes.length) {
      return null;
    }

    let total = 0;

    for (const vt of config.vertexTypes) {
      const currTotal = config?.getVertexTypeConfig(vt)?.total;
      if (currTotal == null) {
        return null;
      }

      total += currTotal;
    }

    return total;
  }, [config]);

  const totalEdges = useMemo(() => {
    if (config?.totalEdges != null) {
      return config?.totalEdges;
    }

    if (!config?.edgeTypes.length) {
      return null;
    }

    let total = 0;

    for (const et of config.edgeTypes) {
      const currTotal = config?.getEdgeTypeConfig(et)?.total;
      if (currTotal == null) {
        return null;
      }

      total += currTotal;
    }

    return total;
  }, [config]);

  return { totalNodes, totalEdges };
};

export default useEntitiesCounts;

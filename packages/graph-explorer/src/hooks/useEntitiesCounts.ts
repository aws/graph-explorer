import { useMemo } from "react";
import { useConfiguration } from "../core";
import { useVertexTypeConfigs } from "../core/ConfigurationProvider/useConfiguration";

const useEntitiesCounts = () => {
  const config = useConfiguration();
  const vtConfigs = useVertexTypeConfigs();

  const totalNodes = useMemo(() => {
    if (config?.totalVertices != null) {
      return config.totalVertices;
    }

    if (!vtConfigs.length) {
      return null;
    }

    let total = 0;

    for (const vtConfig of vtConfigs) {
      const currTotal = vtConfig.total;
      if (currTotal == null) {
        return null;
      }

      total += currTotal;
    }

    return total;
  }, [config?.totalVertices, vtConfigs]);

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

import { useMemo } from "react";
import { useConfiguration } from "@/core";
import {
  useEdgeTypeConfigs,
  useVertexTypeConfigs,
} from "@/core/ConfigurationProvider/useConfiguration";

const useEntitiesCounts = () => {
  const config = useConfiguration();
  const vtConfigs = useVertexTypeConfigs();
  const etConfigs = useEdgeTypeConfigs();

  const preCalculatedTotalNodes = config?.totalVertices ?? 0;
  const preCalculatedTotalEdges = config?.totalEdges ?? 0;

  const hasSyncedSchema = Boolean(config?.schema?.lastUpdate);

  const totalNodes = useMemo(() => {
    if (!hasSyncedSchema) {
      return null;
    }

    // If pre-calculated total exists, use that
    if (preCalculatedTotalNodes !== 0) {
      return preCalculatedTotalNodes;
    }

    if (!vtConfigs.length) {
      return 0;
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
  }, [hasSyncedSchema, preCalculatedTotalNodes, vtConfigs]);

  const totalEdges = useMemo(() => {
    if (!hasSyncedSchema) {
      return null;
    }

    if (preCalculatedTotalEdges !== 0) {
      return preCalculatedTotalEdges;
    }

    if (!etConfigs.length) {
      return 0;
    }

    let total = 0;

    for (const etConfig of etConfigs) {
      const currTotal = etConfig.total;
      if (currTotal == null) {
        return null;
      }

      total += currTotal;
    }

    return total;
  }, [etConfigs, hasSyncedSchema, preCalculatedTotalEdges]);

  return { totalNodes, totalEdges };
};

export default useEntitiesCounts;

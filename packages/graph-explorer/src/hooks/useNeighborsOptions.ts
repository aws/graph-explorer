import { useMemo } from "react";
import { Vertex } from "@/types/entities";
import { SelectOption } from "@/components";
import { DisplayVertexTypeConfig, useDisplayVertexTypeConfigs } from "@/core";

export type NeighborOption = SelectOption & {
  config: DisplayVertexTypeConfig;
};

export default function useNeighborsOptions(vertex: Vertex): NeighborOption[] {
  const vtConfigs = useDisplayVertexTypeConfigs();

  return useMemo(() => {
    return Object.keys(vertex.neighborsCountByType)
      .map(type => vtConfigs.get(type))
      .filter(vtConfig => vtConfig != null)
      .map(vtConfig => {
        return {
          label: vtConfig.displayLabel,
          value: vtConfig.type,
          isDisabled: vertex.__unfetchedNeighborCounts?.[vtConfig.type] === 0,
          config: vtConfig,
        };
      })
      .toSorted((a, b) => a.label.localeCompare(b.label));
  }, [
    vertex.neighborsCountByType,
    vertex.__unfetchedNeighborCounts,
    vtConfigs,
  ]);
}

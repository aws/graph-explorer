import { useMemo } from "react";
import {
  VertexId,
  DisplayVertexTypeConfig,
  useDisplayVertexTypeConfigs,
  useNeighbors,
} from "@/core";
import { SelectOption } from "@/components";

export type NeighborOption = SelectOption & {
  config: DisplayVertexTypeConfig;
};

export default function useNeighborsOptions(
  vertexId: VertexId
): NeighborOption[] {
  const vtConfigs = useDisplayVertexTypeConfigs();
  const neighbors = useNeighbors(vertexId);

  return useMemo(() => {
    if (!neighbors) {
      return [];
    }

    return neighbors.byType
      .entries()
      .map(([type, neighbors]) => {
        const vtConfig = vtConfigs.get(type);

        if (!vtConfig) {
          return null;
        }

        return {
          label: vtConfig.displayLabel,
          value: vtConfig.type,
          isDisabled: neighbors.unfetched === 0,
          config: vtConfig,
        } satisfies NeighborOption;
      })
      .filter(op => op != null)
      .toArray()
      .toSorted((a, b) => a.label.localeCompare(b.label));
  }, [neighbors, vtConfigs]);
}

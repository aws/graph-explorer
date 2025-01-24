import { useMemo } from "react";
import { Vertex } from "@/core";
import { SelectOption } from "@/components";
import {
  DisplayVertexTypeConfig,
  useDisplayVertexTypeConfigs,
  useNeighbors,
} from "@/core";

export type NeighborOption = SelectOption & {
  config: DisplayVertexTypeConfig;
};

export default function useNeighborsOptions(vertex: Vertex): NeighborOption[] {
  const vtConfigs = useDisplayVertexTypeConfigs();
  const neighbors = useNeighbors(vertex);

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

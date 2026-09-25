import type { SelectOption } from "@/components";

import {
  type DisplayVertexTypeConfig,
  useDisplayVertexTypeConfigCallback,
  useNeighbors,
  type VertexId,
} from "@/core";

export type NeighborOption = SelectOption & {
  config: DisplayVertexTypeConfig;
};

export default function useNeighborsOptions(
  vertexId: VertexId,
): NeighborOption[] {
  const getVtConfig = useDisplayVertexTypeConfigCallback();
  const neighbors = useNeighbors(vertexId);

  if (!neighbors) {
    return [];
  }

  return Array.from(neighbors.byType.entries(), ([type, neighbors]) => {
    const vtConfig = getVtConfig(type);

    return {
      label: vtConfig.displayLabel,
      value: vtConfig.type,
      isDisabled: neighbors.unfetched === 0,
      config: vtConfig,
    };
  }).toSorted((a, b) => a.label.localeCompare(b.label));
}

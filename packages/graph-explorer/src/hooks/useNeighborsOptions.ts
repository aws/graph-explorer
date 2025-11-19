import {
  type VertexId,
  type DisplayVertexTypeConfig,
  useNeighbors,
  useDisplayVertexTypeConfigCallback,
} from "@/core";
import type { SelectOption } from "@/components";

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

  return neighbors.byType
    .entries()
    .map(([type, neighbors]) => {
      const vtConfig = getVtConfig(type);

      return <NeighborOption>{
        label: vtConfig.displayLabel,
        value: vtConfig.type,
        isDisabled: neighbors.unfetched === 0,
        config: vtConfig,
      };
    })
    .toArray()
    .toSorted((a, b) => a.label.localeCompare(b.label));
}

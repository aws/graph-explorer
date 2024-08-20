import { useMemo } from "react";
import { Vertex } from "@/types/entities";
import {
  useConfiguration,
  VertexTypeConfig,
} from "@/core/ConfigurationProvider";
import useTextTransform from "./useTextTransform";
import { SelectOption } from "@/components";

export type NeighborOption = SelectOption & {
  config?: VertexTypeConfig;
};

export default function useNeighborsOptions(vertex: Vertex): NeighborOption[] {
  const config = useConfiguration();
  const textTransform = useTextTransform();

  return useMemo(() => {
    return Object.keys(vertex.data.neighborsCountByType)
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
    textTransform,
    vertex.data.neighborsCountByType,
    vertex.data.__unfetchedNeighborCounts,
  ]);
}

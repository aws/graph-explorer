import { Vertex } from "@/types/entities";
import { ComponentBaseProps, VertexSymbol } from "@/components";
import { useDisplayNames, useTextTransform } from "@/hooks";
import {
  useVertexTypeConfig,
  useVertexTypeConfigs,
} from "@/core/ConfigurationProvider/useConfiguration";

export default function VertexHeader({
  vertex,
}: { vertex: Vertex } & ComponentBaseProps) {
  const textTransform = useTextTransform();
  const vertexTypeConfigs = useVertexTypeConfigs(vertex.types ?? [vertex.type]);
  const displayLabels = vertexTypeConfigs
    .map(vtConfig => vtConfig.displayLabel || textTransform(vtConfig.type))
    .join(", ");
  const getDisplayNames = useDisplayNames();
  const { name } = getDisplayNames(vertex);
  const vtConfig = useVertexTypeConfig(vertex.type);

  return (
    <div className="bg-background-default flex items-center gap-2 break-words border-b p-3">
      {vtConfig.iconUrl && (
        <VertexSymbol vtConfig={vtConfig} className="size-12 p-2.5" />
      )}
      <div>
        <div className="break-words font-bold">
          {displayLabels || vertex.type}
        </div>
        <div>{name}</div>
      </div>
    </div>
  );
}

import { Vertex } from "@/types/entities";
import { ComponentBaseProps, VertexIcon } from "@/components";
import { fade } from "@/core";
import useDisplayNames from "@/hooks/useDisplayNames";
import useTextTransform from "@/hooks/useTextTransform";
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
        <div
          className="text-primary-main bg-primary-main/20 grid min-h-[36px] min-w-[36px] place-content-center rounded-full text-[2em]"
          style={{
            background: fade(vtConfig.color, 0.2),
            color: vtConfig.color,
          }}
        >
          <VertexIcon
            iconUrl={vtConfig.iconUrl}
            iconImageType={vtConfig.iconImageType}
          />
        </div>
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

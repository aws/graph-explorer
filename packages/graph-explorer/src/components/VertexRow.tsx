import {
  useVertexTypeConfig,
  useVertexTypeConfigs,
} from "@/core/ConfigurationProvider/useConfiguration";
import { Vertex } from "@/@types/entities";
import { useDisplayNames, useTextTransform } from "@/hooks";
import { VertexSymbol } from ".";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils";

export function VertexRow({
  vertex,
  className,
  ...props
}: { vertex: Vertex } & ComponentPropsWithoutRef<"div">) {
  const getDisplayNames = useDisplayNames();
  const textTransform = useTextTransform();

  const { name, longName } = getDisplayNames(vertex);

  const vtConfigForStyling = useVertexTypeConfig(vertex.type);
  const vertexTypeConfigs = useVertexTypeConfigs(vertex.types ?? [vertex.type]);
  const vertexTypeDisplayLabels = vertexTypeConfigs
    .map(vtConfig => vtConfig.displayLabel || textTransform(vtConfig.type))
    .join(", ");

  return (
    <div
      className={cn("flex flex-row items-center gap-3", className)}
      {...props}
    >
      <VertexSymbol vtConfig={vtConfigForStyling} />
      <div className="flex grow flex-col items-start">
        <div className="text-base font-bold leading-snug">
          {vertexTypeDisplayLabels} &rsaquo; {name}
        </div>
        <div className="text-text-secondary/90 line-clamp-2 text-base leading-snug">
          {longName}
        </div>
      </div>
    </div>
  );
}

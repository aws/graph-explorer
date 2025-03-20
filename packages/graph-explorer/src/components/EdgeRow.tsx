import { DisplayEdge, useDisplayVertex } from "@/core";
import { ComponentPropsWithoutRef } from "react";
import { EdgeSymbol } from "./EdgeSymbol";
import { cn } from "@/utils";

export function EdgeRow({
  edge,
  className,
  ...props
}: {
  edge: DisplayEdge;
} & ComponentPropsWithoutRef<"div">) {
  const source = useDisplayVertex(edge.source.id);
  const target = useDisplayVertex(edge.target.id);

  const title =
    edge.displayTypes === edge.displayName
      ? edge.displayTypes
      : `${edge.displayTypes} › ${edge.displayName}`;

  return (
    <div
      className={cn("flex flex-row items-center gap-3", className)}
      {...props}
    >
      <EdgeSymbol className="size-11 p-[8px]" />
      <div className="flex grow flex-col items-start">
        <div className="break-word text-balance text-base font-bold leading-snug">
          {title}
        </div>
        <div className="text-text-secondary/90 break-word line-clamp-2 inline-flex items-center gap-1 text-balance text-base leading-snug">
          {source.displayName}&nbsp;&rarr; {target.displayName}
        </div>
      </div>
    </div>
  );
}

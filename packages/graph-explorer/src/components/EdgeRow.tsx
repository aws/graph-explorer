import { DisplayEdge, DisplayVertex } from "@/core";
import { ComponentPropsWithoutRef } from "react";
import { EdgeSymbol } from "./EdgeSymbol";
import { cn } from "@/utils";

/**
 * Visually represents an edge from the graph database.
 *
 * Used in the header of edge details and in search results lists.
 */
export function EdgeRow({
  edge,
  source,
  target,
  className,
  ...props
}: {
  edge: DisplayEdge;
  source: DisplayVertex;
  target: DisplayVertex;
} & ComponentPropsWithoutRef<"div">) {
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
      <div className="inline-block text-pretty text-base leading-snug [word-break:break-word]">
        <div className="line-clamp-3 font-bold">{title}</div>
        <div className="text-text-secondary/90 line-clamp-3">
          {source.displayName}&nbsp;&rarr; {target.displayName}
        </div>
      </div>
    </div>
  );
}

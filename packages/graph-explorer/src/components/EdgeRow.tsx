import { DisplayEdge, DisplayVertex } from "@/core";
import { ComponentPropsWithoutRef } from "react";
import { EdgeSymbol } from "./EdgeSymbol";
import { cn, NBSP, RSAQUO } from "@/utils";
import { SearchResultSubtitle, SearchResultTitle } from "./SearchResult";

/**
 * Visually represents an edge from the graph database.
 *
 * Used in the header of edge details and in search results lists.
 */
export function EdgeRow({
  edge,
  source,
  target,
  name,
  className,
  ...props
}: {
  edge: DisplayEdge;
  source: DisplayVertex;
  target: DisplayVertex;
  name?: string | null;
} & ComponentPropsWithoutRef<"div">) {
  const resultName = name ? `${name}: ` : "";
  const nameIsSameAsTypes = edge.displayTypes === edge.displayName;
  const displayName = nameIsSameAsTypes
    ? edge.displayName
    : `${edge.displayTypes}${NBSP}${RSAQUO} ${edge.displayName}`;
  const title = `${resultName}${displayName}`;

  return (
    <div
      className={cn("flex flex-row items-center gap-3", className)}
      {...props}
    >
      <EdgeSymbol />
      <div>
        <SearchResultTitle>{title}</SearchResultTitle>
        <SearchResultSubtitle>
          {source.displayName}&nbsp;&rarr; {target.displayName}
        </SearchResultSubtitle>
      </div>
    </div>
  );
}

import type { ComponentPropsWithoutRef } from "react";

import type { DisplayEdge, DisplayVertex } from "@/core";

import { ASCII, cn } from "@/utils";

import { EdgeSymbol } from "./EdgeSymbol";
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
  name?: string;
} & ComponentPropsWithoutRef<"div">) {
  const resultName = name ? `${name}: ` : "";
  const nameIsSameAsTypes = edge.displayTypes === edge.displayName;
  const displayName = nameIsSameAsTypes
    ? edge.displayName
    : `${edge.displayTypes}${ASCII.NBSP}${ASCII.RSAQUO} ${edge.displayName}`;
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

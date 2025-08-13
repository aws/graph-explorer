import { DisplayEdge, DisplayVertex } from "@/core";
import { ComponentPropsWithoutRef } from "react";
import { EdgeSymbol } from "./EdgeSymbol";
import { cn } from "@/utils";
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
  const innerTitle =
    edge.displayTypes === edge.displayName ? (
      <>{edge.displayTypes}</>
    ) : (
      <>
        {edge.displayTypes}&nbsp;&rsaquo; {edge.displayName}
      </>
    );

  const title = name ? (
    <>
      {name}: {innerTitle}
    </>
  ) : (
    <>{innerTitle}</>
  );

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

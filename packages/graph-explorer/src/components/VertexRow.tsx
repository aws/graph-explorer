import { DisplayVertex } from "@/core";
import { SearchResultSubtitle, SearchResultTitle, VertexSymbol } from ".";
import { ComponentPropsWithoutRef } from "react";
import { cn, NBSP, RSAQUO } from "@/utils";

export function VertexRow({
  name,
  vertex,
  className,
  ...props
}: {
  vertex: DisplayVertex;
  name?: string;
} & ComponentPropsWithoutRef<"div">) {
  const resultName = name ? `${name}: ` : "";
  const nameIsSameAsTypes = vertex.displayTypes === vertex.displayName;
  const displayName = nameIsSameAsTypes
    ? vertex.displayName
    : `${vertex.displayTypes}${NBSP}${RSAQUO} ${vertex.displayName}`;
  const title = `${resultName}${displayName}`;

  return (
    <div
      className={cn("flex flex-row items-center gap-3", className)}
      {...props}
    >
      <VertexSymbol vertexStyle={vertex.typeConfig.style} />
      <div>
        <SearchResultTitle>{title}</SearchResultTitle>
        <SearchResultSubtitle>{vertex.displayDescription}</SearchResultSubtitle>
      </div>
    </div>
  );
}

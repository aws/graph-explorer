import { useVertexPreferences, type DisplayVertex } from "@/core";
import { SearchResultSubtitle, SearchResultTitle, VertexSymbol } from ".";
import type { ComponentPropsWithoutRef } from "react";
import { ASCII, cn, LABELS } from "@/utils";

export function VertexRow({
  name,
  vertex,
  className,
  ...props
}: {
  vertex: DisplayVertex;
  name?: string;
} & ComponentPropsWithoutRef<"div">) {
  const vertexStyle = useVertexPreferences(vertex.primaryType);
  const resultName = name ? `${name}: ` : "";
  const nameIsSameAsTypes = vertex.displayTypes === vertex.displayName;
  const isDefaultType = vertex.displayTypes === LABELS.MISSING_TYPE;
  const displayName =
    nameIsSameAsTypes || isDefaultType
      ? vertex.displayName
      : `${vertex.displayTypes}${ASCII.NBSP}${ASCII.RSAQUO} ${vertex.displayName}`;
  const title = `${resultName}${displayName}`;

  return (
    <div
      className={cn("flex flex-row items-center gap-3", className)}
      {...props}
    >
      <VertexSymbol vertexStyle={vertexStyle} />
      <div>
        <SearchResultTitle>{title}</SearchResultTitle>
        <SearchResultSubtitle>{vertex.displayDescription}</SearchResultSubtitle>
      </div>
    </div>
  );
}

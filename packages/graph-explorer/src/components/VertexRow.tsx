import type { ComponentPropsWithoutRef } from "react";

import { type DisplayVertex, useVertexPreferences } from "@/core";
import { ASCII, cn, LABELS } from "@/utils";

import { SearchResultSubtitle, SearchResultTitle, VertexSymbol } from ".";

export function VertexRow({
  name,
  vertex,
  className,
  ...props
}: {
  vertex: DisplayVertex;
  name?: string;
} & ComponentPropsWithoutRef<"div">) {
  const vertexPreferences = useVertexPreferences(vertex.primaryType);
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
      <VertexSymbol vertexStyle={vertexPreferences} />
      <div>
        <SearchResultTitle>{title}</SearchResultTitle>
        <SearchResultSubtitle>{vertex.displayDescription}</SearchResultSubtitle>
      </div>
    </div>
  );
}

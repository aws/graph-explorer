import { DisplayVertex } from "@/core";
import { SearchResultSubtitle, SearchResultTitle, VertexSymbol } from ".";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils";

export function VertexRow({
  name,
  vertex,
  className,
  ...props
}: {
  vertex: DisplayVertex;
  name?: string | null;
} & ComponentPropsWithoutRef<"div">) {
  const title = name ? (
    <>
      {name}: {vertex.displayTypes}&nbsp;&rsaquo; {vertex.displayName}
    </>
  ) : (
    <>
      {vertex.displayTypes}&nbsp;&rsaquo; {vertex.displayName}
    </>
  );

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

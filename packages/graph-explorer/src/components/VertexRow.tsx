import { DisplayVertex } from "@/core";
import { SearchResultSubtitle, SearchResultTitle, VertexSymbol } from ".";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils";

export function VertexRow({
  vertex,
  className,
  ...props
}: { vertex: DisplayVertex } & ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("flex flex-row items-center gap-3", className)}
      {...props}
    >
      <VertexSymbol vertexStyle={vertex.typeConfig.style} />
      <div>
        <SearchResultTitle>
          {vertex.displayTypes}&nbsp;&rsaquo; {vertex.displayName}
        </SearchResultTitle>
        <SearchResultSubtitle>{vertex.displayDescription}</SearchResultSubtitle>
      </div>
    </div>
  );
}

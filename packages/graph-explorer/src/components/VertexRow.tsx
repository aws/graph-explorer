import { DisplayVertex } from "@/core";
import { VertexSymbol } from ".";
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
      <VertexSymbol
        vertexStyle={vertex.typeConfig.style}
        className="size-11 p-[8px]"
      />
      <div className="inline-block text-pretty text-base leading-snug [word-break:break-word]">
        <div className="line-clamp-3 font-bold">
          {vertex.displayTypes}&nbsp;&rsaquo; {vertex.displayName}
        </div>
        <div className="text-text-secondary/90 line-clamp-3">
          {vertex.displayDescription}
        </div>
      </div>
    </div>
  );
}

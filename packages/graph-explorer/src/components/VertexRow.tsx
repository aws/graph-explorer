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
      <div className="flex grow flex-col items-start">
        <div className="text-balance break-all text-base font-bold leading-snug">
          {vertex.displayTypes} &rsaquo; {vertex.displayName}
        </div>
        <div className="text-text-secondary/90 line-clamp-2 text-balance break-all text-base leading-snug">
          {vertex.displayDescription}
        </div>
      </div>
    </div>
  );
}

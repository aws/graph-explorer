import type { ComponentPropsWithRef } from "react";
import { cn } from "@/utils";

export function KeyboardKey({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "border-text-secondary inline rounded border bg-transparent px-1 py-0.5 font-mono text-xs leading-none tracking-wider [&_svg]:inline [&_svg]:size-[10px]",
        className
      )}
      {...props}
    />
  );
}

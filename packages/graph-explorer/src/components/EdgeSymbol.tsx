import { cn } from "@/utils";
import { EdgeIcon } from "./icons";
import { ComponentPropsWithoutRef } from "react";

/** Icon representing an edge in the graph. */
export function EdgeSymbol({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "text-primary-main bg-primary-main/20 grid size-[36px] shrink-0 place-content-center rounded-full p-2 text-[2em]",
        className
      )}
      {...props}
    >
      <EdgeIcon className="size-full" />
    </div>
  );
}

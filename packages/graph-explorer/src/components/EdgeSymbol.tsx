import { type ComponentPropsWithoutRef } from "react";
import { EdgeIcon } from "./icons";
import { SearchResultSymbol } from "./SearchResult";
import { cn } from "@/utils";

/** Icon representing an edge in the graph. */
export function EdgeSymbol({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <SearchResultSymbol
      className={cn("text-primary-main bg-primary-main/20", className)}
      {...props}
    >
      <EdgeIcon className="size-full" />
    </SearchResultSymbol>
  );
}

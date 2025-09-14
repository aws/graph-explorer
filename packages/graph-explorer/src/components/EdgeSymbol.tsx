import { cn } from "@/utils";
import { EdgeIcon } from "./icons";
import { type ComponentPropsWithoutRef } from "react";
import { SearchResultSymbol } from "./SearchResult";

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

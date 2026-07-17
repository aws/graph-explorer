import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/utils";

import { EdgeIcon } from "./icons";
import { SearchResultSymbol } from "./SearchResult";

/** Icon representing an edge in the graph. */
export function EdgeSymbol({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <SearchResultSymbol
      className={cn("bg-primary/20 text-primary", className)}
      {...props}
    >
      <EdgeIcon className="size-full" />
    </SearchResultSymbol>
  );
}

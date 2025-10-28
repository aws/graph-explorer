import { cn } from "@/utils";
import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";
import type { ComponentPropsWithRef } from "react";

export default function NavBarLogo({
  className,
  ...rest
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "mr-2 grid aspect-square h-full place-content-center overflow-hidden bg-logo-gradient text-white",
        className
      )}
      {...rest}
    >
      <GraphExplorerIcon width="2em" height="2em" />
    </div>
  );
}

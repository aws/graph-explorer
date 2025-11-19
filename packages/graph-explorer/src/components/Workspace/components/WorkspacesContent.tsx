import { cn } from "@/utils";
import type { ComponentPropsWithRef } from "react";

function WorkspacesContent({
  className,
  orientation = "vertical",
  ...props
}: ComponentPropsWithRef<"div"> & { orientation?: "vertical" | "horizontal" }) {
  return (
    <div
      className={cn(
        "flex h-full grow gap-2 overflow-auto p-2",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        className,
      )}
      {...props}
    />
  );
}

WorkspacesContent.displayName = "WorkspacesContent";

export default WorkspacesContent;

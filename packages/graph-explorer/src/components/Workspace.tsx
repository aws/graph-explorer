import { cn } from "@/utils";
import type { ComponentPropsWithRef } from "react";

export function Workspace({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="workspace"
      className={cn(
        "bg-background-secondary flex min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function WorkspaceContent({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="workspace-content"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
      {...props}
    />
  );
}

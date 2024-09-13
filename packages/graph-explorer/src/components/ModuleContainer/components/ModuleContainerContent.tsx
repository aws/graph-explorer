import { cn } from "@/utils";
import { ComponentProps } from "react";

export default function ModuleContainerContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-background-default h-full w-full grow overflow-auto",
        className
      )}
      {...props}
    />
  );
}

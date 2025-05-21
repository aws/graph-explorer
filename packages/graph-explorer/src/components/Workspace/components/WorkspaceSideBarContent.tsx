import { cn } from "@/utils";
import type { ComponentPropsWithRef } from "react";

export type WorkspaceSideBarContentProps = {
  className?: string;
};

const WorkspaceSideBarContent = ({
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  return (
    <div
      className={cn("h-full w-full overflow-x-hidden", className)}
      {...props}
    />
  );
};

WorkspaceSideBarContent.displayName = "WorkspaceSideBarContent";

export default WorkspaceSideBarContent;

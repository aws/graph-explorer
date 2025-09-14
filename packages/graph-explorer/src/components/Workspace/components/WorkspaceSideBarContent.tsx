import type { ComponentPropsWithRef } from "react";
import { cn } from "@/utils";

export type WorkspaceSideBarContentProps = {
  className?: string;
};

const WorkspaceSideBarContent = ({
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  return <div className={cn("h-full w-full", className)} {...props} />;
};

WorkspaceSideBarContent.displayName = "WorkspaceSideBarContent";

export default WorkspaceSideBarContent;

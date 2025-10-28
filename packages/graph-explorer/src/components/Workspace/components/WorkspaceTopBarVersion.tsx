import { cn } from "@/utils";
import type { PropsWithChildren } from "react";

export type WorkspaceTopBarVersionProps = {
  className?: string;
};

const WorkspaceTopBarVersion = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarVersionProps>) => {
  return (
    <div
      className={cn(
        "top-bar-version flex items-center justify-center text-xs font-light text-text-secondary",
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarVersion.displayName = "WorkspaceTopBarVersion";

export default WorkspaceTopBarVersion;

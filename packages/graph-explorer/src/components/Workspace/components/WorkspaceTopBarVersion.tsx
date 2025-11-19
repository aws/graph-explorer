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
        "top-bar-version text-text-secondary flex items-center justify-center text-xs font-light",
        className,
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarVersion.displayName = "WorkspaceTopBarVersion";

export default WorkspaceTopBarVersion;

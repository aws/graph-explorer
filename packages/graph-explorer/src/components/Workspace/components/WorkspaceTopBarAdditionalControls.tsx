import type { PropsWithChildren } from "react";
import { cn } from "@/utils";

export type WorkspaceTopBarAdditionalControlsProps = {
  className?: string;
};

const WorkspaceTopBarAdditionalControls = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarAdditionalControlsProps>) => {
  return (
    <div className={cn("flex h-full items-center gap-1", className)}>
      {children}
    </div>
  );
};

WorkspaceTopBarAdditionalControls.displayName =
  "WorkspaceTopBarAdditionalControls";

export default WorkspaceTopBarAdditionalControls;

import { cn } from "@/utils";
import type { PropsWithChildren } from "react";

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

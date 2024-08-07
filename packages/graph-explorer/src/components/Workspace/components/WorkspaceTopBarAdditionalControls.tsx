import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";

export type WorkspaceTopBarAdditionalControlsProps = {
  className?: string;
};

const WorkspaceTopBarAdditionalControls = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarAdditionalControlsProps>) => {
  return (
    <div className={cx("flex h-full items-center gap-1", className)}>
      {children}
    </div>
  );
};

WorkspaceTopBarAdditionalControls.displayName =
  "WorkspaceTopBarAdditionalControls";

export default WorkspaceTopBarAdditionalControls;

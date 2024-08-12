import { cx } from "@emotion/css";
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
      className={cx(
        "top-bar-version text-text-secondary flex items-center justify-center text-xs font-light",
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarVersion.displayName = "WorkspaceTopBarVersion";

export default WorkspaceTopBarVersion;

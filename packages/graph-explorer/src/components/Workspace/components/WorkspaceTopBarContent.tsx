import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";

export type WorkspaceTopBarContentProps = {
  className?: string;
};

const WorkspaceTopBarContent = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarContentProps>) => {
  return (
    <div
      className={cx(
        "flex h-full min-w-[240px] grow justify-center py-1",
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarContent.displayName = "WorkspaceTopBarContent";

export default WorkspaceTopBarContent;

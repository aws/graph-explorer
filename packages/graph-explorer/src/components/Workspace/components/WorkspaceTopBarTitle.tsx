import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactNode } from "react";

export type WorkspaceTopBarTitleProps = {
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
};

const WorkspaceTopBarTitle = ({
  className,
  title,
  subtitle,
  children,
}: PropsWithChildren<WorkspaceTopBarTitleProps>) => {
  return (
    <div className={cx("flex h-full items-center", className)}>
      <div className="flex flex-col">
        {title && (
          <div className="line-clamp-1 overflow-hidden font-bold">{title}</div>
        )}
        {subtitle && (
          <div className="text-text-secondary line-clamp-1 overflow-hidden text-xs font-bold leading-tight">
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

WorkspaceTopBarTitle.displayName = "WorkspaceTopBarTitle";

export default WorkspaceTopBarTitle;

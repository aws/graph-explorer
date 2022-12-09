import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { withClassNamePrefix } from "../../../core";

export type WorkspaceSideBarContentProps = {
  classNamePrefix?: string;
  className?: string;
  isOpen?: boolean;
  defaultWidth?: number | string;
};

const WorkspaceSideBarContent = ({
  classNamePrefix = "ft",
  className,
  children,
  isOpen,
  defaultWidth = 350,
}: PropsWithChildren<WorkspaceSideBarContentProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <div
      className={cx(pfx("sidebar-content"), className)}
      style={{
        width: isOpen ? defaultWidth : 0,
      }}
    >
      {children}
    </div>
  );
};

WorkspaceSideBarContent.displayName = "WorkspaceSideBarContent";

export default WorkspaceSideBarContent;

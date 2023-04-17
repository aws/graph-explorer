import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { withClassNamePrefix } from "../../../core";

export type WorkspaceSideBarContentLeftProps = {
  classNamePrefix?: string;
  className?: string;
  isOpen?: boolean;
  defaultWidth?: number | string;
};

const WorkspaceSideBarContentLeft = ({
  classNamePrefix = "ft",
  className,
  children,
  isOpen,
  defaultWidth = 300,
}: PropsWithChildren<WorkspaceSideBarContentLeftProps>) => {
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

WorkspaceSideBarContentLeft.displayName = "WorkspaceSideBarContentLeft";

export default WorkspaceSideBarContentLeft;

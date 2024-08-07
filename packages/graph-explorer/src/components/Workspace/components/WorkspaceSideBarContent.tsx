import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";

export type WorkspaceSideBarContentProps = {
  className?: string;
  isOpen?: boolean;
  defaultWidth?: number | string;
};

const WorkspaceSideBarContent = ({
  className,
  children,
  isOpen,
  defaultWidth = 350,
}: PropsWithChildren<WorkspaceSideBarContentProps>) => {
  return (
    <div
      className={cx(
        "transition-width h-full overflow-x-hidden duration-200 ease-in-out",
        className
      )}
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

import { cn } from "@/utils";
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
      className={cn(
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

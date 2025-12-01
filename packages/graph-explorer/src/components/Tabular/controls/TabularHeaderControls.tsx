import { cn } from "@/utils";
import { type FC, type PropsWithChildren, useEffect } from "react";

import { useTabularControl } from "../TabularControlsProvider";

export type TabularHeaderControlsProps = PropsWithChildren<{
  className?: string;

  /**
   * Disables the sticky header controls. By default, it is pinned to the top of the view
   * so that it is visible even when scrolling.
   */
  disableSticky?: boolean;
}>;

const TabularHeaderControls: FC<TabularHeaderControlsProps> = ({
  children,
  className,
  disableSticky,
}) => {
  const { headerControlsRef, setHeaderControlsPosition } = useTabularControl();
  useEffect(() => {
    setHeaderControlsPosition(disableSticky ? "initial" : "sticky");
  }, [disableSticky, setHeaderControlsPosition]);

  return (
    <div
      ref={headerControlsRef}
      className={cn(
        "bg-background-contrast border-border sticky left-0 flex min-h-9 w-full flex-wrap items-center justify-end border border-solid *:mx-1",
        !disableSticky && "top-0 z-2",
        className,
      )}
    >
      {children}
    </div>
  );
};

TabularHeaderControls.displayName = "TabularHeaderControls";

export default TabularHeaderControls;

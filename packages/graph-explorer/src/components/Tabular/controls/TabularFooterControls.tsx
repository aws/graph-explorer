import type { FC, PropsWithChildren } from "react";

import { cn } from "@/utils";

export type TabularFooterControlsProps = PropsWithChildren<{
  className?: string;
  /**
   * Disables the sticky footer controls. By default, it is pinned to the bottom of the view
   * so that it is visible even when scrolling.
   */
  disableSticky?: boolean;
}>;

const TabularFooterControls: FC<TabularFooterControlsProps> = ({
  children,
  className,
  disableSticky,
}) => {
  return (
    <div
      className={cn(
        "bg-background-default text-text-primary sticky left-0 flex w-full flex-wrap items-center justify-between border-t px-3 py-2",
        !disableSticky && "-bottom-px z-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

TabularFooterControls.displayName = "TabularFooterControls";

export default TabularFooterControls;

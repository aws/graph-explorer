import type { FC, PropsWithChildren } from "react";

import { cn } from "@/utils";

import { useTabularControl } from "../TabularControlsProvider";

export type TabularEmptyBodyControlsProps = PropsWithChildren<{
  className?: string;
}>;

const TabularEmptyBodyControls: FC<TabularEmptyBodyControlsProps> = ({
  children,
  className,
}) => {
  const {
    instance: { page },
  } = useTabularControl();

  if (page.length !== 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex w-full grow flex-col items-center justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
};

TabularEmptyBodyControls.displayName = "TabularEmptyBodyControls";

export default TabularEmptyBodyControls;

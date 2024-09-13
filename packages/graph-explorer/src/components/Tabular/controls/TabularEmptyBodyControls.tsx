import { css } from "@emotion/css";
import { cn } from "@/utils";

import { FC, PropsWithChildren } from "react";

import { useTabularControl } from "../TabularControlsProvider";

export type TabularEmptyBodyControlsProps = PropsWithChildren<{
  className?: string;
}>;

const defaultStyles = () => css`
  &.body-controls {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    width: 100%;
    justify-content: center;
    align-items: center;
  }
`;

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
    <div className={cn(defaultStyles(), "body-controls", className)}>
      {children}
    </div>
  );
};

TabularEmptyBodyControls.displayName = "TabularEmptyBodyControls";

export default TabularEmptyBodyControls;

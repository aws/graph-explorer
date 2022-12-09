import { css, cx } from "@emotion/css";

import { FC } from "react";
import { withClassNamePrefix } from "../../../core";

import { useTabularControl } from "../TabularControlsProvider";

export type TabularEmptyBodyControlsProps = {
  classNamePrefix?: string;
  className?: string;
};

const defaultStyles = (pfx: string) => css`
  &.${pfx}-body-controls {
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
  classNamePrefix = "ft",
}) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const {
    instance: { page },
  } = useTabularControl();

  if (page.length !== 0) {
    return null;
  }

  return (
    <div
      className={cx(
        defaultStyles(classNamePrefix),
        pfx("body-controls"),
        className
      )}
    >
      {children}
    </div>
  );
};

TabularEmptyBodyControls.displayName = "TabularEmptyBodyControls";

export default TabularEmptyBodyControls;

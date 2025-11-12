import { css } from "@emotion/css";
import { cn } from "@/utils";
import { cssVar } from "@/core/ThemeProvider/utils/lib";
import { type FC, type PropsWithChildren, useEffect } from "react";
import type { ThemeStyleFn } from "@/core";
import { useWithTheme } from "@/core";

import { useTabularControl } from "../TabularControlsProvider";

export type TabularHeaderControlsProps = PropsWithChildren<{
  className?: string;

  /**
   * Disables the sticky header controls. By default, it is pinned to the top of the view
   * so that it is visible even when scrolling.
   */
  disableSticky?: boolean;
}>;

const defaultStyles = (): ThemeStyleFn => () => css`
  &.header-controls {
    position: sticky;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    width: 100%;
    min-height: 36px;
    background: ${cssVar(
      "--tabular-header-controls-background",
      "--tabular-header-background",
      "--palette-background-contrast"
    )};
    color: ${cssVar(
      "--tabular-header-controls-color",
      "--tabular-header-color"
    )};
    padding: ${cssVar("--tabular-header-controls-padding")};

    border-top: ${cssVar(
      "--tabular-header-controls-border",
      "--tabular-header-controls-border",
      "--tabular-border",
      "solid 1px var(--palette-border)"
    )};
    border-right: ${cssVar(
      "--tabular-header-controls-border",
      "--tabular-border",
      "solid 1px var(--palette-border)"
    )};
    border-left: ${cssVar(
      "--tabular-header-controls-border",
      "--tabular-border",
      "solid 1px var(--palette-border)"
    )};

    > * {
      margin: 0 4px;
    }
  }

  &.header-controls-sticky {
    z-index: 2;
    top: 0;
  }
`;

const TabularHeaderControls: FC<TabularHeaderControlsProps> = ({
  children,
  className,
  disableSticky,
}) => {
  const { headerControlsRef, setHeaderControlsPosition } = useTabularControl();
  useEffect(() => {
    setHeaderControlsPosition(disableSticky ? "initial" : "sticky");
  }, [disableSticky, setHeaderControlsPosition]);
  const styleWithTheme = useWithTheme();
  return (
    <div
      ref={headerControlsRef}
      className={cn(
        styleWithTheme(defaultStyles()),
        "header-controls",
        className,
        {
          ["header-controls-sticky"]: !disableSticky,
        }
      )}
    >
      {children}
    </div>
  );
};

TabularHeaderControls.displayName = "TabularHeaderControls";

export default TabularHeaderControls;

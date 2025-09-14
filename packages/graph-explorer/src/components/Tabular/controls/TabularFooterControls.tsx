import { css } from "@emotion/css";
import { cn } from "@/utils";
import { type FC, type PropsWithChildren } from "react";
import { useWithTheme } from "@/core";
import type { TabularVariantType } from "../Tabular";

import type { ThemeStyleFn } from "@/core/ThemeProvider";
import baseTheme from "../baseTheme";

export type TabularFooterControlsProps = PropsWithChildren<{
  className?: string;
  variant?: TabularVariantType;
  /**
   * Disables the sticky footer controls. By default, it is pinned to the bottom of the view
   * so that it is visible even when scrolling.
   */
  disableSticky?: boolean;
}>;

const defaultStyles =
  (variant?: TabularVariantType): ThemeStyleFn =>
  theme => {
    const { palette } = theme;

    return css`
      &.footer-controls {
        position: sticky;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        background: ${palette.background.default};
        color: ${palette.text.primary};
        padding: ${baseTheme.footer.controls.padding};
        border: solid 1px ${palette.border};

        ${variant === "noBorders" &&
        `border-right: none; border-left: none; border-bottom: none;`}

        > * {
          margin: 0 4px;
        }
      }

      &.footer-controls-sticky {
        z-index: 3;
        // -1px fixes the border
        ${variant === "noBorders" ? "bottom: 0;" : "bottom: -1px;"}
      }
    `;
  };

const TabularFooterControls: FC<TabularFooterControlsProps> = ({
  children,
  className,
  disableSticky,
  variant,
}) => {
  const styleWithTheme = useWithTheme();

  return (
    <div
      className={cn(
        styleWithTheme(defaultStyles(variant)),
        "footer-controls",
        className,
        {
          ["footer-controls-sticky"]: !disableSticky,
        }
      )}
    >
      {children}
    </div>
  );
};

TabularFooterControls.displayName = "TabularFooterControls";

export default TabularFooterControls;

import { css, cx } from "@emotion/css";
import { FC } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import type { TabularVariantType } from "../Tabular";

import type { ThemeStyleFn } from "../../../core/ThemeProvider/types";
import type { TabularTheme } from "../Tabular.model";
import baseTheme from "../baseTheme";

export type TabularFooterControlsProps = {
  classNamePrefix?: string;
  className?: string;
  variant?: TabularVariantType;
  /**
   * Disables the sticky footer controls. By default, it is pinned to the bottom of the view
   * so that it is visible even when scrolling.
   */
  disableSticky?: boolean;
};

const defaultStyles = (
  pfx: string,
  variant?: TabularVariantType
): ThemeStyleFn<TabularTheme> => ({ theme, isDarkTheme }) => {
  const { tabular, palette } = theme;

  return css`
    &.${pfx}-footer-controls {
      position: sticky;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      background: ${tabular?.footer?.controls?.background ||
      (isDarkTheme ? palette.grey[800] : palette.background.default)};
      color: ${tabular?.footer?.controls?.color || palette.text.primary};
      padding: ${tabular?.footer?.controls?.padding ||
      baseTheme.footer.controls.padding};
      border: ${tabular?.footer?.controls?.border ||
      tabular?.border ||
      `solid 1px ${palette.border}`};

      ${variant === "noBorders" &&
      `border-right: none; border-left: none; border-bottom: none;`}

      > * {
        margin: 0 4px;
      }
    }

    &.${pfx}-footer-controls-sticky {
      z-index: 3;
      // -1px fixes the border
      ${variant === "noBorders" ? "bottom: 0;" : "bottom: -1px;"}
    }
  `;
};

const TabularFooterControls: FC<TabularFooterControlsProps> = ({
  children,
  className,
  classNamePrefix = "ft",
  disableSticky,
  variant,
}) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const styleWithTheme = useWithTheme();

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix, variant)),
        pfx("footer-controls"),
        className,
        {
          [pfx("footer-controls-sticky")]: !disableSticky,
        }
      )}
    >
      {children}
    </div>
  );
};

TabularFooterControls.displayName = "TabularFooterControls";

export default TabularFooterControls;

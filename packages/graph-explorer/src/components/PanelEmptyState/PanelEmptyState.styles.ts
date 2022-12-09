import { css } from "@emotion/css";
import type { ProcessedTheme, ThemeStyleFn } from "../../core";
import { fade } from "../../core";

const getIndicatorSize = (size: "xs" | "sm" | "md" | "lg") => {
  if (size === "md") {
    return css`
      width: 100px;
      height: 100px;
      font-size: 72.5px;
    `;
  }

  if (size === "lg") {
    return css`
      width: 150px;
      height: 150px;
      font-size: 100.5px;
    `;
  }

  if (size === "sm") {
    return css`
      width: 60px;
      height: 60px;
      font-size: 32px;
    `;
  }

  return css`
    width: 40px;
    height: 40px;
    font-size: 18px;
  `;
};
const getTitleFontSize = (size: "xs" | "sm" | "md" | "lg") => {
  const sizes = {
    xs: "0.875rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.15rem",
  };

  return sizes[size];
};

const getSubTitleFontSize = (size: "xs" | "sm" | "md" | "lg") => {
  const sizes = {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "0.875rem",
    lg: "1rem",
  };

  return sizes[size];
};
const getStyleByVariant = (
  variant: "info" | "waiting" | "warning" | "error",
  theme: ProcessedTheme,
  isDarkTheme?: boolean
) => {
  const { palette, panelEmptyState } = theme;
  const paletteVariant = variant === "waiting" ? "warning" : variant;
  return css`
    background: ${panelEmptyState?.panel?.indicator?.[variant]?.background ||
    `linear-gradient(180deg,${palette[paletteVariant].main} 48%,${palette[paletteVariant].light} 100%)`};
    box-shadow: ${isDarkTheme
      ? "none"
      : panelEmptyState?.panel?.indicator?.[variant]?.boxShadow ||
        `0px 0px 20px 2px ${fade(palette[paletteVariant].light, 0.7)}`};
    color: ${panelEmptyState?.panel?.indicator?.[variant]?.color ||
    palette.common.white};
  `;
};

const styles = (
  pfx: string,
  variant: "info" | "waiting" | "warning" | "error",
  size: "xs" | "sm" | "md" | "lg"
): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 1;

    &.${pfx}-panel-empty-state-horizontal {
      flex-direction: row;
      .${pfx}-indicator-wrapper {
        margin-bottom: 0;
        margin-right: 12px;
      }
      .${pfx}-panel-empty-state-title {
        margin-bottom: 8px;
      }
      .${pfx}-panel-empty-state-subtitle {
        text-align: center;
      }
    }

    .${pfx}-indicator-wrapper {
      margin-bottom: 16px;
    }
    .${pfx}-indicator {
      ${getStyleByVariant(variant, theme, isDarkTheme)};
      ${getIndicatorSize(size)};
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      > svg {
        width: 60%;
        height: 60%;
      }
    }

    .${pfx}-panel-empty-state-text-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .${pfx}-panel-empty-state-title {
      margin: 0;
      margin-bottom: 4px;
      text-align: center;
      color: ${theme.emptyState?.panel?.title?.color ||
      theme.palette.text.primary};
      font-size: ${theme.emptyState?.panel?.title?.fontSize ||
      getTitleFontSize(size)};
      font-weight: ${theme.emptyState?.panel?.title?.fontWeight || 500};
    }

    .${pfx}-panel-empty-state-subtitle {
      margin: 0;
      text-align: center;
      color: ${theme.emptyState?.panel?.subtitle?.color ||
      theme.palette.text.secondary};
      font-size: ${theme.emptyState?.panel?.subtitle?.fontSize ||
      getSubTitleFontSize(size)};
      font-weight: ${theme.emptyState?.panel?.subtitle?.fontWeight || 400};
    }
  `;

export default styles;

import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../../core";
import getSelectThemeWithDefaults from "../../utils/getThemeWithDefaultValues";

const defaultStyles = (pfx: string): ThemeStyleFn => activeTheme => {
  const themeWithDefault = getSelectThemeWithDefaults(
    activeTheme,
    "valid"
  )("default");

  return css`
    padding: ${activeTheme.theme.spacing["2x"]};
    user-select: none;
    margin: 0 ${activeTheme.theme.spacing["2x"]};
    display: flex;
    flex-direction: column;

    .${pfx}-select-header-title {
      font-size: 16px;
      font-weight: 600;
      color: ${themeWithDefault.list?.header?.title?.color};
    }

    .${pfx}-select-header-subtitle {
      padding-top: ${activeTheme.theme.spacing.base};
      font-size: 14px;
      color: ${themeWithDefault.list?.header?.subtitle?.color};
    }
  `;
};

export default defaultStyles;

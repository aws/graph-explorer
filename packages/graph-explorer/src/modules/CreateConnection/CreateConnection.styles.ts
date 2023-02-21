import { css } from "@emotion/css";
import { ActiveThemeType, ProcessedTheme } from "../../core";

const defaultStyles = (pfx: string) => ({
  theme,
}: ActiveThemeType<ProcessedTheme>) =>
  css`
    .${pfx}-content {
      background: ${theme.palette.background.default};
    }

    .${pfx}-top-bar-title {
      font-weight: bold;
    }

    .${pfx}-input-url {
      margin-top: ${theme.spacing["4x"]};
    }

    .${pfx}-configuration-form {
      width: 100%;
      padding: ${theme.spacing["4x"]} ${theme.spacing.base};
      background: ${theme.palette.background.default};
    }

    .${pfx}-actions {
      display: flex;
      justify-content: space-between;
      padding-top: ${theme.spacing["4x"]};
      border-top: solid 1px ${theme.palette.divider};
    }
  `;

export default defaultStyles;

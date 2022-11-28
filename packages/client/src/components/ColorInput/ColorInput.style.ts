import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx?: string): ThemeStyleFn => () =>
  css`
    .${pfx}-color-input {
      min-width: 105px;
      position: relative;
      .${pfx}-input {
        margin: 0px;
        .${pfx}-end-adornment {
          height: 100%;
        }
      }
    }
  `;

export const colorPickerStyle = (): ThemeStyleFn => ({ theme }) =>
  css`
    background: ${theme.palette.background.default};
    padding: ${theme.spacing["2x"]};
    box-shadow: ${theme.shadow.lg};
    border-radius: ${theme.shape.borderRadius};
  `;

export default defaultStyles;

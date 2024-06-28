import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles: ThemeStyleFn = () => css`
  .color-input {
    min-width: 105px;
    position: relative;
    .input {
      margin: 0px;
      .end-adornment {
        height: 100%;
      }
    }
  }
`;

export const colorPickerStyle: ThemeStyleFn = ({ theme }) => css`
  background: ${theme.palette.background.default};
  padding: ${theme.spacing["2x"]};
  box-shadow: ${theme.shadow.lg};
  border-radius: ${theme.shape.borderRadius};
`;

export default defaultStyles;

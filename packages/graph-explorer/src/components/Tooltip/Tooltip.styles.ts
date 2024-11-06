import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

export const tooltipStyles: ThemeStyleFn = ({ theme }) => css`
  background-color: rgb(78, 78, 78);
  color: #eee;
  border-color: transparent;
  border-width: 0;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
  border-radius: ${theme.shape.borderRadius};
  padding: ${theme.spacing.base} ${theme.spacing["2x"]};
  z-index: 999999;
`;

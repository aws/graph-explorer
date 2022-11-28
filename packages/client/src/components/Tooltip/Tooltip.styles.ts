import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import type { TooltipTheme } from "./Tooltip.model";

export const tooltipStyles: ThemeStyleFn<TooltipTheme> = ({ theme }) => css`
  background-color: ${theme?.tooltip?.background || "rgb(78, 78, 78)"};
  color: ${theme?.tooltip?.color || "#eee"};
  border-color: ${theme?.tooltip?.border?.color || "transparent"};
  border-width: ${theme?.tooltip?.border?.width || "0"};
  box-shadow: ${theme?.tooltip?.shadow || "0 2px 4px 0 rgba(0, 0, 0, 0.3)"};
  border-radius: ${theme?.tooltip?.border?.radius || theme.shape.borderRadius};
  padding: ${theme?.tooltip?.padding || theme.spacing.base};
  z-index: 999999;
`;

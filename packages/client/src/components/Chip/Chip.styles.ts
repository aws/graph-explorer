import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";

const heightMap = {
  xs: "18px",
  sm: "22px",
  md: "26px",
  lg: "30px",
};

const defaultStyles = (
  variant: "info" | "success" | "error" | "warning",
  background?: string,
  color?: string,
  size?: "xs" | "sm" | "md" | "lg",
  pfx?: string
): ThemeStyleFn => ({ theme }) =>
  css`
    display: inline-flex;
    border-radius: 16px;
    align-items: center;
    padding: ${theme.spacing.base || "4px"};
    height: ${heightMap[size || "md"]};
    font-size: ${theme.typography.sizes?.[
      size === "md" ? "base" : size || "sm"
    ]};
    color: ${color
      ? color
      : theme.chip?.variants?.[variant]?.text || theme.palette.common.white};
    background-color: ${background
      ? background
      : theme.chip?.variants?.[variant]?.background ||
        theme.palette[variant === "info" ? "primary" : variant].main};

    &.${pfx}-chip-clickable {
      cursor: pointer;
      &:hover {
        color: ${color
          ? color
          : theme.chip?.variants?.[variant]?.clickable?.hover?.text ||
            theme.palette.common.white};
        background-color: ${background
          ? background
          : theme.chip?.variants?.[variant]?.clickable?.hover?.background ||
            fade(
              theme.palette[variant === "info" ? "primary" : variant].main,
              0.15
            )};
      }
    }
    .${pfx}-chip-label {
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 ${theme.spacing.base};
      font-weight: ${theme.typography.weight.base};
      white-space: nowrap;
    }

    .${pfx}-icon-delete {
      padding: 0;
      color: ${fade(theme.palette.grey[600], 0.7)};

      &:hover {
        transition: 0.3s;
        color: ${theme.palette.grey[600]};
      }
    }

    > svg {
      font-size: ${theme.spacing["5x"]};
    }
  `;

export default defaultStyles;

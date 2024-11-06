import { css } from "@emotion/css";
import { ActiveThemeType, fade } from "@/core";

export const navArrowsStyles = ({ theme }: ActiveThemeType) => css`
  color: ${theme.palette.primary.main};
  font-size: 18px;
  height: 100%;
  display: flex;
  align-items: center;
  background-color: ${fade(theme.palette.primary.main, 0.1)};
  border-radius: ${theme.shape.borderRadius};
  box-shadow: ${theme.shadow.base};
  cursor: pointer;
  &:hover {
    background-color: ${fade(theme.palette.primary.main, 0.3)};
  }
  &.swiper-button-lock {
    color: ${theme.palette.text.disabled};
    background-color: ${fade(theme.palette.text.disabled, 0.05)};
    cursor: default;
    &:hover {
      background-color: ${fade(theme.palette.text.disabled, 0.05)};
    }
  }

  &.swiper-button-disabled {
    color: ${theme.palette.text.disabled};
    background-color: ${fade(theme.palette.text.disabled, 0.05)};
    cursor: default;
    &:hover {
      background-color: ${fade(theme.palette.text.disabled, 0.05)};
    }
  }
`;

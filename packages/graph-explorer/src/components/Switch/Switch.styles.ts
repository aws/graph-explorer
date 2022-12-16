import { css } from "@emotion/css";

import { fade, ThemeStyleFn } from "../../core";
import type { SwitchTheme } from "./Switch.model";

export const defaultSwitchStyles = (
  pfx: string,
  width: number
): ThemeStyleFn<SwitchTheme> => ({ theme }) => {
  const { switchTheme, palette } = theme;
  const trackWidth = width - 10;

  return css`
    margin-right: 4px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px 5px;
    &.${pfx}-switch-on {
      .${pfx}-switch-track {
        background: ${switchTheme?.on?.background || palette.primary.main};
        justify-content: flex-end;
        .${pfx}-switch-handle {
          transform: translateX(calc(${trackWidth - 2}px - 100% - 2px));
          color: ${switchTheme?.on?.iconColor || palette.primary.main};
          background-color: ${switchTheme?.on?.handleBackground ||
          palette.common.white};
        }
      }
    }

    &.${pfx}-switch-off {
      .${pfx}-switch-track {
        justify-content: flex-start;
        background-color: ${switchTheme?.off?.background ||
        palette.grey["500"]};
        .${pfx}-switch-handle {
          color: ${switchTheme?.off?.iconColor || palette.grey["500"]};
          background-color: ${switchTheme?.off?.handleBackground ||
          palette.common.white};
        }
      }
    }
    &.${pfx}-switch-focused {
      .${pfx}-switch-track {
        outline: 2px solid
          ${fade(switchTheme?.focus?.outlineColor || palette.primary.main, 0.5)};
      }
    }

    &.${pfx}-switch-sm {
      .${pfx}-switch-track {
        .${pfx}-switch-handle {
          width: 36%;
          svg {
            font-size: 9px;
          }
        }
      }
    }

    &.${pfx}-switch-lg {
      .${pfx}-switch-track {
        .${pfx}-switch-handle {
          width: 50%;
          svg {
            font-size: 15px;
          }
        }
      }
    }
    .${pfx}-switch-track {
      cursor: pointer;
      height: 100%;
      width: 100%;
      padding: 2px 0;
      border-radius: 10px;
      position: relative;
      display: flex;
      align-items: center;
      .${pfx}-switch-handle {
        width: 46%;
        left: 0;
        height: calc(100% - 4px);
        position: absolute;
        border-radius: 50%;
        margin-left: 2px;
        margin-right: 2px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all ease 300ms;

        > svg {
          font-size: 12px;
        }
      }
    }

    &.${pfx}-switch-disabled {
      filter: opacity(
        ${switchTheme?.disabledOpacity || theme.forms?.disabledOpacity || "50%"}
      );
      > .focus {
        color: ${switchTheme?.on?.background || palette.primary.main};
      }
    }
  `;
};

export const defaultSwitchLabelStyles = (
  pfx: string
): ThemeStyleFn<SwitchTheme> => ({ theme }) => {
  const {
    switchTheme,
    palette: { text },
    forms,
  } = theme;

  return css`
    display: flex;
    align-items: center;
    cursor: pointer;
    color: ${text.primary};
    font-size: ${theme.typography.sizes?.sm};

    &.${pfx}-switch-label-disabled {
      cursor: auto;
      pointer-events: none;
      filter: opacity(
        ${switchTheme?.disabledOpacity || forms?.disabledOpacity || "50%"}
      );
    }

    &.${pfx}-switch-label-readonly {
      cursor: auto;
      pointer-events: none;
    }
  `;
};

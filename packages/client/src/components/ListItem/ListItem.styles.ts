import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import type { ListItemTheme } from "./ListItem.model";

const defaultStyles: (pfx: string) => ThemeStyleFn<ListItemTheme> = pfx => ({
  theme,
  isDarkTheme,
}) =>
  css`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;

    &.${pfx}-clickable {
      cursor: pointer;
      transition: color 250ms ease, background 250ms ease;
      background: ${theme.listItem?.clickable?.background || isDarkTheme
        ? theme.palette.background.secondary
        : theme.palette.background.default};
      color: ${theme.listItem?.clickable?.text || theme.palette.text.primary};

      &.${pfx}-disabled {
        background: ${theme.listItem?.clickable?.disabled?.background};
        color: ${theme.listItem?.clickable?.disabled?.text ||
        theme.palette.text.disabled};
        pointer-events: none;

        .${pfx}-primary {
          background: ${theme.listItem?.clickable?.disabled?.background};
          color: ${theme.listItem?.clickable?.disabled?.text ||
          theme.palette.text.disabled};
          pointer-events: none;
        }
      }

      :hover {
        background: ${theme.listItem?.clickable?.hover?.background ||
        theme.palette.background.contrast};
        color: ${theme.listItem?.clickable?.hover?.text ||
        theme.palette.text.primary};
      }
    }

    .${pfx}-start-adornment, .${pfx}-end-adornment {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin: 0 ${theme.spacing["2x"]};
      min-width: 32px;
    }

    .${pfx}-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 48px;
      color: ${theme.listItem?.primary?.text || theme.palette.text.primary};
      background: ${theme.listItem?.primary?.background};
    }

    .${pfx}-primary {
      font-weight: normal;
      color: ${theme.listItem?.primary?.text || theme.palette.text.primary};
      background: ${theme.listItem?.primary?.background};
    }

    .${pfx}-secondary {
      font-size: 0.8rem;
      color: ${theme.listItem?.secondary?.text || theme.palette.text.secondary};
      background: ${theme.listItem?.secondary?.background};
    }
  `;

export default defaultStyles;

import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";
import { SidebarTheme } from "./Sidebar.model";

const defaultStyles = (pfx: string): ThemeStyleFn<SidebarTheme> => ({
  theme,
}) => {
  const { sidebar, spacing, palette } = theme;
  return css`
    &.${pfx}-sidebar {
      padding: ${spacing.base};
      height: 100%;
      display: flex;
      align-items: center;
      flex-direction: column;
      background-color: ${fade(palette.primary.light, 0.2)};
      color: ${palette.text.primary};

      .${pfx}-divider {
        width: 60%;
        margin: ${spacing["2x"]} auto;
        height: 1px;
        background: ${palette.divider};
      }

        &.${pfx}-active {
          color: ${palette.primary.main};
        }
      }

      .${pfx}-sidebar-button {
        color: ${sidebar?.button?.color || palette.primary.dark};
        background-color: ${
          sidebar?.button?.background || fade(palette.primary.main, 0.2)
        };
        margin: ${spacing.base};
        padding: 0;

        &.${pfx}-active {
          color: ${sidebar?.button?.active?.color || palette.primary.dark};
          background-color: ${
            sidebar?.button?.active?.background ||
            fade(palette.primary.main, 0.6)
          };
        }
      }
    }
    &.${pfx}-left-sidebar {
      padding: ${spacing.base};
      height: 100%;
      display: flex;
      align-items: center;
      flex-direction: column;
      background-color: ${fade(palette.apotheca.light, 0.2)};
      color: ${palette.text.primary};

      .${pfx}-divider {
        width: 60%;
        margin: ${spacing["2x"]} auto;
        height: 1px;
        background: ${palette.divider};
      }

        &.${pfx}-active {
          color: ${palette.primary.main};
        }
      }

      .${pfx}-sidebar-button {
        color: ${sidebar?.button?.color || palette.primary.dark};
        background-color: ${
          sidebar?.button?.background || fade(palette.primary.main, 0.2)
        };
        margin: ${spacing.base};
        padding: 0;

        &.${pfx}-active {
          color: ${sidebar?.button?.active?.color || palette.primary.dark};
          background-color: ${
            sidebar?.button?.active?.background ||
            fade(palette.primary.main, 0.6)
          };
        }
      }
    }
  `;
};

export default defaultStyles;

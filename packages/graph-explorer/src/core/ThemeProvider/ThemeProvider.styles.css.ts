import { css } from "@emotion/css";

const defaultStyles = () => css`
  overflow: hidden;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--colors-background);
  color: var(--colors-foreground);
  font-size: 14px;

  #dashboard-full-screen {
    z-index: 99999990;
  }

  #layers {
    z-index: 99999999;
  }

  * {
    box-sizing: border-box;
  }
`;

export default defaultStyles;

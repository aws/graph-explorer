import { css } from "@emotion/css";

const defaultStyles = () => css`
  overflow: hidden;
  margin: 0;
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

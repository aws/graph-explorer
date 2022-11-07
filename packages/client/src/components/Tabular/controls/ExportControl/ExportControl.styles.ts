import { css } from "@emotion/css";

const defaultStyles = (pfx: string) => css`
  z-index: 1000;

  .${pfx}-card {
    border-radius: 2px;
    margin: 0 4px;
    padding: 16px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .${pfx}-title {
    padding: 8px 0;
    font-size: 0.75rem;
  }

  .${pfx}-columns-container {
    width: 90%;
    min-width: 200px;
    min-height: 32px;
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    border: solid 1px var(--palette-border);
    border-radius: 4px;
  }

  .${pfx}-actions {
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
  }
`;

export default defaultStyles;

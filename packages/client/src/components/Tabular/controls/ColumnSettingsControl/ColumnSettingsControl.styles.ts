import { css } from "@emotion/css";

const defaultStyles = (pfx: string) => css`
  z-index: 1000;

  .${pfx}-card {
    border-radius: 2px;
    margin: 0 4px;
    padding: 8px 4px 0 8px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .${pfx}-columns-list {
    user-select: none;
  }

  .${pfx}-column-item {
    display: flex;
    align-items: center;
    padding: 8px;

    &:not(:last-child) {
      border-bottom: solid 1px var(--palette-border);
    }
  }

  .${pfx}-action-item {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    border-top: solid 1px var(--palette-border);
  }

  .${pfx}-column-item-switch {
    flex-grow: 1;
  }

  .${pfx}-column-item-label {
    font-size: 0.875rem;
    margin-right: var(--spacing-2x, 8px);
  }

  .${pfx}-column-item-drag-handler {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0.25;
    width: 24px;
    cursor: move;
  }
`;

export default defaultStyles;

import { css } from "@emotion/css";

const defaultStyles = () => css`
  z-index: 1000;

  .card {
    border-radius: 2px;
    margin: 0 4px;
    padding: 8px 4px 0 8px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .columns-list {
    user-select: none;
  }

  .column-item {
    display: flex;
    align-items: center;
    padding: 8px;

    &:not(:last-child) {
      border-bottom: solid 1px var(--palette-border);
    }
  }

  .action-item {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    border-top: solid 1px var(--palette-border);
  }

  .column-item-switch {
    flex-grow: 1;
  }

  .column-item-label {
    font-size: 0.875rem;
    margin-right: var(--spacing-2x, 8px);
  }

  .column-item-drag-handler {
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

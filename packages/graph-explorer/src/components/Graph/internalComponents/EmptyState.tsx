import { css } from "@emotion/css";
import { SearchIcon } from "../../icons";
import { PanelEmptyState } from "../../PanelEmptyState";

const EmptyState = () => {
  return (
    <div className={styles()}>
      <PanelEmptyState
        icon={<SearchIcon />}
        title="To get started, click into the search bar to browse graph data. Click + to add to Graph View."
        size="md"
      />
    </div>
  );
};

function styles() {
  return css`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: #4b8fe2;
    font-size: 1rem;
    user-select: none;
    pointer-events: none;
    .label {
      padding-top: 16px;
    }
    background-color: #f0f4f9;
  `;
}

export default EmptyState;

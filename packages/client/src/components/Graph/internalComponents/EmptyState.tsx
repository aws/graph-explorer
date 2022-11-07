import { css } from "@emotion/css";
import { PanelEmptyState } from "../../EmptyStates";
import NoGraphDataIcon from "../../icons/NoGraphDataIcon";

const EmptyState = () => {
  return (
    <div className={styles()}>
      <PanelEmptyState
        icon={<NoGraphDataIcon />}
        title="To get started, select an entity from the search"
        size="lg"
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

import { css } from "@emotion/css";
import { SearchIcon } from "../../icons";
import { PanelEmptyState } from "../../PanelEmptyState";

const EmptyState = () => {
  return (
    <div className={styles()}>
      <PanelEmptyState
        icon={<SearchIcon />}
<<<<<<< HEAD
<<<<<<< HEAD
        title="To get started, click into the search bar to browse graph data. Click + to add to Graph View."
=======
        title="To get started, search for an entity"
>>>>>>> beca7aa (12/09 12:22PM push)
=======
        title="To get started, click into the search bar to browse graph data. Click + to add to Graph View."
>>>>>>> d9d360e (12/14 7:50PM push (Address some requested label changes, adding https to graph explorer url, adding format to sparql endpoint))
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

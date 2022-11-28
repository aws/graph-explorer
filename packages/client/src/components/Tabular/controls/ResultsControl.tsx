import { css } from "@emotion/css";

import { useTabularControl } from "../TabularControlsProvider";

const defaultStyles = () => css`
  flex-grow: 1;
`;

export const ResultsControl = () => {
  const {
    instance: { rows, data },
  } = useTabularControl();
  return (
    <div className={defaultStyles()}>
      {rows.length} results of a total of {data.length} items
    </div>
  );
};

export default ResultsControl;

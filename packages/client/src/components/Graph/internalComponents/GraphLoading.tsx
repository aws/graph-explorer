import { css, cx } from "@emotion/css";
import LoadingSpinner from "../../LoadingSpinner";

const loadingStyles = css`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
`;

interface GraphLoadingProps {
  className?: string;
}

const GraphLoading = ({ className }: GraphLoadingProps) => {
  return (
    <div className={cx(loadingStyles, className)}>
      <LoadingSpinner style={{ width: "3rem", height: "3rem" }} />
    </div>
  );
};

export default GraphLoading;

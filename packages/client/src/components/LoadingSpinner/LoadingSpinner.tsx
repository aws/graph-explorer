import { cx } from "@emotion/css";
import type { CSSProperties, ReactNode } from "react";
import { useWithTheme } from "../../core";
import { LoaderIcon } from "../icons";

import defaultStyles from "./LoadingSpinner.styles";

export type LoadingSpinnerProps = {
  style?: CSSProperties;
  color?: string;
  className?: string;
  loadingIcon?: ReactNode;
};

export const LoadingSpinner = ({
  style,
  color,
  className,
  loadingIcon,
}: LoadingSpinnerProps) => {
  const themedStyle = useWithTheme();
  return (
    <div
      className={cx(themedStyle(defaultStyles(color)), className)}
      style={style}
    >
      <div>{loadingIcon || <LoaderIcon />}</div>
    </div>
  );
};

export default LoadingSpinner;

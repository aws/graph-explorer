import { cx } from "@emotion/css";
import type { ReactNode } from "react";
import { useWithTheme } from "../../core";
import { LoaderIcon } from "../icons";

import defaultStyles from "./LoadingSpinner.styles";

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  loadingIcon?: ReactNode;
}

export const LoadingSpinner = ({
  color,
  className,
  loadingIcon,
  ...props
}: LoadingSpinnerProps) => {
  const themedStyle = useWithTheme();
  return (
    <div
      className={cx(themedStyle(defaultStyles(color)), className)}
      {...props}
    >
      <div>{loadingIcon || <LoaderIcon />}</div>
    </div>
  );
};

export default LoadingSpinner;

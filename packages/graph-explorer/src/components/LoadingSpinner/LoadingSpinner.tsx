import { cn } from "@/utils";
import type { ReactNode } from "react";
import { useWithTheme } from "@/core";
import { LoaderIcon } from "@/components/icons";

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
      className={cn(
        themedStyle(defaultStyles(color)),
        "animate-spin",
        className
      )}
      {...props}
    >
      <div>{loadingIcon || <LoaderIcon />}</div>
    </div>
  );
};

export default LoadingSpinner;

import { cn } from "@/utils";
import type { ReactNode } from "react";
import { useWithTheme } from "@/core";
import { LoaderIcon } from "@/components/icons";

import defaultStyles from "./LoadingSpinner.styles";
import { IconBaseProps } from "../icons/IconBase";

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

/** Basic spinner */
export function Spinner({ className, ...props }: IconBaseProps) {
  return <LoaderIcon className={cn(className, "animate-spin")} {...props} />;
}

export default LoadingSpinner;

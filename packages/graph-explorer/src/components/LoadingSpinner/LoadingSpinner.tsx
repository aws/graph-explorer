import { cn } from "@/utils";
import type { PropsWithChildren, ReactNode } from "react";
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

interface SpinnerProps extends PropsWithChildren<IconBaseProps> {
  loading?: boolean;
}

/** Basic spinner */
export function Spinner({
  className,
  loading,
  children,
  ...props
}: SpinnerProps) {
  if (!children) {
    return <LoaderIcon className={cn(className, "animate-spin")} {...props} />;
  }

  return (
    <span className="stack">
      <LoaderIcon
        className={cn(
          "invisible",
          loading && "visible animate-spin",
          className
        )}
        {...props}
      />
      <span className={cn("visible", loading && "invisible")}>{children}</span>
    </span>
  );
}

export default LoadingSpinner;

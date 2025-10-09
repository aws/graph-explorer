import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import { LoaderIcon } from "@/components/icons";
import { type IconBaseProps } from "./icons/IconBase";

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
          "invisible self-center justify-self-center",
          loading && "visible animate-spin",
          className
        )}
        {...props}
      />
      <span className={cn("visible", loading && "invisible")}>{children}</span>
    </span>
  );
}

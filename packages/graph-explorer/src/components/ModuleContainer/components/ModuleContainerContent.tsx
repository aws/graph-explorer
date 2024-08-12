import { cx } from "@emotion/css";
import { ComponentProps } from "react";

export default function ModuleContainerContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "bg-background-default h-full w-full grow overflow-auto",
        className
      )}
      {...props}
    />
  );
}

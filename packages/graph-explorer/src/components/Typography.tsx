import { cx } from "@emotion/css";
import { ComponentProps } from "react";

export function PageHeading({ className, ...props }: ComponentProps<"div">) {
  return (
    <h1
      className={cx("font-extraBold text-text-primary text-4xl", className)}
      {...props}
    />
  );
}

export function PageSubheading({ className, ...props }: ComponentProps<"div">) {
  return (
    <h1
      className={cx("text-text-secondary text-2xl font-bold", className)}
      {...props}
    />
  );
}

export function Paragraph({ className, ...props }: ComponentProps<"div">) {
  return (
    <h1
      className={cx(
        "font-base text-text-secondary text-text-secondary-dark my-1 text-lg",
        className
      )}
      {...props}
    />
  );
}

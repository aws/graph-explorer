import { cx } from "@emotion/css";
import { ComponentProps } from "react";

export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cx(
        "font-extraBold text-text-primary mb-2 text-4xl leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cx(
        "text-text-secondary text-xl font-bold leading-loose",
        className
      )}
      {...props}
    />
  );
}

export function Paragraph({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cx(
        "text-text-secondary text-text-secondary-dark my-2 text-lg font-light",
        className
      )}
      {...props}
    />
  );
}

import { cn } from "@/utils";
import type { ComponentProps } from "react";

export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "text-4xl font-extraBold leading-snug text-text-primary",
        className
      )}
      {...props}
    />
  );
}

export function Paragraph({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "my-2 text-pretty text-base font-light text-text-secondary",
        className
      )}
      {...props}
    />
  );
}

export function ImportantBlock({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border-l-4 border-info-main bg-info-light/20 px-4 py-2 text-info-dark",
        className
      )}
      {...props}
    >
      <div className="font-extraBold uppercase">Important</div>
      {children}
    </div>
  );
}

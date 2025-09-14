import { cn } from "@/utils";
import { type ComponentProps } from "react";

export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "font-extraBold text-text-primary text-4xl leading-snug",
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
        "text-text-secondary my-2 text-pretty text-base font-light",
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
        "border-info-main bg-info-light/20 text-info-dark rounded-md border-l-4 px-4 py-2",
        className
      )}
      {...props}
    >
      <div className="font-extraBold uppercase">Important</div>
      {children}
    </div>
  );
}

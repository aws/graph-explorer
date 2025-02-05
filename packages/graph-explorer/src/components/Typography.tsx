import { cn } from "@/utils";
import { ComponentProps } from "react";

export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
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
      className={cn(
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
      className={cn(
        "text-text-secondary text-text-secondary-dark my-2 text-lg font-light",
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

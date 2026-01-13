import type { ComponentProps } from "react";

import { CircleAlertIcon } from "lucide-react";

import { cn } from "@/utils";

import { Alert, AlertDescription, AlertTitle } from "./Alert";

export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "font-extraBold text-text-primary text-4xl leading-snug",
        className,
      )}
      {...props}
    />
  );
}

export function Paragraph({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-text-secondary my-2 text-base font-light text-pretty",
        className,
      )}
      {...props}
    />
  );
}

export function ImportantBlock({
  children,
  ...props
}: ComponentProps<typeof Alert>) {
  return (
    <Alert variant="primary" {...props}>
      <CircleAlertIcon />
      <AlertTitle>Important</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

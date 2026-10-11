import React from "react";

import { cn } from "@/utils";

function InfoBar({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-start gap-6 border-b px-3 py-6 @sm:flex-row @sm:gap-9",
        className,
      )}
      {...props}
    />
  );
}

function InfoItemIcon({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "bg-primary-subtle text-primary hidden aspect-square h-12 items-center justify-center rounded-lg @lg:flex [&_svg]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function InfoItem({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn("flex flex-row items-start gap-4", className)}
      {...props}
    />
  );
}

function InfoItemContent({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return <div className={cn("", className)} {...props} />;
}

function InfoItemLabel({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-muted-foreground text-sm text-balance break-words",
        className,
      )}
      {...props}
    />
  );
}

function InfoItemValue({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-foreground inline-flex items-center gap-1 text-base font-medium text-balance break-words",
        className,
      )}
      {...props}
    />
  );
}

export {
  InfoBar,
  InfoItem,
  InfoItemContent,
  InfoItemIcon,
  InfoItemLabel,
  InfoItemValue,
};

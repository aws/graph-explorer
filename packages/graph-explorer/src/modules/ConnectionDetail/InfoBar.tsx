import { cn } from "@/utils";
import React from "react";

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
        "bg-secondary-subtle text-primary-main hidden aspect-square h-12 items-center justify-center rounded-lg @lg:flex [&_svg]:size-6",
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
        "text-text-secondary text-sm text-balance break-words",
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
        "text-text-primary inline-flex items-center gap-1 text-base font-medium text-balance break-words",
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

import { cn } from "@/utils";
import React from "react";

const InfoBar = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex w-full flex-col items-start gap-6 border-b px-3 py-6 @sm:flex-row @sm:gap-9",
      className
    )}
    {...props}
  />
));

const InfoItemIcon = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-background-secondary-subtle hidden aspect-square h-12 items-center justify-center rounded-lg text-primary-main @lg:flex [&_svg]:size-6",
      className
    )}
    {...props}
  />
));

const InfoItem = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row items-start gap-4", className)}
    {...props}
  />
));

const InfoItemContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

const InfoItemLabel = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-balance break-words text-sm text-text-secondary",
      className
    )}
    {...props}
  />
));

const InfoItemValue = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 text-balance break-words text-base font-medium text-text-primary",
      className
    )}
    {...props}
  />
));

export {
  InfoBar,
  InfoItem,
  InfoItemContent,
  InfoItemIcon,
  InfoItemLabel,
  InfoItemValue,
};

import type { ComponentProps } from "react";

import { cn } from "@/utils";

/** Settings page wrapper; constrains width and spaces out its `Group` sections */
export function SettingsPage({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("max-w-[80ch] space-y-9", className)} {...props} />;
}

export function SettingsPageHeader({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="settings-page-header"
      className={cn(
        "group/settings-page-header grid grid-cols-[auto_1fr]",
        className,
      )}
      {...props}
    />
  );
}

export function SettingsPageIcon({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="settings-page-icon"
      className={cn(
        "bg-primary-subtle text-primary-foreground col-start-1 row-span-2 me-4 grid size-12 place-items-center items-center justify-center rounded-lg [&_svg]:size-6",
        className,
      )}
      {...props}
    />
  );
}

export function SettingsPageTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<"h1">) {
  return (
    <h1
      data-slot="settings-page-title"
      className={cn(
        "text-foreground col-start-2 text-2xl font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SettingsPageDescription({
  className,
  ...props
}: React.ComponentPropsWithRef<"p">) {
  return (
    <p
      data-slot="settings-page-description"
      className={cn(
        "text-muted-foreground col-start-2 text-base font-normal",
        className,
      )}
      {...props}
    />
  );
}

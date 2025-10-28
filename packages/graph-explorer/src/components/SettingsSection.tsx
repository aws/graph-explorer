import { cn } from "@/utils";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
} from "react";
import { Switch } from "./Switch";

/** Provides a default gap between section elements */
export function SettingsSection({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cn("max-w-paragraph space-y-6", className)}
      {...props}
    />
  );
}

export function SettingsSectionHeader({
  className,
  ...props
}: ComponentProps<"header">) {
  return <header className={cn("space-y-1", className)} {...props} />;
}

export function SettingsSectionTitle({
  className,
  ...props
}: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-xl font-bold leading-snug text-text-primary",
        className
      )}
      {...props}
    />
  );
}

export function SettingsSectionDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-base font-base leading-snug text-text-secondary",
        className
      )}
      {...props}
    />
  );
}

/** Contains a list of `SettingsSection` elements and provides a gap between them */
export function SettingsSectionContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-9", className)} {...props} />;
}

export function ToggleSetting({
  label,
  description,
  ...props
}: ComponentPropsWithoutRef<typeof Switch> & {
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={props.id}
      className="flex flex-row items-center justify-between space-x-4"
    >
      <div className="space-y-1">
        <p className="text-pretty text-base font-medium leading-none text-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
        {description ? (
          <p className="text-pretty text-sm font-base leading-normal text-text-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {description}
          </p>
        ) : null}
      </div>
      <Switch {...props} />
    </label>
  );
}

export function LabelledSetting({
  label,
  description,
  children,
}: PropsWithChildren<{
  label: string;
  description?: string;
}>) {
  return (
    <div className="flex flex-row items-center justify-between space-x-4">
      <div className="block cursor-pointer space-y-1">
        <p className="text-pretty text-base font-medium leading-none text-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
        {description ? (
          <p className="text-pretty text-sm font-base leading-normal text-text-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

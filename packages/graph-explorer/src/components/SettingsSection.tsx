import { cn } from "@/utils";
import {
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
        "text-text-primary text-xl font-bold leading-snug",
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
        "text-text-secondary font-base text-base leading-snug",
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
        <p className="text-text-primary text-pretty text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
        {description ? (
          <p className="text-text-secondary font-base text-pretty text-sm leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
        <p className="text-text-primary text-pretty text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
        {description ? (
          <p className="text-text-secondary font-base text-pretty text-sm leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

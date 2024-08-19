import { cx } from "@emotion/css";
import { ComponentProps } from "react";

/** Provides a default gap between section elements */
export function SettingsSection({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cx("flex flex-col gap-3", className)} {...props} />;
}

/** Contains a list of `SettingsSection` elements and provides a gap between them */
export function SettingsSectionContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cx("flex flex-col gap-6", className)} {...props} />;
}

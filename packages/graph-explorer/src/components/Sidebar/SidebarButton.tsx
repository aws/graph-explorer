import { cx } from "@emotion/css";
import type { ReactNode } from "react";
import { withClassNamePrefix } from "../../core";
import IconButton, { IconButtonProps } from "../IconButton";

export type NavItem = {
  icon: ReactNode;
  onPress(): void;
  tooltipText?: string;
};

export type SidebarButtonProps = {
  active?: boolean;
} & Omit<IconButtonProps, "variant" | "rounded" | "tooltipPlacement">;

const SidebarButton = ({
  classNamePrefix = "ft",
  className,
  active,
  ...props
}: SidebarButtonProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <IconButton
      tooltipPlacement={"left-center"}
      variant={"text"}
      rounded={true}
      classNamePrefix={classNamePrefix}
      className={cx(pfx("sidebar-button"), active && pfx("active"), className)}
      {...props}
    />
  );
};

export default SidebarButton;

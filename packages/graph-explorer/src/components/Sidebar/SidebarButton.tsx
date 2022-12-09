import { cx } from "@emotion/css";
import type { ReactNode } from "react";
import { withClassNamePrefix } from "../../core";
import IconButton from "../IconButton";

export type NavItem = {
  icon: ReactNode;
  onPress(): void;
  tooltipText?: string;
};

export type SidebarButtonProps = {
  tooltipText?: string;
  icon: ReactNode;
  onPress(): void;
  classNamePrefix?: string;
  className?: string;
  active?: boolean;
};

const SidebarButton = ({
  tooltipText,
  classNamePrefix = "ft",
  className,
  active,
  icon,
  onPress,
}: SidebarButtonProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <IconButton
      tooltipText={tooltipText}
      tooltipPlacement={"left-center"}
      variant={"text"}
      rounded={true}
      classNamePrefix={classNamePrefix}
      className={cx(
        pfx("sidebar-button"),
        {
          [pfx("active")]: active,
        },
        className
      )}
      icon={icon}
      onPress={onPress}
    />
  );
};

export default SidebarButton;

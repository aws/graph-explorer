import { cn } from "@/utils";
import type { ReactNode } from "react";
import IconButton, { IconButtonProps } from "../IconButton";

export type NavItem = {
  icon: ReactNode;
  onPress(): void;
  tooltipText?: string;
};

export type SidebarButtonProps = {
  active?: boolean;
} & Omit<IconButtonProps, "variant" | "rounded" | "tooltipPlacement">;

const SidebarButton = ({ className, active, ...props }: SidebarButtonProps) => {
  return (
    <IconButton
      tooltipPlacement={"left-center"}
      variant={"text"}
      rounded={true}
      className={cn("sidebar-button", active && "active", className)}
      {...props}
    />
  );
};

export default SidebarButton;

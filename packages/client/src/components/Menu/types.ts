import type { CSSProperties, MouseEvent, ReactNode } from "react";

export type BaseMenuItemDivider = {
  id: string;
  isDivider: true;
  className?: string;
  label?: never;
  startAdornment?: never;
  endAdornment?: never;
  onClick?: never;
  render?: never;
  submenu?: never;
  isDisabled?: never;
  isSelected?: never;
};

export type BaseMenuItem = {
  id: string;
  isDivider?: false;
  style?: CSSProperties;
  className?: string;
  label?: ReactNode;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  onClick?: (
    event: MouseEvent<HTMLDivElement>,
    id: string,
    closeCallback?: () => void
  ) => void;
  render?: ReactNode;
  submenu?: { title?: ReactNode; items: MenuItemDef[] };
  isDisabled?: boolean;
  isSelected?: boolean;
};

export type MenuItemDef = BaseMenuItem | BaseMenuItemDivider;

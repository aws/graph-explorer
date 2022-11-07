import { cx } from "@emotion/css";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { Placement } from "react-laag";
import { useHover } from "react-laag";
import { withClassNamePrefix } from "../../core";
import Button from "../Button";
import { DropdownIcon } from "../icons";
import ContextMenu, { MenuItemDef } from "../Menu";
import Tooltip, { TooltipProps } from "../Tooltip";
import type { UseLayerSides } from "../UseLayer";
import UseLayer, { UseLayerOverlay, UseLayerTrigger } from "../UseLayer";

export type ButtonMenuItemDef = MenuItemDef;
export type ButtonMenuProps = {
  items: ButtonMenuItemDef[];
  label?: ReactNode;
  size?: "small" | "base" | "large";
  ["aria-label"]?: string;
  className?: string;
  menuClassName?: string;
  classNamePrefix?: string;
  isDisabled?: boolean;
  variant?: "default" | "filled" | "text";
  hideCaret?: boolean;
  offset?: number;
  isOpen?: boolean;
  placement?: Placement;
  possiblePlacements?: Placement[];
  menuHeader?: ReactNode;
  openOnHover?: boolean;
  keepOpenOnSelect?: boolean;
  selectedKey?: string;
  tooltipText?: TooltipProps["text"];
  tooltipPlacement?: TooltipProps["placement"];
};

export type ButtonMenuRef = { close: () => void; open: () => void };
const DEFAULT_POSSIBLE_PLACEMENTS: Placement[] = ["right-start", "left-start"];

const ButtonMenu = (
  {
    items = [],
    hideCaret,
    className,
    classNamePrefix = "ft",
    isDisabled,
    label,
    placement,
    possiblePlacements = DEFAULT_POSSIBLE_PLACEMENTS,
    menuHeader,
    openOnHover,
    menuClassName,
    tooltipText,
    tooltipPlacement,
    ...props
  }: ButtonMenuProps,
  ref: ForwardedRef<ButtonMenuRef | null>
) => {
  const [open, setOpen] = useState<boolean>(false);
  const [parentLayerSide, setParentLayerSide] = useState<UseLayerSides>(
    "right"
  );
  const [isHovered, hoverProps] = useHover({
    delayEnter: 100,
    delayLeave: 100,
  });
  const pfx = withClassNamePrefix(classNamePrefix);
  useImperativeHandle(ref, () => ({
    close: () => setOpen(false),
    open: () => setOpen(true),
  }));

  const component = (
    <Button
      variant={props.variant}
      aria-label={props["aria-label"]}
      className={cx(pfx("button-menu"), {
        [pfx("button-menu-is-open")]: open,
      })}
      size={props.size}
      isDisabled={isDisabled}
      {...(openOnHover ? hoverProps : {})}
    >
      {label}
      {!hideCaret && (
        <DropdownIcon
          className={pfx("button-menu-dropdown-icon")}
          aria-hidden="true"
        />
      )}
    </Button>
  );

  return (
    <UseLayer
      isOpen={openOnHover ? isHovered : open}
      auto={true}
      triggerOffset={4}
      possiblePlacements={possiblePlacements}
      placement={placement}
      overflowContainer={true}
      className={className}
      classNamePrefix={classNamePrefix}
      onClose={() => setOpen(false)}
      onLayerSideChange={setParentLayerSide}
    >
      <UseLayerTrigger
        classNamePrefix={classNamePrefix}
        className={cx(pfx("submenu-parent"))}
      >
        <div
          onClickCapture={() => {
            if (!isDisabled) setOpen(!open);
          }}
        >
          {tooltipText ? (
            <Tooltip
              text={tooltipText}
              placement={tooltipPlacement}
              delayEnter={400}
            >
              <span>{component}</span>
            </Tooltip>
          ) : (
            component
          )}
        </div>
      </UseLayerTrigger>
      <UseLayerOverlay classNamePrefix={classNamePrefix}>
        <ContextMenu
          items={items}
          className={menuClassName}
          parentLayerSide={parentLayerSide}
          classNamePrefix={classNamePrefix}
          title={menuHeader}
        />
      </UseLayerOverlay>
    </UseLayer>
  );
};

export default forwardRef<ButtonMenuRef | null, ButtonMenuProps>(ButtonMenu);

import { cx } from "@emotion/css";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import IconButton from "../IconButton";
import DoubleChevronRightAltIcon from "../icons/DoubleChevronRightAltIcon";
import defaultStyles from "./NavBar.style";
import type { NavBarBlockStructure } from "./NavBarBlock";
import NavBarBlock from "./NavBarBlock";

export interface NavBarProps {
  children?: ReactNode;
  items?: NavBarBlockStructure[];
  className?: string;
  classNamePrefix?: string;
  activeItems?: string[];
  onItemClick?(id: string, path: string | undefined): void;
  isOpen?: boolean;
  onOpenChange?(isOpen: boolean): void;
}

export const NavBar = (
  {
    children,
    items,
    className,
    classNamePrefix = "ft",
    activeItems,
    onItemClick,
    isOpen,
    onOpenChange,
  }: NavBarProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (items) {
      return items.map(item => {
        return (
          <NavBarBlock
            key={`${item.type}-${item.items?.map(i => i.id).join(",")}`}
            {...item}
            activeItems={activeItems}
            onItemClick={onItemClick}
          />
        );
      });
    }

    return null;
  };

  return (
    <div
      ref={ref}
      className={cx(
        styleWithTheme(defaultStyles("ft")),
        pfx("navigation-bar"),
        className
      )}
    >
      <nav
        className={cx(pfx("navbar"), {
          [pfx("navigation-bar-open")]: isOpen,
          [pfx("navigation-bar-closed")]: !isOpen,
        })}
      >
        <div className={pfx("hide-navigation-button")}>
          <IconButton
            size={"small"}
            tooltipText={"Hide Navigation"}
            variant={"text"}
            rounded={true}
            icon={<DoubleChevronRightAltIcon />}
            onPress={onOpenChange ? () => onOpenChange(!isOpen) : undefined}
            className={cx({
              [pfx("hide-navigation-icon")]: !!onOpenChange,
            })}
          />
        </div>
        <div className={pfx("navigation-content")}>{renderContent()}</div>
      </nav>
    </div>
  );
};

export default forwardRef<HTMLDivElement, NavBarProps>(NavBar);

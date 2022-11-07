import { cx } from "@emotion/css";
import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import ForwardIcon from "../icons/ForwardIcon";
import defaultStyles from "./NavBarItem.styles";

export interface NavBarItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "className"> {
  title: ReactNode;
  id: string;
  path?: string;
  icon?: ReactNode;
  defaultIcon?: ReactNode;
  arrowIcon?: ReactNode;
  collapsableEnabled?: boolean;
  children?: ReactNode;
  items?: NavBarItemProps[];
  className?: string;
  classNamePrefix?: string;
  initialOpen?: boolean;
  tabSize?: number;
  onClick?: () => void;
  render?: () => ReactNode;
  depthLevel?: number;
  activeItems?: string[];
  onItemClick?: (id: string, path: string | undefined) => void;
}

export const NavBarItem = ({
  title,
  id,
  path,
  icon,
  defaultIcon,
  arrowIcon,
  collapsableEnabled = true,
  children,
  items,
  className,
  classNamePrefix = "ft",
  initialOpen = false,
  tabSize = 20,
  onClick,
  render,
  depthLevel = 0,
  activeItems = [],
  onItemClick,
  ...props
}: PropsWithChildren<NavBarItemProps>) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const [open, setOpen] = useState(initialOpen);

  const handleOnClick = () => {
    setOpen(() => !open);
    if (onItemClick) onItemClick(id, path);
    if (onClick) onClick();
  };

  // render colapsed part
  const renderContent = () => {
    if (children) {
      return children;
    } else if (items) {
      return items.map((item, index) => {
        return (
          <NavBarItem
            {...item}
            key={index}
            activeItems={activeItems}
            depthLevel={(depthLevel || 0) + 1}
            defaultIcon={defaultIcon}
            onItemClick={onItemClick}
          />
        );
      });
    }
  };

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("navbar-item"),
        className
      )}
      {...props}
    >
      <div
        className={cx(
          pfx("handler"),
          pfx(collapsableEnabled ? "handler-enabled" : "handler-disabled"),
          {
            [pfx("is-open-and-active")]:
              collapsableEnabled &&
              open &&
              activeItems.includes(id) &&
              (children !== undefined || items !== undefined),
          },
          { [pfx("is-active")]: activeItems.includes(id) }
        )}
        onClick={handleOnClick}
        style={{ paddingLeft: `${depthLevel * tabSize}px` }}
      >
        {(icon || defaultIcon) && (
          <span className={pfx("icon")}>{icon ? icon : defaultIcon}</span>
        )}
        <span className={cx({ [pfx("title")]: !render })}>
          {render ? render() : title}
        </span>
        {collapsableEnabled && (children || items) ? (
          <span
            className={cx(pfx("arrow-icon"), {
              [pfx("arrow-icon-open")]: open,
            })}
          >
            {arrowIcon ? { arrowIcon } : <ForwardIcon fontSize={20} />}
          </span>
        ) : null}
      </div>

      {collapsableEnabled && open && (children || items) && renderContent()}
    </div>
  );
};

export default NavBarItem;

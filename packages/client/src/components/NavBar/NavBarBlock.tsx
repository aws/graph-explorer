import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactNode } from "react";
import { useMemo } from "react";
import { withClassNamePrefix } from "../../core";

import NavBarItem, { NavBarItemProps } from "./NavBarItem";

export type NavBarBlockStructure = {
  type: "header" | "footer" | "scrollable" | "sticky";
  className?: string;
  classNamePrefix?: string;
  tabSize?: number;
  items?: NavBarItemProps[];
  activeItems?: string[];
  onItemClick?: (id: string, path: string | undefined) => void;
};

export interface NavBarBlockProps extends NavBarBlockStructure {
  children?: ReactNode;
}

const NavBarBlock = ({
  type,
  className,
  classNamePrefix = "ft",
  items,
  children,
  tabSize = 20,
  activeItems,
  onItemClick,
}: PropsWithChildren<NavBarBlockProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);

  const renderContent = useMemo(() => {
    if (children) {
      return children;
    } else if (items) {
      return items.map((item, index) => {
        return (
          <div key={item.id}>
            <NavBarItem
              {...item}
              tabSize={(item.tabSize = tabSize)}
              activeItems={activeItems}
              onItemClick={onItemClick}
            />
            {type === "scrollable" && index < items.length - 1 && (
              <hr key={"sep" + index} className={pfx("separator")} />
            )}
          </div>
        );
      });
    }
    // No Items or items array is empty
    return <h1>Empty Component</h1>;
  }, [items, type, pfx, activeItems, onItemClick, children, tabSize]);

  return (
    <div className={cx(pfx(type), className)}>
      {renderContent}
      {type === "scrollable" && <hr className={pfx("separator")} />}
    </div>
  );
};

export default NavBarBlock;

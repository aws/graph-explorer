import { cx } from "@emotion/css";
import type { CSSProperties, ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import Card from "../Card";
import type { UseLayerSides } from "../UseLayer";
import MenuItem from "./components/MenuItem";
import styles from "./Menu.styles";
import type { MenuItemDef } from "./types";

export type MenuProps = {
  items: MenuItemDef[];
  title?: ReactNode;
  classNamePrefix?: string;
  className?: string;
  style?: CSSProperties;
  isDisabled?: boolean;
  parentLayerSide?: UseLayerSides;
};

const Menu = (
  {
    classNamePrefix = "ft",
    className,
    title,
    parentLayerSide,
    items,
    style,
  }: MenuProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const styleWithTheme = useWithTheme();

  return (
    <div
      ref={ref}
      style={style}
      className={cx(
        styleWithTheme(styles.rootStyles(classNamePrefix)),
        className
      )}
    >
      <Card className={pfx("card-root")} disablePadding>
        {!!title && (
          <>
            <div className={pfx("title")}>{title}</div>
            <div className={pfx("divider")} />
          </>
        )}
        {items.map(item => (
          <MenuItem
            key={item.id}
            item={item}
            parentLayerSide={parentLayerSide}
            className={item.className}
            classNamePrefix={classNamePrefix}
          />
        ))}
      </Card>
    </div>
  );
};

export default forwardRef<HTMLDivElement, MenuProps>(Menu);

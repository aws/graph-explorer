import { cx } from "@emotion/css";
import { CSSProperties, ReactNode, useState } from "react";
import { Placement, useHover } from "react-laag";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import Card from "../../Card";
import { ForwardIcon } from "../../icons";
import ListItem from "../../ListItem";
import type { UseLayerSides } from "../../UseLayer";
import UseLayer from "../../UseLayer";
import UseLayerOverlay from "../../UseLayer/UseLayerOverlay";
import UseLayerTrigger from "../../UseLayer/UseLayerTrigger";
import styles from "../Menu.styles";
import type { MenuItemDef } from "../types";
import { SubmenuParent } from "./SubMenuItem.styles";

type SubMenuItemProps = {
  item: MenuItemDef;
  style?: CSSProperties;
  classNamePrefix?: string;
  parentLayerSide?: UseLayerSides;
  className?: string;
  title?: ReactNode;
  onClose?: () => void;
};

const SubMenuItem = ({
  item,
  onClose,
  className,
  classNamePrefix = "ft",
  parentLayerSide = "right",
  title,
}: SubMenuItemProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);

  const styleWithTheme = useWithTheme();
  const [isOpen, hoverProps, close] = useHover({
    delayEnter: 100,
    delayLeave: 100,
  });

  const [open, setOpen] = useState(false);
  return (
    <UseLayer
      isOpen={isOpen}
      auto={true}
      triggerOffset={4}
      placement={(parentLayerSide + "-start") as Placement}
      possiblePlacements={["right-start", "left-start"]}
      overflowContainer={true}
      className={cx(pfx("submenu"))}
      onParentClose={close}
    >
      <UseLayerTrigger
        className={cx(
          styleWithTheme(SubmenuParent("ft")),
          pfx("submenu-parent")
        )}
      >
        <div
          {...hoverProps}
          className={cx(
            styleWithTheme(styles.listItemStyles(classNamePrefix)),
            pfx("menu-list-item"),
            { [pfx("list-item-selected")]: item.isSelected },
            item.className
          )}
        >
          <ListItem
            classNamePrefix={classNamePrefix}
            className={cx(pfx("list-item"), {
              [pfx("submenu-is-open")]: open,
              [pfx("list-item-selected")]: item.isSelected,
              [pfx("list-item-disabled")]: item.isDisabled,
            })}
            clickable={!item.isDisabled}
            isDisabled={item.isDisabled}
            startAdornment={item.startAdornment}
            endAdornment={
              <>
                {item.endAdornment}
                <ForwardIcon />
              </>
            }
            onClick={() => setOpen(open => !open)}
          >
            {!!item.render && item.render}
            {!item.render && item.label}
          </ListItem>
        </div>
      </UseLayerTrigger>
      <UseLayerOverlay
        className={cx(
          styleWithTheme(styles.rootStyles(classNamePrefix)),
          pfx("submenu"),
          className
        )}
      >
        <Card className={pfx("card-root")} {...hoverProps}>
          {!!title && (
            <>
              <div className={pfx("title")}>{title}</div>
              <div className={pfx("divider")} />
            </>
          )}
          {item.submenu?.items &&
            item.submenu.items.map(subItem => (
              <MenuItem
                parentLayerSide={parentLayerSide}
                item={subItem}
                className={subItem.className}
                classNamePrefix={classNamePrefix}
                key={subItem.id}
                onClose={onClose}
              />
            ))}
        </Card>
      </UseLayerOverlay>
    </UseLayer>
  );
};

type MenuItemProps = {
  item: MenuItemDef;
  classNamePrefix?: string;
  className?: string;
  parentLayerSide?: UseLayerSides;
  onClose?: () => void;
};

const MenuItem = ({
  item,
  classNamePrefix = "ft",
  className,
  parentLayerSide = "right",
  onClose,
}: MenuItemProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();
  if (item.submenu?.items && item.submenu?.items.length) {
    return (
      <SubMenuItem
        item={item}
        onClose={onClose}
        className={item.className}
        classNamePrefix={classNamePrefix}
        parentLayerSide={parentLayerSide}
        title={item.submenu.title}
      />
    );
  }

  return (
    <div
      key={item.id}
      className={cx(
        stylesWithTheme(styles.listItemStyles(classNamePrefix)),
        pfx("menu-list-item"),
        { [pfx("list-item-selected")]: item.isSelected },
        item.className,
        className
      )}
    >
      {!item.isDivider && (
        <ListItem
          style={item.style}
          isDisabled={item.isDisabled}
          className={cx(pfx("list-item"), {
            [pfx("list-item-disabled")]: item.isDisabled,
          })}
          clickable={!item.isDisabled}
          endAdornment={
            item.submenu?.items && item.submenu?.items.length ? (
              <>
                {item.endAdornment} <ForwardIcon />
              </>
            ) : (
              item.endAdornment
            )
          }
          startAdornment={item.startAdornment}
          onClick={evt => {
            evt.stopPropagation();
            item.onClick?.(evt, item.id, onClose);
          }}
        >
          {!!item.render && item.render}
          {!item.render && item.label}
        </ListItem>
      )}
      {item.isDivider && (
        <div className={cx(pfx("menu-divider"), item.className)} />
      )}
    </div>
  );
};

export default MenuItem;

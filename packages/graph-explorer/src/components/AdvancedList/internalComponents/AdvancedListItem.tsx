import { cx } from "@emotion/css";
import type { DragEvent, MouseEvent, ReactNode, RefObject } from "react";
import { useRef } from "react";
import type { DragObjectWithType } from "react-dnd";
import { useDrag } from "react-dnd";
import { useHover } from "react-laag";
import { withClassNamePrefix } from "../../../core";
import { CodeIcon } from "../../icons";
import ListItem from "../../ListItem";
import type { AdvancedListItemType } from "../AdvancedList";

type AdvancedListItemProps<T extends object> = {
  classNamePrefix?: string;
  className?: string;
  onClick?: (
    event: MouseEvent<HTMLDivElement>,
    item: AdvancedListItemType<T>
  ) => void;
  onMouseOver?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<T>
  ) => void;
  onMouseOut?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<T>
  ) => void;
  onMouseEnter?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<T>
  ) => void;
  onMouseLeave?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<T>
  ) => void;
  item: AdvancedListItemType<T>;
  group?: AdvancedListItemType<T>;
  isSelected?: boolean;
  draggable?: boolean;
  onDragStart?: (
    item: AdvancedListItemType<T>,
    group: AdvancedListItemType<T> | undefined,
    event: DragEvent<unknown>
  ) => void;
  overrideTitle?: ReactNode;
  defaultItemType?: string;
  renderPopover?: (
    item: AdvancedListItemType<any>,
    itemRef: RefObject<HTMLDivElement>
  ) => ReactNode;
  hidePopover?: boolean;
  isActive?: boolean;
};

const AdvancedListItem = <T extends object>({
  classNamePrefix = "ft",
  onClick,
  onMouseOver,
  onMouseOut,
  onMouseEnter,
  onMouseLeave,
  className,
  item,
  draggable,
  isSelected,
  isActive = false,
  onDragStart,
  overrideTitle,
  group,
  defaultItemType,
  hidePopover,
  renderPopover,
}: AdvancedListItemProps<T>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, dragRef] = useDrag({
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    item: {
      type: defaultItemType || "none",
      ...item.properties,
    } as DragObjectWithType & T,
  });
  const [isOver, hoverProps] = useHover({
    delayEnter: 400,
    delayLeave: 100,
    hideOnScroll: false,
  });

  const InnerItem = (
    <div ref={ref} {...hoverProps}>
      <ListItem
        clickable={!!onClick}
        onClick={event => onClick?.(event, item)}
        onMouseOver={event => onMouseOver?.(event, item)}
        onMouseOut={event => onMouseOut?.(event, item)}
        onMouseEnter={event => onMouseEnter?.(event, item)}
        onMouseLeave={event => onMouseLeave?.(event, item)}
        classNamePrefix={classNamePrefix}
        className={cx(pfx("advanced-list-item"), item.className, {
          [pfx("advanced-list-item-with-popover")]: isOver,
          [pfx("advanced-list-item-selected")]: isSelected,
          [pfx("advanced-list-item-active")]: isActive,
        })}
        startAdornment={item.icon || <CodeIcon />}
        secondary={item.subtitle}
        endAdornment={item.endAdornment}
        onDragStart={event => onDragStart?.(item, group, event)}
      >
        {overrideTitle || item.title}
      </ListItem>
      {isOver &&
        !isDragging &&
        !!renderPopover &&
        !hidePopover &&
        renderPopover(item, ref)}
    </div>
  );

  const WrapComponent = item.wrapperElement;
  const WrappedElement = WrapComponent ? (
    <WrapComponent>{InnerItem}</WrapComponent>
  ) : (
    InnerItem
  );

  if (!draggable) {
    return (
      <div className={cx(className, pfx("advanced-list-item-wrapper"))}>
        {WrappedElement}
      </div>
    );
  }

  return (
    <div className={pfx("advanced-list-item-wrapper")}>
      <div ref={dragRef} className={className}>
        {WrappedElement}
      </div>
    </div>
  );
};

export default AdvancedListItem;

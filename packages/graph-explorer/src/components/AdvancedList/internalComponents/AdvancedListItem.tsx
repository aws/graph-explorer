import { cn } from "@/utils";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { useRef } from "react";
import { useHover } from "react-laag";
import { CodeIcon } from "@/components/icons";
import ListItem from "@/components/ListItem";
import type { AdvancedListItemType } from "@/components/AdvancedList";

type AdvancedListItemProps<T extends object> = {
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
  overrideTitle?: ReactNode;
  renderPopover?: (
    item: AdvancedListItemType<any>,
    itemRef: RefObject<HTMLDivElement>
  ) => ReactNode;
  hidePopover?: boolean;
  isActive?: boolean;
};

const AdvancedListItem = <T extends object>({
  onClick,
  onMouseOver,
  onMouseOut,
  onMouseEnter,
  onMouseLeave,
  className,
  item,
  isSelected,
  isActive = false,
  overrideTitle,
  hidePopover,
  renderPopover,
}: AdvancedListItemProps<T>) => {
  const ref = useRef<HTMLDivElement>(null);

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
        className={cn("advanced-list-item", item.className, {
          ["advanced-list-item-with-popover"]: isOver,
          ["advanced-list-item-selected"]: isSelected,
          ["advanced-list-item-active"]: isActive,
        })}
        startAdornment={item.icon || <CodeIcon />}
        secondary={item.subtitle}
        endAdornment={item.endAdornment}
      >
        {overrideTitle || item.title}
      </ListItem>
      {isOver && !!renderPopover && !hidePopover && renderPopover(item, ref)}
    </div>
  );

  const WrapComponent = item.wrapperElement;
  const WrappedElement = WrapComponent ? (
    <WrapComponent>{InnerItem}</WrapComponent>
  ) : (
    InnerItem
  );

  return (
    <div className={cn(className, "advanced-list-item-wrapper")}>
      {WrappedElement}
    </div>
  );
};

export default AdvancedListItem;

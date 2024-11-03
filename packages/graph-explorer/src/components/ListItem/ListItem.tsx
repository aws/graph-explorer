import { cn } from "@/utils";
import type {
  DragEventHandler,
  ForwardedRef,
  HTMLAttributes,
  MouseEvent,
  PropsWithChildren,
  ReactNode,
} from "react";
import { forwardRef, useCallback } from "react";
import { useWithTheme } from "@/core";
import defaultStyles from "./ListItem.styles";

export interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  /**
   * If true, adds onClick event and the proper styling to the root element.
   */
  clickable?: boolean;
  /**
   * Should be memoized.
   * It's triggered only if clickable is true.
   */
  onClick?(event: MouseEvent<HTMLDivElement>): void;
  /**
   * The secondary content element.
   */
  secondary?: ReactNode;
  /**
   * A icon-like element positioned on the left of the component.
   */
  startAdornment?: ReactNode;
  /**
   * A icon-like element positioned on the right of the component.
   */
  endAdornment?: ReactNode;
  isDisabled?: boolean;
  onDragStart?: DragEventHandler;
}

export const ListItem = (
  {
    children,
    className,
    clickable,
    onClick,
    secondary,
    startAdornment,
    endAdornment,
    isDisabled,
    onDragStart,
    ...allProps
  }: PropsWithChildren<ListItemProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const styleWithTheme = useWithTheme();

  const actualOnClick = useCallback(
    (ev: MouseEvent<HTMLDivElement>) => {
      if (!clickable) {
        return;
      }

      onClick?.(ev);
    },
    [onClick, clickable]
  );

  return (
    <div
      ref={ref}
      onDragStart={onDragStart}
      draggable={!!onDragStart}
      className={cn(
        styleWithTheme(defaultStyles),
        { ["disabled"]: isDisabled },
        { ["clickable"]: clickable },
        className
      )}
      onClick={actualOnClick}
      {...allProps}
    >
      {startAdornment && (
        <div className={"start-adornment"}>{startAdornment}</div>
      )}
      <div className={"content"}>
        <div className={"primary"}>{children}</div>
        <div className={"secondary"}>{secondary}</div>
      </div>
      {endAdornment && <div className="end-adornment">{endAdornment}</div>}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<ListItemProps>>(
  ListItem
);

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
        <div className="start-adornment flex min-w-[32px] items-center justify-center">
          {startAdornment}
        </div>
      )}
      <div className="text-text-primary flex min-h-[48px] grow flex-col justify-center px-3 py-1">
        <div className="text-text-primary line-clamp-1">{children}</div>
        <div className="text-text-secondary line-clamp-2 break-all text-sm">
          {secondary}
        </div>
      </div>
      {endAdornment && (
        <div className="end-adornment mx-2 flex min-w-[32px] flex-row items-center justify-center">
          {endAdornment}
        </div>
      )}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<ListItemProps>>(
  ListItem
);

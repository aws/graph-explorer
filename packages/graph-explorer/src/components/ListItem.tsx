import { cn } from "@/utils";
import type {
  ForwardedRef,
  HTMLAttributes,
  MouseEvent,
  PropsWithChildren,
} from "react";
import { forwardRef } from "react";

export interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  isDisabled?: boolean;
}

export const ListItem = (
  {
    children,
    className,
    onClick,
    isDisabled,
    ...allProps
  }: PropsWithChildren<ListItemProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const clickable = onClick != null;
  const actualOnClick = (ev: MouseEvent<HTMLDivElement>) => {
    if (!clickable) {
      return;
    }

    onClick?.(ev);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "line-clamp-1 flex flex-row items-center gap-3 rounded px-3 py-2 text-text-primary [&_svg]:size-5 [&_svg]:text-primary-dark",
        isDisabled && "pointer-events-none",
        clickable && "hover:cursor-pointer hover:bg-background-secondary",
        className
      )}
      onClick={actualOnClick}
      {...allProps}
    >
      {children}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<ListItemProps>>(
  ListItem
);

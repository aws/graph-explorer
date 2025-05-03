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
        "text-text-primary [&_svg]:text-primary-dark line-clamp-1 flex flex-row items-center gap-3 rounded px-3 py-2 [&_svg]:size-5",
        isDisabled && "pointer-events-none",
        clickable && "hover:bg-background-secondary hover:cursor-pointer",
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

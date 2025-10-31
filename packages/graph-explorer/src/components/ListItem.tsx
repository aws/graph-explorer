import { cn } from "@/utils";
import type { MouseEvent, PropsWithChildren } from "react";

export interface ListItemProps extends React.ComponentPropsWithRef<"div"> {
  isDisabled?: boolean;
}

export function ListItem({
  children,
  className,
  onClick,
  isDisabled,
  ref,
  ...allProps
}: PropsWithChildren<ListItemProps>) {
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
        "text-text-primary [&_svg]:text-primary-dark line-clamp-1 flex flex-row items-center gap-3 rounded-sm px-3 py-2 [&_svg]:size-5",
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
}

export default ListItem;

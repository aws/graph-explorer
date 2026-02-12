import type { ComponentPropsWithRef, ReactNode } from "react";

import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";
import { cn } from "@/utils";

type NavBarProps = {
  logoVisible?: boolean;
};

export function NavBar({
  className,
  children,
  logoVisible,
}: ComponentPropsWithRef<"div"> & NavBarProps) {
  return (
    <div
      data-slot="nav-bar"
      className={cn(
        "bg-background-default text-text-primary flex min-h-16 flex-row items-center gap-3 border-b pr-3",
        !logoVisible && "pl-3",
        className,
      )}
    >
      {logoVisible ? <NavBarLogo /> : null}
      {children}
    </div>
  );
}

export function NavBarContent({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="nav-bar-content"
      className={cn("flex flex-1 flex-row items-center gap-3", className)}
      {...props}
    />
  );
}

export function NavBarActions({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="nav-bar-actions"
      className={cn(
        "flex h-full flex-row items-center gap-3 justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function NavBarLogo({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="nav-bar-logo"
      className={cn(
        "bg-logo-gradient mr-2 grid aspect-square h-full place-content-center overflow-hidden text-white",
        className,
      )}
      {...rest}
    >
      <GraphExplorerIcon width="2em" height="2em" />
    </div>
  );
}

export function NavBarVersion({
  className,
  ...props
}: Omit<ComponentPropsWithRef<"div">, "children">) {
  return (
    <div
      data-slot="nav-bar-version"
      className={cn(
        "text-muted-foreground/80 flex items-center justify-center text-sm",
        className,
      )}
      {...props}
    >
      v{__GRAPH_EXP_VERSION__}
    </div>
  );
}

type NavBarTitleProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
};

export function NavBarTitle({
  title,
  subtitle,
  className,
  children,
  ...props
}: ComponentPropsWithRef<"div"> & NavBarTitleProps) {
  return (
    <div className={cn("flex h-full items-center", className)} {...props}>
      <div className="flex flex-col">
        {title && (
          <div className="line-clamp-1 overflow-hidden font-bold">{title}</div>
        )}
        {subtitle && (
          <div className="text-text-secondary line-clamp-1 overflow-hidden text-sm leading-tight font-medium">
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

import { Tabs as TabsPrimitive } from "radix-ui";
import { Resizable } from "re-resizable";
import { type PropsWithChildren, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { DEFAULT_SIDEBAR_WIDTH } from "@/core";
import { cn } from "@/utils";

const CLOSED_WIDTH = 50;

export type CollapsibleSidebarProps = PropsWithChildren<{
  isSidebarOpen: boolean;
  sidebarWidth: number;
  onResize: (deltaWidth: number) => void;
}>;

export function CollapsibleSidebar({
  children,
  isSidebarOpen,
  sidebarWidth,
  onResize,
}: CollapsibleSidebarProps) {
  const [enableAnimation, setEnableAnimation] = useState(true);

  return (
    <Resizable
      size={{ width: isSidebarOpen ? sidebarWidth : CLOSED_WIDTH }}
      minWidth={isSidebarOpen ? DEFAULT_SIDEBAR_WIDTH : CLOSED_WIDTH}
      defaultSize={{
        width: isSidebarOpen ? DEFAULT_SIDEBAR_WIDTH : CLOSED_WIDTH,
      }}
      enable={{ left: isSidebarOpen }}
      onResizeStart={() => setEnableAnimation(false)}
      onResizeStop={(_e, _direction, _ref, delta) => {
        setEnableAnimation(true);
        onResize(delta.width);
      }}
      className={cn(
        enableAnimation &&
          "min-h-0 transform transition-[width] duration-200 ease-in-out",
      )}
    >
      {children}
    </Resizable>
  );
}

export function SidebarTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn(
        "bg-background shadow-primary-foreground/25 grid size-full min-h-0 flex-none shrink-0 grid-cols-[auto_1fr] shadow",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "bg-primary-subtle border-border/50 text-muted-foreground flex flex-col items-center gap-2 border-r p-2",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarTabsTrigger({
  className,
  title,
  badge,
  children,
  value,
  onToggle,
  ...props
}: Omit<React.ComponentProps<typeof TabsPrimitive.Trigger>, "onClick"> & {
  title: string;
  badge?: boolean;
  onToggle: () => void;
}) {
  return (
    <BadgeIndicator value={badge}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <TabsPrimitive.Trigger
              value={value}
              onClick={onToggle}
              className={cn(
                "text-brand-900 active:bg-brand-300 data-[state=active]:bg-brand-500 inline-flex size-10 items-center justify-center rounded-md bg-transparent p-2 ring-0 transition-colors duration-100 focus:shadow-none active:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-white [&_svg]:size-6",
                "hover:data-[state=active]:bg-brand-400 hover:bg-primary-subtle-hover",
                "focus-visible:ring-brand-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-hidden active:ring-0",
                className,
              )}
              {...props}
            >
              {children}
              <span className="sr-only">{title}</span>
            </TabsPrimitive.Trigger>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">{title}</TooltipContent>
      </Tooltip>
    </BadgeIndicator>
  );
}

export function SidebarTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("flex-1 overflow-y-auto outline-none", className)}
      {...props}
    />
  );
}

function BadgeIndicator({
  children,
  value,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { value?: boolean }) {
  return (
    <div className="stack" {...props}>
      {children}
      {value ? (
        <span
          aria-description="badge"
          className="bg-danger pointer-events-none -mt-0.5 -mr-0.5 size-2.5 place-self-start justify-self-end rounded-full"
        />
      ) : null}
    </div>
  );
}

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/utils";

const SidebarTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn("flex h-full flex-col", className)}
    {...props}
  />
));
SidebarTabs.displayName = TabsPrimitive.Root.displayName;

const SidebarTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "sticky top-0 flex w-full flex-row items-center border-b border-divider bg-background-default text-text-secondary",
      className
    )}
    {...props}
  />
));
SidebarTabsList.displayName = TabsPrimitive.List.displayName;

const SidebarTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "focus-visible:ring-ring inline-flex grow items-center justify-center gap-2 whitespace-nowrap border-b-2 border-transparent bg-background-default px-4 py-2 text-base font-bold text-text-secondary ring-offset-background-contrast transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary-main data-[state=active]:text-text-primary [&_svg]:size-5",
      className
    )}
    {...props}
  />
));
SidebarTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const SidebarTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring h-full overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
SidebarTabsContent.displayName = TabsPrimitive.Content.displayName;

export { SidebarTabs, SidebarTabsList, SidebarTabsTrigger, SidebarTabsContent };

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/utils";

function SidebarTabs({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn("flex h-full flex-col", className)}
      {...props}
    />
  );
}
SidebarTabs.displayName = TabsPrimitive.Root.displayName;

function SidebarTabsList({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "bg-background-default text-text-secondary sticky top-0 flex w-full flex-row items-center border-b",
        className,
      )}
      {...props}
    />
  );
}
SidebarTabsList.displayName = TabsPrimitive.List.displayName;

function SidebarTabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "focus-visible:ring-ring-3 bg-background-default text-text-secondary ring-offset-muted data-[state=active]:border-primary-main data-[state=active]:text-text-primary inline-flex grow items-center justify-center gap-2 border-b-2 border-transparent px-4 py-2 text-base font-bold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
        className,
      )}
      {...props}
    />
  );
}
SidebarTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

function SidebarTabsContent({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "ring-offset-background focus-visible:ring-ring-3 h-full overflow-y-auto focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
        className,
      )}
      {...props}
    />
  );
}
SidebarTabsContent.displayName = TabsPrimitive.Content.displayName;

export { SidebarTabs, SidebarTabsList, SidebarTabsTrigger, SidebarTabsContent };

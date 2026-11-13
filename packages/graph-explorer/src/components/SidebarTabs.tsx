import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

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
        "bg-background text-muted-foreground sticky top-0 flex w-full flex-row items-center border-b",
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
        "bg-background text-muted-foreground data-[state=active]:border-b-primary-foreground data-[state=active]:text-primary-foreground focus-visible:focus-ring inline-flex grow items-center justify-center gap-2 border-y-2 border-transparent border-y-transparent px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:font-medium [&_svg]:size-4",
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
        "focus-visible:focus-ring h-full overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}
SidebarTabsContent.displayName = TabsPrimitive.Content.displayName;

export { SidebarTabs, SidebarTabsList, SidebarTabsTrigger, SidebarTabsContent };

import { Tabs as TabsPrimitive } from "radix-ui";
import { Resizable } from "re-resizable";
import { type PropsWithChildren, useState } from "react";

import { DetailsIcon } from "@/components";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { cn, LABELS } from "@/utils";

import type { SchemaGraphSelection } from "../SchemaGraph";

import { SchemaDetailsContent } from "./SchemaDetailsContent";
import {
  DEFAULT_SCHEMA_SIDEBAR_WIDTH,
  useSchemaExplorerSidebarSize,
} from "./schemaExplorerLayout";

export type SchemaExplorerSidebarProps = {
  selection: SchemaGraphSelection;
};

/** Resizable sidebar for schema graph with details tab */
export function SchemaExplorerSidebar({
  selection,
}: SchemaExplorerSidebarProps) {
  return (
    <ResizableSidebarContainer>
      <SidebarTabs
        value="details"
        orientation="vertical"
        className="bg-background-default shadow-primary-dark/25 grid min-h-0 flex-none shrink-0 shadow"
      >
        <SidebarTabsList>
          <SidebarTabsTrigger
            value="details"
            title={LABELS.SIDEBAR.SELECTION_DETAILS}
          >
            <DetailsIcon />
          </SidebarTabsTrigger>
        </SidebarTabsList>
        <SidebarTabsContent value="details">
          <SchemaDetailsContent selection={selection} />
        </SidebarTabsContent>
      </SidebarTabs>
    </ResizableSidebarContainer>
  );
}

function ResizableSidebarContainer({ children }: PropsWithChildren) {
  const [sidebarWidth, setSidebarWidth] = useSchemaExplorerSidebarSize();
  const [enableAnimation, setEnableAnimation] = useState(true);

  return (
    <Resizable
      size={{ width: sidebarWidth }}
      minWidth={DEFAULT_SCHEMA_SIDEBAR_WIDTH}
      defaultSize={{ width: DEFAULT_SCHEMA_SIDEBAR_WIDTH }}
      enable={{ left: true }}
      onResizeStart={() => setEnableAnimation(false)}
      onResizeStop={(_e, _direction, _ref, delta) => {
        setEnableAnimation(true);
        setSidebarWidth(delta.width);
      }}
      className={cn(
        enableAnimation &&
          "transition-width min-h-0 transform duration-200 ease-in-out",
      )}
    >
      {children}
    </Resizable>
  );
}

function SidebarTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="schema-explorer-sidebar-tabs"
      className={cn("grid size-full grid-cols-[auto_1fr]", className)}
      {...props}
    />
  );
}

function SidebarTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="schema-explorer-sidebar-tabs-list"
      className={cn(
        "bg-primary-subtle border-border/50 text-muted-foreground flex flex-col items-center gap-2 border-r p-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarTabsTrigger({
  className,
  title,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  title: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <TabsPrimitive.Trigger
            data-slot="schema-explorer-sidebar-tabs-trigger"
            value={value}
            className={cn(
              "text-brand-900 active:bg-brand-300 data-[state=active]:bg-brand-500 inline-flex size-10 items-center justify-center rounded-md bg-transparent p-2 ring-0 transition-colors duration-100 focus:shadow-none active:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-white [&_svg]:size-6",
              "hover:data-[state=active]:bg-brand-400 hover:bg-primary-subtle-hover",
              "dark:text-brand-300 dark:data-[state=active]:bg-brand-400 dark:hover:data-[state=active]:bg-brand-500 dark:hover:bg-gray-800 dark:data-[state=active]:text-white",
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
  );
}

function SidebarTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="schema-explorer-sidebar-tabs-content"
      className={cn("flex-1 overflow-y-auto outline-none", className)}
      {...props}
    />
  );
}

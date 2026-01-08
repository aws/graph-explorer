import { cn } from "@/utils";
import {
  useState,
  type ComponentPropsWithRef,
  type PropsWithChildren,
} from "react";
import { Resizable } from "re-resizable";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
  CLOSED_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  useSidebar,
  useSidebarSize,
  type SidebarItems,
} from "@/core";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import {
  DetailsIcon,
  EdgeIcon,
  ExpandGraphIcon,
  FilterIcon,
  GraphIcon,
  NamespaceIcon,
  SearchIcon,
} from "@/components";
import { SearchSidebarPanel } from "@/modules/SearchSidebar";
import EntityDetails from "@/modules/EntityDetails";
import NodeExpand from "@/modules/NodeExpand";
import EntitiesFilter from "@/modules/EntitiesFilter";
import { NodesStyling } from "@/modules/NodesStyling";
import { EdgesStyling } from "@/modules/EdgesStyling";
import Namespaces from "@/modules/Namespaces/Namespaces";
import { useAtomValue } from "jotai";
import { totalFilteredCount } from "@/core/StateProvider/filterCount";
import { useTranslations } from "@/hooks";

export function Sidebar({
  className,
  ...props
}: ComponentPropsWithRef<typeof SidebarTabs>) {
  const t = useTranslations();
  const filteredEntitiesCount = useAtomValue(totalFilteredCount);
  const { shouldShowNamespaces, activeSidebarItem } = useSidebar();

  return (
    <ResizableSidebar>
      <SidebarTabs
        value={activeSidebarItem ?? ""}
        orientation="vertical"
        className={cn(
          className,
          "bg-background-default shadow-primary-dark/25 grid min-h-0 flex-none shrink-0 shadow",
        )}
        {...props}
      >
        <SidebarTabsList>
          <SidebarTabsTrigger value="search" title="Search">
            <SearchIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger value="details" title="Details">
            <DetailsIcon />
          </SidebarTabsTrigger>

          <SidebarTabsTrigger value="expand" title="Expand">
            <ExpandGraphIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="filters"
            title="Filters"
            badge={filteredEntitiesCount > 0}
          >
            <FilterIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="nodes-styling"
            title={t("nodes-styling.title")}
          >
            <GraphIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="edges-styling"
            title={t("edges-styling.title")}
          >
            <EdgeIcon />
          </SidebarTabsTrigger>
          {shouldShowNamespaces && (
            <SidebarTabsTrigger value="namespaces" title="Namespaces">
              <NamespaceIcon />
            </SidebarTabsTrigger>
          )}
        </SidebarTabsList>
        <SidebarTabsContent value="search">
          <SearchSidebarPanel />
        </SidebarTabsContent>
        <SidebarTabsContent value="details">
          <EntityDetails />
        </SidebarTabsContent>
        <SidebarTabsContent value="expand">
          <NodeExpand />
        </SidebarTabsContent>
        <SidebarTabsContent value="filters">
          <EntitiesFilter />
        </SidebarTabsContent>
        <SidebarTabsContent value="nodes-styling">
          <NodesStyling />
        </SidebarTabsContent>
        <SidebarTabsContent value="edges-styling">
          <EdgesStyling />
        </SidebarTabsContent>
        <SidebarTabsContent value="namespaces">
          <Namespaces />
        </SidebarTabsContent>
      </SidebarTabs>
    </ResizableSidebar>
  );
}

function ResizableSidebar({ children }: PropsWithChildren) {
  const { isSidebarOpen } = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useSidebarSize();

  // The transition animation used for opening and closing sidebar animation
  // does not play well with the resizing behavior of the Resizable component.
  // If the animation is not disabled, the resize will feel jerky.
  const [enableAnimation, setEnableAnimation] = useState(true);

  return (
    <Resizable
      size={{
        width: isSidebarOpen ? sidebarWidth : CLOSED_SIDEBAR_WIDTH,
      }}
      minWidth={isSidebarOpen ? DEFAULT_SIDEBAR_WIDTH : CLOSED_SIDEBAR_WIDTH}
      defaultSize={{
        width: isSidebarOpen ? DEFAULT_SIDEBAR_WIDTH : CLOSED_SIDEBAR_WIDTH,
      }}
      enable={{ left: isSidebarOpen }}
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
      data-slot="workspace-sidebar-tabs"
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
      data-slot="workspace-sidebar-tabs-list"
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
  badge,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  title: string;
  badge?: boolean;
}) {
  const { toggleSidebar } = useSidebar();

  const handleClick = () => {
    toggleSidebar(value as SidebarItems);
  };

  return (
    <BadgeIndicator value={badge}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <TabsPrimitive.Trigger
              data-slot="workspace-sidebar-tabs-trigger"
              value={value}
              onClick={handleClick}
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
    </BadgeIndicator>
  );
}

function SidebarTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="workspace-sidebar-tabs-content"
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
          className="bg-error-main pointer-events-none -mt-0.5 -mr-0.5 size-2.5 place-self-start justify-self-end rounded-full"
        />
      ) : null}
    </div>
  );
}

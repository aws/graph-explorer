import { useAtomValue } from "jotai";

import {
  DetailsIcon,
  EdgeIcon,
  ExpandGraphIcon,
  FilterIcon,
  GraphIcon,
  NamespaceIcon,
  SearchIcon,
} from "@/components";
import {
  CollapsibleSidebar,
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components/CollapsibleSidebar";
import { useGraphViewSidebar } from "@/core";
import { totalFilteredCount } from "@/core/StateProvider/filterCount";
import { useTranslations } from "@/hooks";
import { EdgesStyling } from "@/modules/EdgesStyling";
import EntitiesFilter from "@/modules/EntitiesFilter";
import EntityDetails from "@/modules/EntityDetails";
import Namespaces from "@/modules/Namespaces/Namespaces";
import NodeExpand from "@/modules/NodeExpand";
import { NodesStyling } from "@/modules/NodesStyling";
import { SearchSidebarPanel } from "@/modules/SearchSidebar";

export function Sidebar() {
  const t = useTranslations();
  const filteredEntitiesCount = useAtomValue(totalFilteredCount);
  const {
    shouldShowNamespaces,
    activeSidebarItem,
    isSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    toggleSidebar,
  } = useGraphViewSidebar();

  return (
    <CollapsibleSidebar
      isSidebarOpen={isSidebarOpen}
      sidebarWidth={sidebarWidth}
      onResize={setSidebarWidth}
    >
      <SidebarTabs value={activeSidebarItem ?? ""} orientation="vertical">
        <SidebarTabsList>
          <SidebarTabsTrigger
            value="search"
            title="Search"
            onToggle={() => toggleSidebar("search")}
          >
            <SearchIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="details"
            title="Details"
            onToggle={() => toggleSidebar("details")}
          >
            <DetailsIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="expand"
            title="Expand"
            onToggle={() => toggleSidebar("expand")}
          >
            <ExpandGraphIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="filters"
            title="Filters"
            badge={filteredEntitiesCount > 0}
            onToggle={() => toggleSidebar("filters")}
          >
            <FilterIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="nodes-styling"
            title={t("nodes-styling.title")}
            onToggle={() => toggleSidebar("nodes-styling")}
          >
            <GraphIcon />
          </SidebarTabsTrigger>
          <SidebarTabsTrigger
            value="edges-styling"
            title={t("edges-styling.title")}
            onToggle={() => toggleSidebar("edges-styling")}
          >
            <EdgeIcon />
          </SidebarTabsTrigger>
          {shouldShowNamespaces && (
            <SidebarTabsTrigger
              value="namespaces"
              title="Namespaces"
              onToggle={() => toggleSidebar("namespaces")}
            >
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
    </CollapsibleSidebar>
  );
}

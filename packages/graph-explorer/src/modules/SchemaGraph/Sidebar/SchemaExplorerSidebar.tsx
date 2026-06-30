import { DetailsIcon, EdgeIcon, GraphIcon } from "@/components";
import {
  CollapsibleSidebar,
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components/CollapsibleSidebar";
import { useTranslations } from "@/hooks";
import { LABELS } from "@/utils";

import type {
  SchemaGraphSelection,
  SchemaGraphSelectionItem,
} from "../SchemaGraph";

import { SchemaDetailsContent } from "./SchemaDetailsContent";
import { SchemaEdgesStyling } from "./SchemaEdgesStyling";
import { SchemaNodesStyling } from "./SchemaNodesStyling";
import { useSchemaViewSidebar } from "./schemaViewLayout";

export type SchemaExplorerSidebarProps = {
  selection: SchemaGraphSelection;
  onSelectionChange?: (item: SchemaGraphSelectionItem) => void;
};

export function SchemaExplorerSidebar({
  selection,
  onSelectionChange,
}: SchemaExplorerSidebarProps) {
  const t = useTranslations();
  const {
    activeSidebarItem,
    isSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    toggleSidebar,
  } = useSchemaViewSidebar();

  return (
    <CollapsibleSidebar
      isSidebarOpen={isSidebarOpen}
      sidebarWidth={sidebarWidth}
      onResize={setSidebarWidth}
    >
      <SidebarTabs value={activeSidebarItem ?? ""} orientation="vertical">
        <SidebarTabsList>
          <SidebarTabsTrigger
            value="details"
            title={LABELS.SIDEBAR.SELECTION_DETAILS}
            onToggle={() => toggleSidebar("details")}
          >
            <DetailsIcon />
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
        </SidebarTabsList>
        <SidebarTabsContent value="details">
          <SchemaDetailsContent
            selection={selection}
            onSelectionChange={onSelectionChange}
          />
        </SidebarTabsContent>
        <SidebarTabsContent value="nodes-styling">
          <SchemaNodesStyling />
        </SidebarTabsContent>
        <SidebarTabsContent value="edges-styling">
          <SchemaEdgesStyling />
        </SidebarTabsContent>
      </SidebarTabs>
    </CollapsibleSidebar>
  );
}

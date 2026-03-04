import {
  CheckboxList,
  NoEdgeTypesEmptyState,
  NoNodeTypesEmptyState,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components";
import { useTranslations } from "@/hooks";

import { SidebarCloseButton } from "../SidebarCloseButton";
import useFiltersConfig from "./useFiltersConfig";

function EntitiesFilter() {
  const t = useTranslations();

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Entities Filter</PanelTitle>
        <PanelHeaderActions>
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        <SidebarTabs defaultValue="vertex">
          <SidebarTabsList>
            <SidebarTabsTrigger value="vertex">
              {t("node-types")}
            </SidebarTabsTrigger>
            <SidebarTabsTrigger value="edge">
              {t("edge-types")}
            </SidebarTabsTrigger>
          </SidebarTabsList>
          <SidebarTabsContent value="vertex">
            <VertexFiltersTabContent />
          </SidebarTabsContent>
          <SidebarTabsContent value="edge">
            <EdgeFiltersTabContent />
          </SidebarTabsContent>
        </SidebarTabs>
      </PanelContent>
    </Panel>
  );
}

function EdgeFiltersTabContent() {
  const {
    selectedConnectionTypes,
    connectionTypes,
    onChangeConnectionTypes,
    onChangeAllConnectionTypes,
  } = useFiltersConfig();

  if (connectionTypes.length === 0) {
    return <NoEdgeTypesEmptyState />;
  }

  return (
    <CheckboxList
      selectedIds={selectedConnectionTypes}
      checkboxes={connectionTypes}
      onChange={onChangeConnectionTypes}
      onChangeAll={onChangeAllConnectionTypes}
    />
  );
}

function VertexFiltersTabContent() {
  const {
    selectedVertexTypes,
    vertexTypes,
    onChangeVertexTypes,
    onChangeAllVertexTypes,
  } = useFiltersConfig();

  if (vertexTypes.length === 0) {
    return <NoNodeTypesEmptyState />;
  }

  return (
    <CheckboxList
      selectedIds={selectedVertexTypes}
      checkboxes={vertexTypes}
      onChange={onChangeVertexTypes}
      onChangeAll={onChangeAllVertexTypes}
    />
  );
}

export default EntitiesFilter;

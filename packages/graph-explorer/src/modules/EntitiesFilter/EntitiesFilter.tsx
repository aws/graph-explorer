import {
  CheckboxList,
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
import useFiltersConfig from "./useFiltersConfig";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { useTranslations } from "@/hooks";

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
              {t("entities-filter.node-types")}
            </SidebarTabsTrigger>
            <SidebarTabsTrigger value="edge">
              {t("entities-filter.edge-types")}
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

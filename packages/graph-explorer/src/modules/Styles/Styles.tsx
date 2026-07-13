import { atom, type PrimitiveAtom, useAtom } from "jotai";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelTitle,
} from "@/components";
import {
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@/components/SidebarTabs";
import { useTranslations } from "@/hooks";
import { LABELS } from "@/utils";

import { EdgeStyles } from "./EdgeStyles";
import { VertexStyles } from "./VertexStyles";

export type StylesTab = "nodes" | "edges";

/**
 * Holds the active Nodes/Edges tab for one styling sidebar. Module-level so the
 * selection survives the panel unmounting when the user switches sidebar panels
 * or collapses the sidebar. The graph and schema views each own a separate atom
 * so their tab selections stay independent.
 */
export const graphViewStylesTabAtom = atom<StylesTab>("nodes");
export const schemaViewStylesTabAtom = atom<StylesTab>("nodes");

export type StylesProps = {
  onClose: () => void;
  tabAtom: PrimitiveAtom<StylesTab>;
  /** Shows a per-row eye toggle to hide vertex types from the Schema view. */
  showVertexVisibilityToggle?: boolean;
};

/**
 * Combined node and edge styling sidebar panel. The two style lists live behind
 * an internal Nodes/Edges tab switch so both share one styling entry point.
 */
export function Styles({
  onClose,
  tabAtom,
  showVertexVisibilityToggle,
}: StylesProps) {
  const t = useTranslations();
  const [selectedTab, setSelectedTab] = useAtom(tabAtom);

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>{LABELS.SIDEBAR.STYLES}</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent className="flex h-full flex-col overflow-hidden">
        <SidebarTabs
          value={selectedTab}
          onValueChange={value => setSelectedTab(value as StylesTab)}
          className="min-h-0 grow"
        >
          <SidebarTabsList>
            <SidebarTabsTrigger value="nodes">{t("nodes")}</SidebarTabsTrigger>
            <SidebarTabsTrigger value="edges">{t("edges")}</SidebarTabsTrigger>
          </SidebarTabsList>
          <SidebarTabsContent value="nodes">
            <VertexStyles showVisibilityToggle={showVertexVisibilityToggle} />
          </SidebarTabsContent>
          <SidebarTabsContent value="edges">
            <EdgeStyles />
          </SidebarTabsContent>
        </SidebarTabs>
      </PanelContent>
    </Panel>
  );
}

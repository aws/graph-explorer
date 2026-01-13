import { useAtomValue } from "jotai";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import GraphIcon from "@/components/icons/GraphIcon";
import PanelEmptyState from "@/components/PanelEmptyState/PanelEmptyState";
import { useSelectedDisplayVertices } from "@/core";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import useTranslations from "@/hooks/useTranslations";

import { SidebarCloseButton } from "../SidebarCloseButton";
import NodeExpandContent from "./NodeExpandContent";

function NodeExpand() {
  const t = useTranslations();
  const edgesSelectedIds = useAtomValue(edgesSelectedIdsAtom);
  const selectedNodes = useSelectedDisplayVertices();
  const selectedNode = selectedNodes[0];

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Expand</PanelTitle>
        <PanelHeaderActions>
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        {selectedNodes.length === 0 && edgesSelectedIds.size === 0 && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={t("node-expand.no-selection-title")}
            subtitle={t("node-expand.no-selection-subtitle")}
          />
        )}
        {selectedNodes.length === 0 && edgesSelectedIds.size > 0 && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={t("node-expand.edge-selection-title")}
            subtitle={t("node-expand.edge-selection-subtitle")}
          />
        )}
        {selectedNodes.length > 1 && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={t("node-expand.multi-selection-title")}
            subtitle={t("node-expand.multi-selection-subtitle")}
          />
        )}
        {selectedNodes.length === 1 && selectedNode && (
          <NodeExpandContent vertex={selectedNode} />
        )}
      </PanelContent>
    </Panel>
  );
}

export default NodeExpand;

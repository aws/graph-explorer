import { useRecoilValue } from "recoil";
import type { PanelHeaderCloseButtonProps } from "@/components";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelTitle,
} from "@/components";
import GraphIcon from "@/components/icons/GraphIcon";
import PanelEmptyState from "@/components/PanelEmptyState/PanelEmptyState";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import useTranslations from "@/hooks/useTranslations";
import NodeExpandContent from "./NodeExpandContent";
import { useSelectedDisplayVertices } from "@/core";

export type NodeExpandProps = Pick<PanelHeaderCloseButtonProps, "onClose">;

const NodeExpand = ({ onClose }: NodeExpandProps) => {
  const t = useTranslations();
  const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom);
  const selectedNodes = useSelectedDisplayVertices();
  const selectedNode = selectedNodes[0];

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Expand</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
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
};

export default NodeExpand;

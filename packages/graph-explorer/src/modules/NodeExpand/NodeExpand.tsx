import { useMemo } from "react";
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
import { nodesAtom, nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import useTranslations from "@/hooks/useTranslations";
import NodeExpandContent from "./NodeExpandContent";

export type NodeExpandProps = Pick<PanelHeaderCloseButtonProps, "onClose">;

const NodeExpand = ({ onClose }: NodeExpandProps) => {
  const t = useTranslations();
  const nodes = useRecoilValue(nodesAtom);
  const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom);
  const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom);

  const selectedNode = useMemo(() => {
    return nodesSelectedIds
      .keys()
      .map(id => nodes.get(id))
      .filter(v => v != null)
      .next().value;
    // return nodes.find(node => nodesSelectedIds.has(node.id));
  }, [nodes, nodesSelectedIds]);

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Expand</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        {nodesSelectedIds.size === 0 && edgesSelectedIds.size === 0 && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={t("node-expand.no-selection-title")}
            subtitle={t("node-expand.no-selection-subtitle")}
          />
        )}
        {nodesSelectedIds.size === 0 && edgesSelectedIds.size > 0 && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={t("node-expand.edge-selection-title")}
            subtitle={t("node-expand.edge-selection-subtitle")}
          />
        )}
        {nodesSelectedIds.size > 1 && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={t("node-expand.multi-selection-title")}
            subtitle={t("node-expand.multi-selection-subtitle")}
          />
        )}
        {nodesSelectedIds.size === 1 && selectedNode && (
          <NodeExpandContent vertex={selectedNode} />
        )}
      </PanelContent>
    </Panel>
  );
};

export default NodeExpand;

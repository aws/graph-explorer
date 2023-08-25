import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import type { ModuleContainerHeaderProps } from "../../components";
import { ModuleContainer, ModuleContainerHeader } from "../../components";
import GraphIcon from "../../components/icons/GraphIcon";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import { edgesSelectedIdsAtom } from "../../core/StateProvider/edges";
import {
  nodesAtom,
  nodesSelectedIdsAtom,
} from "../../core/StateProvider/nodes";
import useTranslations from "../../hooks/useTranslations";
import EdgeExpandContent from "./EdgeExpandContent";

export type EdgeExpandProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
};

const EdgeExpand = ({ title = "Expand by Edge", ...headerProps }: EdgeExpandProps) => {
  const t = useTranslations();
  const nodes = useRecoilValue(nodesAtom);
  const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom);
  const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom);

  const selectedNode = useMemo(() => {
    return nodes.find(node => nodesSelectedIds.has(node.data.id));
  }, [nodes, nodesSelectedIds]);

  return (
    <ModuleContainer>
      <ModuleContainerHeader
        title={title}
        variant={"sidebar"}
        {...headerProps}
      />
      {nodesSelectedIds.size === 0 && edgesSelectedIds.size === 0 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={t("edge-expand.no-selection-title")}
          subtitle={t("edge-expand.no-selection-subtitle")}
        />
      )}
      {nodesSelectedIds.size === 0 && edgesSelectedIds.size > 0 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={t("edge-expand.edge-selection-title")}
          subtitle={t("edge-expand.edge-selection-subtitle")}
        />
      )}
      {nodesSelectedIds.size > 1 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={t("edge-expand.multi-selection-title")}
          subtitle={t("edge-expand.multi-selection-subtitle")}
        />
      )}
      {nodesSelectedIds.size === 1 && selectedNode && (
        <EdgeExpandContent vertex={selectedNode} />
      )}
    </ModuleContainer>
  );
};

export default EdgeExpand;

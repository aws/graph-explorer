import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import type { ModuleContainerHeaderProps } from "../../components";
import { ModuleContainer, ModuleContainerHeader } from "../../components";
import GraphIcon from "../../components/icons/GraphIcon";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import {
  nodesAtom,
  nodesSelectedIdsAtom,
} from "../../core/StateProvider/nodes";
import {
  edgesAtom,
  edgesSelectedIdsAtom,
  edgesTypesFilteredAtom,
} from "../../core/StateProvider/edges";
import { overdateAtom } from "../../core/StateProvider/overdate";
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
  //const edges = useRecoilValue(edgesAtom);
  const edges = useRecoilValue(edgesTypesFilteredAtom)
  const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom);
  const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom);

  const selectedNode = useMemo(() => {
    return nodes.find(node => nodesSelectedIds.has(node.data.id));
  }, [nodes, nodesSelectedIds]);

  const filteredEdges = edges
  const odFlag = useRecoilValue(overdateAtom)

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
        <EdgeExpandContent 
        vertex={selectedNode}
        edgeList={filteredEdges}
        overdate={odFlag} />
      )}
    </ModuleContainer>
  );
};

export default EdgeExpand;

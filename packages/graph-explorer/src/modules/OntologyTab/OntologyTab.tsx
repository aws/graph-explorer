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
import NodeExpandContent from "./OntologyTabContent";

export type OntologyTabProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
};

const OntologyTab = ({ title = "Ontologies", ...headerProps }: OntologyTabProps) => {
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
    </ModuleContainer>
  );
};

export default OntologyTab;

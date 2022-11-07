import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import type { ModuleContainerHeaderProps } from "../../components";
import { ModuleContainer, ModuleContainerHeader } from "../../components";
import PanelEmptyState from "../../components/EmptyStates/PanelEmptyState";
import GraphIcon from "../../components/icons/GraphIcon";
import { edgesSelectedIdsAtom } from "../../core/StateProvider/edges";
import {
  nodesAtom,
  nodesSelectedIdsAtom,
} from "../../core/StateProvider/nodes";
import VertexExpandContent from "./VertexExpandContent";

export type VertexExpandProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
};

const VertexExpand = ({
  title = "Expand",
  ...headerProps
}: VertexExpandProps) => {
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
          title={"Empty Selection"}
          subtitle={"Select a Node to expand its connections"}
        />
      )}
      {nodesSelectedIds.size === 0 && edgesSelectedIds.size > 0 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={"Edge Selection"}
          subtitle={"Select a Node to expand its connections"}
        />
      )}
      {nodesSelectedIds.size > 1 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={"Multiple Selection"}
          subtitle={"Select a single Node to expand its connections"}
        />
      )}
      {nodesSelectedIds.size === 1 && selectedNode && (
        <VertexExpandContent vertex={selectedNode} />
      )}
    </ModuleContainer>
  );
};

export default VertexExpand;

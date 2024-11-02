import { useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import type { ModuleContainerHeaderProps } from "@/components";
import {
  AutoFitLeftIcon,
  ModuleContainer,
  ModuleContainerContent,
  ModuleContainerHeader,
} from "@/components";
import GraphIcon from "@/components/icons/GraphIcon";
import PanelEmptyState from "@/components/PanelEmptyState/PanelEmptyState";
import { edgesAtom, edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import { nodesAtom, nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import { userLayoutAtom } from "@/core/StateProvider/userPreferences";
import EdgeDetail from "./EdgeDetail";
import NodeDetail from "./NodeDetail";

export type EntityDetailsProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
  noHeader?: boolean;
  disableConnections?: boolean;
};

const EntityDetails = ({
  title = "Details View",
  noHeader,
  disableConnections,
  ...headerProps
}: EntityDetailsProps) => {
  const nodes = useRecoilValue(nodesAtom);
  const edges = useRecoilValue(edgesAtom);
  const selectedNodesIds = useRecoilValue(nodesSelectedIdsAtom);
  const selectedEdgesIds = useRecoilValue(edgesSelectedIdsAtom);
  const [userLayout, setUserLayout] = useRecoilState(userLayoutAtom);

  const selectedNode = useMemo(() => {
    return selectedNodesIds
      .keys()
      .map(id => nodes.get(id))
      .filter(n => n != null)
      .next().value;
  }, [nodes, selectedNodesIds]);

  const selectedEdge = useMemo(() => {
    return edges.find(edge => selectedEdgesIds.has(edge.id));
  }, [edges, selectedEdgesIds]);

  const [sourceNode, targetNode] = useMemo(() => {
    if (selectedEdgesIds.size === 0 || !selectedEdge) {
      return [undefined, undefined];
    }

    return [nodes.get(selectedEdge.source), nodes.get(selectedEdge.target)];
  }, [selectedEdgesIds, selectedEdge, nodes]);

  const isEmptySelection = selectedNodesIds.size + selectedEdgesIds.size === 0;
  const isMultiSelection = selectedNodesIds.size + selectedEdgesIds.size > 1;

  const onAction = useCallback(
    (value: string) => {
      if (value === "auto_open") {
        return setUserLayout(prev => ({
          ...prev,
          detailsAutoOpenOnSelection: !prev.detailsAutoOpenOnSelection,
        }));
      }
    },
    [setUserLayout]
  );

  return (
    <ModuleContainer variant="sidebar">
      {noHeader !== true && (
        <ModuleContainerHeader
          title={title}
          variant={"sidebar"}
          actions={[
            {
              label: "Automatically open on selection",
              value: "auto_open",
              alwaysVisible: true,
              icon: <AutoFitLeftIcon />,
              active: userLayout.detailsAutoOpenOnSelection,
            },
          ]}
          onActionClick={onAction}
          {...headerProps}
        />
      )}
      <ModuleContainerContent>
        {isEmptySelection && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={"Empty Selection"}
            subtitle={"Select an entity to see its details"}
          />
        )}
        {isMultiSelection && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title={"Multiple Selection"}
            subtitle={"Select a single entity to see its details"}
          />
        )}
        {!isMultiSelection && selectedNodesIds.size === 1 && selectedNode && (
          <NodeDetail node={selectedNode} hideNeighbors={disableConnections} />
        )}
        {!isMultiSelection &&
          selectedEdgesIds.size === 1 &&
          selectedEdge &&
          sourceNode &&
          targetNode && (
            <EdgeDetail
              edge={selectedEdge}
              sourceVertex={sourceNode}
              targetVertex={targetNode}
            />
          )}
      </ModuleContainerContent>
    </ModuleContainer>
  );
};

export default EntityDetails;

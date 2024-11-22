import { useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import type { PanelHeaderCloseButtonProps } from "@/components";
import {
  AutoFitLeftIcon,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderDivider,
  PanelTitle,
} from "@/components";
import GraphIcon from "@/components/icons/GraphIcon";
import PanelEmptyState from "@/components/PanelEmptyState/PanelEmptyState";
import { edgesAtom, edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import { nodesAtom, nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import { userLayoutAtom } from "@/core/StateProvider/userPreferences";
import EdgeDetail from "./EdgeDetail";
import NodeDetail from "./NodeDetail";

export type EntityDetailsProps = Pick<PanelHeaderCloseButtonProps, "onClose">;

const EntityDetails = ({ onClose }: EntityDetailsProps) => {
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
    return selectedEdgesIds
      .keys()
      .map(id => edges.get(id))
      .filter(n => n != null)
      .next().value;
  }, [edges, selectedEdgesIds]);

  const [sourceNode, targetNode] = useMemo(() => {
    if (selectedEdgesIds.size === 0 || !selectedEdge) {
      return [undefined, undefined];
    }

    return [nodes.get(selectedEdge.source), nodes.get(selectedEdge.target)];
  }, [selectedEdgesIds, selectedEdge, nodes]);

  const isEmptySelection = selectedNodesIds.size + selectedEdgesIds.size === 0;
  const isMultiSelection = selectedNodesIds.size + selectedEdgesIds.size > 1;

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Details View</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderActionButton
            label="Automatically open on selection"
            icon={<AutoFitLeftIcon />}
            active={userLayout.detailsAutoOpenOnSelection}
            onActionClick={() =>
              setUserLayout(prev => ({
                ...prev,
                detailsAutoOpenOnSelection: !prev.detailsAutoOpenOnSelection,
              }))
            }
          />
          <PanelHeaderDivider />
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
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
          <NodeDetail node={selectedNode} />
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
      </PanelContent>
    </Panel>
  );
};

export default EntityDetails;

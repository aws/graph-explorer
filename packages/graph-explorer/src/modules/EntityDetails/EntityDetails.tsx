import { useAtom } from "jotai";

import {
  AutoFitLeftIcon,
  Button,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
} from "@/components";
import GraphIcon from "@/components/icons/GraphIcon";
import PanelEmptyState from "@/components/PanelEmptyState/PanelEmptyState";
import {
  userLayoutAtom,
  useSelectedDisplayEdges,
  useSelectedDisplayVertices,
} from "@/core";

import { SidebarCloseButton } from "../SidebarCloseButton";
import EdgeDetail from "./EdgeDetail";
import { EntitiesRefreshButton } from "./EntitiesRefreshButton";
import NodeDetail from "./NodeDetail";

function EntityDetails() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);
  const selectedNodes = useSelectedDisplayVertices();
  const selectedNode = selectedNodes[0];
  const selectedEdges = useSelectedDisplayEdges();
  const selectedEdge = selectedEdges[0];

  const isEmptySelection = selectedNodes.length + selectedEdges.length === 0;
  const isMultiSelection = selectedNodes.length + selectedEdges.length > 1;

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Details View</PanelTitle>
        <PanelHeaderActions>
          <EntitiesRefreshButton />
          <Button
            tooltip="Automatically open on selection"
            variant={
              userLayout.detailsAutoOpenOnSelection ? "primary" : "ghost"
            }
            size="icon"
            onClick={() =>
              setUserLayout(prev => {
                return {
                  ...prev,
                  detailsAutoOpenOnSelection: !prev.detailsAutoOpenOnSelection,
                };
              })
            }
          >
            <AutoFitLeftIcon />
          </Button>
          <PanelHeaderDivider />
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        {isEmptySelection && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title="Empty Selection"
            subtitle="Select an entity to see its details"
          />
        )}
        {isMultiSelection && (
          <PanelEmptyState
            icon={<GraphIcon />}
            title="Multiple Selection"
            subtitle="Select a single entity to see its details"
          />
        )}
        {!isMultiSelection && selectedNodes.length === 1 && selectedNode && (
          <NodeDetail node={selectedNode} />
        )}
        {!isMultiSelection && selectedEdges.length === 1 && selectedEdge && (
          <EdgeDetail edge={selectedEdge} />
        )}
      </PanelContent>
    </Panel>
  );
}

export default EntityDetails;

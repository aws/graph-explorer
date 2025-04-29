import {
  AutoFitLeftIcon,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
} from "@/components";
import GraphIcon from "@/components/icons/GraphIcon";
import PanelEmptyState from "@/components/PanelEmptyState/PanelEmptyState";
import { userLayoutAtom } from "@/core/StateProvider/userPreferences";
import EdgeDetail from "./EdgeDetail";
import NodeDetail from "./NodeDetail";
import { useSelectedDisplayEdges, useSelectedDisplayVertices } from "@/core";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { useAtom } from "jotai";

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
          <PanelHeaderActionButton
            label="Automatically open on selection"
            icon={<AutoFitLeftIcon />}
            active={userLayout.detailsAutoOpenOnSelection}
            onActionClick={() =>
              setUserLayout(async prev => {
                const prevValue = await prev;
                return {
                  ...prevValue,
                  detailsAutoOpenOnSelection:
                    !prevValue.detailsAutoOpenOnSelection,
                };
              })
            }
          />
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

import {
  NavBar,
  NavBarContent,
  NavBarTitle,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelGroup,
  RouteButtonGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";
import { useConfiguration } from "@/core";
import { useIsSyncing } from "@/hooks/useSchemaSync";
import AvailableConnections from "@/modules/AvailableConnections";
import ConnectionDetail from "@/modules/ConnectionDetail";

export default function Connections() {
  const config = useConfiguration();
  const isSyncing = useIsSyncing();

  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle
            title="Connections Details"
            subtitle={`Connection: ${config?.displayLabel || config?.id || "none"}`}
          />
        </NavBarContent>
        <RouteButtonGroup active="connections" />
      </NavBar>
      <WorkspaceContent>
        <PanelGroup className="grid grid-cols-2 gap-2">
          <div className="h-full grow">
            <AvailableConnections isSync={isSyncing} />
          </div>
          {config ? (
            <div className="h-full grow">
              <ConnectionDetail config={config} />
            </div>
          ) : (
            <NoActiveConnectionPanel />
          )}
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}

function NoActiveConnectionPanel() {
  return (
    <Panel>
      <PanelContent>
        <PanelEmptyState
          icon={<GraphExplorerIcon />}
          title="No Active Connection"
          subtitle="Select a connection in the left panel to be the active connection."
        />
      </PanelContent>
    </Panel>
  );
}

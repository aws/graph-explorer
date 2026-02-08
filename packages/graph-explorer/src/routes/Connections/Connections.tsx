import { useAtomValue } from "jotai";
import { useState } from "react";

import {
  GraphExplorerRouteButton,
  NavBar,
  NavBarActions,
  NavBarContent,
  NavBarTitle,
  NavBarVersion,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelGroup,
  SchemaExplorerRouteButton,
  SettingsRouteButton,
  Workspace,
  WorkspaceContent,
} from "@/components";
import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";
import { configurationAtom, useConfiguration } from "@/core";
import { useIsSyncing } from "@/hooks/useSchemaSync";
import AvailableConnections from "@/modules/AvailableConnections";
import ConnectionDetail from "@/modules/ConnectionDetail";

export default function Connections() {
  const config = useConfiguration();
  const configuration = useAtomValue(configurationAtom);
  const [isModalOpen, setModal] = useState(configuration.size === 0);
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
        <NavBarActions>
          <NavBarVersion>{__GRAPH_EXP_VERSION__}</NavBarVersion>
          <div className="flex gap-2">
            <SettingsRouteButton />
            <SchemaExplorerRouteButton />
            <GraphExplorerRouteButton variant="primary" />
          </div>
        </NavBarActions>
      </NavBar>
      <WorkspaceContent>
        <PanelGroup className="grid grid-cols-2 gap-2">
          <div className="h-full grow">
            <AvailableConnections
              isSync={isSyncing}
              isModalOpen={isModalOpen}
              onModalChange={setModal}
            />
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

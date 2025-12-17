import { useState } from "react";
import { Link } from "react-router";
import {
  buttonStyles,
  NavBar,
  NavBarContent,
  NavBarActions,
  NavBarTitle,
  NavBarVersion,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { ExplorerIcon, GearIcon } from "@/components/icons";
import { configurationAtom, useConfiguration } from "@/core";
import { useIsSyncing } from "@/hooks/useSchemaSync";
import AvailableConnections from "@/modules/AvailableConnections";
import ConnectionDetail from "@/modules/ConnectionDetail";
import { LABELS } from "@/utils/constants";
import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";
import { cn } from "@/utils";
import { useAtomValue } from "jotai";

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
            <Link
              to="/settings/general"
              className={cn(buttonStyles({ variant: "default" }))}
            >
              <GearIcon />
              Settings
            </Link>

            <Link
              to={
                !config?.schema?.lastUpdate ? "/connections" : "/graph-explorer"
              }
              className={cn(buttonStyles({ variant: "filled" }))}
              aria-disabled={!config?.schema?.lastUpdate}
            >
              <ExplorerIcon />
              Open {LABELS.APP_NAME}
            </Link>
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

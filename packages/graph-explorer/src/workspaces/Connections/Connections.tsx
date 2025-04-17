import { useState } from "react";
import { Link } from "react-router";
import { useRecoilValue } from "recoil";
import {
  buttonStyles,
  Panel,
  PanelContent,
  PanelEmptyState,
} from "@/components";
import { ExplorerIcon, GearIcon } from "@/components/icons";
import Workspace from "@/components/Workspace/Workspace";
import { useConfiguration } from "@/core";
import { configurationAtom } from "@/core/StateProvider/configuration";
import { useIsSyncing } from "@/hooks/useSchemaSync";
import AvailableConnections from "@/modules/AvailableConnections";
import ConnectionDetail from "@/modules/ConnectionDetail";
import { APP_NAME } from "@/utils/constants";
import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";
import { cn } from "@/utils";

export default function Connections() {
  const config = useConfiguration();
  const configuration = useRecoilValue(configurationAtom);
  const [isModalOpen, setModal] = useState(configuration.size === 0);
  const isSyncing = useIsSyncing();

  return (
    <Workspace>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title="Connections Details"
          subtitle={`Connection: ${config?.displayLabel || config?.id || "none"}`}
        />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
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
              Open {APP_NAME}
            </Link>
          </div>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <div className="grid h-full grid-cols-2 gap-2">
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
        </div>
      </Workspace.Content>
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

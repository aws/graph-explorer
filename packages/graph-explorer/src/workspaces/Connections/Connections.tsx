import { useState } from "react";
import { Link } from "react-router";
import { useRecoilValue } from "recoil";
import Button from "@/components/Button";
import { ExplorerIcon, GearIcon } from "@/components/icons";
import Workspace from "@/components/Workspace/Workspace";
import { useConfiguration } from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { useIsSyncing } from "@/hooks/useSchemaSync";
import AvailableConnections from "@/modules/AvailableConnections";
import ConnectionDetail from "@/modules/ConnectionDetail";
import { APP_NAME } from "@/utils/constants";
import { Panel, PanelContent, PanelEmptyState } from "@/components";
import GraphExplorerIcon from "@/components/icons/GraphExplorerIcon";

export default function Connections() {
  const config = useConfiguration();
  const activeConfig = useRecoilValue(activeConfigurationAtom);
  const configuration = useRecoilValue(configurationAtom);
  const [isModalOpen, setModal] = useState(configuration.size === 0);
  const isSyncing = useIsSyncing();

  // Every time that the active connection changes,
  // if it was not synchronized yet, try to sync it
  // const updateSchema = useSchemaSync();
  // useEffect(() => {
  //   if (config?.schema?.triedToSync === true) {
  //     return;
  //   }

  //   updateSchema();
  // }, [activeConfig, config?.schema?.triedToSync, updateSchema]);

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
            <Link to="/settings/general">
              <Button icon={<GearIcon />}>Settings</Button>
            </Link>

            <Link
              to={
                !activeConfig || !config?.schema?.lastUpdate
                  ? "/connections"
                  : "/graph-explorer"
              }
            >
              <Button
                isDisabled={!activeConfig || !config?.schema?.lastUpdate}
                className="button"
                icon={<ExplorerIcon />}
                variant="filled"
              >
                Open {APP_NAME}
              </Button>
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
          {activeConfig && config ? (
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

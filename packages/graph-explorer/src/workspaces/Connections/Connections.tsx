import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Button from "@/components/Button";
import { ExplorerIcon, GearIcon } from "@/components/icons";
import Workspace from "@/components/Workspace/Workspace";
import { useConfiguration, useWithTheme } from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import useSchemaSync from "@/hooks/useSchemaSync";
import AvailableConnections from "@/modules/AvailableConnections";
import ConnectionDetail from "@/modules/ConnectionDetail";
import defaultStyles from "./Connections.styles";
import { APP_NAME } from "@/utils/constants";

const Connections = () => {
  const styleWithTheme = useWithTheme();

  const config = useConfiguration();
  const activeConfig = useRecoilValue(activeConfigurationAtom);
  const configuration = useRecoilValue(configurationAtom);
  const [isModalOpen, setModal] = useState(configuration.size === 0);
  const [isSyncing, setSyncing] = useState(false);

  // Every time that the active connection changes,
  // if it was not synchronized yet, try to sync it
  const updateSchema = useSchemaSync(setSyncing);
  useEffect(() => {
    if (config?.schema?.triedToSync === true) {
      return;
    }

    updateSchema();
  }, [activeConfig, config?.schema?.triedToSync, updateSchema]);

  return (
    <Workspace className={cn(styleWithTheme(defaultStyles), "connections")}>
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
                className={"button"}
                icon={<ExplorerIcon />}
                variant={"filled"}
              >
                Open {APP_NAME}
              </Button>
            </Link>
          </div>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <div className="flex h-full gap-2">
          <div className="h-full min-w-[50%] grow">
            <AvailableConnections
              isSync={isSyncing}
              isModalOpen={isModalOpen}
              onModalChange={setModal}
            />
          </div>
          {activeConfig && (
            <div className="h-full min-w-[50%] grow">
              <ConnectionDetail isSync={isSyncing} onSyncChange={setSyncing} />
            </div>
          )}
        </div>
      </Workspace.Content>
    </Workspace>
  );
};

export default Connections;

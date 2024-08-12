import { cx } from "@emotion/css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Button from "../../components/Button";
import { ExplorerIcon } from "../../components/icons";
import Workspace from "../../components/Workspace/Workspace";
import { useConfiguration, useWithTheme } from "../../core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import useSchemaSync from "../../hooks/useSchemaSync";
import AvailableConnections from "../../modules/AvailableConnections";
import ConnectionDetail from "../../modules/ConnectionDetail";
import defaultStyles from "./Connections.styles";

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
    <Workspace className={cx(styleWithTheme(defaultStyles), "connections")}>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title="Connections Details"
          subtitle={`Connection: ${config?.displayLabel || config?.id || "none"}`}
        />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
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
              Open Graph Explorer
            </Button>
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <div
          style={{
            display: "flex",
            height: "100%",
            gap: 8,
          }}
        >
          <div style={{ flexGrow: 1, minWidth: "50%" }}>
            <AvailableConnections
              isSync={isSyncing}
              isModalOpen={isModalOpen}
              onModalChange={setModal}
            />
          </div>
          {activeConfig && (
            <div style={{ flexGrow: 1, width: "50%", height: "100%" }}>
              <ConnectionDetail isSync={isSyncing} onSyncChange={setSyncing} />
            </div>
          )}
        </div>
      </Workspace.Content>
    </Workspace>
  );
};

export default Connections;

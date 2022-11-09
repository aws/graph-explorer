import { Modal } from "@mantine/core";
import { useCallback, useState } from "react";
import { useRecoilCallback } from "recoil";
import {
  Chip,
  DatabaseIcon,
  DeleteIcon,
  EditIcon,
  ModuleContainer,
  ModuleContainerHeader,
  SyncIcon,
  TrayArrowIcon,
} from "../../components";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import { schemaAtom } from "../../core/StateProvider/schema";
import useSchemaSync from "../../hooks/useSchemaSync";
import { formatDate } from "../../utils";
import labelsByEngine from "../../utils/labelsByEngine";
import saveConfigurationToFile from "../../utils/saveConfigurationToFile";
import CreateConnection from "../CreateConnection";
import ConnectionData from "./ConnectionData";
import defaultStyles from "./ConnectionDetail.styles";

export type ConnectionDetailProps = {
  isSync: boolean;
  onSyncChange(isSync: boolean): void;
};

const HEADER_ACTIONS = (isSync: boolean, isFileBased: boolean) => [
  {
    label: "Synchronize Schema",
    icon: <SyncIcon className={isSync ? "animate-spin" : ""} />,
    value: "sync",
    isDisabled: isSync,
  },
  "divider",
  {
    label: "Export Connection",
    icon: <TrayArrowIcon />,
    value: "export",
    isDisabled: isSync,
  },
  "divider",
  {
    label: "Edit connection",
    icon: <EditIcon />,
    value: "edit",
    isDisabled: isSync,
  },
  {
    label: isFileBased ? "File (read-only)" : "Delete connection",
    icon: <DeleteIcon />,
    value: "delete",
    color: "error",
    isDisabled: isFileBased || isSync,
  },
];

const ConnectionDetail = ({ isSync, onSyncChange }: ConnectionDetailProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");
  const config = useConfiguration();
  const [edit, setEdit] = useState(false);

  const updateSchema = useSchemaSync();
  const onConfigSync = useCallback(async () => {
    onSyncChange(true);
    try {
      await updateSchema();
    } finally {
      onSyncChange(false);
    }
  }, [onSyncChange, updateSchema]);

  const onConfigExport = useCallback(() => {
    if (!config?.id) {
      return;
    }

    saveConfigurationToFile(config);
  }, [config]);

  const onConfigDelete = useRecoilCallback(
    ({ set }) => () => {
      if (!config?.id) {
        return;
      }

      set(activeConfigurationAtom, null);

      set(configurationAtom, prevConfigs => {
        const updatedConfigs = new Map(prevConfigs);
        updatedConfigs.delete(config.id);
        return updatedConfigs;
      });

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        updatedSchemas.delete(config.id);
        return updatedSchemas;
      });
    },
    [config?.id]
  );

  const onActionClick = useCallback(
    (value: string) => {
      if (value === "sync") {
        return onConfigSync();
      }

      if (value === "edit") {
        return setEdit(true);
      }

      if (value === "delete") {
        return onConfigDelete();
      }

      if (value === "export") {
        return onConfigExport();
      }
    },
    [onConfigDelete, onConfigExport, onConfigSync]
  );

  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];
  if (!config) {
    return null;
  }

  return (
    <ModuleContainer className={styleWithTheme(defaultStyles("ft"))}>
      <ModuleContainerHeader
        title={config.displayLabel || config.id}
        startAdornment={<DatabaseIcon />}
        actions={HEADER_ACTIONS(isSync, config.__fileBase === true)}
        onActionClick={onActionClick}
      >
        <div className={pfx("header-children")}>
          {!config?.schema?.lastUpdate && (
            <Chip size={"sm"} variant={"warning"}>
              Not Synchronized
            </Chip>
          )}
          {!!config?.schema?.lastUpdate && (
            <Chip size={"sm"} variant={"success"}>
              Synchronized
            </Chip>
          )}
        </div>
      </ModuleContainerHeader>
      <div className={pfx("info-bar")}>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>URL</div>
          <div className={pfx("value")}>{config.connection?.url}</div>
        </div>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>Graph Type</div>
          <div className={pfx("value")}>{labels["graph-type"]}</div>
        </div>
        {!!config.schema?.lastUpdate && (
          <div className={pfx("item")}>
            <div className={pfx("tag")}>Last Synchronization</div>
            <div className={pfx("value")}>
              {formatDate(config.schema.lastUpdate)}
            </div>
          </div>
        )}
      </div>
      <ConnectionData />
      <Modal
        opened={edit}
        onClose={() => setEdit(false)}
        centered={true}
        title={"Update connection"}
      >
        <CreateConnection
          onClose={() => setEdit(false)}
          configId={config.id}
          disabledFields={config.__fileBase ? ["type", "url"] : undefined}
          initialData={{
            name: config.displayLabel || config.id,
            url: config.connection?.url,
            type: config.connection?.queryEngine,
          }}
        />
      </Modal>
    </ModuleContainer>
  );
};

export default ConnectionDetail;

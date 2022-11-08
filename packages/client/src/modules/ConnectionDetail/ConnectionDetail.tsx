import { useCallback } from "react";
import { useRecoilCallback } from "recoil";
import {
  Chip,
  DatabaseIcon,
  DeleteIcon,
  ModuleContainer,
  ModuleContainerHeader,
} from "../../components";
import SyncIcon from "../../components/icons/SyncIcon";
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
import ConnectionData from "./ConnectionData";
import defaultStyles from "./ConnectionDetail.styles";

export type ConnectionDetailProps = {
  isSync: boolean;
  onSyncChange(isSync: boolean): void;
};

const HEADER_ACTIONS = (isSync: boolean, isFileBased: boolean) => [
  "divider",
  {
    label: "Synchronize Schema",
    icon: <SyncIcon className={isSync ? "animate-spin" : ""} />,
    value: "sync",
    isDisabled: isSync,
  },
  {
    label: isFileBased ? "File (read-only)" : "Delete connection",
    icon: <DeleteIcon />,
    value: "delete",
    color: "error",
    isDisabled: isFileBased,
  },
];

const ConnectionDetail = ({ isSync, onSyncChange }: ConnectionDetailProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");
  const config = useConfiguration();

  const updateSchema = useSchemaSync();
  const onConfigSync = useCallback(async () => {
    onSyncChange(true);
    try {
      await updateSchema();
    } finally {
      onSyncChange(false);
    }
  }, [onSyncChange, updateSchema]);

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

      if (value === "delete") {
        return onConfigDelete();
      }
    },
    [onConfigDelete, onConfigSync]
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
          {!config?.schema?.lasUpdate && (
            <Chip size={"sm"} variant={"warning"}>
              Not Synchronized
            </Chip>
          )}
          {!!config?.schema?.lasUpdate && (
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
        {!!config.schema?.lasUpdate && (
          <div className={pfx("item")}>
            <div className={pfx("tag")}>Last Synchronization</div>
            <div className={pfx("value")}>
              {formatDate(config.schema.lasUpdate)}
            </div>
          </div>
        )}
      </div>
      <ConnectionData />
    </ModuleContainer>
  );
};

export default ConnectionDetail;

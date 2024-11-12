import { Modal } from "@mantine/core";
import { useCallback, useState } from "react";
import {
  useRecoilCallback,
  useResetRecoilState,
  useSetRecoilState,
} from "recoil";
import {
  ActionItem,
  Button,
  Chip,
  DatabaseIcon,
  DeleteIcon,
  EditIcon,
  ModuleContainer,
  ModuleContainerContent,
  ModuleContainerHeader,
  NotInProduction,
  PanelEmptyState,
  SyncIcon,
  TrayArrowIcon,
} from "@/components";
import { showDebugActionsAtom, useConfiguration, useWithTheme } from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { activeSchemaSelector, schemaAtom } from "@/core/StateProvider/schema";
import useSchemaSync from "@/hooks/useSchemaSync";
import useTranslations from "@/hooks/useTranslations";
import { formatDate, logger } from "@/utils";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";
import CreateConnection from "@/modules/CreateConnection";
import ConnectionData from "./ConnectionData";
import defaultStyles from "./ConnectionDetail.styles";

export type ConnectionDetailProps = {
  isSync: boolean;
  onSyncChange(isSync: boolean): void;
};

const HEADER_ACTIONS = (
  isSync: boolean,
  isFileBased: boolean
): ActionItem[] => [
  {
    label: "Synchronize Database",
    icon: <SyncIcon className={isSync ? "animate-spin" : ""} />,
    value: "sync",
    isDisabled: isSync,
  },
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
  const config = useConfiguration();
  const t = useTranslations();
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
    ({ set }) =>
      () => {
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
      if (value === "edit") {
        return setEdit(true);
      }

      if (value === "delete") {
        return onConfigDelete();
      }

      if (value === "export") {
        return onConfigExport();
      }

      if (value === "sync") {
        return onConfigSync();
      }
    },
    [onConfigDelete, onConfigExport, onConfigSync]
  );

  if (!config) {
    return null;
  }

  const lastSyncUpdate = config?.schema?.lastUpdate;
  const lastSyncFail = config?.schema?.lastSyncFail === true;

  return (
    <ModuleContainer className={styleWithTheme(defaultStyles)}>
      <ModuleContainerHeader
        title={config.displayLabel || config.id}
        startAdornment={<DatabaseIcon />}
        actions={HEADER_ACTIONS(isSync, config.__fileBase === true)}
        onActionClick={onActionClick}
      />
      <ModuleContainerContent className="flex flex-col">
        <div className="info-bar">
          <div className="item">
            <div className="tag">Type</div>
            <div className="value">{t("connection-detail.graph-type")}</div>
          </div>
          <div className="item">
            <div className="tag">URL</div>
            <div className="value">{config.connection?.url}</div>
          </div>
          {!!lastSyncUpdate && (
            <div className="item">
              <div className="tag">
                <div>Last Synchronization</div>
              </div>
              {!lastSyncFail && (
                <div className="value">{formatDate(lastSyncUpdate)}</div>
              )}
              {!lastSyncUpdate && !lastSyncFail && (
                <Chip variant="warning">Not Synchronized</Chip>
              )}
              {lastSyncFail && (
                <Chip variant="error">Synchronization Failed</Chip>
              )}
            </div>
          )}
          <NotInProduction featureFlag={showDebugActionsAtom}>
            <DebugActions />
          </NotInProduction>
        </div>
        {!isSync && !!lastSyncUpdate && <ConnectionData />}
        {!lastSyncUpdate && !isSync && (
          <PanelEmptyState
            variant="error"
            icon={<SyncIcon />}
            title="Synchronization Required"
            subtitle="It is necessary to synchronize the connection to be able to work with the database."
            actionLabel="Start synchronization"
            onAction={onConfigSync}
            actionVariant="text"
            className="p-6"
          />
        )}
        {isSync && (
          <PanelEmptyState
            variant="info"
            icon={<SyncIcon className="animate-spin" />}
            title="Synchronizing..."
            subtitle="The connection is being synchronized."
            className="p-6"
          />
        )}
        <Modal
          opened={edit}
          onClose={() => setEdit(false)}
          title="Update connection"
          size="600px"
        >
          <CreateConnection
            onClose={() => setEdit(false)}
            existingConfig={config}
          />
        </Modal>
      </ModuleContainerContent>
    </ModuleContainer>
  );
};

function DebugActions() {
  const setActiveSchema = useSetRecoilState(activeSchemaSelector);
  const resetActiveSchema = useResetRecoilState(activeSchemaSelector);

  const deleteSchema = () => {
    logger.log("Deleting schema");
    resetActiveSchema();
  };
  const resetSchemaLastUpdated = () => {
    logger.log("Resetting schema last updated");
    setActiveSchema(prevSchema => {
      if (!prevSchema) {
        return prevSchema;
      }
      return {
        ...prevSchema,
        lastUpdate: undefined,
      };
    });
  };
  const setSchemaSyncFailed = () => {
    logger.log("Setting last schema sync failed");
    setActiveSchema(prevSchema => {
      if (!prevSchema) {
        return prevSchema;
      }
      return {
        ...prevSchema,
        lastSyncFail: true,
      };
    });
  };
  const resetVertexTotals = () => {
    logger.log("Setting vertex totals to undefined");
    setActiveSchema(prevSchema => {
      if (!prevSchema) {
        return prevSchema;
      }

      return {
        ...prevSchema,
        vertices: prevSchema.vertices.map(vertex => ({
          ...vertex,
          total: undefined,
        })),
      };
    });
  };
  const resetAllTotals = () => {
    logger.log("Setting vertex totals to undefined");
    setActiveSchema(prev => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        vertices: prev.vertices.map(vertex => ({
          ...vertex,
          total: undefined,
        })),
        edges: prev.edges.map(edge => ({
          ...edge,
          total: undefined,
        })),
        totalEdges: undefined,
        totalVertices: undefined,
      };
    });
  };

  return (
    <div className="item">
      <div className="tag">Debug Actions</div>
      <div className="flex flex-wrap gap-2">
        <Button onPress={() => deleteSchema()}>Delete Schema</Button>
        <Button onPress={() => resetSchemaLastUpdated()}>
          Reset Last Updated
        </Button>
        <Button onPress={() => setSchemaSyncFailed()}>Last Sync Failed</Button>
        <Button onPress={() => resetVertexTotals()}>Reset Vertex Totals</Button>
        <Button onPress={() => resetAllTotals()}>Reset All Totals</Button>
      </div>
    </div>
  );
}

export default ConnectionDetail;

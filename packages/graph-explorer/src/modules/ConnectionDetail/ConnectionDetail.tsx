import { Modal } from "@mantine/core";
import { useCallback, useState } from "react";
import {
  useRecoilCallback,
  useResetRecoilState,
  useSetRecoilState,
} from "recoil";
import {
  Button,
  Chip,
  DatabaseIcon,
  DeleteIcon,
  EditIcon,
  NotInProduction,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelError,
  PanelHeader,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
  SyncIcon,
  TrayArrowIcon,
} from "@/components";
import {
  ConfigurationContextProps,
  showDebugActionsAtom,
  useWithTheme,
} from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { activeSchemaSelector, schemaAtom } from "@/core/StateProvider/schema";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import useTranslations from "@/hooks/useTranslations";
import { cn, formatDate, logger } from "@/utils";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";
import CreateConnection from "@/modules/CreateConnection";
import ConnectionData from "./ConnectionData";
import defaultStyles from "./ConnectionDetail.styles";
import { useQueryClient } from "@tanstack/react-query";

export type ConnectionDetailProps = {
  config: ConfigurationContextProps;
};

function ConnectionDetail({ config }: ConnectionDetailProps) {
  const styleWithTheme = useWithTheme();
  const t = useTranslations();
  const [edit, setEdit] = useState(false);

  const {
    refetch: syncSchema,
    isFetching: isSync,
    error: syncError,
  } = useSchemaSync();

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

  const lastSyncUpdate = config.schema?.lastUpdate;
  const lastSyncFail = config.schema?.lastSyncFail === true;

  return (
    <Panel className={cn(styleWithTheme(defaultStyles))}>
      <PanelHeader>
        <PanelTitle>
          <DatabaseIcon />
          {config.displayLabel || config.id}
        </PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderActionButton
            label="Synchronize Database"
            icon={<SyncIcon className={isSync ? "animate-spin" : ""} />}
            isDisabled={isSync}
            onActionClick={syncSchema}
          />
          <PanelHeaderActionButton
            label="Export Connection"
            icon={<TrayArrowIcon />}
            isDisabled={isSync}
            onActionClick={onConfigExport}
          />
          <PanelHeaderDivider />
          <PanelHeaderActionButton
            label="Edit connection"
            icon={<EditIcon />}
            isDisabled={isSync}
            onActionClick={() => setEdit(true)}
          />
          <PanelHeaderActionButton
            label="Delete connection"
            icon={<DeleteIcon />}
            color="error"
            isDisabled={isSync}
            onActionClick={onConfigDelete}
          />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
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
        {!lastSyncUpdate && !isSync && syncError && (
          <PanelError error={syncError} onRetry={syncSchema} className="p-6" />
        )}
        {!lastSyncUpdate && !isSync && !syncError && (
          <PanelEmptyState
            variant="error"
            icon={<SyncIcon />}
            title="Synchronization Required"
            subtitle="It is necessary to synchronize the connection to be able to work with the database."
            actionLabel="Start synchronization"
            onAction={syncSchema}
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
      </PanelContent>
    </Panel>
  );
}

function DebugActions() {
  const setActiveSchema = useSetRecoilState(activeSchemaSelector);
  const resetActiveSchema = useResetRecoilState(activeSchemaSelector);
  const queryClient = useQueryClient();

  const deleteSchema = () => {
    logger.log("Deleting schema");
    resetActiveSchema();
    queryClient.invalidateQueries({
      queryKey: ["schema"],
    });
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

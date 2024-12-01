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
  Dialog,
  EditIcon,
  NotInProduction,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelHeader,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
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
import { cn, formatDate, logger } from "@/utils";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";
import CreateConnection from "@/modules/CreateConnection";
import ConnectionData from "./ConnectionData";
import defaultStyles from "./ConnectionDetail.styles";
import { DialogTrigger } from "@radix-ui/react-dialog";

export type ConnectionDetailProps = {
  isSync: boolean;
  onSyncChange(isSync: boolean): void;
};

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

  if (!config) {
    return null;
  }

  const lastSyncUpdate = config?.schema?.lastUpdate;
  const lastSyncFail = config?.schema?.lastSyncFail === true;
  const isFileBased = config.__fileBase === true;

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
            onActionClick={onConfigSync}
          />
          <PanelHeaderActionButton
            label="Export Connection"
            icon={<TrayArrowIcon />}
            isDisabled={isSync}
            onActionClick={onConfigExport}
          />
          <PanelHeaderDivider />
          <Dialog open={edit} onOpenChange={setEdit}>
            <DialogTrigger asChild>
              <PanelHeaderActionButton
                label="Edit connection"
                icon={<EditIcon />}
                isDisabled={isSync}
                onActionClick={() => {}}
              />
            </DialogTrigger>

            <CreateConnection
              onClose={() => setEdit(false)}
              existingConfig={config}
            />
          </Dialog>
          <PanelHeaderActionButton
            label={isFileBased ? "File (read-only)" : "Delete connection"}
            icon={<DeleteIcon />}
            color="error"
            isDisabled={isFileBased || isSync}
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
        <Dialog open={edit} onOpenChange={setEdit}>
          <CreateConnection
            onClose={() => setEdit(false)}
            existingConfig={config}
          />
        </Dialog>
      </PanelContent>
    </Panel>
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

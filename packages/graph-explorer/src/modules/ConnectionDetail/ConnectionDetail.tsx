import { Modal } from "@mantine/core";
import { useCallback, useState } from "react";
import { useResetRecoilState, useSetRecoilState } from "recoil";
import {
  Button,
  Chip,
  DeleteIcon,
  EdgeIcon,
  EditIcon,
  GraphIcon,
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
  Spinner,
  SyncIcon,
  toHumanString,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TrayArrowIcon,
} from "@/components";
import {
  activeSchemaSelector,
  ConfigurationContextProps,
  showDebugActionsAtom,
} from "@/core";

import {
  useCancelSchemaSync,
  useIsSyncing,
  useSchemaSync,
} from "@/hooks/useSchemaSync";
import useTranslations from "@/hooks/useTranslations";
import {
  formatDate,
  formatRelativeDate,
  logger,
  MISSING_DISPLAY_VALUE,
} from "@/utils";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";
import CreateConnection from "@/modules/CreateConnection";
import ConnectionData from "./ConnectionData";
import { useQueryClient } from "@tanstack/react-query";
import useEntitiesCounts from "@/hooks/useEntitiesCounts";
import {
  InfoBar,
  InfoItem,
  InfoItemContent,
  InfoItemIcon,
  InfoItemLabel,
  InfoItemValue,
} from "./InfoBar";
import {
  ClockIcon,
  DatabaseIcon,
  GlobeIcon,
  HammerIcon,
  LinkIcon,
} from "lucide-react";
import { useDeleteActiveConfiguration } from "@/hooks/useDeleteConfig";

export type ConnectionDetailProps = {
  config: ConfigurationContextProps;
};

function ConnectionDetail({ config }: ConnectionDetailProps) {
  const t = useTranslations();
  const [edit, setEdit] = useState(false);

  const { refetch: syncSchema, isFetching: isSync } = useSchemaSync();

  const onConfigExport = useCallback(() => {
    saveConfigurationToFile(config);
  }, [config]);

  const deleteActiveConfig = useDeleteActiveConfiguration();

  const dbUrl = config.connection
    ? config.connection.proxyConnection
      ? config.connection.graphDbUrl
      : config.connection.url
    : MISSING_DISPLAY_VALUE;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>
          <DatabaseIcon className="size-5" />
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
            color="danger"
            isDisabled={isSync}
            onActionClick={deleteActiveConfig}
          />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        <InfoBar className="@sm:flex hidden">
          <InfoItem className="shrink-0">
            <InfoItemIcon>
              <GlobeIcon />
            </InfoItemIcon>
            <InfoItemContent>
              <InfoItemLabel>Graph Type</InfoItemLabel>
              <InfoItemValue>{t("connection-detail.graph-type")}</InfoItemValue>
            </InfoItemContent>
          </InfoItem>
          <InfoItem>
            <InfoItemIcon>
              <LinkIcon />
            </InfoItemIcon>

            <InfoItemContent>
              <InfoItemLabel>Database URL</InfoItemLabel>
              <InfoItemValue>{dbUrl}</InfoItemValue>
            </InfoItemContent>
          </InfoItem>
        </InfoBar>
        <InfoBar className="@sm:flex hidden">
          <VertexCounts />
          <EdgeCounts />
          <InfoItem>
            <InfoItemIcon>
              <ClockIcon />
            </InfoItemIcon>
            <InfoItemContent>
              <InfoItemLabel>Last Synchronization</InfoItemLabel>
              <LastSyncInfo config={config} />
            </InfoItemContent>
          </InfoItem>
        </InfoBar>
        <NotInProduction featureFlag={showDebugActionsAtom}>
          <DebugActions />
        </NotInProduction>
        <MainContentLayout />
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

/** Shows the vertex list, loading, or error state. */
function MainContentLayout() {
  const schemaSyncQuery = useSchemaSync();
  const cancel = useCancelSchemaSync();

  if (schemaSyncQuery.isFetching) {
    return (
      <PanelEmptyState
        variant="info"
        icon={<SyncIcon className="animate-spin" />}
        title="Synchronizing..."
        subtitle="The connection is being synchronized."
        className="p-6"
        onAction={() => cancel()}
        actionLabel="Cancel Sync"
      />
    );
  }

  if (schemaSyncQuery.error) {
    return (
      <PanelError
        error={schemaSyncQuery.error}
        onRetry={schemaSyncQuery.refetch}
        className="p-6"
      />
    );
  }

  return <ConnectionData />;
}

function LastSyncInfo({ config }: { config: ConfigurationContextProps }) {
  const isSyncing = useIsSyncing();

  if (isSyncing) {
    return (
      <InfoItemValue>
        <Spinner />
        Synchronizing...
      </InfoItemValue>
    );
  }

  const lastSyncFail = config.schema?.lastSyncFail === true;
  if (lastSyncFail) {
    return <InfoItemValue>Synchronization Failed</InfoItemValue>;
  }

  const lastSyncUpdate = config.schema?.lastUpdate;
  if (!lastSyncUpdate) {
    return <Chip variant="warning">Not Synchronized</Chip>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InfoItemValue>{formatRelativeDate(lastSyncUpdate)}</InfoItemValue>
      </TooltipTrigger>
      <TooltipContent>{formatDate(lastSyncUpdate)}</TooltipContent>
    </Tooltip>
  );
}

function VertexCounts() {
  const { totalNodes } = useEntitiesCounts();
  const t = useTranslations();

  const humanReadable =
    totalNodes == null ? MISSING_DISPLAY_VALUE : toHumanString(totalNodes);

  return (
    <InfoItem>
      <InfoItemIcon>
        <GraphIcon />
      </InfoItemIcon>
      <InfoItemContent>
        <InfoItemLabel>{t("connection-detail.nodes")}</InfoItemLabel>
        <InfoItemValue>{humanReadable}</InfoItemValue>
      </InfoItemContent>
    </InfoItem>
  );
}

function EdgeCounts() {
  const { totalEdges } = useEntitiesCounts();
  const t = useTranslations();

  const humanReadable =
    totalEdges == null ? MISSING_DISPLAY_VALUE : toHumanString(totalEdges);

  return (
    <InfoItem>
      <InfoItemIcon>
        <EdgeIcon />
      </InfoItemIcon>
      <InfoItemContent>
        <InfoItemLabel>{t("connection-detail.edges")}</InfoItemLabel>
        <InfoItemValue>{humanReadable}</InfoItemValue>
      </InfoItemContent>
    </InfoItem>
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
    <InfoBar>
      <InfoItem>
        <InfoItemIcon>
          <HammerIcon />
        </InfoItemIcon>
        <InfoItemContent>
          <InfoItemLabel>Debug Actions</InfoItemLabel>
          <InfoItemValue className="flex flex-wrap gap-2">
            <Button onPress={() => deleteSchema()}>Delete Schema</Button>
            <Button onPress={() => resetSchemaLastUpdated()}>
              Reset Last Updated
            </Button>
            <Button onPress={() => setSchemaSyncFailed()}>
              Last Sync Failed
            </Button>
            <Button onPress={() => resetVertexTotals()}>
              Reset Vertex Totals
            </Button>
            <Button onPress={() => resetAllTotals()}>Reset All Totals</Button>
          </InfoItemValue>
        </InfoItemContent>
      </InfoItem>
    </InfoBar>
  );
}

export default ConnectionDetail;

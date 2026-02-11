import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import {
  ClockIcon,
  DatabaseIcon,
  GlobeIcon,
  HammerIcon,
  LinkIcon,
} from "lucide-react";
import { useState } from "react";

import {
  Button,
  Chip,
  EdgeIcon,
  EditIcon,
  GraphIcon,
  NotInProduction,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelError,
  PanelHeader,
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
import { LinkButton } from "@/components/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import {
  activeSchemaSelector,
  type ConfigurationContextProps,
  type RawConfiguration,
  showDebugActionsAtom,
  useHasActiveSchema,
  useMaybeActiveSchema,
} from "@/core";
import { useDeleteActiveConfiguration } from "@/hooks/useDeleteConfig";
import useEntitiesCounts from "@/hooks/useEntitiesCounts";
import { useCancelSchemaSync, useSchemaSync } from "@/hooks/useSchemaSync";
import useTranslations from "@/hooks/useTranslations";
import CreateConnection from "@/modules/CreateConnection";
import { formatDate, formatRelativeDate, LABELS, logger } from "@/utils";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";

import ConnectionData from "./ConnectionData";
import ConnectionDeleteButton from "./ConnectionDeleteButton";
import {
  InfoBar,
  InfoItem,
  InfoItemContent,
  InfoItemIcon,
  InfoItemLabel,
  InfoItemValue,
} from "./InfoBar";

export type ConnectionDetailProps = {
  config: ConfigurationContextProps;
};

function ConnectionDetail({ config }: ConnectionDetailProps) {
  const t = useTranslations();
  const [edit, setEdit] = useState(false);

  const { isFetching } = useSchemaSync();

  const onConfigExport = () => saveConfigurationToFile(config);

  const deleteActiveConfig = useDeleteActiveConfiguration();

  const dbUrl = config.connection
    ? config.connection.proxyConnection
      ? config.connection.graphDbUrl
      : config.connection.url
    : LABELS.MISSING_VALUE;

  const connectionName = config.displayLabel || config.id;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>
          <DatabaseIcon className="size-5" />
          {connectionName}
        </PanelTitle>
        <PanelHeaderActions>
          <Button
            tooltip="Export Connection"
            variant="ghost"
            size="icon"
            disabled={isFetching}
            onClick={onConfigExport}
          >
            <TrayArrowIcon />
          </Button>
          <PanelHeaderDivider />
          <Button
            tooltip="Edit connection"
            variant="ghost"
            size="icon"
            disabled={isFetching}
            onClick={() => setEdit(true)}
          >
            <EditIcon />
          </Button>
          <ConnectionDeleteButton
            connectionName={connectionName}
            isSync={isFetching}
            deleteActiveConfig={deleteActiveConfig}
            saveCopy={onConfigExport}
          />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent className="@container">
        <InfoBar className="hidden @sm:flex">
          <InfoItem className="shrink-0">
            <InfoItemIcon>
              <GlobeIcon />
            </InfoItemIcon>
            <InfoItemContent>
              <InfoItemLabel>Query Language</InfoItemLabel>
              <InfoItemValue>{t("query-language")}</InfoItemValue>
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
        <InfoBar className="hidden @sm:flex">
          <VertexCounts />
          <EdgeCounts />
          <InfoItem>
            <InfoItemIcon>
              <Spinner loading={isFetching}>
                <ClockIcon />
              </Spinner>
            </InfoItemIcon>
            <InfoItemContent>
              <InfoItemLabel>Last Synchronization</InfoItemLabel>
              <LastSyncInfo />
            </InfoItemContent>
          </InfoItem>
        </InfoBar>
        <NotInProduction featureFlag={showDebugActionsAtom}>
          <DebugActions />
        </NotInProduction>
        <MainContentLayout config={config} />
        <Dialog open={edit} onOpenChange={setEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update connection</DialogTitle>
              <DialogDescription>
                Update the connection details for {connectionName}.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <CreateConnection
                onClose={() => setEdit(false)}
                existingConfig={config}
              />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </PanelContent>
    </Panel>
  );
}

/*
 * DEV NOTE:
 * Props required to prevent React Compiler memoization issues with query subscriptions.
 */

/** Shows the vertex list, loading, or error state. */
function MainContentLayout(_props: { config: RawConfiguration }) {
  const { isFetching, schemaDiscoveryQuery, refreshSchema } = useSchemaSync();
  const hasSchema = useHasActiveSchema();
  const cancel = useCancelSchemaSync();

  if (isFetching) {
    return (
      <PanelEmptyState
        variant="info"
        icon={<SyncIcon className="animate-spin" />}
        title="Synchronizing..."
        subtitle="The connection is being synchronized."
        className="p-6"
        onAction={cancel}
        actionLabel="Cancel Sync"
      />
    );
  }

  // Only show error for main schema discovery here, edge connections are secondary
  if (schemaDiscoveryQuery.error) {
    return (
      <PanelError
        error={schemaDiscoveryQuery.error}
        onRetry={refreshSchema}
        className="p-6"
      />
    );
  }

  if (!hasSchema) {
    return (
      <PanelEmptyState
        variant="info"
        icon={<SyncIcon />}
        title="No Schema Available"
        subtitle="Synchronize the connection to explore the data."
        onAction={refreshSchema}
        actionLabel="Synchronize"
        className="p-6"
      />
    );
  }

  return <ConnectionData />;
}

function LastSyncInfo() {
  const t = useTranslations();
  const { refreshSchema, isFetching } = useSchemaSync();
  const schema = useMaybeActiveSchema();

  if (isFetching) {
    return <InfoItemValue>Synchronizing...</InfoItemValue>;
  }

  const lastSyncFail = schema?.lastSyncFail === true;
  if (lastSyncFail) {
    return (
      <InfoItemValue className="inline">
        <span>Synchronization Failed </span>
        <LinkButton onClick={refreshSchema}>Retry</LinkButton>
      </InfoItemValue>
    );
  }

  const edgeDiscoveryFailed = schema?.edgeConnectionDiscoveryFailed === true;
  if (edgeDiscoveryFailed) {
    return (
      <InfoItemValue className="inline">
        <span>{t("edge-connection")} Discovery Failed </span>
        <LinkButton onClick={refreshSchema}>Retry</LinkButton>
      </InfoItemValue>
    );
  }

  const lastSyncUpdate = schema?.lastUpdate;
  if (!lastSyncUpdate) {
    return (
      <InfoItemValue className="inline">
        <Chip variant="warning">Not Synchronized</Chip>{" "}
        <LinkButton onClick={refreshSchema}>Synchronize</LinkButton>
      </InfoItemValue>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InfoItemValue className="inline">
          <span>{formatRelativeDate(lastSyncUpdate)} </span>
          <LinkButton onClick={refreshSchema}>Refresh</LinkButton>
        </InfoItemValue>
      </TooltipTrigger>
      <TooltipContent>{formatDate(lastSyncUpdate)}</TooltipContent>
    </Tooltip>
  );
}

function VertexCounts() {
  const { totalNodes } = useEntitiesCounts();
  const t = useTranslations();

  const humanReadable =
    totalNodes == null ? LABELS.MISSING_VALUE : toHumanString(totalNodes);

  return (
    <InfoItem>
      <InfoItemIcon>
        <GraphIcon />
      </InfoItemIcon>
      <InfoItemContent>
        <InfoItemLabel>{t("nodes")}</InfoItemLabel>
        <InfoItemValue>{humanReadable}</InfoItemValue>
      </InfoItemContent>
    </InfoItem>
  );
}

function EdgeCounts() {
  const { totalEdges } = useEntitiesCounts();
  const t = useTranslations();

  const humanReadable =
    totalEdges == null ? LABELS.MISSING_VALUE : toHumanString(totalEdges);

  return (
    <InfoItem>
      <InfoItemIcon>
        <EdgeIcon />
      </InfoItemIcon>
      <InfoItemContent>
        <InfoItemLabel>{t("edges")}</InfoItemLabel>
        <InfoItemValue>{humanReadable}</InfoItemValue>
      </InfoItemContent>
    </InfoItem>
  );
}

function DebugActions() {
  const setActiveSchema = useSetAtom(activeSchemaSelector);
  const queryClient = useQueryClient();

  const deleteSchema = () => {
    logger.log("Deleting schema");
    setActiveSchema(RESET);
    void queryClient.removeQueries({
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
  const resetEdgeConnections = () => {
    logger.log("Resetting edge connections");
    setActiveSchema(prev => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        edgeConnections: undefined,
        edgeConnectionDiscoveryFailed: undefined,
      };
    });
  };
  const setEdgeConnectionFail = () => {
    logger.log("Setting edge connections failure");
    setActiveSchema(prev => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        edgeConnections: [],
        edgeConnectionDiscoveryFailed: true,
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
            <Button onClick={() => deleteSchema()}>Delete Schema</Button>
            <Button onClick={() => resetSchemaLastUpdated()}>
              Reset Last Updated
            </Button>
            <Button onClick={() => setSchemaSyncFailed()}>
              Last Sync Failed
            </Button>
            <Button onClick={() => resetEdgeConnections()}>
              Reset Edge Connections
            </Button>
            <Button onClick={() => setEdgeConnectionFail()}>
              Edge Connections Failed
            </Button>
            <Button onClick={() => resetVertexTotals()}>
              Reset Vertex Totals
            </Button>
            <Button onClick={() => resetAllTotals()}>Reset All Totals</Button>
          </InfoItemValue>
        </InfoItemContent>
      </InfoItem>
    </InfoBar>
  );
}

export default ConnectionDetail;

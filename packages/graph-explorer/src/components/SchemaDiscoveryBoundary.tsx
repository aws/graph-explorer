import type { PropsWithChildren } from "react";

import {
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelError,
  PanelGroup,
  PanelHeader,
  PanelTitle,
  SyncIcon,
} from "@/components";
import { useHasActiveSchema, useMaybeActiveSchema } from "@/core";
import { useTranslations } from "@/hooks";
import { useCancelSchemaSync, useSchemaSync } from "@/hooks/useSchemaSync";

interface SchemaDiscoveryBoundaryProps extends PropsWithChildren {
  /** When true, also waits for edge connections to be discovered. */
  requireEdgeConnections?: boolean;
}

/**
 * Renders loading, error, or no-schema states for schema discovery.
 * Renders children when a schema has been successfully synced.
 * When requireEdgeConnections is true, also gates on edge connection discovery.
 */
export function SchemaDiscoveryBoundary({
  children,
  requireEdgeConnections = false,
}: SchemaDiscoveryBoundaryProps) {
  const {
    schemaDiscoveryQuery,
    edgeDiscoveryQuery,
    refreshSchema,
    isFetching,
  } = useSchemaSync();
  const hasSchema = useHasActiveSchema();
  const schema = useMaybeActiveSchema();
  const cancel = useCancelSchemaSync();
  const t = useTranslations();

  // 1. If data exists, render children
  const hasRequiredData = requireEdgeConnections
    ? hasSchema && schema?.edgeConnections != null
    : hasSchema;

  if (hasRequiredData) {
    return children;
  }

  // 2. If loading/fetching, show loading state
  if (isFetching) {
    return (
      <Layout>
        <PanelEmptyState
          variant="info"
          icon={<SyncIcon className="animate-spin" />}
          title="Synchronizing..."
          subtitle="The connection is being synchronized."
          className="p-6"
          onAction={cancel}
          actionLabel="Cancel Sync"
        />
      </Layout>
    );
  }

  // 3. If error, show error state
  if (schemaDiscoveryQuery.error) {
    return (
      <Layout>
        <PanelError
          error={schemaDiscoveryQuery.error}
          onRetry={refreshSchema}
        />
      </Layout>
    );
  }

  if (requireEdgeConnections && edgeDiscoveryQuery.error) {
    return (
      <Layout>
        <PanelError
          error={edgeDiscoveryQuery.error}
          onRetry={edgeDiscoveryQuery.refetch}
        />
      </Layout>
    );
  }

  // 4. Edge connections not yet discovered
  if (requireEdgeConnections && hasSchema) {
    return (
      <Layout>
        <PanelEmptyState
          variant="info"
          icon={<SyncIcon />}
          title={`No ${t("edge-connections")} Available`}
          subtitle={`Synchronize ${t("edge-connections").toLocaleLowerCase()} to explore the schema.`}
          onAction={refreshSchema}
          actionLabel="Synchronize"
          className="p-6"
        />
      </Layout>
    );
  }

  // 5. No schema available
  return (
    <Layout>
      <PanelEmptyState
        variant="info"
        icon={<SyncIcon />}
        title="No Schema Available"
        subtitle="Synchronize the connection to explore the data."
        onAction={refreshSchema}
        actionLabel="Synchronize"
        className="p-6"
      />
    </Layout>
  );
}

function Layout({ children }: PropsWithChildren) {
  return (
    <PanelGroup>
      <Panel className="flex-1">
        <PanelHeader>
          <PanelTitle>Schema Sync</PanelTitle>
        </PanelHeader>
        <PanelContent>{children}</PanelContent>
      </Panel>
    </PanelGroup>
  );
}

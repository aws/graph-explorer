import type { PropsWithChildren } from "react";

import { ArrowRightIcon, DatabaseIcon } from "lucide-react";

import {
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  NavButton,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelError,
  PanelGroup,
  PanelHeader,
  PanelTitle,
  SyncIcon,
} from "@/components";
import { useConfiguration, useHasActiveSchema } from "@/core";
import { useCancelSchemaSync, useSchemaSync } from "@/hooks/useSchemaSync";

/**
 * Renders loading, error, or no-schema states for schema discovery.
 * Renders children once a schema has been successfully synced, regardless of
 * whether edge connection discovery has succeeded — a failure there is
 * reported inline by the Schema view instead of blocking the whole page.
 */
export function SchemaDiscoveryBoundary({ children }: PropsWithChildren) {
  const config = useConfiguration();
  // Must precede useSchemaSync(): its mount fetch can write the schema
  // synchronously, and these readers only observe writes that land after they
  // subscribe, which React does in hook declaration order.
  const hasSchema = useHasActiveSchema();
  const { schemaDiscoveryQuery, refreshSchema, isFetching } = useSchemaSync();
  const cancel = useCancelSchemaSync();

  // 0. If no connection is configured, show no-connection state
  if (!config) {
    return (
      <Layout>
        <EmptyState className="p-6">
          <EmptyStateIcon>
            <DatabaseIcon />
          </EmptyStateIcon>
          <EmptyStateContent>
            <EmptyStateTitle>No Connection</EmptyStateTitle>
            <EmptyStateDescription>
              Add a connection to start exploring your graph data.
            </EmptyStateDescription>
            <EmptyStateActions>
              <NavButton to="/connections" variant="primary">
                Go to Connections <ArrowRightIcon />
              </NavButton>
            </EmptyStateActions>
          </EmptyStateContent>
        </EmptyState>
      </Layout>
    );
  }

  // 1. If loading/fetching, show loading state
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

  // 2. If schema exists, render children — edge connection failures are
  // reported inline by the Schema view, not here.
  if (hasSchema) {
    return children;
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

  // 4. No schema available
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

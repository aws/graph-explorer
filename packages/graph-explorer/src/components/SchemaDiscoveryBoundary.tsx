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
import { useHasActiveSchema } from "@/core";
import { useCancelSchemaSync, useSchemaSync } from "@/hooks/useSchemaSync";

/**
 * Renders loading, error, or no-schema states for schema discovery.
 * Renders children when a schema has been successfully synced.
 */
export function SchemaDiscoveryBoundary({ children }: PropsWithChildren) {
  const { schemaDiscoveryQuery, refreshSchema } = useSchemaSync();
  const hasSchema = useHasActiveSchema();
  const cancel = useCancelSchemaSync();

  if (
    schemaDiscoveryQuery.isLoading ||
    (schemaDiscoveryQuery.isFetching && !hasSchema)
  ) {
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

  if (!hasSchema) {
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

  return children;
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

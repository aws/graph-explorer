import type { PropsWithChildren, ReactNode } from "react";

import { RotateCcwIcon } from "lucide-react";

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  GraphIcon,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelError,
  PanelGroup,
  SyncIcon,
} from "@/components";
import { useMaybeActiveSchema } from "@/core";
import { useTranslations } from "@/hooks";
import { useCancelSchemaSync, useSchemaSync } from "@/hooks/useSchemaSync";

/**
 * Prevents access to the schema explorer until edge connections have been
 * discovered at least once. Once edgeConnections is defined, children render
 * regardless of subsequent query failures.
 */
export function EdgeDiscoveryBoundary({ children }: PropsWithChildren) {
  const t = useTranslations();
  const { schemaDiscoveryQuery, edgeDiscoveryQuery } = useSchemaSync();

  const schema = useMaybeActiveSchema();
  const cancel = useCancelSchemaSync();

  if (!schema) {
    return null;
  }

  // Once edge connections have been discovered, always render children
  if (schema.edgeConnections != null) {
    return children;
  }

  if (schemaDiscoveryQuery.isLoading || edgeDiscoveryQuery.isLoading) {
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
          onRetry={schemaDiscoveryQuery.refetch}
        />
      </Layout>
    );
  }

  if (edgeDiscoveryQuery.error) {
    return (
      <Layout>
        <PanelError
          error={edgeDiscoveryQuery.error}
          onRetry={edgeDiscoveryQuery.refetch}
        />
      </Layout>
    );
  }

  if (schema.edgeConnectionDiscoveryFailed) {
    return (
      <Layout>
        <EmptyState>
          <EmptyStateIcon variant="error">
            <GraphIcon />
          </EmptyStateIcon>
          <EmptyStateContent>
            <EmptyStateTitle>
              {t("edge-connection")} discovery failed
            </EmptyStateTitle>
            <EmptyStateDescription>
              The last attempt to discover{" "}
              {t("edge-connections").toLocaleLowerCase()} failed.
            </EmptyStateDescription>

            <EmptyStateActions>
              <Button onClick={() => edgeDiscoveryQuery.refetch()}>
                <RotateCcwIcon />
                Retry
              </Button>
            </EmptyStateActions>
          </EmptyStateContent>
        </EmptyState>
      </Layout>
    );
  }

  return children;
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <PanelGroup>
      <Panel className="flex-1">
        <PanelContent>{children}</PanelContent>
      </Panel>
    </PanelGroup>
  );
}

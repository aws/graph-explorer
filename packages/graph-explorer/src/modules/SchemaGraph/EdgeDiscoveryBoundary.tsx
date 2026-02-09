import type { ComponentPropsWithoutRef } from "react";

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
 * Renders loading, error, or failure states for edge connection discovery.
 * Renders children when discovery succeeds.
 */
export function EdgeDiscoveryBoundary({
  children,
}: ComponentPropsWithoutRef<"div">) {
  const t = useTranslations();
  const { schemaDiscoveryQuery, edgeDiscoveryQuery } = useSchemaSync();

  const schema = useMaybeActiveSchema();
  const cancel = useCancelSchemaSync();

  if (schemaDiscoveryQuery.isLoading || edgeDiscoveryQuery.isLoading) {
    return (
      <PanelGroup>
        <Panel className="flex-1">
          <PanelContent>
            <PanelEmptyState
              variant="info"
              icon={<SyncIcon className="animate-spin" />}
              title="Synchronizing..."
              subtitle="The connection is being synchronized."
              className="p-6"
              onAction={cancel}
              actionLabel="Cancel Sync"
            />
          </PanelContent>
        </Panel>
      </PanelGroup>
    );
  }

  if (schemaDiscoveryQuery.error) {
    return (
      <PanelGroup>
        <Panel className="flex-1">
          <PanelContent>
            <PanelError
              error={schemaDiscoveryQuery.error}
              onRetry={schemaDiscoveryQuery.refetch}
            />
          </PanelContent>
        </Panel>
      </PanelGroup>
    );
  }

  if (edgeDiscoveryQuery.error) {
    return (
      <PanelGroup>
        <Panel className="flex-1">
          <PanelContent>
            <PanelError
              error={edgeDiscoveryQuery.error}
              onRetry={edgeDiscoveryQuery.refetch}
            />
          </PanelContent>
        </Panel>
      </PanelGroup>
    );
  }

  if (schema?.edgeConnectionDiscoveryFailed) {
    return (
      <PanelGroup>
        <Panel className="flex-1">
          <PanelContent>
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
          </PanelContent>
        </Panel>
      </PanelGroup>
    );
  }

  return children;
}

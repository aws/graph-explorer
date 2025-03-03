import { useCallback, useRef } from "react";
import { useNotification } from "@/components/NotificationProvider";
import { useConfiguration } from "@/core/ConfigurationProvider";
import { loggerSelector, useExplorer } from "@/core/connector";
import usePrefixesUpdater from "./usePrefixesUpdater";
import useUpdateSchema from "./useUpdateSchema";
import { createDisplayError } from "@/utils/createDisplayError";
import { useRecoilValue } from "recoil";

const useSchemaSync = (onSyncChange?: (isSyncing: boolean) => void) => {
  const config = useConfiguration();
  const explorer = useExplorer();
  const remoteLogger = useRecoilValue(loggerSelector);

  const updatePrefixes = usePrefixesUpdater();
  const { enqueueNotification, clearNotification } = useNotification();
  const notificationId = useRef<string | null>(null);

  const { replaceSchema, setSyncFailure } = useUpdateSchema();
  return useCallback(async () => {
    if (!config) {
      return;
    }

    onSyncChange?.(true);
    try {
      notificationId.current = enqueueNotification({
        title: config.displayLabel || config.id,
        message: "Updating the Database schema",
        type: "info",
      });

      const schema = await explorer.fetchSchema();

      if (!schema.vertices.length) {
        notificationId.current && clearNotification(notificationId.current);
        enqueueNotification({
          title: config.displayLabel || config.id,
          message: "This connection has no data available",
          type: "info",
          stackable: true,
        });
        remoteLogger.info(
          `[${
            config.displayLabel || config.id
          }] This connection has no data available: ${JSON.stringify(
            config.connection
          )}`
        );
      }

      replaceSchema(schema);
      onSyncChange?.(false);

      notificationId.current && clearNotification(notificationId.current);
      enqueueNotification({
        title: config.displayLabel || config.id,
        message: "Connection successfully synchronized",
        type: "success",
        stackable: true,
      });
      remoteLogger.info(
        `[${
          config.displayLabel || config.id
        }] Connection successfully synchronized: ${JSON.stringify(
          config.connection
        )}`
      );

      const ids = schema.vertices.flatMap(v => [
        v.type,
        ...v.attributes.map(attr => attr.name),
      ]);
      ids.push(...schema.edges.map(e => e.type));
      updatePrefixes(ids);
    } catch (e) {
      notificationId.current && clearNotification(notificationId.current);
      const displayError = createDisplayError(e);
      enqueueNotification({
        ...displayError,
        type: "error",
        stackable: true,
      });
      if (e instanceof Error && e.name === "AbortError") {
        remoteLogger.error(
          `[${
            config.displayLabel || config.id
          }] Fetch aborted, reached max time out ${config.connection?.fetchTimeoutMs} MS`
        );
      } else {
        remoteLogger.error(
          `[${
            config.displayLabel || config.id
          }] Error while fetching schema: ${e instanceof Error ? e.message : "Unexpected error"}`
        );
      }
      setSyncFailure();
      onSyncChange?.(false);
    }
  }, [
    config,
    explorer,
    onSyncChange,
    enqueueNotification,
    replaceSchema,
    clearNotification,
    remoteLogger,
    updatePrefixes,
    setSyncFailure,
  ]);
};

export default useSchemaSync;

import { useCallback, useRef } from "react";
import { useNotification } from "../components/NotificationProvider";
import { SchemaResponse } from "../connector/AbstractConnector";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import useConnector from "../core/ConnectorProvider/useConnector";
import usePrefixesUpdater from "./usePrefixesUpdater";
import useUpdateSchema from "./useUpdateSchema";

const useSchemaSync = (onSyncChange?: (isSyncing: boolean) => void) => {
  const config = useConfiguration();
  const connector = useConnector();

  const updatePrefixes = usePrefixesUpdater();
  const { enqueueNotification, clearNotification } = useNotification();
  const notificationId = useRef<string | null>(null);

  const updateSchemaState = useUpdateSchema();
  return useCallback(
    async (abortSignal?: AbortSignal) => {
      if (!config || !connector.explorer) {
        return;
      }

      onSyncChange?.(true);
      let schema: SchemaResponse | null = null;
      try {
        notificationId.current = enqueueNotification({
          title: config.displayLabel || config.id,
          message: "Updating the Database schema",
          type: "info",
        });
        schema = await connector.explorer.fetchSchema({
          abortSignal,
        });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error(e);
        }

        if (e.name !== "AbortError") {
          notificationId.current && clearNotification(notificationId.current);
          enqueueNotification({
            title: config.displayLabel || config.id,
            message: "Unable to connect with the Database",
            type: "error",
            stackable: true,
          });
          connector.logger?.error(
            `[${
              config.displayLabel || config.id
            }] Unable to connect with the Database: ${JSON.stringify(
              config.connection
            )}`
          );
        }

        updateSchemaState(config.id);
        onSyncChange?.(false);
        return;
      }

      if (!schema.vertices.length) {
        notificationId.current && clearNotification(notificationId.current);
        enqueueNotification({
          title: config.displayLabel || config.id,
          message: "This connection has no data available",
          type: "info",
          stackable: true,
        });
        connector.logger?.info(
          `[${
            config.displayLabel || config.id
          }] This connection has no data available: ${JSON.stringify(
            config.connection
          )}`
        );
      }

      updateSchemaState(config.id, schema);
      onSyncChange?.(false);

      notificationId.current && clearNotification(notificationId.current);
      enqueueNotification({
        title: config.displayLabel || config.id,
        message: "Connection successfully synchronized",
        type: "success",
        stackable: true,
      });
      connector.logger?.info(
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
    },
    [
      clearNotification,
      config,
      connector.explorer,
      connector.logger,
      enqueueNotification,
      onSyncChange,
      updatePrefixes,
      updateSchemaState,
    ]
  );
};

export default useSchemaSync;

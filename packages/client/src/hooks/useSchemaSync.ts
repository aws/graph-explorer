import { useCallback, useRef } from "react";
import { useRecoilCallback } from "recoil";
import { useNotification } from "../components/NotificationProvider";
import { SchemaResponse } from "../connector/AbstractConnector";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import useConnector from "../core/ConnectorProvider/useConnector";
import { schemaAtom } from "../core/StateProvider/schema";

const useSchemaSync = (onSyncChange?: (isSyncing: boolean) => void) => {
  const config = useConfiguration();
  const connector = useConnector();

  const { enqueueNotification, clearNotification } = useNotification();
  const notificationId = useRef<string | null>(null);

  const updateSchemaState = useRecoilCallback(
    ({ set }) => (id: string, schema?: SchemaResponse) => {
      set(schemaAtom, prevSchemaMap => {
        const updatedSchema = new Map(prevSchemaMap);
        const prevSchema = prevSchemaMap.get(id);

        updatedSchema.set(id, {
          vertices: schema?.vertices || prevSchema?.vertices || [],
          edges: schema?.edges || prevSchema?.edges || [],
          prefixes: schema?.prefixes || prevSchema?.prefixes || [],
          lastUpdate: !schema ? prevSchema?.lastUpdate : new Date(),
          triedToSync: true,
          lastSyncFail: !schema && !!prevSchema,
        });
        return updatedSchema;
      });
    },
    []
  );

  return useCallback(
    async (abortSignal?: AbortSignal) => {
      if (
        !config ||
        !connector.explorer ||
        !connector.explorer.isConfigEqual(config)
      ) {
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

      const oldPrefixesSize = config?.schema?.prefixes?.length || 0;
      const newPrefixesSize = schema.prefixes?.length || 0;
      if (schema.prefixes?.length && oldPrefixesSize !== newPrefixesSize) {
        const addedCount = newPrefixesSize - oldPrefixesSize;
        enqueueNotification({
          title: "Namespaces updated",
          message:
            addedCount === 1
              ? "1 new namespace has been generated"
              : `${addedCount} new namespaces have been generated`,
          type: "success",
          stackable: true,
        });
      }
    },
    [
      clearNotification,
      config,
      connector.explorer,
      enqueueNotification,
      onSyncChange,
      updateSchemaState,
    ]
  );
};

export default useSchemaSync;

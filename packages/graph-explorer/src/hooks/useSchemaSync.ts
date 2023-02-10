import { useCallback, useRef } from "react";
import { useRecoilCallback } from "recoil";
import { useNotification } from "../components/NotificationProvider";
import { SchemaResponse } from "../connector/AbstractConnector";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import useConnector from "../core/ConnectorProvider/useConnector";
import { schemaAtom } from "../core/StateProvider/schema";
import usePrefixesUpdater from "./usePrefixesUpdater";

const useSchemaSync = (onSyncChange?: (isSyncing: boolean) => void) => {
  const config = useConfiguration();
  const connector = useConnector();

  const updatePrefixes = usePrefixesUpdater();
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
          prefixes: prevSchema?.prefixes || [],
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
      enqueueNotification,
      onSyncChange,
      updatePrefixes,
      updateSchemaState,
    ]
  );
};

export default useSchemaSync;

import { useCallback, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { useNotification } from "../components/NotificationProvider";
import { SchemaResponse } from "../connector/AbstractConnector";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import useConnector from "../core/ConnectorProvider/useConnector";
import { schemaAtom } from "../core/StateProvider/schema";

const useSchemaSync = () => {
  const config = useConfiguration();
  const connector = useConnector();

  const setSchema = useSetRecoilState(schemaAtom);
  const { enqueueNotification, clearNotification } = useNotification();
  const notificationId = useRef<string | null>(null);

  return useCallback(
    async (abortSignal?: AbortSignal) => {
      if (
        !config ||
        !connector.explorer ||
        !connector.explorer.isConfigEqual(config)
      ) {
        return;
      }

      let schema: SchemaResponse | null = null;
      try {
        notificationId.current = enqueueNotification({
          title: config.displayLabel || config.id,
          message: "Updating the Database schema",
          type: "info",
          closeable: false,
          autoHideDuration: null,
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

      setSchema(prevSchemaMap => {
        if (!schema) {
          return prevSchemaMap;
        }
        const updatedSchema = new Map(prevSchemaMap);
        updatedSchema.set(config.id, {
          vertices: schema.vertices,
          edges: schema.edges,
          lastUpdate: new Date(),
          prefixes: [
            ...(prevSchemaMap.get(config.id)?.prefixes || []),
            ...(schema.prefixes || []),
          ],
        });
        return updatedSchema;
      });

      notificationId.current && clearNotification(notificationId.current);
      enqueueNotification({
        title: config.displayLabel || config.id,
        message: "Connection successfully synchronized",
        type: "success",
        stackable: true,
      });

      if (schema.prefixes?.length) {
        enqueueNotification({
          title: "Prefixes updated",
          message:
            schema.prefixes.length === 1
              ? "1 new prefix has been generated"
              : `${schema.prefixes.length} new prefixes have been generated`,
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
      setSchema,
    ]
  );
};

export default useSchemaSync;

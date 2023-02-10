import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { useNotification } from "../components/NotificationProvider";
import { useConfiguration } from "../core";
import { schemaAtom } from "../core/StateProvider/schema";
import generatePrefixes from "../utils/generatePrefixes";

const usePrefixesUpdater = () => {
  const config = useConfiguration();
  const setSchema = useSetRecoilState(schemaAtom);
  const { enqueueNotification } = useNotification();

  return useCallback(
    (ids: Array<string>) => {
      if (config?.connection?.queryEngine !== "sparql" || ids.length === 0) {
        return;
      }

      const genPrefixes = generatePrefixes(ids, config?.schema?.prefixes);
      if (!genPrefixes?.length) {
        return;
      }

      setSchema(prevSchemaMap => {
        if (!config?.id) {
          return prevSchemaMap;
        }

        const updatedSchema = new Map(prevSchemaMap);
        const schema = updatedSchema.get(config.id);
        updatedSchema.set(config.id, {
          // Update prefixes does not affect to sync last update date
          lastUpdate: schema?.lastUpdate,
          vertices: schema?.vertices || [],
          edges: schema?.edges || [],
          prefixes: genPrefixes || [],
          lastSyncFail: schema?.lastSyncFail,
          triedToSync: schema?.triedToSync,
        });
        return updatedSchema;
      });

      const oldPrefixesSize = config?.schema?.prefixes?.length || 0;
      const newPrefixesSize = genPrefixes.length || 0;
      if (
        genPrefixes.length &&
        config?.schema?.prefixes?.length !== genPrefixes.length
      ) {
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
      config?.id,
      config?.connection?.queryEngine,
      config?.schema?.prefixes,
      enqueueNotification,
      setSchema,
    ]
  );
};

export default usePrefixesUpdater;

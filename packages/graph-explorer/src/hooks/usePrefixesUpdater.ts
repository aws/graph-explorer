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

  const supportsPrefixes = config?.connection?.queryEngine === "sparql"
  const existingPrefixes = config?.schema?.prefixes
  const activeConfigId = config?.id;

  return useCallback(
    (ids: Array<string>) => {
      if (supportsPrefixes || ids.length === 0) {
        return;
      }

      const genPrefixes = generatePrefixes(ids, existingPrefixes);
      if (!genPrefixes?.length) {
        return;
      }

      setSchema(prevSchemaMap => {
        if (!activeConfigId) {
          return prevSchemaMap;
        }

        const updatedSchema = new Map(prevSchemaMap);
        const schema = updatedSchema.get(activeConfigId);
        updatedSchema.set(activeConfigId, {
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

      const oldPrefixesSize = existingPrefixes?.length ?? 0;
      const newPrefixesSize = genPrefixes.length;
      if (
        genPrefixes.length &&
        existingPrefixes?.length !== genPrefixes.length
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
    [supportsPrefixes, existingPrefixes, setSchema,  activeConfigId, enqueueNotification]
  );
};

export default usePrefixesUpdater;

import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { useNotification } from "@/components/NotificationProvider";
import { useConfiguration } from "@/core";
import { activeSchemaSelector } from "@/core/StateProvider/schema";
import generatePrefixes from "@/utils/generatePrefixes";

const usePrefixesUpdater = () => {
  const config = useConfiguration();
  const setActiveSchema = useSetRecoilState(activeSchemaSelector);
  const { enqueueNotification } = useNotification();

  const supportsPrefixes = config?.connection?.queryEngine === "sparql";
  const existingPrefixes = config?.schema?.prefixes;

  return useCallback(
    (ids: Array<string>) => {
      if (supportsPrefixes || ids.length === 0) {
        return;
      }

      const genPrefixes = generatePrefixes(ids, existingPrefixes);
      if (!genPrefixes?.length) {
        return;
      }

      setActiveSchema(prev => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          prefixes: genPrefixes,
        };
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
    [supportsPrefixes, existingPrefixes, setActiveSchema, enqueueNotification]
  );
};

export default usePrefixesUpdater;

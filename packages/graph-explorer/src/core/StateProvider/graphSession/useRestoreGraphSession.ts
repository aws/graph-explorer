import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { toast } from "sonner";

import { fetchEntityDetails, notifyOnIncompleteRestoration } from "@/connector";
import { activeConfigurationAtom, usePopulateGraph } from "@/core";
import { useEntityCountFormatterCallback } from "@/hooks/useEntityCountFormatter";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";

import {
  commitGraphRestoration,
  graphRestorationRequestAtom,
  isCurrentGraphRestoration,
  startGraphRestoration,
} from "./restoration";
import {
  type GraphSessionStorageModel,
  resolveGraphSessionLayout,
} from "./storage";

/**
 * Provides a mutation that restores the graph session from storage.
 */
export function useRestoreGraphSession() {
  const queryClient = useQueryClient();
  const populateGraph = usePopulateGraph();
  const formatEntityCounts = useEntityCountFormatterCallback();

  const mutationFn = useAtomCallback(
    useCallback(
      async (get, set, graph: GraphSessionStorageModel) => {
        const target = get(activeConfigurationAtom);

        if (!target) {
          throw new Error("No active connection to restore the graph session");
        }

        const token = startGraphRestoration(set, target);
        logger.debug("Restoring graph session", graph);

        const entityCountMessage = formatEntityCounts(
          graph.vertices.size,
          graph.edges.size,
        );

        let committed = false;

        const restorePromise = (async () => {
          const result = await fetchEntityDetails(
            graph.vertices,
            graph.edges,
            queryClient,
          );

          if (!isCurrentGraphRestoration(get, token, target)) {
            return result;
          }

          populateGraph(result.entities);

          if (!isCurrentGraphRestoration(get, token, target)) {
            return result;
          }

          committed = commitGraphRestoration(get, set, {
            token,
            target,
            source: graph,
            layout: resolveGraphSessionLayout(graph.layout),
            arrangement: graph.arrangement,
          });

          return result;
        })();

        toast.promise(restorePromise, {
          loading: `Loading ${entityCountMessage}`,
          error: err => ({
            message: createDisplayError(err).title,
            description: createDisplayError(err).message,
          }),
        });

        try {
          const result = await restorePromise;

          if (committed) {
            notifyOnIncompleteRestoration(result);
          }

          return result;
        } finally {
          if (isCurrentGraphRestoration(get, token, target)) {
            set(graphRestorationRequestAtom, null);
          }
        }
      },
      [queryClient, populateGraph, formatEntityCounts],
    ),
  );

  return useMutation({ mutationFn });
}

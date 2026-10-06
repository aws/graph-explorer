import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchEntityDetails, notifyOnIncompleteRestoration } from "@/connector";
import { useAddToGraph } from "@/hooks";
import { useEntityCountFormatterCallback } from "@/hooks/useEntityCountFormatter";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";

import type { GraphSessionStorageModel } from "./storage";

/**
 * Provides a mutation that restores the graph session from storage.
 *
 * Restoring brings back the session's entities only; it deliberately does not
 * touch the Graph View layout. The per-tab View Layout is the single source of
 * truth for the chosen layout algorithm (it already persists across reloads),
 * so writing the session's stored layout back here would overwrite the user's
 * current, persisted choice with a snapshot that goes stale the moment they
 * change the layout without adding or removing a node.
 */
export function useRestoreGraphSession() {
  const queryClient = useQueryClient();
  const addToGraph = useAddToGraph();
  const formatEntityCounts = useEntityCountFormatterCallback();

  const mutation = useMutation({
    mutationFn: async (graph: GraphSessionStorageModel) => {
      logger.debug("Restoring graph session", graph);

      const entityCountMessage = formatEntityCounts(
        graph.vertices.size,
        graph.edges.size,
      );

      const restorePromise = (async () => {
        // Get the vertex and edge details from the database
        const result = await fetchEntityDetails(
          graph.vertices,
          graph.edges,
          queryClient,
        );

        // Update Graph Explorer state
        await addToGraph(result.entities);

        return result;
      })();

      toast.promise(restorePromise, {
        loading: `Loading ${entityCountMessage}`,
        error: err => ({
          message: createDisplayError(err).title,
          description: createDisplayError(err).message,
        }),
      });

      const result = await restorePromise;

      notifyOnIncompleteRestoration(result);

      return result;
    },
  });
  return mutation;
}

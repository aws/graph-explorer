import { toast } from "sonner";
import { fetchEntityDetails, notifyOnIncompleteRestoration } from "@/connector";
import { useAddToGraph } from "@/hooks";
import { logger, formatEntityCounts } from "@/utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import type { GraphSessionStorageModel } from "./storage";
import { createDisplayError } from "@/utils/createDisplayError";

/**
 * Provides a mutation that restores the graph session from storage.
 */
export function useRestoreGraphSession() {
  const queryClient = useQueryClient();
  const addToGraph = useAddToGraph();

  const mutation = useMutation({
    mutationFn: async (graph: GraphSessionStorageModel) => {
      logger.debug("Restoring graph session", graph);

      const entityCountMessage = formatEntityCounts(
        graph.vertices.size,
        graph.edges.size,
      );

      const restorePromise = (async () => {
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

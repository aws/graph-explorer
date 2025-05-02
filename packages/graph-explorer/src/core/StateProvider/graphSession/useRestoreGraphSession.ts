import { useNotification } from "@/components/NotificationProvider";
import { useExplorer } from "@/core/connector";
import {
  fetchEntityDetails,
  createFetchEntityDetailsCompletionNotification,
} from "@/core/fetchEntityDetails";
import { useAddToGraph } from "@/hooks";
import { logger, formatEntityCounts } from "@/utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { GraphSessionStorageModel } from "./storage";

/**
 * Provides a mutation that restores the graph session from storage.
 */
export function useRestoreGraphSession() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();
  const addToGraph = useAddToGraph();

  const { enqueueNotification, clearNotification } = useNotification();

  const notificationTitle = "Restoring Graph Session";

  const mutation = useMutation({
    mutationFn: async (graph: GraphSessionStorageModel) => {
      logger.debug("Restoring graph session", graph);

      // Get the vertex and edge details from the database
      const entityCountMessage = formatEntityCounts(
        graph.vertices.size,
        graph.edges.size
      );

      const progressNotificationId = enqueueNotification({
        title: notificationTitle,
        message: `Restoring graph session with ${entityCountMessage}.`,
        type: "loading",
        autoHideDuration: null,
        stackable: true,
      });

      const result = await fetchEntityDetails(
        graph.vertices,
        graph.edges,
        queryClient,
        explorer
      );

      clearNotification(progressNotificationId);

      // Update Graph Explorer state
      await addToGraph(result.entities);

      // Notify user of completion
      const finalNotification =
        createFetchEntityDetailsCompletionNotification(result);
      enqueueNotification({
        ...finalNotification,
        title: notificationTitle,
        stackable: true,
      });
    },
    onSettled: () => {
      logger.debug("Graph has been restored");
    },
    onError: () => {
      enqueueNotification({
        title: notificationTitle,
        message: `Failed to restore the graph session because an error occurred.`,
        type: "error",
        stackable: true,
      });
    },
  });
  return mutation;
}

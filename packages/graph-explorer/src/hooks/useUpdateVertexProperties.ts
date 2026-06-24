import { useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { toast } from "sonner";

import type { ResultVertex } from "@/connector/entities";

import {
  type UpdateVertexPropertiesRequest,
  updateVertexPropertiesQuery,
} from "@/connector/gremlin/updateVertexProperties";
import {
  getExplorer,
  getStore,
  setVertexDetailsQueryCache,
  updateVertexGraphCanvasState,
} from "@/connector/queries/helpers";
import { createVertex } from "@/core";
import { loggerSelector } from "@/core/connector";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";

/**
 * Persists an edit to a vertex's properties directly through the Gremlin
 * connection, then syncs the in-memory graph so the details panel and canvas
 * reflect the new values without a re-query.
 *
 * Only valid for Gremlin connections — property writes are issued as a Gremlin
 * traversal.
 */
export function useUpdateVertexProperties() {
  const remoteLogger = useAtomValue(loggerSelector);

  const { mutateAsync: updateVertexProperties, isPending } = useMutation({
    mutationFn: async (
      request: UpdateVertexPropertiesRequest,
      { client, meta },
    ) => {
      const explorer = getExplorer(meta);

      if (explorer.connection.queryEngine !== "gremlin") {
        throw new Error(
          "Editing vertex properties is only supported on Gremlin connections",
        );
      }

      const updatePromise = explorer.rawQuery({
        query: updateVertexPropertiesQuery(request),
      });

      toast.promise(updatePromise, {
        loading: "Saving properties",
        success: "Properties saved",
        error: err => {
          remoteLogger.error(
            `Failed to save properties: ${(err as Error)?.message ?? "Unknown error"}`,
          );
          return createDisplayError(err).message;
        },
      });

      const response = await updatePromise;

      // The traversal ends at the updated vertex. Map it through the standard
      // result so its id and attributes match what a later fetch would return,
      // then sync both the details cache and the canvas without a re-query.
      const updatedVertexResult = response.results.find(
        (entity): entity is ResultVertex =>
          entity.entityType === "vertex" && entity.attributes != null,
      );

      if (updatedVertexResult == null) {
        logger.warn(
          "Property update succeeded but no vertex was returned; the panel may be stale until refresh",
        );
        return;
      }

      const updatedVertex = createVertex(updatedVertexResult);
      setVertexDetailsQueryCache(client, updatedVertex);
      updateVertexGraphCanvasState(getStore(meta), [updatedVertex]);
    },
  });

  return { updateVertexProperties, isPending };
}

import type { SchemaResponse } from "@/connector";
import { activeSchemaSelector } from "@/core/StateProvider/schema";
import { useSetAtom } from "jotai";
import { useCallback } from "react";

export default function useUpdateSchema() {
  const setSchema = useSetAtom(activeSchemaSelector);

  // Keeps previous data, but sets the status to sync failure
  const setSyncFailure = useCallback(async () => {
    await setSchema(prev => ({
      ...prev,
      vertices: prev?.vertices ?? [],
      edges: prev?.edges ?? [],
      triedToSync: true,
      lastSyncFail: true,
    }));
  }, [setSchema]);

  // Updates the stored schema with the given schema
  const replaceSchema = useCallback(
    async (schema: SchemaResponse) => {
      await setSchema({
        ...schema,
        triedToSync: true,
        lastUpdate: new Date(),
        lastSyncFail: false,
      });
    },
    [setSchema]
  );

  // Update the vertex totals (used by Data Explorer)
  const updateVertexTotal = useCallback(
    async (vertexType: string, newTotal: number) => {
      await setSchema(prev => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          vertices: prev.vertices.map(vertex =>
            vertex.type === vertexType ? { ...vertex, total: newTotal } : vertex
          ),
        };
      });
    },
    [setSchema]
  );

  return { setSyncFailure, replaceSchema, updateVertexTotal };
}

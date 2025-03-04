import { useSetRecoilState } from "recoil";
import type { SchemaResponse } from "@/connector";
import { activeSchemaSelector } from "@/core/StateProvider/schema";
import { startTransition, useCallback } from "react";

export default function useUpdateSchema() {
  const setSchema = useSetRecoilState(activeSchemaSelector);

  // Keeps previous data, but sets the status to sync failure
  const setSyncFailure = useCallback(() => {
    startTransition(() => {
      setSchema(prev => ({
        ...prev,
        vertices: prev?.vertices ?? [],
        edges: prev?.edges ?? [],
        triedToSync: true,
        lastSyncFail: true,
      }));
    });
  }, [setSchema]);

  // Updates the stored schema with the given schema
  const replaceSchema = useCallback(
    (schema: SchemaResponse) => {
      startTransition(() => {
        setSchema({
          ...schema,
          triedToSync: true,
          lastUpdate: new Date(),
          lastSyncFail: false,
        });
      });
    },
    [setSchema]
  );

  // Update the vertex totals (used by Data Explorer)
  const updateVertexTotal = useCallback(
    (vertexType: string, newTotal: number) => {
      startTransition(() => {
        setSchema(prev => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            vertices: prev.vertices.map(vertex =>
              vertex.type === vertexType
                ? { ...vertex, total: newTotal }
                : vertex
            ),
          };
        });
      });
    },
    [setSchema]
  );

  return { setSyncFailure, replaceSchema, updateVertexTotal };
}

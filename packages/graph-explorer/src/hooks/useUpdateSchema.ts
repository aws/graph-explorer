import type { SchemaResponse } from "@/connector";
import { activeSchemaSelector } from "@/core/StateProvider/schema";
import { useSetAtom } from "jotai";

export default function useUpdateSchema() {
  const setSchema = useSetAtom(activeSchemaSelector);

  // Keeps previous data, but sets the status to sync failure
  const setSyncFailure = async () => {
    await setSchema(prev => ({
      ...prev,
      vertices: prev?.vertices ?? [],
      edges: prev?.edges ?? [],
      triedToSync: true,
      lastSyncFail: true,
    }));
  };

  // Updates the stored schema with the given schema
  const replaceSchema = async (schema: SchemaResponse) => {
    await setSchema({
      ...schema,
      triedToSync: true,
      lastUpdate: new Date(),
      lastSyncFail: false,
    });
  };

  // Update the vertex totals (used by Data Explorer)
  const updateVertexTotal = async (vertexType: string, newTotal: number) => {
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
  };

  return { setSyncFailure, replaceSchema, updateVertexTotal };
}

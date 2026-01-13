import { useSetAtom } from "jotai";

import type { SchemaResponse } from "@/connector";
import type { VertexType } from "@/core";

import { activeSchemaSelector } from "@/core/StateProvider/schema";

export default function useUpdateSchema() {
  const setSchema = useSetAtom(activeSchemaSelector);

  // Keeps previous data, but sets the status to sync failure
  const setSyncFailure = () => {
    setSchema(prev => ({
      ...prev,
      vertices: prev?.vertices ?? [],
      edges: prev?.edges ?? [],
      triedToSync: true,
      lastSyncFail: true,
    }));
  };

  // Updates the stored schema with the given schema
  const replaceSchema = (schema: SchemaResponse) => {
    setSchema({
      ...schema,
      triedToSync: true,
      lastUpdate: new Date(),
      lastSyncFail: false,
    });
  };

  // Update the vertex totals (used by Data Explorer)
  const updateVertexTotal = (vertexType: VertexType, newTotal: number) => {
    setSchema(prev => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        vertices: prev.vertices.map(vertex =>
          vertex.type === vertexType ? { ...vertex, total: newTotal } : vertex,
        ),
      };
    });
  };

  return { setSyncFailure, replaceSchema, updateVertexTotal };
}

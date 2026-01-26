import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import { activeSchemaSelector, type VertexType } from "@/core";

import { getExplorer, getStore } from "./helpers";

/**
 * Retrieves the count of nodes for a specific node type.
 * @param vertexType A node label or class.
 * @returns An object with the total nodes for the given node type.
 */
export function nodeCountByNodeTypeQuery(vertexType: VertexType) {
  return queryOptions({
    queryKey: ["schema", "vertex-type", vertexType, "count"],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      const response = await explorer.fetchVertexCountsByType(
        {
          label: vertexType,
        },
        { signal },
      );

      // Persist the vertex type totals in the schema cache
      store.set(updateVertexTotalAtom, vertexType, response.total);

      return response;
    },
  });
}

/** Setter-only atom that updates the vertex total for a given vertex type. */
const updateVertexTotalAtom = atom(
  null,
  (_get, set, vertexType: VertexType, newTotal: number) => {
    set(activeSchemaSelector, prev => {
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
  },
);
